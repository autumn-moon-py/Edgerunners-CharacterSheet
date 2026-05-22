"use client"

import * as Popover from "@radix-ui/react-popover"
import { Check, ChevronDown, ChevronUp, Edit, X } from "lucide-react"
import { useEffect, useMemo, useRef, useState } from "react"
import { CardType } from "@/card"
import { createEmptyCard, isEmptyCard, type StandardCard } from "@/card/card-types"
import { useCardStore } from "@/card/stores/unified-card-store"
import { GenericCardSelectionModal } from "@/components/modals/generic-card-selection-modal"
import { showFadeNotification } from "@/components/ui/fade-notification"
import { upgradeOptionsData, type UpgradeOption } from "@/data/list/upgrade"
import { getInitialHumanityBaseFromInstinct } from "@/lib/humanity-metrics"
import { parseToNumber, safeEvaluateExpression } from "@/lib/number-utils"
import type { AttributeValue, CheckedUpgrades, SheetData } from "@/lib/sheet-data"
import { useSheetStore } from "@/lib/sheet-store"

interface UpgradeSectionProps {
  tier: 1 | 2 | 3
  title: string
  description: string
  formData: SheetData
}

const ATTRIBUTE_OPTIONS = [
  { key: "agility", label: "敏捷" },
  { key: "strength", label: "力量" },
  { key: "finesse", label: "灵巧" },
  { key: "instinct", label: "本能" },
  { key: "presence", label: "风度" },
  { key: "knowledge", label: "知识" },
] as const

type AttributeKey = (typeof ATTRIBUTE_OPTIONS)[number]["key"]

type UpgradeHistoryEntry =
  | {
      type: "attribute"
      targets: Array<{
        key: AttributeKey
        previousValue: string
        previousChecked: boolean
      }>
    }
  | {
      type: "experience"
      targets: Array<{
        index: number
        previousValue: string
      }>
    }
  | {
      type: "evasion"
      previousValue: string
    }
  | {
      type: "hp"
      previousValue: number
    }
  | {
      type: "stress"
      previousValue: number
    }
  | {
      type: "proficiency"
      previousValue: boolean[]
    }
  | {
      type: "subclass"
      slotIndex: number
      previousCard: StandardCard
    }

function createBaseCheckedUpgrades(): CheckedUpgrades {
  return {
    tier1: {},
    tier2: {},
    tier3: {},
  }
}

function getUpgradeOptions(tier: 1 | 2 | 3): UpgradeOption[] {
  const tierKey = `tier${tier}` as const
  const levelCap = upgradeOptionsData.tierLevelCaps[tierKey]

  return [
    ...upgradeOptionsData.baseUpgrades.map((option) => ({
      ...option,
      label: option.label.replace("{LEVEL_CAP}", levelCap),
    })),
    ...upgradeOptionsData.tierSpecificUpgrades[tierKey],
  ]
}

function isAttributeUpgradeOption(label: string) {
  return label.includes("角色属性+1")
}

function isExperienceUpgradeOption(label: string) {
  return label.includes("经历获得额外+1")
}

function isEvasionUpgradeOption(label: string) {
  return label.includes("闪避值+1")
}

function isHPUpgradeOption(label: string) {
  return label.includes("生命槽")
}

function isStressUpgradeOption(label: string) {
  return label.includes("压力槽")
}

function isProficiencyUpgradeOption(label: string) {
  return label.includes("熟练度+1")
}

function isSubclassUpgradeOption(label: string) {
  return label.includes("升级你的子职业")
}

function getAttributeState(attribute?: AttributeValue) {
  return {
    value: attribute?.value ?? "",
    checked: Boolean(attribute?.checked),
  }
}

function AttributeUpgradeEditor({
  formData,
  onCancel,
  onConfirm,
}: {
  formData: SheetData
  onCancel: () => void
  onConfirm: (targets: Array<{ key: AttributeKey; nextValue: string }>) => void
}) {
  const [selectedKeys, setSelectedKeys] = useState<AttributeKey[]>([])
  const [editingValues, setEditingValues] = useState<Record<AttributeKey, string>>(() => ({
    agility: formData.agility?.value ?? "",
    strength: formData.strength?.value ?? "",
    finesse: formData.finesse?.value ?? "",
    instinct: formData.instinct?.value ?? "",
    presence: formData.presence?.value ?? "",
    knowledge: formData.knowledge?.value ?? "",
  }))

  const handleToggle = (key: AttributeKey) => {
    const current = getAttributeState(formData[key])
    if (current.checked) {
      return
    }

    setSelectedKeys((prev) => {
      if (prev.includes(key)) {
        return prev.filter((item) => item !== key)
      }
      if (prev.length >= 2) {
        return prev
      }
      return [...prev, key]
    })
  }

  const canConfirm = selectedKeys.length === 2

  return (
    <div className="w-48">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-semibold text-gray-700">属性升级</span>
        <button type="button" onClick={onCancel} className="rounded p-0.5 transition-colors hover:bg-gray-100" title="关闭">
          <X className="h-3 w-3 text-gray-500" />
        </button>
      </div>
      <div className="mb-2 text-xs text-gray-600">
        选择并<strong>修改两项</strong>未升级的属性 ({selectedKeys.length}/2)
      </div>
      <div className="mb-3 space-y-1">
        {ATTRIBUTE_OPTIONS.map((attribute) => {
          const current = getAttributeState(formData[attribute.key])
          const selected = selectedKeys.includes(attribute.key)
          const disabled = current.checked || (!selected && selectedKeys.length >= 2)
          const rawAttribute = formData[attribute.key]
          const isSpellcasting =
            typeof rawAttribute === "object" &&
            rawAttribute !== null &&
            "spellcasting" in rawAttribute &&
            Boolean((rawAttribute as AttributeValue & { spellcasting?: boolean }).spellcasting)

          return (
            <div
              key={attribute.key}
              onClick={() => !disabled && handleToggle(attribute.key)}
              className={`flex items-center justify-between rounded border px-2 py-1.5 transition-colors ${disabled ? "cursor-not-allowed border-gray-200 bg-gray-100 opacity-60" : "cursor-pointer border-gray-300 bg-white hover:bg-gray-50"} ${selected ? "!border-blue-500 !bg-blue-100 hover:!bg-blue-100" : ""}`}
            >
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-0.5 text-xs font-medium">
                  {attribute.label}
                  {isSpellcasting && <span className="text-[11px] font-bold text-gray-800">✦</span>}
                  {current.checked && <span className="ml-1 text-[10px] text-gray-500">(已升级)</span>}
                </span>
              </div>
              <div className="flex items-center gap-1" onClick={(event) => event.stopPropagation()}>
                {selected && (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        const currentValue = parseToNumber(editingValues[attribute.key], 0)
                        setEditingValues((prev) => ({ ...prev, [attribute.key]: String(currentValue - 1) }))
                      }}
                      className="flex h-6 w-6 items-center justify-center rounded bg-blue-500 text-white transition-colors hover:bg-blue-600"
                      title="减少属性值 (-1)"
                    >
                      <ChevronDown className="h-3 w-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const currentValue = parseToNumber(editingValues[attribute.key], 0)
                        setEditingValues((prev) => ({ ...prev, [attribute.key]: String(currentValue + 1) }))
                      }}
                      className="flex h-6 w-6 items-center justify-center rounded bg-blue-500 text-white transition-colors hover:bg-blue-600"
                      title="增加属性值 (+1)"
                    >
                      <ChevronUp className="h-3 w-3" />
                    </button>
                  </>
                )}
                <input
                  type="text"
                  value={editingValues[attribute.key]}
                  disabled={!selected}
                  onChange={(event) => {
                    const value = event.target.value
                    setEditingValues((prev) => ({ ...prev, [attribute.key]: value }))
                  }}
                  className={`w-16 rounded border px-1 py-0.5 text-center text-xs ${selected ? "border-blue-300 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500" : "border-gray-200 bg-gray-50 text-gray-600"}`}
                />
              </div>
            </div>
          )
        })}
      </div>
      <button
        type="button"
        disabled={!canConfirm}
        onClick={() => onConfirm(selectedKeys.map((key) => ({ key, nextValue: editingValues[key] })))}
        className="flex w-full items-center justify-center gap-1 rounded bg-green-600 py-2 text-xs font-semibold text-white transition-colors hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-gray-300"
      >
        <Check className="h-3 w-3" />
        应用升级
      </button>
    </div>
  )
}

function ExperienceUpgradeEditor({
  formData,
  onCancel,
  onConfirm,
}: {
  formData: SheetData
  onCancel: () => void
  onConfirm: (targets: Array<{ index: number; nextValue: string }>) => void
}) {
  const experienceTexts = (formData.experience || []).slice(0, 4)
  const experienceValues = (formData.experienceValues || ["0", "", "", "", ""]).slice(0, 4)
  const available = experienceTexts
    .map((text, index) => ({ text, index, value: experienceValues[index] || "" }))
    .filter((item) => item.text.trim() !== "")

  const [selectedIndices, setSelectedIndices] = useState<number[]>([])
  const [editingValues, setEditingValues] = useState<Record<number, string>>(() =>
    available.reduce<Record<number, string>>((result, item) => {
      result[item.index] = item.value
      return result
    }, {})
  )

  const handleToggle = (index: number) => {
    setSelectedIndices((prev) => {
      if (prev.includes(index)) {
        return prev.filter((item) => item !== index)
      }
      if (prev.length >= 2) {
        return prev
      }
      return [...prev, index]
    })
  }

  const canConfirm = selectedIndices.length === 2

  return (
    <div className="w-48">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-semibold text-gray-700">经历加值升级</span>
        <button type="button" onClick={onCancel} className="rounded p-0.5 transition-colors hover:bg-gray-100" title="关闭">
          <X className="h-3 w-3 text-gray-500" />
        </button>
      </div>
      <div className="mb-2 text-xs text-gray-600">
        选择并<strong>修改两项</strong>经历加值 ({selectedIndices.length}/2)
      </div>
      {available.length < 2 ? (
        <div className="rounded border border-gray-200 bg-gray-50 py-4 text-center text-xs text-gray-500">
          {available.length === 0 ? "暂无经历内容" : "需要至少2项经历"}
        </div>
      ) : (
        <>
          <div className="mb-3 max-h-64 space-y-1 overflow-y-auto">
            {available.map((item) => {
              const selected = selectedIndices.includes(item.index)
              const disabled = !selected && selectedIndices.length >= 2
              const displayValue = selected ? editingValues[item.index] ?? "" : item.value

              return (
                <div
                  key={item.index}
                  onClick={() => !disabled && handleToggle(item.index)}
                  className={`flex items-center justify-between rounded border px-2 py-1.5 transition-colors ${disabled ? "cursor-not-allowed border-gray-200 bg-gray-100 opacity-60" : "cursor-pointer border-gray-300 bg-white hover:bg-gray-50"} ${selected ? "!border-blue-500 !bg-blue-100 hover:!bg-blue-100" : ""}`}
                >
                  <div className="min-w-0 flex-1">
                    <span className="truncate text-xs text-gray-700" title={item.text}>
                      {item.text}
                    </span>
                  </div>
                  <div className="flex flex-shrink-0 items-center gap-1" onClick={(event) => event.stopPropagation()}>
                    {selected && (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            const currentValue = parseToNumber(displayValue, 0)
                            setEditingValues((prev) => ({ ...prev, [item.index]: String(currentValue - 1) }))
                          }}
                          className="flex h-6 w-6 items-center justify-center rounded bg-blue-500 text-white transition-colors hover:bg-blue-600"
                          title="减少经历加值 (-1)"
                        >
                          <ChevronDown className="h-3 w-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const currentValue = parseToNumber(displayValue, 0)
                            setEditingValues((prev) => ({ ...prev, [item.index]: String(currentValue + 1) }))
                          }}
                          className="flex h-6 w-6 items-center justify-center rounded bg-blue-500 text-white transition-colors hover:bg-blue-600"
                          title="增加经历加值 (+1)"
                        >
                          <ChevronUp className="h-3 w-3" />
                        </button>
                      </>
                    )}
                    <input
                      type="text"
                      value={displayValue}
                      disabled={!selected}
                      onChange={(event) => {
                        const value = event.target.value
                        setEditingValues((prev) => ({ ...prev, [item.index]: value }))
                      }}
                      className={`w-14 rounded border px-1 py-0.5 text-center text-xs ${selected ? "border-blue-300 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500" : "border-gray-200 bg-gray-50 text-gray-600"}`}
                      placeholder="+0"
                    />
                  </div>
                </div>
              )
            })}
          </div>
          <button
            type="button"
            disabled={!canConfirm}
            onClick={() => onConfirm(selectedIndices.map((index) => ({ index, nextValue: editingValues[index] ?? "" })))}
            className="flex w-full items-center justify-center gap-1 rounded bg-green-600 py-2 text-xs font-semibold text-white transition-colors hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-gray-300"
          >
            <Check className="h-3 w-3" />
            应用升级
          </button>
        </>
      )}
    </div>
  )
}

function EvasionUpgradeEditor({
  value,
  onCancel,
  onConfirm,
}: {
  value?: string
  onCancel: () => void
  onConfirm: (nextValue: string) => void
}) {
  const [draft, setDraft] = useState(value ?? "")

  return (
    <div className="w-32">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-semibold text-gray-700">闪避值 +1</span>
        <button type="button" onClick={onCancel} className="rounded p-0.5 transition-colors hover:bg-gray-100" title="关闭">
          <X className="h-3 w-3 text-gray-500" />
        </button>
      </div>
      <div className="mb-3 flex items-center gap-1">
        <button
          type="button"
          onClick={() => setDraft(String(safeEvaluateExpression(draft || "0") - 1))}
          className="flex h-6 w-6 items-center justify-center rounded bg-blue-500 text-white transition-colors hover:bg-blue-600"
          title="计算当前值 -1"
        >
          <ChevronDown className="h-3 w-3" />
        </button>
        <button
          type="button"
          onClick={() => setDraft(String(safeEvaluateExpression(draft || "0") + 1))}
          className="flex h-6 w-6 items-center justify-center rounded bg-blue-500 text-white transition-colors hover:bg-blue-600"
          title="计算当前值 +1"
        >
          <ChevronUp className="h-3 w-3" />
        </button>
        <input
          type="text"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          className="w-16 rounded border border-gray-300 px-2 py-1 text-center text-sm font-bold focus:border-blue-500 focus:outline-none"
          placeholder="0"
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              onConfirm(draft.trim())
            }
          }}
        />
      </div>
      <button
        type="button"
        onClick={() => onConfirm(draft.trim())}
        className="flex w-full items-center justify-center gap-1 rounded bg-green-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-green-700"
      >
        <Check className="h-3 w-3" />
        确认
      </button>
    </div>
  )
}

function HPMaxEditor({
  value,
  onCancel,
  onConfirm,
}: {
  value: number
  onCancel: () => void
  onConfirm: (nextValue: number) => void
}) {
  const [inputValue, setInputValue] = useState(String(value))

  return (
    <div className="w-24">
      <div className="mb-1.5 flex items-center justify-between">
        <span className="text-xs font-semibold text-gray-700">HP上限</span>
        <button type="button" onClick={onCancel} className="rounded p-0.5 transition-colors hover:bg-gray-100" title="关闭">
          <X className="h-3 w-3 text-gray-500" />
        </button>
      </div>
      <div className="flex items-center gap-1">
        <input
          type="text"
          inputMode="numeric"
          value={inputValue}
          onChange={(event) => setInputValue(event.target.value)}
          onBlur={() => setInputValue(String(Math.min(Math.max(parseToNumber(inputValue, value), 1), 18)))}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              onConfirm(Math.min(Math.max(parseToNumber(inputValue, value), 1), 18))
            }
          }}
          className="w-10 rounded border border-gray-300 px-1 py-1 text-center text-sm font-bold focus:border-blue-500 focus:outline-none"
        />
        <button
          type="button"
          onClick={() => {
            const nextValue = Math.min(parseToNumber(inputValue, value) + 1, 18)
            setInputValue(String(nextValue))
            onConfirm(nextValue)
          }}
          disabled={parseToNumber(inputValue, value) >= 18}
          className="flex h-8 w-8 items-center justify-center rounded bg-blue-500 text-white transition-colors hover:bg-blue-600 disabled:cursor-not-allowed disabled:bg-gray-300"
          title="增加生命值上限 (+1)"
        >
          <ChevronUp className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

function StressMaxEditor({
  value,
  onCancel,
  onConfirm,
}: {
  value: number
  onCancel: () => void
  onConfirm: (nextValue: number) => void
}) {
  const [inputValue, setInputValue] = useState(String(value))

  return (
    <div className="w-28">
      <div className="mb-1.5 flex items-center justify-between">
        <span className="text-xs font-semibold text-gray-700">压力上限</span>
        <button type="button" onClick={onCancel} className="rounded p-0.5 transition-colors hover:bg-gray-100" title="关闭">
          <X className="h-3 w-3 text-gray-500" />
        </button>
      </div>
      <div className="flex items-center gap-1">
        <input
          type="text"
          inputMode="numeric"
          value={inputValue}
          onChange={(event) => setInputValue(event.target.value)}
          onBlur={() => setInputValue(String(Math.min(Math.max(parseToNumber(inputValue, value), 1), 18)))}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              onConfirm(Math.min(Math.max(parseToNumber(inputValue, value), 1), 18))
            }
          }}
          className="w-10 rounded border border-gray-300 px-1 py-1 text-center text-sm font-bold focus:border-blue-500 focus:outline-none"
        />
        <button
          type="button"
          onClick={() => {
            const nextValue = Math.min(parseToNumber(inputValue, value) + 1, 18)
            setInputValue(String(nextValue))
            onConfirm(nextValue)
          }}
          disabled={parseToNumber(inputValue, value) >= 18}
          className="flex h-8 w-8 items-center justify-center rounded bg-blue-500 text-white transition-colors hover:bg-blue-600 disabled:cursor-not-allowed disabled:bg-gray-300"
          title="增加压力上限 (+1)"
        >
          <ChevronUp className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

function ProficiencyEditor({
  value,
  onCancel,
  onConfirm,
}: {
  value: boolean[]
  onCancel: () => void
  onConfirm: (nextValue: boolean[]) => void
}) {
  const currentCount = value.filter(Boolean).length

  return (
    <div className="w-40">
      <div className="mb-1 flex items-center justify-between">
        <span className="text-xs font-semibold text-gray-700">熟练度 ({currentCount}/6)</span>
        <button type="button" onClick={onCancel} className="rounded p-0.5 transition-colors hover:bg-gray-100" title="关闭">
          <X className="h-2.5 w-2.5 text-gray-500" />
        </button>
      </div>
      <div className="flex gap-1">
        {Array.from({ length: 6 }, (_, index) => (
          <button
            key={index}
            type="button"
            onClick={() => {
              const nextValue = value.map((_, itemIndex) => itemIndex <= index)
              onConfirm(nextValue)
            }}
            className={`h-5 w-5 rounded-full border-2 border-gray-800 transition-colors ${value[index] ? "bg-gray-800" : "bg-white hover:bg-gray-200"}`}
            title={`熟练度 ${index + 1}`}
          />
        ))}
      </div>
    </div>
  )
}

function NewExperienceEditor({
  formData,
  onCancel,
  onConfirm,
}: {
  formData: SheetData
  onCancel: () => void
  onConfirm: (text: string, value: string) => void
}) {
  const experienceTexts = (formData.experience || []).slice(0, 4)
  const experienceValues = (formData.experienceValues || ["0", "", "", "", ""]).slice(0, 4)
  const hasEmptySlot = experienceTexts.some((text, index) => text.trim() === "" && (experienceValues[index] || "").trim() === "")
  const [text, setText] = useState("")
  const [value, setValue] = useState("+2")

  return (
    <div className="w-48">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-semibold text-gray-700">添加新经历</span>
        <button type="button" onClick={onCancel} className="rounded p-0.5 transition-colors hover:bg-gray-100" title="关闭">
          <X className="h-3 w-3 text-gray-500" />
        </button>
      </div>
      <div className="mb-2 rounded border border-blue-200 bg-blue-50 px-2 py-1.5">
        <p className="text-[10px] leading-relaxed text-blue-700">熟练度会在更新等级时自动更新</p>
      </div>
      {!hasEmptySlot ? (
        <div className="rounded border border-gray-200 bg-gray-50 py-4 text-center text-xs text-gray-500">
          所有经历位已满，请先清空一个位置
        </div>
      ) : (
        <>
          <div className="mb-3">
            <label className="mb-1 block text-xs text-gray-600">经历内容</label>
            <input
              type="text"
              value={text}
              onChange={(event) => setText(event.target.value)}
              placeholder="输入新的经历..."
              className="w-full rounded border border-gray-300 px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
              onKeyDown={(event) => {
                if (event.key === "Enter" && text.trim() !== "") {
                  onConfirm(text.trim(), value.trim() || "+2")
                }
              }}
            />
          </div>
          <div className="mb-3">
            <label className="mb-1 block text-xs text-gray-600">经历加值</label>
            <input
              type="text"
              value={value}
              onChange={(event) => setValue(event.target.value)}
              placeholder="+2"
              className="w-full rounded border border-gray-300 px-2 py-1.5 text-center text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <button
            type="button"
            onClick={() => onConfirm(text.trim(), value.trim() || "+2")}
            disabled={text.trim() === ""}
            className="flex w-full items-center justify-center gap-1 rounded bg-green-600 py-2 text-xs font-semibold text-white transition-colors hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-gray-300"
          >
            <Check className="h-3 w-3" />
            添加经历
          </button>
        </>
      )}
    </div>
  )
}

export function UpgradeSection({ tier, title, description, formData }: UpgradeSectionProps) {
  const tierKey = `tier${tier}` as const
  const options = useMemo(() => getUpgradeOptions(tier), [tier])
  const { setSheetData } = useSheetStore()
  const cardStoreInitialized = useCardStore((state) => state.initialized)
  const initializeCardSystem = useCardStore((state) => state.initializeSystem)
  const getCardById = useCardStore((state) => state.getCardById)
  const historyRef = useRef<Record<string, UpgradeHistoryEntry>>({})
  const [openEditorKey, setOpenEditorKey] = useState<string | null>(null)
  const [subclassModalOpen, setSubclassModalOpen] = useState(false)
  const [subclassSlotIndex, setSubclassSlotIndex] = useState<number | null>(null)
  const [subclassCheckKey, setSubclassCheckKey] = useState<string | null>(null)

  useEffect(() => {
    if (!cardStoreInitialized) {
      initializeCardSystem()
    }
  }, [cardStoreInitialized, initializeCardSystem])

  const setCheckedState = (checkKey: string, index: number, checked: boolean) => {
    setSheetData((prev) => {
      const checkedUpgrades = prev.checkedUpgrades ?? createBaseCheckedUpgrades()

      return {
        checkedUpgrades: {
          ...checkedUpgrades,
          tier1: checkedUpgrades.tier1 ?? {},
          tier2: checkedUpgrades.tier2 ?? {},
          tier3: checkedUpgrades.tier3 ?? {},
          [checkKey]: {
            ...(checkedUpgrades[checkKey] ?? {}),
            [index]: checked,
          },
        },
      }
    })
  }

  const isChecked = (checkKey: string, index: number) => {
    return Boolean(formData.checkedUpgrades?.[checkKey]?.[index])
  }

  const rollbackComplexUpgrade = (checkKey: string, index: number) => {
    const history = historyRef.current[checkKey]
    if (!history) {
      // 组件卸载后重新挂载时 historyRef 会丢失，但勾选状态保存在持久化 store 中。
      // 此时无法自动回滚数值，但可以取消勾选让用户自行调整。
      setCheckedState(checkKey, index, false)
      return
    }

    if (history.type === "attribute") {
      const updates: Partial<SheetData> = {}
      history.targets.forEach((target) => {
        updates[target.key] = {
          value: target.previousValue,
          checked: target.previousChecked,
        }
      })
      setSheetData(updates)
    }

    if (history.type === "experience") {
      const nextValues = [...(formData.experienceValues || ["0", "", "", "", ""])]
      history.targets.forEach((target) => {
        nextValues[target.index] = target.previousValue
      })
      setSheetData({ experienceValues: nextValues })
    }

    if (history.type === "evasion") {
      setSheetData({ evasion: history.previousValue })
    }

    if (history.type === "hp") {
      setSheetData({ hpMax: history.previousValue })
    }

    if (history.type === "stress") {
      setSheetData({ stressMax: history.previousValue })
    }

    if (history.type === "proficiency") {
      setSheetData({ proficiency: history.previousValue })
    }

    if (history.type === "subclass") {
      const nextCards = [...(formData.cards || Array(20).fill(0).map(() => createEmptyCard()))]
      nextCards[history.slotIndex] = history.previousCard
      setSheetData({ cards: nextCards })
    }

    delete historyRef.current[checkKey]
    setCheckedState(checkKey, index, false)
  }

  const handleSimpleUpgrade = (option: UpgradeOption, checkKey: string, index: number) => {
    const currentlyChecked = isChecked(checkKey, index)

    if (isAttributeUpgradeOption(option.label) || isExperienceUpgradeOption(option.label) || isEvasionUpgradeOption(option.label) || isHPUpgradeOption(option.label) || isStressUpgradeOption(option.label) || isProficiencyUpgradeOption(option.label)) {
      if (currentlyChecked) {
        rollbackComplexUpgrade(checkKey, index)
        return
      }

      setOpenEditorKey(checkKey)
      return
    }

    setCheckedState(checkKey, index, !currentlyChecked)
  }

  const handleAttributeConfirm = (checkKey: string, optionIndex: number, targets: Array<{ key: AttributeKey; nextValue: string }>) => {
    const historyTargets = targets.map((target) => {
      const previous = getAttributeState(formData[target.key])
      return {
        key: target.key,
        previousValue: previous.value,
        previousChecked: previous.checked,
      }
    })

    const updates: Partial<SheetData> = {}
    targets.forEach((target) => {
      updates[target.key] = {
        value: target.nextValue,
        checked: true,
      }

      if (target.key === "instinct" && !formData.humanityInitialBase) {
        updates.humanityInitialBase = String(getInitialHumanityBaseFromInstinct(formData.instinct?.value))
      }
    })

    historyRef.current[checkKey] = {
      type: "attribute",
      targets: historyTargets,
    }

    setSheetData(updates)
    setCheckedState(checkKey, optionIndex, true)
    setOpenEditorKey(null)
  }

  const handleExperienceConfirm = (checkKey: string, optionIndex: number, targets: Array<{ index: number; nextValue: string }>) => {
    const nextValues = [...(formData.experienceValues || ["0", "", "", "", ""])]
    historyRef.current[checkKey] = {
      type: "experience",
      targets: targets.map((target) => ({
        index: target.index,
        previousValue: nextValues[target.index] || "",
      })),
    }

    targets.forEach((target) => {
      nextValues[target.index] = target.nextValue
    })

    setSheetData({ experienceValues: nextValues })
    setCheckedState(checkKey, optionIndex, true)
    setOpenEditorKey(null)
  }

  const handleEvasionConfirm = (checkKey: string, optionIndex: number, nextValue: string) => {
    historyRef.current[checkKey] = {
      type: "evasion",
      previousValue: formData.evasion || "",
    }

    setSheetData({ evasion: nextValue })
    setCheckedState(checkKey, optionIndex, true)
    setOpenEditorKey(null)
  }

  const handleHPConfirm = (checkKey: string, optionIndex: number, nextValue: number) => {
    historyRef.current[checkKey] = {
      type: "hp",
      previousValue: formData.hpMax || 6,
    }

    setSheetData({ hpMax: nextValue })
    setCheckedState(checkKey, optionIndex, true)
    setOpenEditorKey(null)
  }

  const handleStressConfirm = (checkKey: string, optionIndex: number, nextValue: number) => {
    historyRef.current[checkKey] = {
      type: "stress",
      previousValue: formData.stressMax || 6,
    }

    setSheetData({ stressMax: nextValue })
    setCheckedState(checkKey, optionIndex, true)
    setOpenEditorKey(null)
  }

  const handleProficiencyConfirm = (checkKey: string, optionIndex: number, nextValue: boolean[]) => {
    const previousValue = Array.isArray(formData.proficiency)
      ? [...formData.proficiency]
      : Array(6).fill(false)

    historyRef.current[checkKey] = {
      type: "proficiency",
      previousValue,
    }

    setSheetData({ proficiency: nextValue })
    setCheckedState(checkKey, optionIndex, true)
    setOpenEditorKey(null)
  }

  const handleOpenSubclassModal = (checkKey: string) => {
    const cards = formData.cards || []
    let emptySlotIndex = -1

    for (let index = 5; index < 20; index += 1) {
      if (isEmptyCard(cards[index])) {
        emptySlotIndex = index
        break
      }
    }

    if (emptySlotIndex === -1) {
      showFadeNotification({
        message: "聚焦卡组没有空余栏位了",
        type: "error",
      })
      return
    }

    setSubclassSlotIndex(emptySlotIndex)
    setSubclassCheckKey(checkKey)
    setSubclassModalOpen(true)
  }

  const handleSubclassSelect = (cardId: string) => {
    if (!subclassCheckKey || subclassSlotIndex === null) {
      setSubclassModalOpen(false)
      setSubclassSlotIndex(null)
      setSubclassCheckKey(null)
      return
    }

    if (cardId === "none") {
      setSubclassModalOpen(false)
      setSubclassSlotIndex(null)
      setSubclassCheckKey(null)
      return
    }

    const selectedCard = getCardById(cardId)
    if (!selectedCard || selectedCard.type !== CardType.Subclass) {
      showFadeNotification({
        message: "没有找到可用的子职业卡",
        type: "error",
      })
      setSubclassModalOpen(false)
      setSubclassSlotIndex(null)
      setSubclassCheckKey(null)
      return
    }

    const nextCards = [...(formData.cards || Array(20).fill(0).map(() => createEmptyCard()))]
    historyRef.current[subclassCheckKey] = {
      type: "subclass",
      slotIndex: subclassSlotIndex,
      previousCard: nextCards[subclassSlotIndex] || createEmptyCard(),
    }
    nextCards[subclassSlotIndex] = selectedCard
    setSheetData({ cards: nextCards })
    const [, optionIndexText] = subclassCheckKey.split("-")
    const optionIndex = Number(optionIndexText)
    if (!Number.isNaN(optionIndex)) {
      setCheckedState(subclassCheckKey, optionIndex, true)
    }

    setSubclassModalOpen(false)
    setSubclassSlotIndex(null)
    setSubclassCheckKey(null)
  }

  const buildCheckKey = (option: UpgradeOption, optionIndex: number, boxIndex: number) => {
    return `${tierKey}-${optionIndex}-${boxIndex}`
  }

  const renderEditor = (option: UpgradeOption, optionIndex: number, checkKey: string) => {
    if (openEditorKey !== checkKey) {
      return null
    }

    if (isAttributeUpgradeOption(option.label)) {
      return (
        <AttributeUpgradeEditor
          formData={formData}
          onCancel={() => setOpenEditorKey(null)}
          onConfirm={(targets) => handleAttributeConfirm(checkKey, optionIndex, targets)}
        />
      )
    }

    if (isExperienceUpgradeOption(option.label)) {
      return (
        <ExperienceUpgradeEditor
          formData={formData}
          onCancel={() => setOpenEditorKey(null)}
          onConfirm={(targets) => handleExperienceConfirm(checkKey, optionIndex, targets)}
        />
      )
    }

    if (isEvasionUpgradeOption(option.label)) {
      return (
        <EvasionUpgradeEditor
          value={formData.evasion}
          onCancel={() => setOpenEditorKey(null)}
          onConfirm={(nextValue) => handleEvasionConfirm(checkKey, optionIndex, nextValue)}
        />
      )
    }

    if (isHPUpgradeOption(option.label)) {
      return (
        <HPMaxEditor
          value={formData.hpMax || 6}
          onCancel={() => setOpenEditorKey(null)}
          onConfirm={(nextValue) => handleHPConfirm(checkKey, optionIndex, nextValue)}
        />
      )
    }

    if (isStressUpgradeOption(option.label)) {
      return (
        <StressMaxEditor
          value={formData.stressMax || 6}
          onCancel={() => setOpenEditorKey(null)}
          onConfirm={(nextValue) => handleStressConfirm(checkKey, optionIndex, nextValue)}
        />
      )
    }

    if (isProficiencyUpgradeOption(option.label)) {
      return (
        <ProficiencyEditor
          value={Array.isArray(formData.proficiency) ? formData.proficiency : Array(6).fill(false)}
          onCancel={() => setOpenEditorKey(null)}
          onConfirm={(nextValue) => handleProficiencyConfirm(checkKey, optionIndex, nextValue)}
        />
      )
    }

    return null
  }

  return (
    <>
      <div className="border border-gray-300 rounded-md shadow-sm">
        <div className="bg-gray-800 text-white p-1 text-center font-bold text-sm rounded-t-md">{title}</div>
        <div className="bg-gray-600 text-white p-1 text-xs flex items-center justify-between gap-1">
          <span>{description}</span>
        </div>
        <div className="p-1">
          <p className="text-xs mb-2">
            {tier === 1
              ? <>更新你的等级，从下方的升级列表中选择并标记<strong>两个</strong>选项。</>
              : <>更新你的等级，从下方的升级列表或更低级的列表中选择并标记<strong>两个</strong>选项。</>}
          </p>

          <div className="space-y-1">
            {options.map((option, optionIndex) => {
              const rowCheckKeys = Array.from({ length: option.boxCount }, (_, boxIndex) => buildCheckKey(option, optionIndex, boxIndex))
              const needsPopover =
                isAttributeUpgradeOption(option.label) ||
                isExperienceUpgradeOption(option.label) ||
                isEvasionUpgradeOption(option.label) ||
                isHPUpgradeOption(option.label) ||
                isStressUpgradeOption(option.label) ||
                isProficiencyUpgradeOption(option.label)

              return (
                <div key={`${tierKey}-${optionIndex}`} className="flex items-start text-[10px] leading-[1.6]">
                  {needsPopover ? (
                    <Popover.Root
                      open={openEditorKey !== null && rowCheckKeys.includes(openEditorKey)}
                      onOpenChange={(open) => {
                        if (!open) {
                          setOpenEditorKey(null)
                        }
                      }}
                    >
                      <Popover.Anchor asChild>
                        <span className={`flex flex-shrink-0 items-center justify-end mt-px ${option.doubleBox && option.boxCount === 2 ? "" : "gap-px"}`} style={{ minWidth: "3.2em" }}>
                          {Array.from({ length: option.boxCount }, (_, boxIndex) => {
                            const checkKey = buildCheckKey(option, optionIndex, boxIndex)
                            const checked = isChecked(checkKey, optionIndex)
                            const checkboxClass = option.doubleBox && option.boxCount === 2
                              ? `${boxIndex === 0
                                ? "border-l-2 border-t-2 border-b-2 border-r border-gray-800"
                                : "border-r-2 border-t-2 border-b-2 border-l border-gray-800"
                              } ${checked ? "bg-gray-800" : "bg-white"}`
                              : option.doubleBox
                                ? `border-2 border-gray-800 ${checked ? "bg-gray-800" : "bg-white"}`
                                : `border border-gray-800 ${checked ? "bg-gray-800" : "bg-white"}`

                            return (
                              <button
                                key={`${checkKey}-${boxIndex}`}
                                type="button"
                                data-testid={`checkbox-${checkKey}`}
                                className={`w-3 h-3 cursor-pointer focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0 ${checkboxClass}`}
                                title={option.label}
                                onClick={() => {
                                  if (checked) {
                                    handleSimpleUpgrade(option, checkKey, optionIndex)
                                    return
                                  }
                                  setOpenEditorKey(checkKey)
                                }}
                              />
                            )
                          })}
                        </span>
                      </Popover.Anchor>
                      <Popover.Portal>
                        <Popover.Content
                          className="z-50 w-auto rounded border border-gray-300 bg-white p-1.5 shadow-lg"
                          side="top"
                          align="start"
                          sideOffset={5}
                        >
                          {openEditorKey && renderEditor(option, optionIndex, openEditorKey)}
                        </Popover.Content>
                      </Popover.Portal>
                    </Popover.Root>
                  ) : (
                    <span className={`flex flex-shrink-0 items-center justify-end mt-px ${option.doubleBox && option.boxCount === 2 ? "" : "gap-px"}`} style={{ minWidth: "3.2em" }}>
                      {Array.from({ length: option.boxCount }, (_, boxIndex) => {
                        const checkKey = buildCheckKey(option, optionIndex, boxIndex)
                        const checked = isChecked(checkKey, optionIndex)
                        const checkboxClass = option.doubleBox && option.boxCount === 2
                          ? `${boxIndex === 0
                            ? "border-l-2 border-t-2 border-b-2 border-r border-gray-800"
                            : "border-r-2 border-t-2 border-b-2 border-l border-gray-800"
                          } ${checked ? "bg-gray-800" : "bg-white"}`
                          : option.doubleBox
                            ? `border-2 border-gray-800 ${checked ? "bg-gray-800" : "bg-white"}`
                            : `border border-gray-800 ${checked ? "bg-gray-800" : "bg-white"}`

                        return (
                          <button
                            key={`${checkKey}-${boxIndex}`}
                            type="button"
                            data-testid={`checkbox-${checkKey}`}
                            className={`w-3 h-3 cursor-pointer focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0 ${checkboxClass}`}
                            title={option.label}
                            onClick={() => handleSimpleUpgrade(option, checkKey, optionIndex)}
                          />
                        )
                      })}
                    </span>
                  )}

                  <div className="flex-1 ml-2 min-w-0">
                    <div className="flex items-start gap-1">
                      <span className="text-gray-800 mr-1">{option.label}</span>
                      {isSubclassUpgradeOption(option.label) && (
                        <button
                          type="button"
                          onClick={() => handleOpenSubclassModal(rowCheckKeys[0])}
                          className="inline-flex items-center justify-center p-0.5 hover:bg-gray-100 rounded transition-colors print:hidden"
                          title="选择子职业卡"
                        >
                          <Edit className="w-2.5 h-2.5 text-gray-600" />
                        </button>
                        )}
                      </div>
                  </div>
                </div>
              )
            })}
          </div>

        </div>
      </div>

      <GenericCardSelectionModal
        isOpen={subclassModalOpen}
        onClose={() => {
          setSubclassModalOpen(false)
          setSubclassSlotIndex(null)
          setSubclassCheckKey(null)
        }}
        onSelect={handleSubclassSelect}
        title="选择子职业卡"
        cardType={CardType.Subclass}
      />
    </>
  )
}
