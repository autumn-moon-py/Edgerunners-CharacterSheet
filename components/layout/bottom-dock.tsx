"use client"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Download, FolderOpen, Package, FileText, FileType, Code, Dice5, Plus, Upload } from "lucide-react"
import { navigateToPage, cn } from "@/lib/utils"
import { isCardManagerEnabled } from '@/lib/distribution-flags'

// 基础 props
interface BottomDockBaseProps {
  isMobile: boolean
}

// 主页面模式 props
interface MainModeProps extends BottomDockBaseProps {
  mode: 'main'
  characterCount: number

  // 导出相关
  onPrintAll: () => void
  onOpenSealDiceExport: () => void
  onQuickExportPDF: () => void
  onQuickExportHTML: () => void

  // 存档相关
  onOpenCharacterManagement: () => void
  onQuickCreateArchive: () => void
  onQuickImportFromHTML: () => void
}

// 预览模式 props
interface PreviewModeProps extends BottomDockBaseProps {
  mode: 'preview'

  onExportPDF: () => void
  onExportHTML: () => void
  onOpenSealDiceExport: () => void
  onClose: () => void
}

type BottomDockProps = MainModeProps | PreviewModeProps

// 主页面模式内容
function MainModeContent(props: MainModeProps) {
  const { isMobile } = props
  const cardManagerEnabled = isCardManagerEnabled()

  return (
    <>
      {/* Group B: 文件操作 */}
      <div className="flex flex-wrap items-center justify-center gap-1.5">
        {/* 导出下拉菜单 */}
        <DropdownMenu>
          <Tooltip>
            <TooltipTrigger asChild>
              <DropdownMenuTrigger asChild>
                <Button className={cn(
                  "bg-gray-800 hover:bg-gray-700 text-white gap-1.5 text-sm",
                  isMobile ? "px-4 py-2.5" : "px-3 py-1.5"
                )}>
                  <Download className="h-3.5 w-3.5" />
                  导出
                </Button>
              </DropdownMenuTrigger>
            </TooltipTrigger>
            <TooltipContent side="top">
              <p>导出角色卡</p>
              <p className="text-xs text-muted-foreground mt-1">
                导出为PDF、HTML或骰娘指令
              </p>
            </TooltipContent>
          </Tooltip>
          <DropdownMenuContent align="end" side="top" className={cn("w-64", isMobile && "text-base")}>
            <DropdownMenuItem onClick={props.onPrintAll} className={cn(isMobile && "py-3 px-4")}>
              <FileText className={cn("mr-2", isMobile ? "h-5 w-5" : "h-4 w-4")} />
              打开导出预览界面
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={props.onOpenSealDiceExport} className={cn(isMobile && "py-3 px-4")}>
              <Dice5 className={cn("mr-2", isMobile ? "h-5 w-5" : "h-4 w-4")} />
              导出到骰子
            </DropdownMenuItem>
            <DropdownMenuItem onClick={props.onQuickExportPDF} className={cn(isMobile && "py-3 px-4")}>
              <FileType className={cn("mr-2", isMobile ? "h-5 w-5" : "h-4 w-4")} />
              导出PDF
            </DropdownMenuItem>
            <DropdownMenuItem onClick={props.onQuickExportHTML} className={cn(isMobile && "py-3 px-4")}>
              <Code className={cn("mr-2", isMobile ? "h-5 w-5" : "h-4 w-4")} />
              导出HTML（网团必备）
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* 存档管理下拉菜单 */}
        <DropdownMenu>
          <Tooltip>
            <TooltipTrigger asChild>
              <DropdownMenuTrigger asChild>
                <Button className={cn(
                  "bg-gray-800 hover:bg-gray-700 text-white gap-1.5 text-sm",
                  isMobile ? "px-4 py-2.5" : "px-3 py-1.5"
                )}>
                  <FolderOpen className="h-3.5 w-3.5" />
                  存档
                </Button>
              </DropdownMenuTrigger>
            </TooltipTrigger>
            <TooltipContent side="top">
              <p>存档管理</p>
              <p className="text-xs text-muted-foreground mt-1">
                管理多个角色存档
              </p>
            </TooltipContent>
          </Tooltip>
          <DropdownMenuContent align="end" side="top" className={cn("w-56", isMobile && "text-base")}>
            <DropdownMenuItem onClick={props.onOpenCharacterManagement} className={cn(isMobile && "py-3 px-4")}>
              <FolderOpen className={cn("mr-2", isMobile ? "h-5 w-5" : "h-4 w-4")} />
              打开存档管理器
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={props.onQuickCreateArchive}
              className={cn(isMobile && "py-3 px-4")}
            >
              <Plus className={cn("mr-2", isMobile ? "h-5 w-5" : "h-4 w-4")} />
              新建存档
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={props.onQuickImportFromHTML}
              className={cn(isMobile && "py-3 px-4")}
            >
              <Upload className={cn("mr-2", isMobile ? "h-5 w-5" : "h-4 w-4")} />
              从HTML导入
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {cardManagerEnabled ? (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              onClick={() => navigateToPage('/card-manager')}
              className={cn(
                "bg-gray-800 hover:bg-gray-700 text-white gap-1.5 text-sm",
                isMobile ? "px-4 py-2.5" : "px-3 py-1.5"
              )}
            >
              <Package className="h-3.5 w-3.5" />
              卡包
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top">
            <p>卡包管理</p>
            <p className="text-xs text-muted-foreground mt-1">
              管理和导入自定义卡包
            </p>
          </TooltipContent>
        </Tooltip>
      ) : null}

    </>
  )
}

// 预览模式内容
function PreviewModeContent(props: PreviewModeProps) {
  const { isMobile } = props

  return (
    <div className="flex items-center gap-4">
      <Button
        onClick={props.onExportPDF}
        className={cn(
          "bg-gray-800 text-white hover:bg-gray-700 focus:outline-none whitespace-nowrap",
          isMobile ? "px-6 py-3 text-base" : "px-4 py-2 text-sm"
        )}
      >
        导出为PDF
      </Button>
      <Button
        onClick={props.onExportHTML}
        className={cn(
          "bg-gray-800 text-white hover:bg-gray-700 focus:outline-none whitespace-nowrap",
          isMobile ? "px-6 py-3 text-base" : "px-4 py-2 text-sm"
        )}
      >
        导出HTML（网团必备）
      </Button>
      <Button
        onClick={props.onOpenSealDiceExport}
        className={cn(
          "bg-gray-800 text-white hover:bg-gray-700 focus:outline-none whitespace-nowrap",
          isMobile ? "px-6 py-3 text-base" : "px-4 py-2 text-sm"
        )}
      >
        导出到骰子
      </Button>
      <Button
        onClick={props.onClose}
        className={cn(
          "bg-red-600 text-white hover:bg-red-700 focus:outline-none whitespace-nowrap",
          isMobile ? "px-6 py-3 text-base" : "px-4 py-2 text-sm"
        )}
      >
        返回
      </Button>
    </div>
  )
}

export function BottomDock(props: BottomDockProps) {
  const { isMobile, mode } = props

  // 根据模式选择不同的 z-index 和样式
  const isPreviewMode = mode === 'preview'

  return (
    <div className={cn(
      "fixed left-0 right-0 print:hidden",
      isMobile ? "bottom-8" : "bottom-4",
      isPreviewMode ? "z-[60] print-control-buttons" : "z-30"
    )}>
      <div className="flex justify-center px-4">
        <TooltipProvider>
          <div
            className={cn(
              "flex max-w-[calc(100vw-1rem)] flex-wrap items-center justify-center gap-2 px-2.5 py-1.5 rounded-3xl shadow-md border transition-all duration-200 md:max-w-none md:flex-nowrap md:rounded-full",
              // 预览模式使用更简单的样式
              isPreviewMode && "gap-4"
            )}
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              backdropFilter: 'blur(16px) saturate(180%)',
              borderColor: 'rgba(255, 255, 255, 0.15)',
              boxShadow: '0 4px 12px -2px rgba(0, 0, 0, 0.1)'
            }}
          >
            {mode === 'main' ? (
              <MainModeContent {...props} />
            ) : (
              <PreviewModeContent {...props} />
            )}
          </div>
        </TooltipProvider>
      </div>
    </div>
  )
}
