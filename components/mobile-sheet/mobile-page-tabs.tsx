"use client"

interface MobilePageTab {
  id: string
  label: string
  tabValue?: string
}

interface MobilePageTabsProps {
  tabs: MobilePageTab[]
  currentTabValue: string
  onSelectTab: (tabValue: string) => void
  adventureNotesVisible: boolean
  onAddAdventureNotes: () => void
  onRemoveAdventureNotes: () => void
}

export function MobilePageTabs({
  tabs,
  currentTabValue,
  onSelectTab,
  adventureNotesVisible,
  onAddAdventureNotes,
  onRemoveAdventureNotes,
}: MobilePageTabsProps) {
  return (
    <div className="sticky top-0 z-20 rounded-2xl border border-white/70 bg-white/90 px-1 py-1 shadow-sm backdrop-blur">
      <div className="flex items-center justify-center gap-2 overflow-x-auto px-1 pb-1">
        {tabs.map((tab) => {
          const tabValue = tab.tabValue || tab.id
          const isActive = currentTabValue === tabValue
          const isAdventureNotes = tabValue === "page3"

          return (
            <div key={tab.id} className="flex shrink-0 items-center gap-1">
              <button
                type="button"
                onClick={() => onSelectTab(tabValue)}
                className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? "border-gray-900 bg-gray-900 text-white"
                    : "border-gray-300 bg-white text-gray-700"
                }`}
              >
                {tab.label}
              </button>
              {isAdventureNotes ? (
                <button
                  type="button"
                  onClick={onRemoveAdventureNotes}
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-300 bg-white text-gray-500"
                  aria-label="删除第三页"
                  title="删除第三页"
                >
                  ×
                </button>
              ) : null}
            </div>
          )
        })}

        {!adventureNotesVisible ? (
          <button
            type="button"
            onClick={onAddAdventureNotes}
            className="shrink-0 rounded-full border border-dashed border-gray-400 bg-white px-4 py-2 text-sm font-medium text-gray-600"
          >
            + 第三页
          </button>
        ) : null}
      </div>
    </div>
  )
}
