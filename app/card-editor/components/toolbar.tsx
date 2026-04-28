import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { 
  Download, 
  Upload, 
  Plus, 
  Database,
  Save,
  FileText,
  CheckCircle,
  Loader2,
  ChevronDown
} from 'lucide-react'
import type { CardPackageState, CardPackageTransferFormat } from '../types'

interface ToolbarProps {
  currentPackage: CardPackageState
  onNew: () => void
  onImport: (format: CardPackageTransferFormat) => void | Promise<void>
  onExport: (format: CardPackageTransferFormat) => void | Promise<void>
  onLoadBuiltin: () => void
  onSaveBuiltin: () => void
  editingSource: 'custom' | 'builtin'
  onShowKeywords: () => void
  onValidate: () => void
  isValidating: boolean
}

export function Toolbar({ 
  currentPackage, 
  onNew, 
  onImport, 
  onExport, 
  onLoadBuiltin,
  onSaveBuiltin,
  editingSource,
  onShowKeywords,
  onValidate,
  isValidating
}: ToolbarProps) {
  return (
    <div className="flex flex-wrap gap-2 p-4 bg-muted/30 rounded-lg">
      <Button
        variant="default"
        size="sm"
        onClick={onNew}
        className="flex items-center gap-2"
      >
        <Plus className="h-4 w-4" />
        新建卡包
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={onLoadBuiltin}
        className="flex items-center gap-2"
      >
        <Database className="h-4 w-4" />
        加载核心包
      </Button>
      <Button
        variant={editingSource === 'builtin' ? 'default' : 'outline'}
        size="sm"
        onClick={onSaveBuiltin}
        className="flex items-center gap-2"
      >
        <Save className="h-4 w-4" />
        保存到核心包
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <Upload className="h-4 w-4" />
            导入卡包
            <ChevronDown className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuItem onClick={() => void onImport('json')}>
            导入 JSON
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => void onImport('dhcb')}>
            导入 DHCB
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            导出卡包
            <ChevronDown className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuItem onClick={() => void onExport('json')}>
            导出 JSON
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => void onExport('dhcb')}>
            导出 DHCB
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <Button
        variant="outline"
        size="sm"
        onClick={onValidate}
        disabled={isValidating}
        className="flex items-center gap-2"
      >
        {isValidating ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <CheckCircle className="h-4 w-4" />
        )}
        {isValidating ? '验证中...' : '验证卡包'}
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={onShowKeywords}
        className="flex items-center gap-2"
      >
        <FileText className="h-4 w-4" />
        查看关键字列表
      </Button>
      <div className="ml-auto flex items-center text-sm text-muted-foreground">
        当前卡包：{currentPackage.name || '未命名卡包'}
      </div>
    </div>
  )
}
