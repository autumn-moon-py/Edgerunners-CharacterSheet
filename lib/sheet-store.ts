"use client";

import { create } from "zustand";
import { ARMOR_SLOT_LIMIT, GOLD_SLOT_LIMIT, createDefaultGoldSlots, createEmptyArmorBoxes, defaultSheetData } from "./default-sheet-data";
import type { SheetData, SheetCardReference } from "./sheet-data";
import { createEmptyCard, type StandardCard } from "@/card/card-types";
import { showFadeNotification } from "@/components/ui/fade-notification";
import { buildVariantFeatureText, loadArmorVariantsFromStore } from "@/lib/equipment-variants";
import { normalizeProficiency } from "./proficiency";
import { parseToNumber } from "./number-utils";

// 按显示长度智能分割文本到两行的函数
const splitFeatureText = (text: string): [string, string] => {
    if (!text) return ["", ""];

    // 估算每行可容纳的字符数（基于输入框宽度和字体大小）
    const maxCharsPerLine = 29; // 匹配输入框的maxLength

    // 如果文本长度小于等于一行容量，全部放在第一行
    if (text.length <= maxCharsPerLine) {
        return [text, ""];
    }

    // 寻找合适的分割点
    let splitIndex = maxCharsPerLine;

    // 只在空格处分割，或者下一行开头是标点符号时才在标点符号处分割
    for (let i = maxCharsPerLine; i >= Math.max(0, maxCharsPerLine - 5); i--) {
        const char = text[i];
        const nextChar = text[i + 1];

        // 在空格处分割
        if (char === ' ') {
            splitIndex = i + 1;
            break;
        }

        // 只有当下一行开头是标点符号时，才在标点符号处分割
        const punctuation = ['，', '。', '：', ';', ',', ':'];
        if (punctuation.includes(char) && nextChar && punctuation.includes(nextChar)) {
            splitIndex = i + 1;
            break;
        }
    }

    return [
        text.substring(0, splitIndex).trim(),
        text.substring(splitIndex).trim()
    ];
};

const buildArmorFeatureValue = (featureName?: string, description?: string): string => {
    const featureText = buildVariantFeatureText(featureName, description);
    const [feature1, feature2] = splitFeatureText(featureText);
    return feature2 ? `${feature1}\n${feature2}` : feature1;
};

interface SheetState {
    sheetData: SheetData;
    setSheetData: (data: Partial<SheetData> | ((prevState: SheetData) => Partial<SheetData>)) => void;
    replaceSheetData: (data: SheetData) => void;

    // Granular actions for better performance and cleaner code
    updateAttribute: (attribute: keyof SheetData, value: string) => void;
    toggleAttributeChecked: (attribute: keyof SheetData) => void;
    updateGold: (index: number) => void;
    updateHope: (index: number) => void;
    updateArmorBox: (index: number) => void;
    updateProficiency: (index: number) => void;
    updateExperience: (index: number, value: string) => void;
    updateExperienceValues: (index: number, value: string) => void;
    updateHP: (index: number, checked: boolean) => void;
    updateName: (name: string) => void;
    updateHPMax: (value: number) => void;
    updateStressMax: (value: number) => void;

    // Threshold calculation actions
    updateLevel: (level: string, oldLevel?: string) => void;
    updateArmorThresholdWithDamage: (armorThreshold: string) => void;
    updateArmorBaseScore: (armorBaseScore: string) => void;
    selectArmor: (armorId: string) => void;

    // Card management actions
    deleteCard: (index: number, isInventory: boolean) => void;
    moveCard: (fromIndex: number, fromInventory: boolean, toInventory: boolean) => boolean;
    updateCard: (index: number, card: StandardCard, isInventory: boolean) => void;

    // Profession change handler
    handleProfessionChange: (newProfessionRef: SheetCardReference | undefined, newProfessionCard: StandardCard | undefined) => void;
}

export const useSheetStore = create<SheetState>((set) => ({
    sheetData: defaultSheetData,
    setSheetData: (updater) => {
        set((state) => {
            const oldData = state.sheetData;
            const rawUpdatedData = typeof updater === 'function' ? updater(oldData) : updater;
            let newData = { ...oldData, ...rawUpdatedData };

            // 检查 armorValue 是否改变，如果改变则清空所有 armorBoxes
            if ('armorValue' in rawUpdatedData && rawUpdatedData.armorValue !== oldData.armorValue) {
                newData = {
                    ...newData,
                    armorBoxes: createEmptyArmorBoxes()
                };
            }

            return { sheetData: normalizeSheetData(newData) };
        });
    },
    replaceSheetData: (newData) => set(() => {
        const mergedData = safelyMergeData(defaultSheetData, newData);

        return {
            sheetData: normalizeSheetData(mergedData),
        };
    }),

    // Granular actions
    updateAttribute: (attribute, value) => set((state) => {
        const currentAttribute = state.sheetData[attribute];
        if (typeof currentAttribute === "object" && currentAttribute !== null && "checked" in currentAttribute) {
            return {
                sheetData: {
                    ...state.sheetData,
                    [attribute]: { ...currentAttribute, value },
                }
            };
        }
        return state;
    }),

    toggleAttributeChecked: (attribute) => set((state) => {
        const currentAttribute = state.sheetData[attribute];
        if (typeof currentAttribute === "object" && currentAttribute !== null && "checked" in currentAttribute) {
            return {
                sheetData: {
                    ...state.sheetData,
                    [attribute]: {
                        ...currentAttribute,
                        checked: !currentAttribute.checked
                    },
                }
            };
        }
        return state;
    }),

    updateGold: (index: number) => set((state) => {
        const gold = normalizeGoldSlots(state.sheetData.gold);

        // 计算属于哪一段
        const segment = Math.floor(index / 10); // 0, 1, 2
        const start = segment * 10;
        const end = Math.min(start + 10, gold.length); // 修正：防止越界
        const segmentGold = gold.slice(start, end);

        // 找到该段最后一个被点亮的欧元槽
        const lastLit = segmentGold.lastIndexOf(true);

        let newSegmentGold: boolean[];
        if ((index - start) === lastLit && segmentGold[index - start]) {
            // 如果点击的是该段最后一个被点亮的欧元槽，则该段全部熄灭
            newSegmentGold = segmentGold.map(() => false);
        } else {
            // 否则点亮前 n 个
            newSegmentGold = segmentGold.map((_, i) => i <= (index - start));
        }

        // 拼接新的欧元数组
        const newGold = [
            ...gold.slice(0, start),
            ...newSegmentGold,
            ...gold.slice(end)
        ];

        return {
            sheetData: {
                ...state.sheetData,
                gold: newGold
            }
        };
    }),

    updateHope: (index: number) => set((state) => {
        const currentHope = typeof state.sheetData.hope === 'number'
            ? state.sheetData.hope
            : 0
        const hopeMax = state.sheetData.hopeMax || 6

        // 如果点击当前最后一个点亮的位置（index === currentHope - 1），清零
        if (index === currentHope - 1) {
            return {
                sheetData: {
                    ...state.sheetData,
                    hope: 0
                }
            }
        }

        // 否则设置为点击位置 + 1（因为 index 从 0 开始）
        const newHope = Math.min(index + 1, hopeMax)
        return {
            sheetData: {
                ...state.sheetData,
                hope: newHope
            }
        }
    }),

    updateArmorBox: (index: number) => set((state) => {
        const current = normalizeArmorBoxes(state.sheetData.armorBoxes);
        // 找到最后一个被点亮的 armorBox 的下标
        const lastLit = current.lastIndexOf(true);
        // 如果点击的正好是最后一个被点亮的 armorBox，则全部熄灭
        if (index === lastLit && current[index]) {
            return {
                sheetData: {
                    ...state.sheetData,
                    armorBoxes: current.map(() => false)
                }
            };
        }
        // 其它情况，点亮前 n 个
        const newArmorBoxes = current.map((_, i) => i <= index);
        return {
            sheetData: {
                ...state.sheetData,
                armorBoxes: newArmorBoxes
            }
        };
    }),

    updateProficiency: (index: number) => set((state) => {
        const current = Array.isArray(state.sheetData.proficiency) ? state.sheetData.proficiency : [];
        // 找到最后一个被点亮的 proficiency 的下标
        const lastLit = current.lastIndexOf(true);
        // 如果点击的正好是最后一个被点亮的 proficiency，则全部熄灭
        if (index === lastLit && current[index]) {
            return {
                sheetData: {
                    ...state.sheetData,
                    proficiency: current.map(() => false)
                }
            };
        }
        // 其它情况，点亮前 n 个
        const newProficiency = current.map((_, i) => i <= index);
        return {
            sheetData: {
                ...state.sheetData,
                proficiency: newProficiency
            }
        };
    }),

    updateExperience: (index, value) => set((state) => {
        const newExperience = [...(state.sheetData.experience || [])];
        newExperience[index] = value;
        return {
            sheetData: {
                ...state.sheetData,
                experience: newExperience
            }
        };
    }),

    updateExperienceValues: (index, value) => set((state) => {
        const newExperienceValues = [...(state.sheetData.experienceValues || [])];
        newExperienceValues[index] = value;
        return {
            sheetData: {
                ...state.sheetData,
                experienceValues: newExperienceValues
            }
        };
    }),

    updateHP: (index, checked) => set((state) => {
        const newHP = [...(state.sheetData.hp || [])];
        newHP[index] = checked;
        return {
            sheetData: {
                ...state.sheetData,
                hp: newHP
            }
        };
    }),

    updateName: (name) => set((state) => ({
        sheetData: {
            ...state.sheetData,
            name
        }
    })),

    updateHPMax: (value) => set((state) => ({
        sheetData: {
            ...state.sheetData,
            hpMax: value
        }
    })),

    updateStressMax: (value) => set((state) => ({
        sheetData: {
            ...state.sheetData,
            stressMax: value
        }
    })),

    // Threshold calculation actions
    updateLevel: (level, oldLevel) => set((state) => {
        const updates: Partial<SheetData> = { level };

        // 检查是否需要增加熟练度（当达到2、5、8级时）
        // 使用传入的 oldLevel，如果未提供则从 store 读取
        const prevLevel = parseToNumber(oldLevel ?? state.sheetData.level, 1)
        const newLevel = parseToNumber(level, 1)

        const proficiencyLevels = [2, 5, 8]

        // 计算跨越了多少个熟练度阈值
        let proficiencyIncrements = 0
        for (const threshold of proficiencyLevels) {
            if (prevLevel < threshold && newLevel >= threshold) {
                proficiencyIncrements++  // 累加，不 break
            }
        }

        // 如果需要增加熟练度
        if (proficiencyIncrements > 0) {
            const currentProficiency = Array.isArray(state.sheetData.proficiency)
                ? state.sheetData.proficiency
                : Array(6).fill(false)

            // 计算当前熟练度数量
            const currentCount = currentProficiency.filter(v => v === true).length

            // 计算可以增加的数量（不超过上限6）
            const actualIncrements = Math.min(proficiencyIncrements, 6 - currentCount)

            if (actualIncrements > 0) {
                const newProficiency = [...currentProficiency]

                // 批量添加熟练度
                for (let i = 0; i < actualIncrements; i++) {
                    newProficiency[currentCount + i] = true
                }

                updates.proficiency = newProficiency

                // 升级时重置属性勾选
                type AttributeKey = 'agility' | 'strength' | 'finesse' | 'instinct' | 'presence' | 'knowledge'
                const attributeKeys: AttributeKey[] = [
                    'agility', 'strength', 'finesse',
                    'instinct', 'presence', 'knowledge'
                ]

                attributeKeys.forEach(key => {
                    const attr = state.sheetData[key]
                    if (attr && typeof attr === 'object' && 'checked' in attr) {
                        updates[key] = { ...attr, checked: false }
                    }
                })

                // 更新通知消息，显示实际增加的数量
                const message = actualIncrements === 1
                    ? `等级提升至${newLevel}级，熟练度+1（${currentCount} → ${currentCount + actualIncrements}），属性勾选已重置`
                    : `等级提升至${newLevel}级，熟练度+${actualIncrements}（${currentCount} → ${currentCount + actualIncrements}），属性勾选已重置`

                showFadeNotification({
                    message,
                    type: "success"
                })
            }
        }

        // 如果等级为空字符串，只更新等级和熟练度，不计算阈值
        if (level === "") {
            return {
                sheetData: {
                    ...state.sheetData,
                    ...updates
                }
            };
        }

        const levelNum = parseInt(level);

        // 验证等级范围 (1-10)，如果无效则只更新等级值和熟练度，不计算阈值
        if (isNaN(levelNum) || levelNum < 1 || levelNum > 10) {
            return {
                sheetData: {
                    ...state.sheetData,
                    ...updates
                }
            };
        }

        // 如果有护甲阈值，计算伤害阈值
        if (state.sheetData.armorThreshold) {
            const thresholds = state.sheetData.armorThreshold.split('/');
            if (thresholds.length === 2) {
                const minor = parseInt(thresholds[0]?.trim());
                const major = parseInt(thresholds[1]?.trim());

                if (!isNaN(minor) && !isNaN(major)) {
                    const newMinor = minor + levelNum;
                    const newMajor = major + levelNum;
                    updates.minorThreshold = String(newMinor);
                    updates.majorThreshold = String(newMajor);

                    // 显示通知
                    showFadeNotification({
                        message: `因等级更新，自动更新伤害阈值`,
                        type: "success"
                    });
                }
            }
        }

        return {
            sheetData: {
                ...state.sheetData,
                ...updates
            }
        };
    }),

    updateArmorThresholdWithDamage: (armorThreshold) => set((state) => {
        const updates: Partial<SheetData> = { armorThreshold };

        // 解析护甲阈值
        const thresholds = armorThreshold.split('/');
        if (thresholds.length !== 2) {
            // 无效格式，只更新护甲阈值
            return {
                sheetData: {
                    ...state.sheetData,
                    ...updates
                }
            };
        }

        const minor = parseInt(thresholds[0]?.trim());
        const major = parseInt(thresholds[1]?.trim());

        if (isNaN(minor) || isNaN(major)) {
            // 无效数字，只更新护甲阈值
            return {
                sheetData: {
                    ...state.sheetData,
                    ...updates
                }
            };
        }

        // 如果有等级，计算伤害阈值
        const levelNum = parseInt(state.sheetData.level);
        if (!isNaN(levelNum) && levelNum >= 1 && levelNum <= 10) {
            const newMinor = minor + levelNum;
            const newMajor = major + levelNum;
            updates.minorThreshold = String(newMinor);
            updates.majorThreshold = String(newMajor);

            // 显示通知
            showFadeNotification({
                message: `因护甲信息更新，自动更新伤害阈值`,
                type: "success"
            });
        }

        return {
            sheetData: {
                ...state.sheetData,
                ...updates
            }
        };
    }),

    updateArmorBaseScore: (armorBaseScore) => set((state) => {
        // 解析护甲值为数字，用于更新 armorMax
        const armorMaxValue = parseToNumber(armorBaseScore, 0);

        const updates: Partial<SheetData> = {
            armorBaseScore,
            armorValue: armorBaseScore,  // 同步更新护甲值
            armorMax: armorMaxValue,      // 同步更新护甲上限
            armorBoxes: createEmptyArmorBoxes()
        };

        // 显示通知
        if (armorBaseScore) {
            showFadeNotification({
                message: `因护甲信息更新，护甲值已更新为 ${armorBaseScore}`,
                type: "success"
            });
        }

        return {
            sheetData: {
                ...state.sheetData,
                ...updates
            }
        };
    }),

    selectArmor: (armorId: string) => set((state) => {
        const updates: Partial<SheetData> = {
            armorBoxes: createEmptyArmorBoxes()
        };

        const applyThresholds = (thresholdValue?: string) => {
            updates.minorThreshold = "";
            updates.majorThreshold = "";

            if (!thresholdValue) {
                return false;
            }

            const thresholds = thresholdValue.split('/');
            if (thresholds.length !== 2) {
                return false;
            }

            const minor = parseInt(thresholds[0]?.trim());
            const major = parseInt(thresholds[1]?.trim());
            const levelNum = parseInt(state.sheetData.level);

            if (!isNaN(minor) && !isNaN(major) && !isNaN(levelNum) && levelNum >= 1 && levelNum <= 10) {
                updates.minorThreshold = String(minor + levelNum);
                updates.majorThreshold = String(major + levelNum);
                return true;
            }

            return false;
        };

        const applyArmorData = (armorData: {
            名称?: string;
            护甲值?: number | string;
            伤害阈值?: string;
            特性名称?: string;
            描述?: string;
        }) => {
            const armorValueStr = String(armorData.护甲值 ?? "");
            updates.armorName = armorData.名称 || "";
            updates.armorBaseScore = armorValueStr;
            updates.armorThreshold = armorData.伤害阈值 || "";
            updates.armorFeature = buildArmorFeatureValue(armorData.特性名称, armorData.描述);
            updates.armorValue = armorValueStr;
            updates.armorMax = parseToNumber(armorValueStr, 0);
        };

        if (armorId === "none") {
            // 清空所有护甲相关字段
            updates.armorName = "";
            updates.armorBaseScore = "";
            updates.armorThreshold = "";
            updates.armorFeature = "";
            updates.minorThreshold = "";
            updates.majorThreshold = "";
            updates.armorValue = "";  // 清空护甲值
            updates.armorMax = 0;      // 清空护甲上限

            // 显示通知
            showFadeNotification({
                message: "护甲信息无效或清空，伤害阈值已重置",
                type: "info"
            });
        } else {
            // 首先检查是否为JSON格式（自定义护甲）
            let isCustomArmor = false;
            let customArmorData: any = null;

            try {
                customArmorData = JSON.parse(armorId);
                isCustomArmor = true;
            } catch {
                // 不是JSON格式，继续处理
            }

            if (isCustomArmor && customArmorData) {
                applyArmorData(customArmorData);
                const hasThresholds = applyThresholds(customArmorData.伤害阈值);
                showFadeNotification({
                    message: hasThresholds ? `因护甲信息更新，自动更新护甲值和伤害阈值` : `因护甲信息更新，自动更新护甲值`,
                    type: "success"
                });
            } else {
                // 尝试从变体卡列表中查找
                const armor = loadArmorVariantsFromStore().find((item) => item.id === armorId || item.名称 === armorId);

                if (armor) {
                    applyArmorData(armor);
                    const hasThresholds = applyThresholds(armor.伤害阈值);
                    showFadeNotification({
                        message: hasThresholds ? `因护甲信息更新，自动更新护甲值和伤害阈值` : `因护甲信息更新，自动更新护甲值`,
                        type: "success"
                    });
                } else {
                    // 既不是JSON也不在预设列表中，作为纯文本名称处理
                    updates.armorName = armorId;
                    updates.armorBaseScore = "";
                    updates.armorThreshold = "";
                    updates.armorFeature = "";
                    updates.minorThreshold = "";
                    updates.majorThreshold = "";
                    updates.armorValue = "";  // 清空护甲值
                    updates.armorMax = 0;      // 清空护甲上限
                }
            }
        }

        return {
            sheetData: {
                ...state.sheetData,
                ...updates
            }
        };
    }),

    // Card management actions
    deleteCard: (index, isInventory) => set((state) => {
        // 检查特殊卡位保护：聚焦卡组的前5个位置不能删除
        if (!isInventory && index < 5) {
            console.log('[Store] 特殊卡位不能删除');
            return state;
        }

        const emptyCard = createEmptyCard();

        if (isInventory) {
            // 删除库存卡牌
            const newInventoryCards = [...(state.sheetData.inventory_cards || [])];
            // 确保数组长度为20
            while (newInventoryCards.length < 20) {
                newInventoryCards.push(createEmptyCard());
            }
            newInventoryCards[index] = emptyCard;

            return {
                sheetData: {
                    ...state.sheetData,
                    inventory_cards: newInventoryCards
                }
            };
        } else {
            // 删除主卡组卡牌
            const newCards = [...(state.sheetData.cards || [])];
            // 确保数组长度为20
            while (newCards.length < 20) {
                newCards.push(createEmptyCard());
            }
            newCards[index] = emptyCard;

            return {
                sheetData: {
                    ...state.sheetData,
                    cards: newCards
                }
            };
        }
    }),

    moveCard: (fromIndex, fromInventory, toInventory) => {
        let success = false;

        set((state) => {
            if (fromInventory === toInventory) {
                success = false;
                return state; // 不需要移动
            }

            // 确保两个卡组都存在且长度为20
            const newFocusedCards = [...(state.sheetData.cards || [])];
            const newInventoryCards = [...(state.sheetData.inventory_cards || [])];

            while (newFocusedCards.length < 20) {
                newFocusedCards.push(createEmptyCard());
            }
            while (newInventoryCards.length < 20) {
                newInventoryCards.push(createEmptyCard());
            }

            // 获取要移动的卡牌
            const sourceCards = fromInventory ? newInventoryCards : newFocusedCards;
            const targetCards = toInventory ? newInventoryCards : newFocusedCards;
            const cardToMove = sourceCards[fromIndex];

            if (!cardToMove || cardToMove.name === '') {
                success = false;
                return state; // 空卡不能移动
            }

            // 检查特殊卡位保护：不能从聚焦卡组的特殊卡位(前5位)移动出去
            if (!fromInventory && fromIndex < 5) {
                console.log('[Store] 特殊卡位不能移动到库存卡组');
                success = false;
                return state;
            }

            // 检查特殊卡位保护：不能移动到聚焦卡组的特殊卡位(前5位)
            // 从库存移动到聚焦卡组时，不能放入特殊卡位
            if (!toInventory && fromInventory) {
                console.log('[Store] 从库存移动到聚焦卡组，不能占用特殊卡位');
                // 这种情况下会在后面的逻辑中自动跳过特殊卡位，从第6位开始查找
            }

            // 找到目标卡组中第一个空位（跳过特殊卡位）
            let targetIndex = -1;
            const startIndex = toInventory ? 0 : 5; // 移动到聚焦卡组时从第6位开始查找

            for (let i = startIndex; i < targetCards.length; i++) {
                if (!targetCards[i] || targetCards[i].name === '') {
                    targetIndex = i;
                    break;
                }
            }

            if (targetIndex === -1) {
                success = false;
                return state; // 目标卡组已满
            }

            // 执行移动：源位置用空卡替换，目标位置放入卡牌
            sourceCards[fromIndex] = createEmptyCard();
            targetCards[targetIndex] = cardToMove;

            success = true;
            return {
                sheetData: {
                    ...state.sheetData,
                    cards: newFocusedCards,
                    inventory_cards: newInventoryCards
                }
            };
        });

        return success;
    },

    updateCard: (index, card, isInventory) => set((state) => {
        if (isInventory) {
            // 更新库存卡牌
            const newInventoryCards = [...(state.sheetData.inventory_cards || [])];
            // 确保数组长度为20
            while (newInventoryCards.length < 20) {
                newInventoryCards.push(createEmptyCard());
            }
            newInventoryCards[index] = card;

            return {
                sheetData: {
                    ...state.sheetData,
                    inventory_cards: newInventoryCards
                }
            };
        } else {
            // 更新主卡组卡牌
            const newCards = [...(state.sheetData.cards || [])];
            // 确保数组长度为20
            while (newCards.length < 20) {
                newCards.push(createEmptyCard());
            }
            newCards[index] = card;

            return {
                sheetData: {
                    ...state.sheetData,
                    cards: newCards
                }
            };
        }
    }),

    // Handle profession change - auto-fill evasion and max HP at level 1
    handleProfessionChange: (newProfessionRef, newProfessionCard) => {
        const state = useSheetStore.getState();
        const currentLevel = state.sheetData.level;

        // Only handle at level 1 (or empty level which defaults to 1)
        if (currentLevel !== "1" && currentLevel !== "") {
            return;
        }

        // Handle profession deletion
        if (!newProfessionRef || !newProfessionRef.id) {
            set((state) => ({
                sheetData: {
                    ...state.sheetData,
                    evasion: "",
                    hpMax: 6,
                }
            }));

            showFadeNotification({
                message: "职业已清空，闪避值和最大生命值回到初始值。",
                type: "info"
            });
            return;
        }

        // Handle profession selection/change
        if (newProfessionCard && newProfessionCard.professionSpecial) {
            const evasion = newProfessionCard.professionSpecial["起始闪避"];
            const hp = newProfessionCard.professionSpecial["起始生命"];

            if (evasion !== undefined && hp !== undefined) {
                set((state) => ({
                    sheetData: {
                        ...state.sheetData,
                        evasion: String(evasion),
                        hpMax: hp,
                    }
                }));

                showFadeNotification({
                    message: `因职业更新，已自动填写闪避值 ${evasion} 和最大生命值 ${hp}`,
                    type: "success"
                });
            }
        }
    },
}));

// Selector functions for better performance
export const useSheetName = () => useSheetStore(state => state.sheetData.name);
export const useSheetLevel = () => useSheetStore(state => state.sheetData.level);
export const useSheetGold = () => useSheetStore(state => state.sheetData.gold);
export const useSheetHope = () => useSheetStore(state => state.sheetData.hope);
export const useSheetArmorBoxes = () => useSheetStore(state => state.sheetData.armorBoxes);
export const useSheetProficiency = () => useSheetStore(state => state.sheetData.proficiency);
export const useSheetHP = () => useSheetStore(state => state.sheetData.hp);
export const useSheetExperience = () => useSheetStore(state => state.sheetData.experience);

// Helper function to safely merge data, filtering out undefined values
const safelyMergeData = (defaultData: SheetData, userData: Partial<SheetData>): SheetData => {
    const result = { ...defaultData };

    // Only copy defined values from userData
    Object.keys(userData).forEach(key => {
        const value = userData[key as keyof SheetData];
        if (value !== undefined) {
            (result as any)[key] = value;
        }
    });

    return result;
};

const normalizeArmorBoxes = (armorBoxes?: boolean[]) =>
    Array.from({ length: ARMOR_SLOT_LIMIT }, (_, index) => Boolean(armorBoxes?.[index]));

const normalizeGoldSlots = (gold?: boolean[]) => {
    const normalized = createDefaultGoldSlots();
    return Array.from({ length: GOLD_SLOT_LIMIT }, (_, index) => {
        if (index === 0 && gold?.[index] === undefined) {
            return normalized[index];
        }

        return Boolean(gold?.[index]);
    });
}

const normalizeSheetData = (sheetData: SheetData): SheetData => ({
    ...sheetData,
    armorBoxes: normalizeArmorBoxes(sheetData.armorBoxes),
    gold: normalizeGoldSlots(sheetData.gold),
    proficiency: normalizeProficiency(sheetData.proficiency),
});

// Safe data selector with default values - using a memoized approach
let cachedSafeData: SheetData | null = null;
let lastSheetData: SheetData | null = null;

export const useSafeSheetData = () => useSheetStore(state => {
    // Only recalculate if sheetData has changed
    if (state.sheetData !== lastSheetData) {
        lastSheetData = state.sheetData;
        cachedSafeData = normalizeSheetData(safelyMergeData(defaultSheetData, state.sheetData));
    }
    return cachedSafeData!;
});
export const useSheetAttributes = () => useSheetStore(state => ({
    agility: state.sheetData.agility,
    finesse: state.sheetData.finesse,
    knowledge: state.sheetData.knowledge,
    strength: state.sheetData.strength,
    instinct: state.sheetData.instinct,
    presence: state.sheetData.presence,
}));

// Card-specific selectors
export const useSheetCards = () => useSheetStore(state => state.sheetData.cards);
export const useSheetInventoryCards = () => useSheetStore(state => state.sheetData.inventory_cards);

// Cache the card actions object to avoid infinite loops
let cachedCardActions: {
    deleteCard: (index: number, isInventory: boolean) => void;
    moveCard: (fromIndex: number, fromInventory: boolean, toInventory: boolean) => boolean;
    updateCard: (index: number, card: StandardCard, isInventory: boolean) => void;
} | null = null;

export const useCardActions = () => {
    return useSheetStore(state => {
        if (!cachedCardActions) {
            cachedCardActions = {
                deleteCard: state.deleteCard,
                moveCard: state.moveCard,
                updateCard: state.updateCard,
            };
        }
        return cachedCardActions;
    });
};
