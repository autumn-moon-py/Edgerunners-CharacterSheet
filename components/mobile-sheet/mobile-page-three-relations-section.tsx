"use client"

import { useState } from "react"
import { MobileOptionSheet } from "@/components/mobile-sheet/mobile-option-sheet"
import {
  LIFE_PATH_CIRCLE_OPTIONS,
  LIFE_PATH_ENEMY_OPTIONS,
  LIFE_PATH_FRIEND_OPTIONS,
  LIFE_PATH_IDENTITY_OPTIONS,
} from "@/data/life-path"
import type { AdventureNotesRelationshipEntry } from "@/lib/sheet-data"
import { useSafeSheetData, useSheetStore } from "@/lib/sheet-store"

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

function normalizeRelationList(entries?: AdventureNotesRelationshipEntry[], minimum = 1, limit = 3): AdventureNotesRelationshipEntry[] {
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

function MobileRelationField({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: string
  options?: string[]
  onChange: (value: string) => void
}) {
  const [open, setOpen] = useState(false)

  return (
    <div className="rounded-[3px] border border-gray-200 bg-gray-50 p-1.5">
      <div className="mb-1 flex items-center justify-between gap-2">
        <div className="pl-[3px] text-xs font-medium uppercase tracking-[0.12em] text-gray-500">{label}</div>
        {options && options.length > 0 ? (
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="rounded-[3px] border border-gray-300 bg-white px-2 py-0.5 text-[10px] text-gray-600"
          >
            选项
          </button>
        ) : null}
      </div>

      <input
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-9 w-full rounded-[3px] border border-gray-300 bg-white px-2 text-sm text-gray-900 outline-none"
        placeholder=""
      />

      {options && options.length > 0 ? (
        <MobileOptionSheet
          open={open}
          onOpenChange={setOpen}
          title={label}
          options={options}
          onSelect={onChange}
        />
      ) : null}
    </div>
  )
}

function MobileRelationCard({
  title,
  entry,
  relationOptions,
  tone,
  onChange,
  onRemove,
  canRemove,
}: {
  title: string
  entry: AdventureNotesRelationshipEntry
  relationOptions: string[]
  tone: "friend" | "enemy"
  onChange: (field: keyof AdventureNotesRelationshipEntry, value: string) => void
  onRemove: () => void
  canRemove: boolean
}) {
  const titleToneClass = tone === "enemy" ? "text-red-700" : "text-sky-700"
  return (
    <div className="rounded-[3px] border border-gray-200 bg-white p-1.5">
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className={`pl-[3px] text-sm font-semibold ${titleToneClass}`}>{title}</div>
        {canRemove ? (
          <button
            type="button"
            onClick={onRemove}
            className="rounded-[3px] border border-gray-300 bg-white px-2 py-0.5 text-[10px] text-gray-600"
          >
            删除
          </button>
        ) : null}
      </div>

      <div className="grid grid-cols-2 gap-2">
        <MobileRelationField label="名字" value={entry.name || ""} onChange={(value) => onChange("name", value)} />
        <MobileRelationField label="身份" value={entry.identity || ""} options={LIFE_PATH_IDENTITY_OPTIONS} onChange={(value) => onChange("identity", value)} />
        <MobileRelationField label="圈子" value={entry.circle || ""} options={LIFE_PATH_CIRCLE_OPTIONS} onChange={(value) => onChange("circle", value)} />
        <MobileRelationField label="关系" value={entry.relation || ""} options={relationOptions} onChange={(value) => onChange("relation", value)} />
      </div>

      <div className="mt-2 rounded-[3px] border border-gray-200 bg-gray-50 p-1.5">
        <div className="mb-1 pl-[3px] text-xs font-medium uppercase tracking-[0.12em] text-gray-500">详细内容</div>
        <textarea
          value={entry.detail || entry.detailExtra || ""}
          onChange={(event) => {
            onChange("detail", event.target.value)
            onChange("detailExtra", event.target.value)
          }}
          className="min-h-[4.5rem] w-full resize-none overflow-y-auto rounded-[3px] border border-gray-300 bg-white px-2 py-1 text-sm leading-5 text-gray-900 outline-none"
          placeholder=""
        />
      </div>
    </div>
  )
}

function MobileRelationModule({
  title,
  entries,
  relationOptions,
  tone,
  onAdd,
  onRemove,
  onChange,
}: {
  title: string
  entries: AdventureNotesRelationshipEntry[]
  relationOptions: string[]
  tone: "friend" | "enemy"
  onAdd: () => void
  onRemove: (index: number) => void
  onChange: (index: number, field: keyof AdventureNotesRelationshipEntry, value: string) => void
}) {
  const titleToneClass = tone === "enemy" ? "text-red-700" : "text-sky-700"

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2 pl-[3px]">
        <div className={`text-sm font-semibold ${titleToneClass}`}>{title}</div>
        <button
          type="button"
          onClick={onAdd}
          disabled={entries.length >= 3}
            className="rounded-[3px] border border-gray-300 bg-white px-2 py-0.5 text-[10px] text-gray-600 disabled:opacity-40"
        >
          新增
        </button>
      </div>

      <div className="space-y-2">
        {entries.map((entry, index) => (
          <MobileRelationCard
            key={`${title}-${index}`}
            title={`${title}${index + 1}`}
            entry={entry}
            relationOptions={relationOptions}
            tone={tone}
            canRemove={entries.length > 1}
            onRemove={() => onRemove(index)}
            onChange={(field, value) => onChange(index, field, value)}
          />
        ))}
      </div>
    </div>
  )
}

export function MobilePageThreeRelationsSection() {
  const safeFormData = useSafeSheetData()
  const setSheetData = useSheetStore((state) => state.setSheetData)
  const lifePath = safeFormData.adventureNotes?.lifePath || {}
  const friends = normalizeRelationList(lifePath.friends, 1, 3)
  const enemies = normalizeRelationList(lifePath.enemies, 1, 3)

  const updateRelationshipEntries = (
    field: "friends" | "enemies",
    updater: (entries: AdventureNotesRelationshipEntry[]) => AdventureNotesRelationshipEntry[],
  ) => {
    setSheetData((prev) => {
      const currentEntries = normalizeRelationList(prev.adventureNotes?.lifePath?.[field], 1, 3)
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

  return (
    <div className="space-y-3">
      <MobileRelationModule
        title="朋友"
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

      <MobileRelationModule
        title="敌人"
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
  )
}
