"use client"

import { useEffect, useMemo, useState } from "react"

import { useCardStore } from "@/card/stores/unified-card-store"
import { Button } from "@/components/ui/button"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { extractArmorVariants } from "@/lib/equipment-variants"

const LEVELS = ["T1", "T2", "T3", "T4"] as const
type Level = typeof LEVELS[number]

interface ArmorModalProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (armorId: string) => void
  title: string
}

export function ArmorSelectionModal({ isOpen, onClose, onSelect, title }: ArmorModalProps) {
  const store = useCardStore()
  const availableArmors = useMemo(() => {
    if (!store.initialized || store.loading) {
      return []
    }

    return extractArmorVariants(store.loadAllCards())
  }, [store.initialized, store.loading, store.cards, store.batches])

  const [searchTerm, setSearchTerm] = useState("")
  const [levelFilter, setLevelFilter] = useState<Level | "">("")
  const [isCustom, setIsCustom] = useState(false)
  const [customName, setCustomName] = useState("")
  const [customLevel, setCustomLevel] = useState<Level | "">("")
  const [customThresholdMinor, setCustomThresholdMinor] = useState("")
  const [customThresholdMajor, setCustomThresholdMajor] = useState("")
  const [customArmorValue, setCustomArmorValue] = useState<number | "">("")
  const [customFeatureName, setCustomFeatureName] = useState("")
  const [customDescription, setCustomDescription] = useState("")

  const resetCustom = () => {
    setCustomName("")
    setCustomLevel("")
    setCustomThresholdMinor("")
    setCustomThresholdMajor("")
    setCustomArmorValue("")
    setCustomFeatureName("")
    setCustomDescription("")
    setIsCustom(false)
  }

  const resetFilters = () => {
    setSearchTerm("")
    setLevelFilter("")
  }

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown)
    } else {
      document.removeEventListener("keydown", handleKeyDown)
      resetFilters()
      resetCustom()
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [isOpen, onClose])

  const filteredArmors = useMemo(() => {
    return availableArmors.filter((armor) => {
      if (levelFilter && armor.等级 !== levelFilter) {
        return false
      }

      if (searchTerm) {
        const keyword = searchTerm.toLowerCase()
        const text = `${armor.名称} ${armor.特性名称} ${armor.描述}`.toLowerCase()
        if (!text.includes(keyword)) {
          return false
        }
      }

      return true
    })
  }, [availableArmors, levelFilter, searchTerm])

  if (!isOpen) {
    return null
  }

  const handleCustomSubmit = () => {
    if (!customName.trim()) {
      return
    }

    const threshold = customThresholdMinor && customThresholdMajor
      ? `${customThresholdMinor}/${customThresholdMajor}`
      : (customThresholdMinor || customThresholdMajor || "")

    onSelect(
      JSON.stringify({
        名称: customName.trim(),
        等级: customLevel || "",
        伤害阈值: threshold,
        护甲值: customArmorValue || 0,
        特性名称: customFeatureName.trim(),
        描述: customDescription.trim(),
      }),
    )
    resetCustom()
  }

  const renderRows = () => {
    if (store.loading) {
      return [
        <tr key="loading">
          <td colSpan={6} className="p-4 text-center text-sm text-gray-500">
            正在读取护甲数据...
          </td>
        </tr>,
      ]
    }

    if (filteredArmors.length === 0) {
      return [
        <tr key="empty">
          <td colSpan={6} className="p-4 text-center text-sm text-gray-500">
            当前没有可用护甲
          </td>
        </tr>,
      ]
    }

    return filteredArmors.map((armor) => (
      <tr
        key={armor.id}
        className="cursor-pointer border-b border-gray-200 hover:bg-gray-100"
        onClick={() => {
          resetCustom()
          onSelect(armor.id)
        }}
      >
        <td className="p-1.5 text-xs sm:text-sm">{armor.名称}</td>
        <td className="p-1.5 whitespace-nowrap text-xs sm:text-sm">{armor.等级}</td>
        <td className="p-1.5 whitespace-nowrap text-xs sm:text-sm">{armor.伤害阈值}</td>
        <td className="p-1.5 whitespace-nowrap text-xs sm:text-sm">{armor.护甲值}</td>
        <td className="p-1.5 whitespace-nowrap text-xs sm:text-sm">{armor.特性名称 || "-"}</td>
        <td className="p-1.5 text-xs sm:text-sm">{armor.描述 || "-"}</td>
      </tr>
    ))
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose}></div>
      <div className="relative flex max-h-[90vh] w-full max-w-6xl flex-col overflow-hidden rounded-lg bg-white shadow-lg">
        <div className="flex flex-col gap-2 border-b border-gray-200 p-3 sm:flex-row sm:items-center sm:p-4">
          <h2 className="flex-1 text-lg font-bold sm:text-xl">{title}</h2>
          <Button
            variant="destructive"
            onClick={() => {
              resetCustom()
              onSelect("none")
            }}
            className="w-full bg-red-500 text-white hover:bg-red-600 sm:w-auto"
          >
            清除选择
          </Button>
        </div>

        <div className="flex flex-wrap items-center gap-2 border-b border-gray-200 bg-gray-50 px-3 py-3 sm:px-4">
          <select
            className="rounded border px-3 py-2 text-sm"
            value={levelFilter}
            onChange={(event) => setLevelFilter(event.target.value as Level | "")}
          >
            <option value="">等级(全部)</option>
            {LEVELS.map((level) => (
              <option key={level} value={level}>
                {level}
              </option>
            ))}
          </select>

          <Button size="sm" variant="outline" onClick={resetFilters}>
            重置筛选
          </Button>

          <Button
            size="sm"
            variant={isCustom ? "default" : "outline"}
            onClick={() => {
              if (isCustom) {
                resetCustom()
              } else {
                setIsCustom(true)
              }
            }}
            className={isCustom ? "bg-blue-500 text-white hover:bg-blue-600" : ""}
          >
            {customName || "自定义护甲"}
          </Button>

          <input
            type="text"
            placeholder="搜索护甲..."
            className="min-w-[180px] flex-1 rounded border px-3 py-2 text-sm"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
        </div>

        {isCustom && (
          <div className="border-b border-blue-200 bg-blue-50 px-3 py-3 sm:px-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className="lg:col-span-2">
                <label className="mb-1 block text-sm font-medium text-gray-700">名称</label>
                <input
                  className="w-full rounded border px-3 py-2 text-sm"
                  placeholder="自定义护甲名称"
                  value={customName}
                  onChange={(event) => setCustomName(event.target.value)}
                  autoFocus
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">等级</label>
                <select
                  className="w-full rounded border px-3 py-2 text-sm"
                  value={customLevel}
                  onChange={(event) => setCustomLevel(event.target.value as Level | "")}
                >
                  <option value="">选择等级</option>
                  {LEVELS.map((level) => (
                    <option key={level} value={level}>
                      {level}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">护甲值</label>
                <input
                  type="number"
                  className="w-full rounded border px-3 py-2 text-sm"
                  placeholder="护甲值"
                  value={customArmorValue}
                  onChange={(event) => setCustomArmorValue(event.target.value ? Number.parseInt(event.target.value, 10) : "")}
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">轻伤阈值</label>
                <input
                  type="number"
                  className="w-full rounded border px-3 py-2 text-sm"
                  placeholder="例如 5"
                  value={customThresholdMinor}
                  onChange={(event) => setCustomThresholdMinor(event.target.value)}
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">重伤阈值</label>
                <input
                  type="number"
                  className="w-full rounded border px-3 py-2 text-sm"
                  placeholder="例如 11"
                  value={customThresholdMajor}
                  onChange={(event) => setCustomThresholdMajor(event.target.value)}
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">特性名称</label>
                <input
                  className="w-full rounded border px-3 py-2 text-sm"
                  placeholder="特性名称"
                  value={customFeatureName}
                  onChange={(event) => setCustomFeatureName(event.target.value)}
                />
              </div>

              <div className="sm:col-span-2 lg:col-span-4">
                <label className="mb-1 block text-sm font-medium text-gray-700">描述</label>
                <textarea
                  className="min-h-[84px] w-full rounded border px-3 py-2 text-sm"
                  placeholder="护甲描述"
                  value={customDescription}
                  onChange={(event) => setCustomDescription(event.target.value)}
                />
              </div>
            </div>

            <div className="mt-3 flex flex-col gap-2 sm:flex-row">
              <Button onClick={handleCustomSubmit} disabled={!customName.trim()}>
                确认添加
              </Button>
              <Button variant="destructive" onClick={resetCustom} className="bg-red-500 text-white hover:bg-red-600">
                取消
              </Button>
            </div>
          </div>
        )}

        <ScrollArea className="flex-1 overflow-auto">
          <div className="p-2 sm:p-3">
            <table className="w-full min-w-[720px] border-collapse">
              <thead className="sticky top-0 z-10 bg-gray-800 text-white">
                <tr>
                  <th className="p-1.5 text-left text-xs font-semibold sm:text-sm">名称</th>
                  <th className="p-1.5 text-left text-xs font-semibold sm:text-sm">等级</th>
                  <th className="p-1.5 text-left text-xs font-semibold sm:text-sm">伤害阈值</th>
                  <th className="p-1.5 text-left text-xs font-semibold sm:text-sm">护甲值</th>
                  <th className="p-1.5 text-left text-xs font-semibold sm:text-sm">特性名称</th>
                  <th className="p-1.5 text-left text-xs font-semibold sm:text-sm">描述</th>
                </tr>
              </thead>
              <tbody>{renderRows()}</tbody>
            </table>
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </div>
    </div>
  )
}
