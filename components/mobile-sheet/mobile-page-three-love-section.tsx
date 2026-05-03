"use client"

import { useState } from "react"
import { MobileOptionSheet } from "@/components/mobile-sheet/mobile-option-sheet"
import {
  LIFE_PATH_CIRCLE_OPTIONS,
  LIFE_PATH_IDENTITY_OPTIONS,
  LIFE_PATH_LOVE_OPTIONS,
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

function MobileLoveChoiceField({
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

export function MobilePageThreeLoveSection() {
  const safeFormData = useSafeSheetData()
  const setSheetData = useSheetStore((state) => state.setSheetData)
  const loveProfile = {
    ...createEmptyRelationEntry(),
    ...(safeFormData.adventureNotes?.lifePath?.loveProfile || {}),
  }

  const updateLoveProfile = (field: keyof AdventureNotesRelationshipEntry, value: string) => {
    setSheetData((prev) => ({
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
    <div className="space-y-2">
      <div className="pl-[3px] text-sm font-semibold text-pink-700">爱情</div>

      <div className="grid grid-cols-2 gap-2">
        <MobileLoveChoiceField
          label="名字"
          value={loveProfile.name || ""}
          onChange={(value) => updateLoveProfile("name", value)}
        />
        <MobileLoveChoiceField
          label="身份"
          value={loveProfile.identity || ""}
          options={LIFE_PATH_IDENTITY_OPTIONS}
          onChange={(value) => updateLoveProfile("identity", value)}
        />
        <MobileLoveChoiceField
          label="圈子"
          value={loveProfile.circle || ""}
          options={LIFE_PATH_CIRCLE_OPTIONS}
          onChange={(value) => updateLoveProfile("circle", value)}
        />
        <MobileLoveChoiceField
          label="关系"
          value={loveProfile.relation || ""}
          options={LIFE_PATH_LOVE_OPTIONS}
          onChange={(value) => updateLoveProfile("relation", value)}
        />
      </div>

      <div className="rounded-[3px] border border-gray-200 bg-gray-50 p-1.5">
        <div className="mb-1 pl-[3px] text-xs font-medium uppercase tracking-[0.12em] text-gray-500">详细内容</div>
        <textarea
          value={loveProfile.detail || loveProfile.detailExtra || ""}
          onChange={(event) => {
            updateLoveProfile("detail", event.target.value)
            updateLoveProfile("detailExtra", event.target.value)
          }}
          className="min-h-[4.5rem] w-full resize-none overflow-y-auto rounded-[3px] border border-gray-300 bg-white px-2 py-1 text-sm leading-5 text-gray-900 outline-none"
          placeholder=""
        />
      </div>
    </div>
  )
}
