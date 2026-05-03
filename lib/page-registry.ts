/**
 * 页面注册系统 - 统一管理所有页面的配置和渲染逻辑
 */

import type { ComponentType } from 'react'
import type { SheetData } from './sheet-data'

export interface PageDefinition {
  id: string
  label: string
  component: ComponentType<any>
  printClass: string
  tabValue?: string  // Tab值，如果与id不同
  
  // 显示条件
  visibility: 
    | { type: 'always' }
    | { type: 'config'; configKey: 'adventureNotes' }
    | { type: 'data'; dataCheck: (data: SheetData) => boolean }
  
  // 打印顺序（数字越小越靠前）
  printOrder: number
  
  // 是否在Tab中显示
  showInTabs?: boolean
}

// 页面注册表
const pageRegistry = new Map<string, PageDefinition>()

/**
 * 注册页面
 */
export function registerPage(page: PageDefinition) {
  pageRegistry.set(page.id, page)
}

/**
 * 批量注册页面
 */
export function registerPages(pages: PageDefinition[]) {
  pages.forEach(page => registerPage(page))
}

/**
 * 获取页面定义
 */
export function getPageDefinition(pageId: string): PageDefinition | undefined {
  return pageRegistry.get(pageId)
}

/**
 * 获取所有页面定义
 */
export function getAllPages(): PageDefinition[] {
  return Array.from(pageRegistry.values())
}

/**
 * 判断页面是否可见
 */
export function isPageVisible(page: PageDefinition, sheetData: SheetData): boolean {
  switch (page.visibility.type) {
    case 'always':
      return true
    case 'config':
      return !!sheetData.pageVisibility?.[page.visibility.configKey]
    case 'data':
      return page.visibility.dataCheck(sheetData)
    default:
      return false
  }
}

/**
 * 获取所有可见页面（用于打印）
 */
export function getVisiblePages(sheetData: SheetData): PageDefinition[] {
  return getAllPages()
    .filter(page => isPageVisible(page, sheetData))
    .sort((a, b) => a.printOrder - b.printOrder)
}

/**
 * 获取打印/导出页面
 *
 * 仅影响打印和 HTML/PDF 导出，不影响正常编辑页签顺序：
 * - 第二页在打印中由卡牌具体效果页替代
 * - 聚焦卡组 / 库存卡组整体前移到第三页之前
 */
export function getPrintPages(sheetData: SheetData): PageDefinition[] {
  const visiblePages = getVisiblePages(sheetData)
  const focusedCardsPage = visiblePages.find(page => page.id === 'focused-cards')
  const pageTwoTextSummaryPage = visiblePages.find(page => page.id === 'page2-text-summary')
  const inventoryCardsPage = visiblePages.find(page => page.id === 'inventory-cards')

  const replacementPages = [focusedCardsPage, inventoryCardsPage, pageTwoTextSummaryPage].filter(Boolean) as PageDefinition[]
  const injectedPageIds = new Set<string>()

  return visiblePages.flatMap((page) => {
    if (page.id === 'page2') {
      replacementPages.forEach(replacementPage => injectedPageIds.add(replacementPage.id))
      return replacementPages.sort((a, b) => a.printOrder - b.printOrder)
    }

    if (injectedPageIds.has(page.id)) {
      return []
    }

    return [page]
  })
}

/**
 * 获取Tab页面（用于正常视图）
 */
export function getTabPages(sheetData: SheetData): PageDefinition[] {
  return getAllPages()
    .filter(page => page.showInTabs !== false && isPageVisible(page, sheetData))
    .sort((a, b) => a.printOrder - b.printOrder)
}

/**
 * 清空注册表（主要用于测试）
 */
export function clearRegistry() {
  pageRegistry.clear()
}

/**
 * 获取最后一个可见页面的打印类名
 */
export function getLastVisiblePageClass(sheetData: SheetData): string {
  const visiblePages = getVisiblePages(sheetData)
  if (visiblePages.length === 0) return ''
  return visiblePages[visiblePages.length - 1].printClass
}
