"use client"

import { useEffect, type MouseEvent } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getTabPages } from "@/lib/page-registry"
import { useSheetStore } from "@/lib/sheet-store"
import type { SheetData } from "@/lib/sheet-data"

interface PageDisplayProps {
  isDualPageMode: boolean
  isMobile: boolean
  leftPageId: string
  rightPageId: string
  leftTabValue: string
  rightTabValue: string
  currentTabValue: string
  formData: SheetData
  onSetLeftTab: (tabValue: string) => void
  onSetRightTab: (tabValue: string) => void
  onSetCurrentTab: (id: string) => void
  onSwitchToPrevPage: () => void
  onSwitchToNextPage: () => void
}

export function PageDisplay({
  isDualPageMode,
  isMobile,
  leftTabValue,
  rightTabValue,
  currentTabValue,
  formData,
  onSetLeftTab,
  onSetRightTab,
  onSetCurrentTab,
  onSwitchToPrevPage,
  onSwitchToNextPage,
}: PageDisplayProps) {
  const setSheetData = useSheetStore(state => state.setSheetData)
  const visibleTabs = formData ? getTabPages(formData) : []
  const visibleTabValues = visibleTabs.map(tab => tab.tabValue || tab.id)
  const adventureNotesVisible = !!formData.pageVisibility?.adventureNotes
  const fallbackCurrentTab = visibleTabValues.find(value => value !== 'page3') || visibleTabValues[0] || 'page1'
  const fallbackRightTab = visibleTabValues[Math.min(1, Math.max(visibleTabValues.length - 1, 0))] || fallbackCurrentTab

  useEffect(() => {
    if (visibleTabValues.length === 0) {
      return
    }

    if (!visibleTabValues.includes(currentTabValue)) {
      onSetCurrentTab(visibleTabValues[0])
    }

    if (!visibleTabValues.includes(leftTabValue)) {
      onSetLeftTab(visibleTabValues[0])
    }

    if (!visibleTabValues.includes(rightTabValue)) {
      onSetRightTab(fallbackRightTab)
    }
  }, [
    currentTabValue,
    fallbackRightTab,
    leftTabValue,
    onSetCurrentTab,
    onSetLeftTab,
    onSetRightTab,
    rightTabValue,
    visibleTabValues,
  ])

  const setAdventureNotesVisibility = (visible: boolean) => {
    setSheetData(prev => ({
      ...prev,
      pageVisibility: {
        adventureNotes: visible,
      },
    }))

    if (visible) {
      if (isDualPageMode && !isMobile) {
        onSetRightTab('page3')
      } else {
        onSetCurrentTab('page3')
      }
      return
    }

    if (currentTabValue === 'page3') {
      onSetCurrentTab(fallbackCurrentTab)
    }

    if (leftTabValue === 'page3') {
      onSetLeftTab(fallbackCurrentTab)
    }

    if (rightTabValue === 'page3') {
      onSetRightTab(fallbackRightTab)
    }
  }

  const handleRemoveAdventureNotes = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault()
    event.stopPropagation()
    setAdventureNotesVisibility(false)
  }

  const renderAddPageButton = (heightClass: string) => {
    if (adventureNotesVisible) {
      return null
    }

    return (
      <button
        type="button"
        onClick={() => setAdventureNotesVisibility(true)}
        className={`${heightClass} min-w-10 rounded-lg border border-gray-400 bg-white px-3 text-xl font-semibold leading-none text-gray-800 transition-colors hover:bg-gray-100 print:hidden`}
        title="添加第三页"
      >
        +
      </button>
    )
  }

  const renderTabTrigger = (
    tab: (typeof visibleTabs)[number],
    index: number,
    triggerClassName: string
  ) => {
    const tabValue = tab.tabValue || tab.id
    const isAdventureNotesTab = tabValue === "page3"

    return (
      <div
        key={tab.id}
        className={`relative min-w-0 ${isAdventureNotesTab ? "pr-1" : ""}`}
      >
        <TabsTrigger
          value={tab.id}
          className={`${triggerClassName} w-full ${isAdventureNotesTab ? "pr-8" : ""}`}
          style={{
            animationDelay: `${index * 50}ms`,
          }}
        >
          {tab.label}
        </TabsTrigger>
        {isAdventureNotesTab && (
          <button
            type="button"
            onMouseDown={(event) => {
              event.preventDefault()
              event.stopPropagation()
            }}
            onClick={handleRemoveAdventureNotes}
            className="absolute right-1.5 top-1/2 z-10 flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded-sm text-gray-500 transition-colors hover:bg-gray-200 hover:text-gray-800 print:hidden"
            title="删除第三页"
            aria-label="删除第三页"
          >
            <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" d="M5 5l10 10M15 5L5 15" />
            </svg>
          </button>
        )}
      </div>
    )
  }

  return (
    <div className={`relative w-full mx-auto transition-all duration-300 ${isDualPageMode && !isMobile ? 'md:max-w-[425mm]' : 'md:max-w-[210mm]'}`}>
      {/* 双页模式布局 */}
      {isDualPageMode && !isMobile ? (
        <div className="overflow-x-auto overflow-y-hidden w-full">
          <div className="grid grid-cols-2 gap-1 w-[425mm] mx-auto min-w-[425mm]">
          {/* 左页 */}
          <div className="w-[210mm]">
            <Tabs value={leftTabValue} onValueChange={onSetLeftTab} className="w-[210mm]">
              {/* 左页Tab导航 */}
              <div className="w-full overflow-x-auto overflow-y-hidden tabs-container">
                <div className="flex items-stretch gap-2">
                  <TabsList className="grid flex-1 transition-all duration-300 ease-in-out h-10"
                    style={{
                      gridTemplateColumns: `repeat(${Math.max(visibleTabs.length, 1)}, 1fr)`
                    }}>
                    {/* 左页tabs */}
                    {visibleTabs.map((tab, index) =>
                      renderTabTrigger(tab, index, "transition-all duration-200 ease-in-out animate-in slide-in-from-right-2 py-1.5 text-sm")
                    )}
                  </TabsList>
                </div>
              </div>

              {/* 左页Tab内容 */}
              {visibleTabs.map((tab) => {
                const Component = tab.component
                return (
                  <TabsContent key={tab.id} value={tab.tabValue || tab.id}>
                    <Component />
                  </TabsContent>
                )
              })}
            </Tabs>
          </div>
          
          {/* 右页 */}
          <div className="w-[210mm]">
            <Tabs value={rightTabValue} onValueChange={onSetRightTab} className="w-[210mm]">
              {/* 右页Tab导航 */}
              <div className="w-full overflow-x-auto overflow-y-hidden tabs-container">
                <div className="flex items-stretch gap-2">
                  <TabsList className="grid flex-1 transition-all duration-300 ease-in-out h-10"
                    style={{
                      gridTemplateColumns: `repeat(${Math.max(visibleTabs.length, 1)}, 1fr)`
                    }}>
                    {/* 右页tabs */}
                    {visibleTabs.map((tab, index) =>
                      renderTabTrigger(tab, index, "transition-all duration-200 ease-in-out animate-in slide-in-from-right-2 py-1.5 text-sm")
                    )}
                  </TabsList>
                  {renderAddPageButton("h-10")}
                </div>
              </div>

              {/* 右页Tab内容 */}
              {visibleTabs.map((tab) => {
                const Component = tab.component
                return (
                  <TabsContent key={tab.id} value={tab.tabValue || tab.id}>
                    <Component />
                  </TabsContent>
                )
              })}
            </Tabs>
          </div>
        </div>
        </div>
      ) : (
        /* 单页模式布局（原有布局） */
        <Tabs value={currentTabValue} onValueChange={onSetCurrentTab} className="w-[210mm]">
          {/* 支持移动端滚动的Tab容器 */}
          <div className="w-full overflow-x-auto overflow-y-hidden tabs-container">
            <div className="flex items-stretch gap-2">
              <TabsList className={`grid flex-1 transition-all duration-300 ease-in-out ${isMobile ? 'h-12' : 'h-10'}`}
                style={{
                  gridTemplateColumns: `repeat(${Math.max(visibleTabs.length, 1)}, 1fr)`
                }}>
                {/* 动态渲染可见的tabs - 填满可用空间 */}
                {visibleTabs.map((tab, index) =>
                  renderTabTrigger(
                    tab,
                    index,
                    `transition-all duration-200 ease-in-out animate-in slide-in-from-right-2 ${isMobile ? 'py-2.5 text-sm' : 'py-1.5 text-sm'}`
                  )
                )}
              </TabsList>
              {renderAddPageButton(isMobile ? "h-12" : "h-10")}
            </div>
          </div>

          {/* 动态渲染Tab内容 */}
          {visibleTabs.map((tab) => {
            const Component = tab.component
            return (
              <TabsContent key={tab.id} value={tab.tabValue || tab.id}>
                <Component />
              </TabsContent>
            )
          })}
        </Tabs>
      )}

      {/* 左侧切换区域 - 仅桌面端单页模式显示 */}
      {!isDualPageMode && (
        <div
          className="print:hidden hidden md:block absolute -left-20 w-16 flex items-center justify-center cursor-pointer group z-20"
          style={{ top: '48px', bottom: 0 }}
          onClick={onSwitchToPrevPage}
          title="上一页 (←) - 循环切换"
        >
          {/* 悬停时显示的背景 */}
          <div className="absolute inset-0 bg-gray-100 opacity-0 group-hover:opacity-50 transition-opacity duration-200 rounded-l-lg"></div>
          {/* 箭头图标 */}
          <div className="relative bg-white shadow-md group-hover:shadow-lg p-2 rounded-full opacity-60 group-hover:opacity-100 transition-all duration-200 group-hover:scale-110 group-active:scale-90">
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </div>
        </div>
      )}

      {/* 右侧切换区域 - 仅桌面端单页模式显示 */}
      {!isDualPageMode && (
        <div
          className="print:hidden hidden md:block absolute -right-20 w-16 flex items-center justify-center cursor-pointer group z-20"
          style={{ top: '48px', bottom: 0 }}
          onClick={onSwitchToNextPage}
          title="下一页 (→) - 循环切换"
        >
          {/* 悬停时显示的背景 */}
          <div className="absolute inset-0 bg-gray-100 opacity-0 group-hover:opacity-50 transition-opacity duration-200 rounded-r-lg"></div>
          {/* 箭头图标 */}
          <div className="relative bg-white shadow-md group-hover:shadow-lg p-2 rounded-full opacity-60 group-hover:opacity-100 transition-all duration-200 group-hover:scale-110 group-active:scale-90">
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>
      )}

    </div>
  )
}
