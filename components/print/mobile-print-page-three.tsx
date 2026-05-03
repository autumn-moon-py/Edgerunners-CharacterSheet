"use client"

import { LIFE_PATH_FIELDS, LIFE_PATH_LOVE_OPTIONS } from "@/data/life-path"
import type { AdventureNotesRelationshipEntry } from "@/lib/sheet-data"
import { useSafeSheetData } from "@/lib/sheet-store"

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

function isLoveProfileEmpty(entry?: AdventureNotesRelationshipEntry) {
  if (!entry) {
    return true
  }

  return ![
    entry.name,
    entry.identity,
    entry.circle,
    entry.relation,
    entry.detail,
    entry.detailExtra,
  ].some((value) => (value || "").trim().length > 0)
}

function PrintBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-[3px] border border-gray-200 bg-white p-2 shadow-sm">
      <div className="mb-2 pl-[3px] text-sm font-semibold text-gray-900">{title}</div>
      <div className="space-y-2">{children}</div>
    </div>
  )
}

function PrintField({ label, value }: { label: string; value?: string }) {
  return (
    <div className="rounded-[3px] border border-gray-200 bg-gray-50 p-1.5">
      <div className="mb-1 pl-[3px] text-xs font-medium uppercase tracking-[0.12em] text-gray-500">{label}</div>
      <div className="min-h-[2.4rem] rounded-[3px] border border-gray-300 bg-white px-2 py-1 text-sm leading-5 text-gray-900 whitespace-pre-wrap">
        {value || ""}
      </div>
    </div>
  )
}

function PrintRelationCard({
  title,
  titleClassName,
  entry,
}: {
  title: string
  titleClassName: string
  entry: {
    name?: string
    identity?: string
    circle?: string
    relation?: string
    detail?: string
    detailExtra?: string
  }
}) {
  return (
    <div className="rounded-[3px] border border-gray-200 bg-white p-1.5">
      <div className={`mb-2 pl-[3px] text-sm font-semibold ${titleClassName}`}>{title}</div>
      <div className="grid grid-cols-2 gap-2">
        <PrintField label="名字" value={entry.name} />
        <PrintField label="身份" value={entry.identity} />
        <PrintField label="圈子" value={entry.circle} />
        <PrintField label="关系" value={entry.relation} />
      </div>
      <div className="mt-2">
        <PrintField label="详细内容" value={entry.detail || entry.detailExtra} />
      </div>
    </div>
  )
}

export function MobilePrintPageThree() {
  const formData = useSafeSheetData()
  const lifePath = formData.adventureNotes?.lifePath || {}
  const loveProfile = lifePath.loveProfile || {}
  const friends = normalizeRelationList(lifePath.friends, 1, 3)
  const enemies = normalizeRelationList(lifePath.enemies, 1, 3)

  return (
    <div className="space-y-2">
      <PrintBlock title="生命路径">
        <div className="grid grid-cols-2 gap-2">
          {LIFE_PATH_FIELDS.map((field) => (
            <PrintField key={field.key} label={field.label} value={lifePath[field.key]} />
          ))}
        </div>
      </PrintBlock>

      {!isLoveProfileEmpty(loveProfile) ? (
        <PrintBlock title="爱情">
          <div className="grid grid-cols-2 gap-2">
            <PrintField label="名字" value={loveProfile.name} />
            <PrintField label="身份" value={loveProfile.identity} />
            <PrintField label="圈子" value={loveProfile.circle} />
            <PrintField label="关系" value={loveProfile.relation || LIFE_PATH_LOVE_OPTIONS.find((option) => option === loveProfile.relation)} />
          </div>
          <div className="mt-2">
            <PrintField label="详细内容" value={loveProfile.detail || loveProfile.detailExtra} />
          </div>
        </PrintBlock>
      ) : null}

      <div className="space-y-3">
        <div className="pl-[3px] text-sm font-semibold text-sky-700">朋友</div>
        <div className="space-y-2">
          {friends.map((entry, index) => (
            <PrintRelationCard key={`friend-${index}`} title={`朋友${index + 1}`} titleClassName="text-sky-700" entry={entry} />
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <div className="pl-[3px] text-sm font-semibold text-red-700">敌人</div>
        <div className="space-y-2">
          {enemies.map((entry, index) => (
            <PrintRelationCard key={`enemy-${index}`} title={`敌人${index + 1}`} titleClassName="text-red-700" entry={entry} />
          ))}
        </div>
      </div>
    </div>
  )
}
