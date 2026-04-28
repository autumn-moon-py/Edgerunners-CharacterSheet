import { createEmptyCard } from "@/card/card-types";
import type { SheetData } from "./sheet-data";
import { createDefaultProficiency } from "./proficiency";

export const ARMOR_SLOT_LIMIT = 6;
export const createEmptyArmorBoxes = (): boolean[] => Array(ARMOR_SLOT_LIMIT).fill(false);
export const GOLD_SLOT_LIMIT = 26;
export const createDefaultGoldSlots = (): boolean[] => [true, ...Array(GOLD_SLOT_LIMIT - 1).fill(false)];

export const defaultSheetData: SheetData = {
    name: "",
    characterImage: "",
    level: "1",
    proficiency: createDefaultProficiency(),
    ancestry1: "",
    ancestry2: "",
    profession: "",
    community: "",
    subclass: "",
    // Initialize new Ref fields
    professionRef: { id: "", name: "" },
    ancestry1Ref: { id: "", name: "" },
    ancestry2Ref: { id: "", name: "" },
    communityRef: { id: "", name: "" },
    subclassRef: { id: "", name: "" },

    evasion: "",

    agility: { checked: false, value: "" },
    strength: { checked: false, value: "" },
    finesse: { checked: false, value: "" },
    instinct: { checked: false, value: "" },
    presence: { checked: false, value: "" },
    knowledge: { checked: false, value: "" },

    // 默认点亮 1 格欧元，并补齐 26 格欧元槽位
    gold: createDefaultGoldSlots(),
    experience: ["声望", "", "", "", ""],
    experienceValues: ["0", "", "", "", ""],
    hope: 2,      // 默认2点希望
    hopeMax: 6,   // 默认最大6点

    hp: Array(18).fill(false),
    stress: Array(18).fill(false),
    hpMax: 6, // Defaulting to 6 as it's a common base
    stressMax: 6, // Defaulting to 6 as it's a common base

    armorBoxes: createEmptyArmorBoxes(),
    armorValue: "",
    armorBonus: "",
    armorMax: 0,
    humanityCurrent: "",
    humanityCyberLoad: "",

    minorThreshold: "",
    majorThreshold: "",

    inventory: ["", "", "", "", ""],
    characterBackground: "",
    characterAppearance: "",
    characterMotivation: "",

    cards: Array(20).fill(0).map(() => createEmptyCard()),          // 聚焦卡组（20张）
    inventory_cards: Array(20).fill(0).map(() => createEmptyCard()), // 库存卡组（20张）
    checkedUpgrades: {
        tier1: {},
        tier2: {},
        tier3: {},
    },

    primaryWeaponName: "",
    primaryWeaponTrait: "",
    primaryWeaponDamage: "",
    primaryWeaponFeature: "",
    secondaryWeaponName: "",
    secondaryWeaponTrait: "",
    secondaryWeaponDamage: "",
    secondaryWeaponFeature: "",

    armorName: "",
    armorBaseScore: "",
    armorThreshold: "",
    armorFeature: "",

    // 注释：移除了 focused_card_ids 字段，聚焦功能由双卡组系统取代

    pageVisibility: {
        adventureNotes: false    // 默认隐藏生命路径页
    },

    // 冒险笔记默认数据
    adventureNotes: {
        lifePath: {},
        characterProfile: {},
        playerInfo: {},
        backstory: '',
        milestones: '',
        adventureLog: Array(8).fill(null).map(() => ({
            name: '',
            levelRange: '',
            trauma: '',
            date: ''
        }))
    },
};
