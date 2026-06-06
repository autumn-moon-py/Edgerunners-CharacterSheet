"use client"

import type React from "react"

import { useState, useEffect, useMemo, useRef } from "react"
import {
  CardType, // Import CardType
} from "@/card"
import { useCardStore } from "@/card/stores/unified-card-store"
import { useSheetStore, useSheetArmorBoxes, useSheetProficiency, useSafeSheetData } from "@/lib/sheet-store"
import { safeEvaluateExpression } from "@/lib/number-utils"
import {
  buildVariantFeatureText,
  buildWeaponSummary,
  extractWeaponVariants,
  type VariantWeaponData,
} from "@/lib/equipment-variants"
import { ARMOR_SLOT_LIMIT } from "@/lib/default-sheet-data"
import { syncSheetCardSnapshots } from "@/lib/card-snapshot-sync"

// Import modals
import { GenericCardSelectionModal } from "@/components/modals/generic-card-selection-modal"
import { WeaponSelectionModal } from "@/components/modals/weapon-selection-modal"
import { ArmorSelectionModal } from "@/components/modals/armor-selection-modal"

// Import sections
import { HeaderSection } from "@/components/character-sheet-sections/header-section"
import { AttributesSection } from "@/components/character-sheet-sections/attributes-section"
import { HitPointsSection } from "@/components/character-sheet-sections/hit-points-section"
import { HopeSection } from "@/components/character-sheet-sections/hope-section"
import { ExperienceSection } from "@/components/character-sheet-sections/experience-section"
import { GoldSection, HumanitySection } from "@/components/character-sheet-sections/gold-section"
import { InventorySection } from "@/components/character-sheet-sections/inventory-section"
import { ProfessionDescriptionSection } from "@/components/character-sheet-sections/profession-description-section"
import { WeaponSection } from "@/components/character-sheet-sections/weapon-section"
import { ArmorSection } from "@/components/character-sheet-sections/armor-section"

export default function CharacterSheet() {
  const {
    setSheetData: setFormData,
    updateArmorBox,
    updateProficiency,
    selectArmor,
    handleProfessionChange: autofillProfessionData,
  } = useSheetStore();
  const armorBoxes = useSheetArmorBoxes();
  const proficiency = useSheetProficiency();
  const safeFormData = useSafeSheetData();

  // 使用全局卡牌Store
  const store = useCardStore();
  const cardsLoading = store.loading;
  const availableWeapons = useMemo(() => {
    if (!store.initialized || cardsLoading) {
      return []
    }

    return extractWeaponVariants(store.loadAllCards())
  }, [cardsLoading, store.initialized, store.cards, store.batches])

  // 在组件加载时确保系统已初始化
  useEffect(() => {
    if (!store.initialized) {
      store.initializeSystem();
    }
  }, [store.initialized, store.initializeSystem]);

  // 模态框状态
  const [modalOpen, setModalOpen] = useState(false)
  const [currentModal, setCurrentModal] = useState<{ type: "profession" | "ancestry" | "community" | "subclass"; field?: string; levelFilter?: number }>({ type: "profession" })
  const [weaponModalOpen, setWeaponModalOpen] = useState(false)
  const [currentWeaponField, setCurrentWeaponField] = useState("")
  const [currentWeaponSlotType, setCurrentWeaponSlotType] = useState<"primary" | "secondary" | "inventory">("primary")
  const [armorModalOpen, setArmorModalOpen] = useState(false)

  const needsSyncRef = useRef(true)
  const initialRenderRef = useRef(true)


  // 同步角色卡位与已存卡牌快照，确保核心包更新后角色数据能回填最新版
  const syncStoredCardsWithCharacterChoices = () => {
    try {
      const nextSheetData = syncSheetCardSnapshots(
        safeFormData,
        (cardId) => store.getCardById(cardId),
        store.loadAllCards(),
      )

      if (!nextSheetData) {
        return
      }

      setFormData(nextSheetData)
    } catch (error) {
      console.error("Error syncing stored cards:", error)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;

    setFormData((prev) => {
      const updatedFormData = { ...prev, [name]: value };

      // 如果修改的是 armorValue，则更新 armorMax
      if (name === "armorValue") {
        const parsedValue = parseInt(value, 10);
        updatedFormData.armorMax = isNaN(parsedValue) ? 0 : parsedValue;
        // Note: armorBoxes will be automatically cleared by the store when armorValue changes
      }

      return updatedFormData;
    });
  }

  const getWeaponFieldPrefix = (fieldName: string): "primaryWeapon" | "secondaryWeapon" | null => {
    if (fieldName.startsWith("primaryWeapon")) {
      return "primaryWeapon"
    }

    if (fieldName.startsWith("secondaryWeapon")) {
      return "secondaryWeapon"
    }

    return null
  }

  const buildWeaponUpdates = (
    fieldPrefix: "primaryWeapon" | "secondaryWeapon",
    weapon?: Partial<VariantWeaponData>,
  ) => {
    return {
      [`${fieldPrefix}Name`]: weapon?.名称 || "",
      [`${fieldPrefix}Trait`]: buildWeaponSummary(weapon),
      [`${fieldPrefix}Damage`]: weapon?.伤害 || "",
      [`${fieldPrefix}Feature`]: buildVariantFeatureText(weapon?.特性名称, weapon?.描述),
    }
  }

  const handleWeaponChange = (weaponId: string, weaponType: "primary" | "secondary") => {
    const fieldPrefix = getWeaponFieldPrefix(currentWeaponField)

    if (!fieldPrefix) {
      setWeaponModalOpen(false)
      return
    }

    if (weaponId === "none") {
      setFormData((prev) => ({
        ...prev,
        ...buildWeaponUpdates(fieldPrefix),
      }))
      setWeaponModalOpen(false)
      return
    }

    let selectedWeapon: Partial<VariantWeaponData> | null = null

    try {
      selectedWeapon = JSON.parse(weaponId) as Partial<VariantWeaponData>
    } catch {
      selectedWeapon = availableWeapons.find(
        (weapon) =>
          (weapon.id === weaponId || weapon.名称 === weaponId) &&
          (weaponType === "primary" || weapon.负荷 === "单手"),
      ) ?? null
    }

    if (!selectedWeapon) {
      setWeaponModalOpen(false)
      return
    }

    setFormData((prev) => ({
      ...prev,
      ...buildWeaponUpdates(fieldPrefix, selectedWeapon),
    }))
    setWeaponModalOpen(false)
  }

  const handleArmorChange = (armorId: string) => {
    selectArmor(armorId)
    setArmorModalOpen(false)
  }

  const openWeaponModal = (fieldName: string, slotType: "primary" | "secondary" | "inventory") => {
    setCurrentWeaponField(fieldName)
    setCurrentWeaponSlotType(slotType)
    setWeaponModalOpen(true)
  }

  const closeWeaponModal = () => {
    setWeaponModalOpen(false)
  }

  const openArmorModal = () => {
    setArmorModalOpen(true)
  }

  const closeArmorModal = () => {
    setArmorModalOpen(false)
  }





  // Helper function to map modal string type to CardType enum
  const getModalCardType = (modalType: "profession" | "ancestry" | "community" | "subclass"): Exclude<CardType, CardType.Domain> => {
    switch (modalType) {
      case "profession":
        return CardType.Profession;
      case "ancestry":
        return CardType.Ancestry;
      case "community":
        return CardType.Community;
      case "subclass":
        return CardType.Subclass;
      // No default needed as modalType is a constrained union type
    }
  };

  const handleProfessionChange = (value: string) => {
    console.log(`handleProfessionChange called with ID: ${value}`);

    if (value === "none") {
      // console.log("Clearing profession selection"); // Removed this log
      setFormData((prev) => {
        const updatedFormData = {
          ...prev,
          profession: "",
          professionRef: { id: "", name: "" },
          subclass: "",
          subclassRef: { id: "", name: "" },
        };
        return updatedFormData;
      });

      // 清空职业时调用自动填写（会重置为默认值）
      autofillProfessionData(undefined, undefined);
    } else {
      if (cardsLoading) {
        console.warn('handleProfessionChange: Cards not loaded yet');
        return;
      }
      const professionCard = store.getCardById(value);
      if (professionCard && professionCard.type === CardType.Profession) {
        // 构建完整的职业名称，包含卡牌选择信息
        let fullName = professionCard.name;
        if (professionCard.cardSelectDisplay?.item1 && professionCard.cardSelectDisplay?.item2) {
          fullName = `${professionCard.name}  -  ${professionCard.cardSelectDisplay.item1}&${professionCard.cardSelectDisplay.item2}`;
        }

        const newRef = { id: professionCard.id, name: fullName };

        setFormData((prev) => {
          const updatedFormData = {
            ...prev,
            profession: professionCard.id,
            professionRef: newRef,
            subclass: "",
            subclassRef: { id: "", name: "" },
          };
          return updatedFormData;
        });

        // 选择职业时调用自动填写
        autofillProfessionData(newRef, professionCard);
      } else {
        console.warn(`handleProfessionChange: Profession card not found for ID: ${value}`);
      }
    }
    needsSyncRef.current = true;
  }

  const handleAncestryChange = (field: string, value: string) => {
    console.log(`handleAncestryChange called for field: ${field}, ID: ${value}`);
    const refField = field === "ancestry1" ? "ancestry1Ref" : "ancestry2Ref";

    if (value === "none" || !value) {
      setFormData((prev) => {
        const updatedFormData = {
          ...prev,
          [field]: "",
          [refField]: { id: "", name: "" },
        };
        return updatedFormData;
      })
    } else {
      if (cardsLoading) {
        console.warn('handleAncestryChange: Cards not loaded yet');
        return;
      }
      const ancestryCard = store.getCardById(value);
      if (ancestryCard && ancestryCard.type === CardType.Ancestry) {
        setFormData((prev) => {
          const updatedFormData = {
            ...prev,
            [field]: ancestryCard.id,
            [refField]: { id: ancestryCard.id, name: ancestryCard.name },
          };
          return updatedFormData;
        })
      } else {
        console.warn(`handleAncestryChange: Ancestry card not found for ID: ${value} in field: ${field}`);
      }
    }
    needsSyncRef.current = true
  }

  const handleCommunityChange = (value: string) => {
    console.log(`handleCommunityChange called with ID: ${value}`);
    if (value === "none" || !value) {
      setFormData((prev) => {
        const updatedFormData = {
          ...prev,
          community: "",
          communityRef: { id: "", name: "" },
        };
        return updatedFormData;
      })
    } else {
      if (cardsLoading) {
        console.warn('handleCommunityChange: Cards not loaded yet');
        return;
      }
      const communityCard = store.getCardById(value);
      if (communityCard && communityCard.type === CardType.Community) {
        setFormData((prev) => {
          const updatedFormData = {
            ...prev,
            community: communityCard.id,
            communityRef: { id: communityCard.id, name: communityCard.name },
          };
          return updatedFormData;
        })
      } else {
        console.warn(`handleCommunityChange: Community card not found for ID: ${value}`);
      }
    }
    needsSyncRef.current = true
  }

  // 使用useEffect监听特殊字段的变化，并在需要时同步卡牌
  useEffect(() => {
    // 关键修复：如果卡牌数据仍在加载，则直接返回，不执行任何同步操作。
    // 这可以防止在卡牌数据加载完成之前尝试查找卡牌，从而避免了将卡牌替换为空白卡的问题。
    if (cardsLoading) {
      return;
    }

    // 只有在首次渲染完成且卡牌加载完毕后，或者在角色选择（如职业）发生变化需要同步时，才执行同步。
    if (initialRenderRef.current || needsSyncRef.current) {
      syncStoredCardsWithCharacterChoices();

      // 同步后重置标记，避免不必要的重复执行。
      if (initialRenderRef.current) {
        initialRenderRef.current = false;
      }
      if (needsSyncRef.current) {
        needsSyncRef.current = false;
      }
    }
  }, [
    cardsLoading,
    store.initialized,
    store.cards,
    store.batches,
    safeFormData.cards,
    safeFormData.inventory_cards,
    safeFormData.profession,
    safeFormData.subclass,
    safeFormData.ancestry1,
    safeFormData.ancestry2,
    safeFormData.community,
    safeFormData.professionRef?.id,
    safeFormData.subclassRef?.id,
    safeFormData.ancestry1Ref?.id,
    safeFormData.ancestry2Ref?.id,
    safeFormData.communityRef?.id,
  ]);

  const openGenericModal = (
    type: "profession" | "ancestry" | "community" | "subclass", // Add subclass type
    field?: string,
    levelFilter?: number,
  ) => {
    setCurrentModal({ type, field, levelFilter })
    setModalOpen(true)
  }

  const closeGenericModal = () => {
    setModalOpen(false)
  }

  const openProfessionModal = () => openGenericModal("profession")
  const openAncestryModal = (field: string) => openGenericModal("ancestry", field, field === "ancestry1" ? 1 : 2)
  const openCommunityModal = () => openGenericModal("community")
  const openSubclassModal = () => openGenericModal("subclass") // Ensure subclass type is supported


  const handleSubclassChange = (value: string) => {
    console.log(`handleSubclassChange called with ID: ${value}`);
    if (value === "none" || !value) {
      setFormData((prev) => {
        const updatedFormData = {
          ...prev,
          subclass: "",
          subclassRef: { id: "", name: "" },
        };
        return updatedFormData;
      })
    } else {
      if (cardsLoading) {
        console.warn('handleSubclassChange: Cards not loaded yet');
        return;
      }
      const subclassCard = store.getCardById(value);
      if (subclassCard && (subclassCard.type === CardType.Subclass || subclassCard.type === CardType.Profession)) {
        setFormData((prev) => {
          const updatedFormData = {
            ...prev,
            subclass: subclassCard.id,
            subclassRef: { id: subclassCard.id, name: subclassCard.name },
          };
          return updatedFormData;
        })
      } else {
        console.warn(`handleSubclassChange: Subclass card not found for ID: ${value}`);
      }
    }
    needsSyncRef.current = true;
  }

  const armorTrack = Array.from({ length: ARMOR_SLOT_LIMIT }, (_, index) => Boolean(armorBoxes?.[index]))
  const armorSlotCount = Math.min(
    Math.max(
      safeEvaluateExpression(safeFormData.armorValue || safeFormData.armorBaseScore || ""),
      safeFormData.armorMax || 0,
    ),
    ARMOR_SLOT_LIMIT,
  )


  return (
    <>
      <div className="w-full max-w-[210mm] mx-auto">
        <div
          className="a4-page p-2 bg-white text-gray-800 shadow-lg print:shadow-none rounded-md"
          style={{ width: "210mm" }}
        >
          {/* Header Section */}
          <HeaderSection
            onOpenProfessionModal={openProfessionModal}
            onOpenAncestryModal={openAncestryModal}
            onOpenCommunityModal={openCommunityModal}
            onOpenSubclassModal={openSubclassModal}
          />

          {/* Main Content */}
          <div className="grid grid-cols-2 gap-2 mt-1">
            {/* Left Column */}
            <div className="flex flex-col space-y-1">
              {/* Evasion & Resource Boxes */}
              <div className="flex w-full items-start justify-between">
                {/* Evasion Box */}
                <div className="shrink-0 w-[88px] h-24">
                  <div className="h-full rounded-lg overflow-hidden border border-gray-800 flex flex-col">
                    <div className="bg-gray-800 text-white py-1 px-2">
                      <div className="text-ms font-bold text-center">闪避值</div>
                    </div>
                    <div className="flex-1 bg-white flex items-center justify-center">
                      <input
                        type="text"
                        name="evasion"
                        value={safeFormData.evasion}
                        onChange={handleInputChange}
                        placeholder={safeFormData.cards[0]?.professionSpecial?.["起始闪避"]?.toString() || ""}
                        className="w-16 text-center bg-transparent border-b border-gray-400 focus:outline-none text-xl font-bold text-gray-800 placeholder-gray-400 pb-1"
                      />
                    </div>
                  </div>
                </div>

                {/* Armor Value Box */}
                <div className="shrink-0 w-[88px] h-24">
                  <div className="h-full rounded-lg overflow-hidden border border-gray-800 flex flex-col">
                    <div className="bg-gray-800 text-white py-1 px-2">
                      <div className="text-ms font-bold text-center">护甲槽</div>
                    </div>
                    <div className="flex-1 bg-white flex items-center justify-center">
                      <input
                        type="text"
                        name="armorValue"
                        value={safeFormData.armorValue}
                        onChange={handleInputChange}
                        placeholder={safeFormData.armorBaseScore || ""}
                        className="w-16 text-center bg-transparent border-b border-gray-400 focus:outline-none text-xl font-bold text-gray-800 placeholder-gray-400 pb-1"
                      />
                    </div>
                  </div>
                </div>

                {/* 欧元 */}
                <div className="w-[88px] h-24 shrink-0 rounded-lg overflow-hidden border border-gray-800 flex flex-col">
                  <div className="bg-gray-800 text-white py-1 px-2">
                    <div className="text-ms font-bold text-center">欧元</div>
                  </div>
                  <div className="flex-1 bg-white flex items-center justify-center">
                    <input
                      type="text"
                      name="goldAmount"
                      value={safeFormData.goldAmount || ""}
                      onChange={handleInputChange}
                      placeholder="0"
                      inputMode="numeric"
                      className="w-16 text-center bg-transparent border-b border-gray-400 focus:outline-none text-xl font-bold text-gray-800 placeholder-gray-400 pb-1"
                    />
                  </div>
                </div>

                {/* 声望 */}
                <div className="w-[88px] h-24 shrink-0 rounded-lg overflow-hidden border border-gray-800 flex flex-col">
                  <div className="bg-gray-800 text-white py-1 px-2">
                    <div className="text-ms font-bold text-center">声望</div>
                  </div>
                  <div className="flex-1 bg-white flex items-center justify-center">
                    <input
                      type="text"
                      name="reputationAmount"
                      value={safeFormData.reputationAmount || ""}
                      onChange={handleInputChange}
                      placeholder="0"
                      inputMode="numeric"
                      className="w-16 text-center bg-transparent border-b border-gray-400 focus:outline-none text-xl font-bold text-gray-800 placeholder-gray-400 pb-1"
                    />
                  </div>
                </div>
              </div>

              {/* Attributes */}
              <AttributesSection />

              {/* HP & Stress */}
              <HitPointsSection />

              {/* Experience */}
              <ExperienceSection />
            </div>

            {/* Right Column */}
            <div className="flex flex-col space-y-1">
              {/* Proficiency */}
              <div className="py-0">
                <div className="flex items-center gap-0.5 mb-1">
                  <span className="text-[10px] font-bold">熟练度</span>
                  {Array(6)
                    .fill(0)
                    .map((_, i) => (
                      <div
                        key={`prof-${i}`}
                        className={`w-3 h-3 rounded-full border-2 border-gray-800 cursor-pointer ${Array.isArray(proficiency) && proficiency[i] ? "bg-gray-800" : "bg-white"
                          }`}
                        onClick={() => updateProficiency(i)}
                      ></div>
                    ))}
                </div>
              </div>

              {/* Weapons */}
              <div className="mt-1">
                <WeaponSection
                  isPrimary
                  fieldPrefix="primaryWeapon"
                  onOpenWeaponModal={openWeaponModal}
                />
              </div>

              <div className="mt-1.5">
                <WeaponSection
                  fieldPrefix="secondaryWeapon"
                  onOpenWeaponModal={openWeaponModal}
                />
              </div>

              {/* Armor equipment */}
              <div className="mt-2">
                <ArmorSection onOpenArmorModal={openArmorModal} />
              </div>

              {/* Inventory */}
              <InventorySection />

              {/* Hope */}
              <HopeSection />
            </div>
          </div>

          {/* Profession Description */}
          <div className="px-1 pb-1 pt-[14px]">
            <h3 className="-translate-y-1 text-xs font-bold text-center">职业特性</h3>
            <ProfessionDescriptionSection description={safeFormData.cards[0]?.description} />
          </div>
        </div>
      </div>

      {modalOpen && (
        <GenericCardSelectionModal
          isOpen={modalOpen}
          onClose={closeGenericModal}
          onSelect={(cardId, field) => {
            console.log(`GenericModal onSelect: Type: ${currentModal.type}, ID: ${cardId}, Field: ${field}`);
            if (currentModal.type === "profession") {
              handleProfessionChange(cardId)
            } else if (currentModal.type === "ancestry" && field) {
              handleAncestryChange(field, cardId)
            } else if (currentModal.type === "community") {
              handleCommunityChange(cardId)
            } else if (currentModal.type === "subclass") {
              handleSubclassChange(cardId)
            }
            closeGenericModal()
          }}
          title={
            currentModal.type === "profession"
              ? "选择职业"
              : currentModal.type === "ancestry"
                ? "选择种族"
                : currentModal.type === "community"
                  ? "选择社群"
                  : "选择子职业"
          }
          cardType={getModalCardType(currentModal.type)} // Use the helper function here
          field={currentModal.field}
          levelFilter={currentModal.levelFilter}
        />
      )}

      <WeaponSelectionModal
        isOpen={weaponModalOpen}
        onClose={closeWeaponModal}
        onSelect={handleWeaponChange}
        title={currentWeaponSlotType === "secondary" ? "选择副武器" : "选择主武器"}
        weaponSlotType={currentWeaponSlotType}
      />

      <ArmorSelectionModal
        isOpen={armorModalOpen}
        onClose={closeArmorModal}
        onSelect={handleArmorChange}
        title="选择护甲"
      />
    </>
  )
}
