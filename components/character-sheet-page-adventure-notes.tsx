"use client"

import * as Popover from "@radix-ui/react-popover"
import type React from "react"
import { useEffect, useRef, useState } from "react"
import {
  LIFE_PATH_FIELDS,
  LIFE_PATH_LAYOUT_ROWS,
  LIFE_PATH_FRIEND_OPTIONS,
  LIFE_PATH_ENEMY_OPTIONS,
  LIFE_PATH_LOVE_OPTIONS,
  LIFE_PATH_IDENTITY_OPTIONS,
  LIFE_PATH_CIRCLE_OPTIONS,
  type LifePathTextFieldKey,
} from "@/data/life-path"
import { useSafeSheetData, useSheetStore } from "@/lib/sheet-store"
import type {
  AdventureNotesLifePathData,
  AdventureNotesRelationshipEntry,
} from "@/lib/sheet-data"

function joinClasses(...classes: Array<string | undefined>) {
  return classes.filter(Boolean).join(" ")
}

interface AutoGrowTextareaProps
  extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, "value" | "onChange"> {
  value: string
  onChange: (event: React.ChangeEvent<HTMLTextAreaElement>) => void
  minHeightClass?: string
}

function createEmptyRelationEntry(): AdventureNotesRelationshipEntry {
  return {
    name: "",
    relation: "",
    identity: "",
    circle: "",
    detail: "",
    detailExtra: "",
  }
}

function normalizeRelationEntry(entry?: AdventureNotesRelationshipEntry): AdventureNotesRelationshipEntry {
  return {
    ...createEmptyRelationEntry(),
    ...(entry || {}),
  }
}

function normalizeRelationList(
  entries?: AdventureNotesRelationshipEntry[],
  minimum = 1,
  limit = 3
): AdventureNotesRelationshipEntry[] {
  const normalized = Array.isArray(entries)
    ? entries.slice(0, limit).map(normalizeRelationEntry)
    : []

  if (normalized.length >= minimum) {
    return normalized
  }

  return [
    ...normalized,
    ...Array.from({ length: minimum - normalized.length }, () => createEmptyRelationEntry()),
  ]
}

function AutoGrowTextarea({
  value,
  onChange,
  className = "",
  minHeightClass = "min-h-[30px]",
  rows = 1,
  ...props
}: AutoGrowTextareaProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    const textarea = textareaRef.current
    if (!textarea) {
      return
    }

    textarea.style.height = "0px"
    textarea.style.height = `${textarea.scrollHeight}px`
  }, [value])

  return (
    <textarea
      ref={textareaRef}
      rows={rows}
      value={value}
      onChange={(event) => {
        event.currentTarget.style.height = "0px"
        event.currentTarget.style.height = `${event.currentTarget.scrollHeight}px`
        onChange(event)
      }}
      className={`w-full resize-none overflow-hidden whitespace-pre-wrap border-b border-gray-400 bg-transparent px-0 py-1 text-sm leading-5 text-gray-900 focus:outline-none print-empty-hide ${minHeightClass} ${className}`.trim()}
      {...props}
    />
  )
}

function EditableChoiceField({
  label,
  value,
  options,
  onChange,
  minHeightClass,
  maxLength = 500,
  containerClassName,
  labelClassName,
  textareaClassName,
  selectClassName,
}: {
  label: string
  value?: string
  options?: string[]
  onChange: (value: string) => void
  minHeightClass?: string
  maxLength?: number
  containerClassName?: string
  labelClassName?: string
  textareaClassName?: string
  selectClassName?: string
}) {
  const safeOptions = options || []
  const [isOptionsOpen, setIsOptionsOpen] = useState(false)
  const hasValue = (value || "").trim().length > 0

  useEffect(() => {
    if (hasValue && isOptionsOpen) {
      setIsOptionsOpen(false)
    }
  }, [hasValue, isOptionsOpen])

  const triggerOptionPicker = () => {
    if (safeOptions.length === 0 || hasValue) {
      return
    }

    setIsOptionsOpen(true)
  }

  return (
    <Popover.Root open={isOptionsOpen} onOpenChange={setIsOptionsOpen}>
      <div className={joinClasses("rounded-md border border-gray-300 bg-white p-2.5", containerClassName)}>
        <label className={joinClasses("mb-1.5 block text-[11px] font-semibold text-gray-700", labelClassName)}>
          {label}
        </label>
        <Popover.Anchor asChild>
          <div className="px-0 py-0">
            <AutoGrowTextarea
              value={value || ""}
              onChange={(event) => onChange(event.target.value)}
              onFocus={() => triggerOptionPicker()}
              onClick={() => triggerOptionPicker()}
              maxLength={maxLength}
              minHeightClass={minHeightClass}
              className={joinClasses("px-0 py-1 text-[13px] leading-6", textareaClassName)}
            />
          </div>
        </Popover.Anchor>
      </div>
      {safeOptions.length > 0 && (
        <Popover.Portal>
          <Popover.Content
            className="z-50 w-[min(320px,calc(100vw-2rem))] rounded border border-gray-300 bg-white p-1.5 shadow-lg print:hidden"
            side="bottom"
            align="start"
            sideOffset={6}
            onOpenAutoFocus={(event) => event.preventDefault()}
          >
            <div className="max-h-64 space-y-1 overflow-y-auto">
              {safeOptions.map((option) => (
                <button
                  key={`${label}-${option}`}
                  type="button"
                  onClick={() => {
                    onChange(option)
                    setIsOptionsOpen(false)
                  }}
                  className={joinClasses(
                    "choice-apply-button block w-full rounded-md border border-gray-300 bg-white px-2.5 py-1.5 text-left text-[11px] text-gray-700 transition-colors hover:bg-gray-50",
                    selectClassName
                  )}
                >
                  {option}
                </button>
              ))}
            </div>
          </Popover.Content>
        </Popover.Portal>
      )}
    </Popover.Root>
  )
}

function SectionShell({
  eyebrow,
  title,
  children,
  className,
  bodyClassName,
  bodyPaddingClassName = "p-3",
  titleClassName,
  hideHeader = false,
}: {
  eyebrow?: string
  title: string
  children: React.ReactNode
  className?: string
  bodyClassName?: string
  bodyPaddingClassName?: string
  titleClassName?: string
  hideHeader?: boolean
}) {
  return (
    <section className={joinClasses("overflow-hidden rounded-md border border-gray-300 bg-white", className)}>
      {!hideHeader && (
        <div className="border-b border-gray-300 bg-gray-50 px-3 py-2.5">
          {eyebrow && <div className="text-[10px] font-semibold tracking-[0.16em] text-gray-500">{eyebrow}</div>}
          <h2
            className={joinClasses(
              eyebrow ? "mt-0.5" : undefined,
              "text-center text-[16px] font-semibold text-gray-900",
              titleClassName
            )}
          >
            {title}
          </h2>
        </div>
      )}
      <div className={joinClasses(bodyPaddingClassName, bodyClassName)}>{children}</div>
    </section>
  )
}

function RelationshipCard({
  title,
  entry,
  relationOptions,
  detailOptions,
  canRemove,
  onChange,
  onRemove,
  tone = "friend",
}: {
  title: string
  entry: AdventureNotesRelationshipEntry
  relationOptions?: string[]
  detailOptions?: string[]
  canRemove?: boolean
  onChange: (field: keyof AdventureNotesRelationshipEntry, value: string) => void
  onRemove?: () => void
  tone?: "friend" | "enemy"
}) {
  const toneClasses =
    tone === "enemy"
      ? {
          chip: "border-red-200 bg-red-50 text-red-700",
          card: "border-gray-300 bg-white",
        }
      : {
          chip: "border-sky-200 bg-sky-50 text-sky-700",
          card: "border-gray-300 bg-white",
        }

  return (
    <div className={joinClasses("break-inside-avoid rounded-md border p-2.5", toneClasses.card)}>
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className={joinClasses("rounded-full border px-2 py-0.5 text-[10px] font-semibold", toneClasses.chip)}>
          {title}
        </div>
        {canRemove && onRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="rounded-md border border-gray-300 px-2 py-0.5 text-[11px] text-gray-600 transition-colors hover:bg-gray-50 print:hidden"
          >
            删除
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2">
        <EditableChoiceField
          label="名字"
          value={entry.name}
          onChange={(value) => onChange("name", value)}
          textareaClassName="min-h-[30px]"
        />
        <EditableChoiceField
          label="身份"
          value={entry.identity}
          options={LIFE_PATH_IDENTITY_OPTIONS}
          onChange={(value) => onChange("identity", value)}
          textareaClassName="min-h-[30px]"
        />
        <EditableChoiceField
          label="圈子"
          value={entry.circle}
          options={LIFE_PATH_CIRCLE_OPTIONS}
          onChange={(value) => onChange("circle", value)}
          textareaClassName="min-h-[30px]"
        />
        <EditableChoiceField
          label="关系"
          value={entry.relation}
          options={relationOptions}
          onChange={(value) => onChange("relation", value)}
          textareaClassName="min-h-[30px]"
        />
        <div className="col-span-2">
          <EditableChoiceField
            label="详细内容"
            value={entry.detail}
            options={detailOptions}
            onChange={(value) => onChange("detail", value)}
            maxLength={2000}
            minHeightClass="min-h-[30px]"
            textareaClassName="min-h-[30px]"
          />
        </div>
      </div>
    </div>
  )
}

function RelationshipModule({
  title,
  entries,
  relationOptions,
  detailOptions,
  onChange,
  onAdd,
  onRemove,
  eyebrow,
  tone = "friend",
}: {
  title: string
  entries: AdventureNotesRelationshipEntry[]
  relationOptions?: string[]
  detailOptions?: string[]
  onChange: (index: number, field: keyof AdventureNotesRelationshipEntry, value: string) => void
  onAdd: () => void
  onRemove: (index: number) => void
  eyebrow: string
  tone?: "friend" | "enemy"
}) {
  const toneClasses =
    tone === "enemy"
      ? {
          section: "border-gray-300 bg-gray-50/80",
          add: "hover:bg-gray-50",
          title: "text-red-700",
        }
      : {
          section: "border-gray-300 bg-gray-50/80",
          add: "hover:bg-gray-50",
          title: "text-sky-700",
        }

  return (
    <div className={joinClasses("min-w-0 rounded-md border p-2.5", toneClasses.section)}>
      <div className="mb-3 flex items-center gap-3">
        <div className="translate-x-[5px] flex items-baseline gap-2">
          <h3 className={joinClasses("text-[15px] font-semibold", toneClasses.title)}>{title}</h3>
          <div className="text-[10px] text-gray-500">{eyebrow}</div>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <div className="text-[10px] text-gray-500 print:hidden">至多3个</div>
          <button
            type="button"
            onClick={onAdd}
            disabled={entries.length >= 3}
            className={joinClasses(
              "rounded-md border border-gray-300 px-2.5 py-1 text-[11px] text-gray-700 transition-colors disabled:cursor-default disabled:opacity-40 print:hidden",
              toneClasses.add
            )}
          >
            新增
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {entries.map((entry, index) => (
          <RelationshipCard
            key={`${title}-${index}`}
            title={`${title}${index + 1}`}
            entry={entry}
            relationOptions={relationOptions}
            detailOptions={detailOptions}
            canRemove={entries.length > 1}
            tone={tone}
            onChange={(field, value) => onChange(index, field, value)}
            onRemove={() => onRemove(index)}
          />
        ))}
      </div>
    </div>
  )
}

function LoveProfileCard({
  entry,
  onChange,
}: {
  entry: AdventureNotesRelationshipEntry
  onChange: (field: keyof AdventureNotesRelationshipEntry, value: string) => void
}) {
  return (
    <div className="rounded-md border border-gray-300 bg-gray-50/80 p-2.5">
      <div className="mb-3 flex items-center gap-3">
        <div className="translate-x-[5px] flex items-baseline gap-2">
          <h3 className="text-[15px] font-semibold text-pink-700">爱情</h3>
          <div className="text-[10px] text-gray-500">情感裂痕</div>
        </div>
      </div>
      <div className="grid grid-cols-[0.85fr_0.85fr_0.9fr_1.4fr] gap-2">
        <EditableChoiceField
          label="名字"
          value={entry.name}
          onChange={(value) => onChange("name", value)}
          containerClassName="col-span-1"
          textareaClassName="min-h-[30px]"
        />
        <EditableChoiceField
          label="身份"
          value={entry.identity}
          options={LIFE_PATH_IDENTITY_OPTIONS}
          onChange={(value) => onChange("identity", value)}
          containerClassName="col-span-1"
          textareaClassName="min-h-[30px]"
        />
        <EditableChoiceField
          label="圈子"
          value={entry.circle}
          options={LIFE_PATH_CIRCLE_OPTIONS}
          onChange={(value) => onChange("circle", value)}
          containerClassName="col-span-1"
          textareaClassName="min-h-[30px]"
        />
        <EditableChoiceField
          label="关系"
          value={entry.relation}
          options={LIFE_PATH_LOVE_OPTIONS}
          onChange={(value) => onChange("relation", value)}
          containerClassName="col-span-1"
          textareaClassName="min-h-[30px]"
        />
      </div>
      <div className="mt-2">
        <EditableChoiceField
          label="详细内容"
          value={entry.detail || entry.detailExtra}
          onChange={(value) => {
            onChange("detail", value)
            onChange("detailExtra", value)
          }}
          maxLength={2000}
          minHeightClass="min-h-[30px]"
          textareaClassName="min-h-[30px]"
        />
      </div>
    </div>
  )
}

export default function CharacterSheetPageAdventureNotes() {
  const { setSheetData: setFormData } = useSheetStore()
  const safeFormData = useSafeSheetData()
  const lifePath: AdventureNotesLifePathData = safeFormData.adventureNotes?.lifePath || {}
  const lifePathFieldMap = new Map(LIFE_PATH_FIELDS.map((field) => [field.key, field]))
  const lifePathRows = LIFE_PATH_LAYOUT_ROWS.map((keys) =>
    keys.map((key) => lifePathFieldMap.get(key)).filter((field): field is (typeof LIFE_PATH_FIELDS)[number] => Boolean(field))
  )

  const friends = normalizeRelationList(lifePath.friends, 1, 3)
  const enemies = normalizeRelationList(lifePath.enemies, 1, 3)
  const loveProfile = normalizeRelationEntry(lifePath.loveProfile)

  const updateLifePathField = (field: LifePathTextFieldKey, value: string) => {
    setFormData((prev) => ({
      ...prev,
      adventureNotes: {
        ...prev.adventureNotes,
        lifePath: {
          ...prev.adventureNotes?.lifePath,
          [field]: value,
        },
      },
    }))
  }

  const updateRelationshipEntries = (
    field: "friends" | "enemies",
    updater: (entries: AdventureNotesRelationshipEntry[]) => AdventureNotesRelationshipEntry[]
  ) => {
    setFormData((prev) => {
      const currentEntries = normalizeRelationList(
        prev.adventureNotes?.lifePath?.[field] as AdventureNotesRelationshipEntry[] | undefined,
        1,
        3
      )
      const nextEntries = updater(currentEntries)
        .slice(0, 3)
        .map(normalizeRelationEntry)

      return {
        ...prev,
        adventureNotes: {
          ...prev.adventureNotes,
          lifePath: {
            ...prev.adventureNotes?.lifePath,
            [field]: nextEntries,
          },
        },
      }
    })
  }

  const updateLoveProfile = (
    field: keyof AdventureNotesRelationshipEntry,
    value: string
  ) => {
    setFormData((prev) => ({
      ...prev,
      adventureNotes: {
        ...prev.adventureNotes,
        lifePath: {
          ...prev.adventureNotes?.lifePath,
          loveProfile: {
            ...createEmptyRelationEntry(),
            ...prev.adventureNotes?.lifePath?.loveProfile,
            [field]: value,
          },
        },
      },
    }))
  }

  return (
    <div className="w-full max-w-[210mm] mx-auto">
      <div
        className="a4-page p-2 bg-white text-gray-800 shadow-lg print:shadow-none rounded-md"
        style={{ width: "210mm" }}
      >
        <div className="grid grid-cols-1 gap-3">
          <SectionShell
            title="生命路径"
            bodyClassName="space-y-3"
            hideHeader
          >
            {lifePathRows.map((row, rowIndex) => (
              <div
                key={`life-path-row-${rowIndex}`}
                className={joinClasses(
                  "gap-3",
                  row.length === 4
                    ? "grid grid-cols-2 md:grid-cols-4 print:grid-cols-4"
                    : "grid grid-cols-1 md:grid-cols-2 print:grid-cols-2"
                )}
              >
                {row.map((field) => (
                  <EditableChoiceField
                    key={field.key}
                    label={field.label}
                    value={lifePath[field.key] || ""}
                    options={field.options}
                    onChange={(value) => updateLifePathField(field.key, value)}
                    minHeightClass="min-h-[30px]"
                    containerClassName="h-full"
                    textareaClassName="min-h-[30px]"
                  />
                ))}
              </div>
            ))}
          </SectionShell>

          <LoveProfileCard
            entry={loveProfile}
            onChange={(field, value) => updateLoveProfile(field, value)}
          />

          <div className="grid min-w-0 grid-cols-1 gap-3 md:grid-cols-2 print:grid-cols-2">
            <RelationshipModule
              title="朋友"
              eyebrow="信任网络"
              entries={friends}
              relationOptions={LIFE_PATH_FRIEND_OPTIONS}
              tone="friend"
              onAdd={() =>
                updateRelationshipEntries("friends", (entries) => {
                  if (entries.length >= 3) {
                    return entries
                  }
                  return [...entries, createEmptyRelationEntry()]
                })
              }
              onRemove={(index) =>
                updateRelationshipEntries("friends", (entries) => {
                  const nextEntries = entries.filter((_, entryIndex) => entryIndex !== index)
                  return nextEntries.length > 0 ? nextEntries : [createEmptyRelationEntry()]
                })
              }
              onChange={(index, field, value) =>
                updateRelationshipEntries("friends", (entries) => {
                  const nextEntries = [...entries]
                  nextEntries[index] = {
                    ...normalizeRelationEntry(nextEntries[index]),
                    [field]: value,
                  }
                  return nextEntries
                })
              }
            />

            <RelationshipModule
              title="敌人"
              eyebrow="危险关系"
              entries={enemies}
              relationOptions={LIFE_PATH_ENEMY_OPTIONS}
              tone="enemy"
              onAdd={() =>
                updateRelationshipEntries("enemies", (entries) => {
                  if (entries.length >= 3) {
                    return entries
                  }
                  return [...entries, createEmptyRelationEntry()]
                })
              }
              onRemove={(index) =>
                updateRelationshipEntries("enemies", (entries) => {
                  const nextEntries = entries.filter((_, entryIndex) => entryIndex !== index)
                  return nextEntries.length > 0 ? nextEntries : [createEmptyRelationEntry()]
                })
              }
              onChange={(index, field, value) =>
                updateRelationshipEntries("enemies", (entries) => {
                  const nextEntries = [...entries]
                  nextEntries[index] = {
                    ...normalizeRelationEntry(nextEntries[index]),
                    [field]: value,
                  }
                  return nextEntries
                })
              }
            />
          </div>
        </div>
      </div>
    </div>
  )
}
