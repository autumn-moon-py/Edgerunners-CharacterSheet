"use client"

import type React from "react"
import { useMemo, useState } from "react"
import ReactMarkdown from "react-markdown"
import { CardType, type StandardCard } from "@/card"
import { useCardStore } from "@/card/stores/unified-card-store"
import { GenericCardSelectionModal } from "@/components/modals/generic-card-selection-modal"
import { WeaponSelectionModal } from "@/components/modals/weapon-selection-modal"
import { ArmorSelectionModal } from "@/components/modals/armor-selection-modal"
import {
  buildVariantFeatureText,
  buildWeaponSummary,
  extractWeaponVariants,
  type VariantWeaponData,
} from "@/lib/equipment-variants"
import { getCyberwareEchoCost, getHumanityLevelBonus } from "@/lib/humanity-metrics"
import { safeEvaluateExpression } from "@/lib/number-utils"
import { getProficiencyCount } from "@/lib/proficiency"
import { useSafeSheetData, useSheetProficiency, useSheetStore } from "@/lib/sheet-store"

type ModalType = "profession" | "ancestry" | "community" | "subclass"

function MobileSection({
  title,
  titleRight,
  children,
}: {
  title: string
  titleRight?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <section className="border border-gray-200 bg-white p-2 shadow-sm">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="pl-[3px] text-base font-semibold text-gray-900">{title}</h2>
        {titleRight}
      </div>
      <div className="space-y-3">{children}</div>
    </section>
  )
}

function MobileField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <div className="pl-[3px] text-xs font-medium uppercase tracking-[0.12em] text-gray-500">{label}</div>
      {children}
    </div>
  )
}

function MobileTextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  const { className, ...restProps } = props

  return (
    <input
      {...restProps}
      className={`rounded-[3px] border border-gray-300 bg-white px-3 text-base text-gray-900 outline-none transition focus:border-gray-900 ${className || ""}`}
    />
  )
}

function MobileCompactNumberInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  const { className, ...restProps } = props

  return (
    <input
      {...restProps}
      className={`h-10 w-14 flex-none rounded-[3px] border border-gray-300 bg-white px-2 text-center text-base text-gray-900 outline-none transition focus:border-gray-900 ${className || ""}`}
    />
  )
}

function MobileReadonlyValue({ value, className }: { value: string; className?: string }) {
  return (
    <div className={`flex h-9 min-w-[56px] items-center justify-center rounded-[3px] border border-gray-300 bg-white px-2 text-center text-base font-semibold text-gray-900 ${className || ""}`}>
      {value}
    </div>
  )
}

function MobileAttributeInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  const { className, ...restProps } = props

  return (
    <input
      {...restProps}
      className={`h-9 w-full min-w-0 max-w-full rounded-[3px] border border-gray-300 bg-white px-1 text-center text-base font-normal text-gray-900 outline-none transition focus:border-gray-900 ${className || ""}`}
    />
  )
}

function MobileTinyNumberInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  const { className, ...restProps } = props

  return (
    <input
      {...restProps}
      className={`h-7 w-12 flex-none rounded-[3px] border border-gray-300 bg-white px-1 text-center text-sm font-normal text-gray-900 outline-none transition focus:border-gray-900 ${className || ""}`}
    />
  )
}

function MobileStatInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  const { className, ...restProps } = props

  return (
    <input
      {...restProps}
      className={`h-9 w-full min-w-0 rounded-[3px] border border-gray-300 bg-white px-2 text-center text-base font-normal text-gray-900 outline-none transition focus:border-gray-900 ${className || ""}`}
    />
  )
}

function MobileStatReadonlyValue({ value, className }: { value: string; className?: string }) {
  return (
    <div className={`flex h-9 min-w-0 items-center justify-center rounded-[3px] border border-gray-300 bg-white px-2 text-center text-base font-normal text-gray-900 ${className || ""}`}>
      {value}
    </div>
  )
}

function MobileStatCard({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-[3px] border border-gray-200 bg-gray-50 px-1.5 py-1.5">
      <div className="mb-1 pl-[3px] text-xs font-medium uppercase tracking-[0.12em] text-gray-500">{label}</div>
      {children}
    </div>
  )
}

function MobileTextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={`min-h-[88px] w-full rounded-[3px] border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-gray-900 ${props.className || ""}`}
    />
  )
}

function MobileSelectButton({
  label,
  value,
  onClick,
  disabled = false,
}: {
  label?: string
  value?: string
  onClick?: () => void
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`flex h-10 w-full items-center justify-between rounded-[3px] border border-gray-300 px-3 text-left text-sm transition ${
        disabled ? "cursor-default bg-gray-100 text-gray-500" : "bg-white text-gray-900 active:scale-[0.99]"
      }`}
    >
      <span className="truncate">{value || label || "请选择"}</span>
      {!disabled ? <span className="ml-3 text-gray-400">选择</span> : null}
    </button>
  )
}

function getModalCardType(modalType: ModalType): Exclude<CardType, CardType.Domain> {
  switch (modalType) {
    case "profession":
      return CardType.Profession
    case "ancestry":
      return CardType.Ancestry
    case "community":
      return CardType.Community
    case "subclass":
      return CardType.Subclass
  }
}

function getCyberpsychoMarks(currentHumanity: number, initialHumanity: number): number {
  if (initialHumanity <= 0 || currentHumanity <= 0) {
    return 4
  }

  const ratio = currentHumanity / initialHumanity
  if (ratio <= 0.25) return 3
  if (ratio <= 0.5) return 2
  if (ratio <= 0.75) return 1
  return 0
}

function getCyberpsychoStage(marks: number): string {
  if (marks >= 7) return "崩坏边缘"
  if (marks >= 5) return "临界"
  if (marks >= 3) return "裂痕"
  if (marks >= 1) return "征兆"
  return "稳定"
}

function getStringField(data: Record<string, unknown>, key: string): string {
  const value = data[key]
  return typeof value === "string" ? value : ""
}

export function MobilePageOne() {
  const safeFormData = useSafeSheetData()
  const proficiency = useSheetProficiency()
  const {
    setSheetData,
    updateAttribute,
    toggleAttributeChecked,
    updateExperience,
    updateExperienceValues,
    updateLevel,
    updateArmorThresholdWithDamage,
    updateArmorBaseScore,
    selectArmor,
    handleProfessionChange: autofillProfessionData,
  } = useSheetStore()
  const store = useCardStore()
  const cardsLoading = store.loading
  const availableWeapons = useMemo(() => {
    if (!store.initialized || cardsLoading) {
      return []
    }

    return extractWeaponVariants(store.loadAllCards())
  }, [cardsLoading, store.initialized, store.cards, store.batches])

  const [modalOpen, setModalOpen] = useState(false)
  const [currentModal, setCurrentModal] = useState<{ type: ModalType; field?: string; levelFilter?: number }>({
    type: "profession",
  })
  const [weaponModalOpen, setWeaponModalOpen] = useState(false)
  const [currentWeaponField, setCurrentWeaponField] = useState("")
  const [currentWeaponSlotType, setCurrentWeaponSlotType] = useState<"primary" | "secondary" | "inventory">("primary")
  const [armorModalOpen, setArmorModalOpen] = useState(false)

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = event.target

    if (name === "armorThreshold") {
      updateArmorThresholdWithDamage(value)
      return
    }

    if (name === "armorBaseScore") {
      updateArmorBaseScore(value)
      return
    }

    if (name === "level") {
      if (value === "" || /^([1-9]|10)$/.test(value)) {
        setSheetData({ level: value })
      }
      return
    }

    if (name === "armorValue") {
      setSheetData((prev) => ({
        ...prev,
        armorValue: value,
        armorMax: Number.parseInt(value, 10) || 0,
      }))
      return
    }

    setSheetData({ [name]: value } as Record<string, string>)
  }

  const openGenericModal = (type: ModalType, field?: string, levelFilter?: number) => {
    setCurrentModal({ type, field, levelFilter })
    setModalOpen(true)
  }

  const handleProfessionChange = (value: string) => {
    if (value === "none") {
      setSheetData({
        profession: "",
        professionRef: { id: "", name: "" },
        subclass: "",
        subclassRef: { id: "", name: "" },
      })
      autofillProfessionData(undefined, undefined)
      return
    }

    if (cardsLoading) {
      return
    }

    const professionCard = store.getCardById(value)
    if (professionCard && professionCard.type === CardType.Profession) {
      let fullName = professionCard.name
      if (professionCard.cardSelectDisplay?.item1 && professionCard.cardSelectDisplay?.item2) {
        fullName = `${professionCard.name}  -  ${professionCard.cardSelectDisplay.item1}&${professionCard.cardSelectDisplay.item2}`
      }

      const newRef = { id: professionCard.id, name: fullName }
      setSheetData({
        profession: professionCard.id,
        professionRef: newRef,
        subclass: "",
        subclassRef: { id: "", name: "" },
      })
      autofillProfessionData(newRef, professionCard)
    }
  }

  const handleAncestryChange = (field: string, value: string) => {
    const refField = field === "ancestry1" ? "ancestry1Ref" : "ancestry2Ref"

    if (value === "none" || !value) {
      setSheetData({
        [field]: "",
        [refField]: { id: "", name: "" },
      } as Record<string, string | { id: string; name: string }>)
      return
    }

    if (cardsLoading) {
      return
    }

    const ancestryCard = store.getCardById(value)
    if (ancestryCard && ancestryCard.type === CardType.Ancestry) {
      setSheetData({
        [field]: ancestryCard.id,
        [refField]: { id: ancestryCard.id, name: ancestryCard.name },
      } as Record<string, string | { id: string; name: string }>)
    }
  }

  const handleCommunityChange = (value: string) => {
    if (value === "none" || !value) {
      setSheetData({ community: "", communityRef: { id: "", name: "" } })
      return
    }

    if (cardsLoading) {
      return
    }

    const communityCard = store.getCardById(value)
    if (communityCard && communityCard.type === CardType.Community) {
      setSheetData({
        community: communityCard.id,
        communityRef: { id: communityCard.id, name: communityCard.name },
      })
    }
  }

  const handleSubclassChange = (value: string) => {
    if (value === "none" || !value) {
      setSheetData({ subclass: "", subclassRef: { id: "", name: "" } })
      return
    }

    if (cardsLoading) {
      return
    }

    const subclassCard = store.getCardById(value)
    if (subclassCard && (subclassCard.type === CardType.Subclass || subclassCard.type === CardType.Profession)) {
      setSheetData({
        subclass: subclassCard.id,
        subclassRef: { id: subclassCard.id, name: subclassCard.name },
      })
    }
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
      setSheetData(buildWeaponUpdates(fieldPrefix) as Record<string, string>)
      setWeaponModalOpen(false)
      return
    }

    let selectedWeapon: Partial<VariantWeaponData> | null = null

    try {
      selectedWeapon = JSON.parse(weaponId) as Partial<VariantWeaponData>
    } catch {
      selectedWeapon =
        availableWeapons.find(
          (weapon) =>
            (weapon.id === weaponId || weapon.名称 === weaponId) &&
            (weaponType === "primary" || weapon.负荷 === "单手"),
        ) ?? null
    }

    if (!selectedWeapon) {
      setWeaponModalOpen(false)
      return
    }

    setSheetData(buildWeaponUpdates(fieldPrefix, selectedWeapon) as Record<string, string>)
    setWeaponModalOpen(false)
  }

  const proficiencyCount = getProficiencyCount(proficiency)
  const professionCard = safeFormData.cards?.[0]
  const instinctValue = safeEvaluateExpression(safeFormData.instinct?.value || "")
  const humanityLevelBonus = getHumanityLevelBonus(safeFormData.level)
  const initialHumanity = Math.max(10, instinctValue * 10) + humanityLevelBonus
  const autoCyberLoad = safeFormData.cards.reduce((total, card) => {
    if (!card?.id) {
      return total
    }

    const latestCard = store.getCardById(card.id) ?? card
    return total + getCyberwareEchoCost(latestCard)
  }, 0)
  const cyberLoadInput =
    typeof safeFormData.humanityCyberLoad === "string" && safeFormData.humanityCyberLoad.trim() !== ""
      ? safeFormData.humanityCyberLoad
      : String(autoCyberLoad)
  const currentHumanityInput =
    typeof safeFormData.humanityCurrent === "string" && safeFormData.humanityCurrent.trim() !== ""
      ? safeFormData.humanityCurrent
      : String(initialHumanity - safeEvaluateExpression(cyberLoadInput))
  const cyberpsychoMarks = getCyberpsychoMarks(
    safeEvaluateExpression(currentHumanityInput),
    initialHumanity,
  )
  const hopeTrait =
    professionCard && professionCard.professionSpecial?.["希望特性"]
      ? String(professionCard.professionSpecial["希望特性"])
      : ""
  const experienceTexts = safeFormData.experience.slice(0, 4)
  const experienceValues = (safeFormData.experienceValues || ["0", "", "", "", ""]).slice(0, 4)
  const safeInventory =
    Array.isArray(safeFormData.inventory) && safeFormData.inventory.length >= 5
      ? safeFormData.inventory
      : ["", "", "", "", ""]
  const gold = safeFormData.gold || []
  const dynamicFormData = safeFormData as unknown as Record<string, unknown>
  const armorSlotValue = String(Math.max(safeEvaluateExpression(safeFormData.armorValue || safeFormData.armorBaseScore || ""), safeFormData.armorMax || 0))
  const hpValue = String(safeFormData.hp?.filter(Boolean).length || 0)
  const hpMaxValue = String(safeFormData.hpMax ?? professionCard?.professionSpecial?.["起始生命"] ?? 6)
  const stressValue = String(safeFormData.stress?.filter(Boolean).length || 0)
  const stressMaxValue = String(safeFormData.stressMax ?? 6)
  const hopeValue = String(typeof safeFormData.hope === "number" ? safeFormData.hope : 0)
  const hopeMaxValue = String(safeFormData.hopeMax || 6)
  const goldHundreds = String(gold.slice(0, 10).filter(Boolean).length)
  const goldThousands = String(gold.slice(10, 20).filter(Boolean).length)
  const goldTenThousands = String(gold.slice(20, 26).filter(Boolean).length)
  const inventoryCombined = safeInventory.filter((item) => item.trim() !== "").join("\n")

  const parseNonNegativeInt = (value: string, max: number): number | null => {
    if (value === "") {
      return 0
    }

    if (!/^\d+$/.test(value)) {
      return null
    }

    return Math.min(Number.parseInt(value, 10), max)
  }

  const updateTrackCount = (field: "hp" | "stress", value: string, max: number) => {
    const parsed = parseNonNegativeInt(value, max)
    if (parsed === null) {
      return
    }

    setSheetData({
      [field]: Array.from({ length: 18 }, (_, index) => index < parsed),
    } as Record<string, boolean[]>)
  }

  const updateTrackMax = (field: "hpMax" | "stressMax", value: string, max: number) => {
    const parsed = parseNonNegativeInt(value, max)
    if (parsed === null) {
      return
    }

    setSheetData({ [field]: parsed } as Record<string, number>)
  }

  const updateHopeValue = (value: string) => {
    const parsed = parseNonNegativeInt(value, 8)
    if (parsed === null) {
      return
    }

    setSheetData({ hope: parsed })
  }

  const updateHopeMaxValue = (value: string) => {
    const parsed = parseNonNegativeInt(value, 8)
    if (parsed === null) {
      return
    }

    setSheetData((prev) => ({
      ...prev,
      hopeMax: Math.max(parsed, 1),
      hope: Math.min(typeof prev.hope === "number" ? prev.hope : 0, Math.max(parsed, 1)),
    }))
  }

  const updateProficiencyValue = (value: string) => {
    const parsed = parseNonNegativeInt(value, 6)
    if (parsed === null) {
      return
    }

    setSheetData({
      proficiency: Array.from({ length: 6 }, (_, index) => index < parsed),
    })
  }

  const updateGoldSegment = (start: number, end: number, value: string) => {
    const parsed = parseNonNegativeInt(value, end - start)
    if (parsed === null) {
      return
    }

    setSheetData((prev) => {
      const nextGold = [...(prev.gold || [])]
      for (let index = start; index < end; index += 1) {
        nextGold[index] = index - start < parsed
      }

      return {
        ...prev,
        gold: nextGold,
      }
    })
  }

  const renderWeaponBlock = (title: string, fieldPrefix: "primaryWeapon" | "secondaryWeapon", slotType: "primary" | "secondary") => {
    const nameField = `${fieldPrefix}Name`
    const traitField = `${fieldPrefix}Trait`
    const damageField = `${fieldPrefix}Damage`
    const featureField = `${fieldPrefix}Feature`
    const rawDamageValue = getStringField(dynamicFormData, damageField)
    const featureValue = getStringField(dynamicFormData, featureField)
    const trimmedDamage = rawDamageValue.trim()
    const normalizedDamageValue =
      proficiencyCount > 0 && trimmedDamage.startsWith(String(proficiencyCount)) && /^[dD]/.test(trimmedDamage.slice(String(proficiencyCount).length))
        ? trimmedDamage.slice(String(proficiencyCount).length)
        : rawDamageValue
    const displayDamageValue =
      normalizedDamageValue.trim() && proficiencyCount > 0
        ? `${proficiencyCount}${normalizedDamageValue.trim()}`
        : normalizedDamageValue

    return (
        <div className="rounded-[3px] border border-gray-200 bg-gray-50 p-1.5">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div className="text-sm font-semibold text-gray-900">{title}</div>
          <button
            type="button"
            onClick={() => {
              setCurrentWeaponField(nameField)
              setCurrentWeaponSlotType(slotType)
              setWeaponModalOpen(true)
            }}
            className="rounded-[3px] border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700"
          >
            选择武器
          </button>
        </div>

        <div className="grid grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] gap-1.5">
          <div className="min-w-0">
            <MobileField label="名称">
              <MobileTextInput
                name={nameField}
                value={getStringField(dynamicFormData, nameField)}
                onChange={handleInputChange}
                placeholder=""
                className="w-full min-w-0"
              />
            </MobileField>
          </div>
          <div className="min-w-0">
            <MobileField label="基本信息">
              <MobileTextInput
                name={traitField}
                value={getStringField(dynamicFormData, traitField)}
                onChange={handleInputChange}
                placeholder=""
                className="w-full min-w-0"
              />
            </MobileField>
          </div>
        </div>

        <div className={`mt-3 grid gap-3 ${featureValue.trim() ? "sm:grid-cols-[140px_1fr]" : ""}`}>
          <MobileField label="伤害骰">
            <div className="flex h-10 items-center rounded-[3px] border border-gray-300 bg-white px-3">
              <input
                type="text"
                name={damageField}
                value={displayDamageValue}
                onChange={handleInputChange}
                className="min-w-0 flex-1 bg-transparent text-base text-gray-900 outline-none"
                placeholder=""
              />
            </div>
          </MobileField>
          {featureValue.trim() ? (
            <MobileField label="特性">
              <MobileTextArea
                name={featureField}
                value={featureValue}
                onChange={handleInputChange}
                className="min-h-[88px]"
              />
            </MobileField>
          ) : null}
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-2 pb-0">
        <MobileSection title="角色身份">
          <div className="grid gap-3">
            <MobileField label="职业">
              <MobileSelectButton value={safeFormData.professionRef?.name} label="选择职业" onClick={() => openGenericModal("profession")} />
            </MobileField>

            <div className="flex items-end gap-2">
              <div className="min-w-0 flex-1">
                <MobileField label="名称">
                  <MobileTextInput name="name" value={safeFormData.name || ""} onChange={handleInputChange} placeholder="" className="h-10 w-full min-w-0 text-sm" />
                </MobileField>
              </div>
              <div className="w-[112px] shrink-0">
                <div className="space-y-1.5">
                  <div className="pl-[3px] text-xs font-medium uppercase tracking-[0.12em] text-gray-500">等级</div>
                  <div className="flex h-10 w-full overflow-hidden rounded-[3px] border border-gray-300 bg-white">
                    <input
                      type="text"
                      name="level"
                      value={safeFormData.level || ""}
                      onChange={handleInputChange}
                      placeholder="1"
                      inputMode="numeric"
                      className="h-full w-[40px] min-w-0 border-0 border-r border-gray-300 bg-transparent px-0 text-center text-sm font-normal text-gray-900 outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const oldLevel = safeFormData.level || ""
                        if (!safeFormData.level || safeFormData.level.trim() === "") {
                          updateLevel("1", oldLevel)
                          return
                        }

                        const currentLevel = Number.parseInt(safeFormData.level, 10)
                        if (currentLevel >= 10) {
                          return
                        }

                        updateLevel(String(Math.min(currentLevel + 1, 10)), oldLevel)
                      }}
                      className="h-full flex-1 border-0 bg-gray-50 px-2 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-100"
                    >
                      升级
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <MobileField label="社群">
                <MobileSelectButton value={safeFormData.communityRef?.name} label="选择社群" onClick={() => openGenericModal("community")} />
              </MobileField>
              <MobileField label="子职业">
                <MobileSelectButton value={safeFormData.subclassRef?.name} label="选择子职业" onClick={() => openGenericModal("subclass")} />
              </MobileField>
            </div>
          </div>
        </MobileSection>

        <MobileSection title="职业特性">
          <div className="prose prose-sm max-w-none whitespace-pre-wrap rounded-[3px] border border-gray-200 bg-gray-50 p-2 text-gray-700 prose-headings:mb-1 prose-p:mt-1 prose-p:mb-1">
            <ReactMarkdown>{professionCard?.description || "当前职业还没有特性描述。"}</ReactMarkdown>
          </div>
        </MobileSection>

        <MobileSection title="生存概览">
          <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
            <MobileStatCard label="闪避">
              <MobileStatInput
                name="evasion"
                value={safeFormData.evasion || ""}
                onChange={handleInputChange}
                placeholder={professionCard?.professionSpecial?.["起始闪避"]?.toString() || ""}
                inputMode="numeric"
              />
            </MobileStatCard>
            <MobileStatCard label="护甲槽">
              <MobileStatReadonlyValue
                value={armorSlotValue}
              />
            </MobileStatCard>
            <MobileStatCard label="HP">
              <div className="grid w-full grid-cols-[minmax(0,1fr)_10px_minmax(0,1fr)] items-center gap-1">
                <MobileStatInput value={hpValue} onChange={(event) => updateTrackCount("hp", event.target.value, 18)} inputMode="numeric" />
                <span className="text-center text-sm text-gray-500">/</span>
                <MobileStatInput value={hpMaxValue} onChange={(event) => updateTrackMax("hpMax", event.target.value, 18)} inputMode="numeric" />
              </div>
            </MobileStatCard>
            <MobileStatCard label="压力">
              <div className="grid w-full grid-cols-[minmax(0,1fr)_10px_minmax(0,1fr)] items-center gap-1">
                <MobileStatInput value={stressValue} onChange={(event) => updateTrackCount("stress", event.target.value, 18)} inputMode="numeric" />
                <span className="text-center text-sm text-gray-500">/</span>
                <MobileStatInput value={stressMaxValue} onChange={(event) => updateTrackMax("stressMax", event.target.value, 18)} inputMode="numeric" />
              </div>
            </MobileStatCard>
            <MobileStatCard label="轻度伤害">
              <MobileStatInput name="minorThreshold" value={safeFormData.minorThreshold || ""} onChange={handleInputChange} inputMode="numeric" />
            </MobileStatCard>
            <MobileStatCard label="重度伤害">
              <MobileStatInput name="majorThreshold" value={safeFormData.majorThreshold || ""} onChange={handleInputChange} inputMode="numeric" />
            </MobileStatCard>
            <MobileStatCard label="初始人性">
              <MobileStatReadonlyValue value={String(initialHumanity)} />
            </MobileStatCard>
            <MobileStatCard label="义体负荷">
              <MobileStatInput name="humanityCyberLoad" value={cyberLoadInput} onChange={handleInputChange} inputMode="numeric" />
            </MobileStatCard>
            <MobileStatCard label="当前人性">
              <MobileStatInput name="humanityCurrent" value={currentHumanityInput} onChange={handleInputChange} inputMode="numeric" />
            </MobileStatCard>
            <MobileStatCard label="精神状态">
              <MobileStatReadonlyValue value={`${getCyberpsychoStage(cyberpsychoMarks)} / ${cyberpsychoMarks}`} className="text-sm" />
            </MobileStatCard>
          </div>
        </MobileSection>

        <MobileSection title="属性">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {[
              { name: "敏捷", key: "agility" },
              { name: "力量", key: "strength" },
              { name: "灵巧", key: "finesse" },
              { name: "本能", key: "instinct" },
              { name: "风度", key: "presence" },
              { name: "知识", key: "knowledge" },
            ].map((attr) => {
              const attrValue = safeFormData[attr.key as keyof typeof safeFormData]
              const currentValue =
                typeof attrValue === "object" && attrValue && "value" in attrValue && typeof attrValue.value === "string"
                  ? attrValue.value
                  : ""
              const checked = typeof attrValue === "object" && attrValue && "checked" in attrValue ? Boolean(attrValue.checked) : false

              return (
                <div key={attr.key} className="rounded-[3px] border border-gray-200 bg-gray-50 p-[5px]">
                  <div className="mb-2 flex items-center justify-between">
                    <div className="text-sm font-semibold text-gray-900">{attr.name}</div>
                    <button
                      type="button"
                      onClick={() => toggleAttributeChecked(attr.key as keyof typeof safeFormData)}
                      className={`h-5 w-5 rounded-full border ${checked ? "border-gray-900 bg-gray-900" : "border-gray-400 bg-white"}`}
                    />
                  </div>
                  <MobileAttributeInput
                    name={attr.key}
                    value={currentValue}
                    onChange={(event) => updateAttribute(attr.key as keyof typeof safeFormData, event.target.value)}
                    placeholder=""
                    inputMode="numeric"
                  />
                </div>
              )
            })}
          </div>
        </MobileSection>

        <MobileSection
          title="战斗装备"
          titleRight={
            <div className="flex items-center gap-2">
              <div className="pl-[3px] text-xs font-medium text-gray-900">熟练度</div>
              <MobileTinyNumberInput value={String(proficiencyCount)} onChange={(event) => updateProficiencyValue(event.target.value)} inputMode="numeric" />
            </div>
          }
        >

          {renderWeaponBlock("主武器", "primaryWeapon", "primary")}
          {renderWeaponBlock("副武器", "secondaryWeapon", "secondary")}

          <div className="rounded-[3px] border border-gray-200 bg-gray-50 p-1.5">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div className="text-sm font-semibold text-gray-900">护甲</div>
              <button
                type="button"
                onClick={() => setArmorModalOpen(true)}
                className="rounded-[3px] border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700"
              >
                选择护甲
              </button>
            </div>

            <div className="grid grid-cols-[minmax(0,1.2fr)_72px_88px] gap-1.5">
              <div className="min-w-0">
                <MobileField label="名称">
                  <MobileTextInput name="armorName" value={safeFormData.armorName || ""} onChange={handleInputChange} placeholder="" className="w-full min-w-0" />
                </MobileField>
              </div>
              <div className="min-w-0">
                <MobileField label="护甲值">
                  <MobileTextInput name="armorBaseScore" value={safeFormData.armorBaseScore || ""} onChange={handleInputChange} inputMode="numeric" className="w-full min-w-0 px-2 text-center" />
                </MobileField>
              </div>
              <div className="min-w-0">
                <MobileField label="阈值">
                  <MobileTextInput name="armorThreshold" value={safeFormData.armorThreshold || ""} onChange={handleInputChange} placeholder="" className="w-full min-w-0 px-2 text-center" />
                </MobileField>
              </div>
            </div>

            {safeFormData.armorFeature?.trim() ? (
              <div className="mt-3">
                <MobileField label="特性">
                  <MobileTextInput name="armorFeature" value={safeFormData.armorFeature || ""} onChange={handleInputChange} placeholder="" className="w-full min-w-0" />
                </MobileField>
              </div>
            ) : null}
          </div>
        </MobileSection>

        <MobileSection title="资源与经历">
          <div className="rounded-[3px] border border-gray-200 bg-gray-50 p-3">
            <div className="text-center text-sm font-semibold text-gray-900">希望</div>
            <div className="mt-2 flex items-center justify-center gap-2">
              <MobileCompactNumberInput value={hopeValue} onChange={(event) => updateHopeValue(event.target.value)} inputMode="numeric" />
              <span className="text-sm text-gray-500">/</span>
              <MobileCompactNumberInput value={hopeMaxValue} onChange={(event) => updateHopeMaxValue(event.target.value)} inputMode="numeric" />
            </div>
            {hopeTrait ? (
              <div className="prose prose-sm mt-3 max-w-none text-center text-gray-700 prose-headings:mb-1 prose-p:mt-1 prose-p:mb-1">
                <ReactMarkdown>{hopeTrait}</ReactMarkdown>
              </div>
            ) : null}
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-[3px] border border-gray-200 bg-gray-50 p-1.5">
              <div className="mb-3 text-sm font-semibold text-gray-900">经历</div>
              <div className="space-y-3">
                {experienceTexts.map((exp, index) => (
                  <div key={`mobile-exp-${index}`} className="grid grid-cols-[1fr_72px] gap-2">
                    <MobileTextInput value={exp} onChange={(event) => updateExperience(index, event.target.value)} placeholder={`经历 ${index + 1}`} />
                    <MobileTextInput value={experienceValues[index] || ""} onChange={(event) => updateExperienceValues(index, event.target.value)} placeholder="#" inputMode="numeric" className="text-center" />
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[3px] border border-gray-200 bg-gray-50 p-3">
              <div className="mb-3 text-sm font-semibold text-gray-900">库存</div>
              <MobileTextArea
                value={inventoryCombined}
                onChange={(event) => {
                  const values = event.target.value.split(/\r?\n/)
                  const nextInventory = Array.from({ length: 5 }, (_, index) => values[index] || "")
                  setSheetData({ inventory: nextInventory })
                }}
                placeholder="填写意义特殊的物品，否则都可被物资点系统取代"
                className="min-h-[36px] resize-none"
              />
            </div>
          </div>

          <div className="rounded-[3px] border border-gray-200 bg-gray-50 p-1.5">
            <div className="mb-3 text-sm font-semibold text-gray-900">欧元</div>
            <div className="flex items-start justify-center gap-6">
              <div className="flex flex-col items-center justify-center gap-1">
                <MobileCompactNumberInput value={goldHundreds} onChange={(event) => updateGoldSegment(0, 10, event.target.value)} inputMode="numeric" className="w-10" />
                <span className="text-sm text-gray-500">百</span>
              </div>
              <div className="flex flex-col items-center justify-center gap-1">
                <MobileCompactNumberInput value={goldThousands} onChange={(event) => updateGoldSegment(10, 20, event.target.value)} inputMode="numeric" className="w-10" />
                <span className="text-sm text-gray-500">千</span>
              </div>
              <div className="flex flex-col items-center justify-center gap-1">
                <MobileCompactNumberInput value={goldTenThousands} onChange={(event) => updateGoldSegment(20, 26, event.target.value)} inputMode="numeric" className="w-10" />
                <span className="text-sm text-gray-500">万</span>
              </div>
            </div>
          </div>
        </MobileSection>
      </div>

      <GenericCardSelectionModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSelect={(cardId, field) => {
          if (currentModal.type === "profession") {
            handleProfessionChange(cardId)
          } else if (currentModal.type === "ancestry" && field) {
            handleAncestryChange(field, cardId)
          } else if (currentModal.type === "community") {
            handleCommunityChange(cardId)
          } else if (currentModal.type === "subclass") {
            handleSubclassChange(cardId)
          }
          setModalOpen(false)
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
        cardType={getModalCardType(currentModal.type)}
        field={currentModal.field}
        levelFilter={currentModal.levelFilter}
      />

      <WeaponSelectionModal
        isOpen={weaponModalOpen}
        onClose={() => setWeaponModalOpen(false)}
        onSelect={handleWeaponChange}
        title={currentWeaponSlotType === "secondary" ? "选择副武器" : "选择主武器"}
        weaponSlotType={currentWeaponSlotType}
      />

      <ArmorSelectionModal
        isOpen={armorModalOpen}
        onClose={() => setArmorModalOpen(false)}
        onSelect={(armorId) => {
          selectArmor(armorId)
          setArmorModalOpen(false)
        }}
        title="选择护甲"
      />
    </>
  )
}
