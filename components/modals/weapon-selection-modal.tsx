"use client"

import { useEffect, useMemo, useState } from "react"

import { useCardStore } from "@/card/stores/unified-card-store"
import { Button } from "@/components/ui/button"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { formatEquipmentPrice, getWeaponPrice } from "@/lib/equipment-price"
import { extractWeaponVariants, type VariantWeaponData } from "@/lib/equipment-variants"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

const LEVELS = ["T1", "T2", "T3", "T4"] as const
const CHECKS = ["敏捷", "灵巧", "知识", "力量", "本能", "风度"] as const
const RANGES = ["近战", "邻近", "近", "远", "极远"] as const
const LOADS = ["单手", "双手"] as const

type Level = typeof LEVELS[number]
type Check = typeof CHECKS[number]
type Range = typeof RANGES[number]
type Load = typeof LOADS[number]

interface WeaponModalProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (weaponId: string, weaponType: "primary" | "secondary") => void
  title: string
  weaponSlotType: "primary" | "secondary" | "inventory"
}

const getDefaultCustomLoad = (weaponSlotType: WeaponModalProps["weaponSlotType"]): Load | "" =>
  weaponSlotType === "secondary" ? "单手" : ""

export function WeaponSelectionModal({
  isOpen,
  onClose,
  onSelect,
  title,
  weaponSlotType,
}: WeaponModalProps) {
  const store = useCardStore()
  const currentWeaponType: "primary" | "secondary" = weaponSlotType === "secondary" ? "secondary" : "primary"
  const availableWeapons = useMemo(() => {
    if (!store.initialized || store.loading) {
      return []
    }

    const weapons = extractWeaponVariants(store.loadAllCards())
    if (weaponSlotType === "secondary") {
      return weapons.filter((weapon) => weapon.负荷 === "单手")
    }

    return weapons
  }, [store.initialized, store.loading, store.cards, store.batches, weaponSlotType])

  const [searchTerm, setSearchTerm] = useState("")
  const [levelFilter, setLevelFilter] = useState<Level | "">("")
  const [checkFilter, setCheckFilter] = useState<Check | "">("")
  const [rangeFilter, setRangeFilter] = useState<Range | "">("")
  const [loadFilter, setLoadFilter] = useState<Load | "">("")
  const [isCustom, setIsCustom] = useState(false)
  const [customName, setCustomName] = useState("")
  const [customLevel, setCustomLevel] = useState<Level | "">("")
  const [customCheck, setCustomCheck] = useState<Check | "">("")
  const [customRange, setCustomRange] = useState<Range | "">("")
  const [customDamage, setCustomDamage] = useState("")
  const [customLoad, setCustomLoad] = useState<Load | "">(getDefaultCustomLoad(weaponSlotType))
  const [customFeatureName, setCustomFeatureName] = useState("")
  const [customDescription, setCustomDescription] = useState("")

  const resetCustom = () => {
    setCustomName("")
    setCustomLevel("")
    setCustomCheck("")
    setCustomRange("")
    setCustomDamage("")
    setCustomLoad(getDefaultCustomLoad(weaponSlotType))
    setCustomFeatureName("")
    setCustomDescription("")
    setIsCustom(false)
  }

  const resetFilters = () => {
    setSearchTerm("")
    setLevelFilter("")
    setCheckFilter("")
    setRangeFilter("")
    setLoadFilter("")
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
  }, [isOpen, onClose, weaponSlotType])

  const filteredWeapons = useMemo(() => {
    return availableWeapons.filter((weapon) => {
      if (levelFilter && weapon.等级 !== levelFilter) {
        return false
      }

      if (checkFilter && weapon.属性 !== checkFilter) {
        return false
      }

      if (rangeFilter && weapon.范围 !== rangeFilter) {
        return false
      }

      if (loadFilter && weapon.负荷 !== loadFilter) {
        return false
      }

      if (searchTerm) {
        const keyword = searchTerm.toLowerCase()
        const text = `${weapon.名称} ${weapon.特性名称} ${weapon.描述}`.toLowerCase()
        if (!text.includes(keyword)) {
          return false
        }
      }

      return true
    })
  }, [availableWeapons, checkFilter, levelFilter, loadFilter, rangeFilter, searchTerm])

  if (!isOpen) {
    return null
  }

  const handleCustomSubmit = () => {
    if (!customName.trim()) {
      return
    }

    const effectiveLoad = weaponSlotType === "secondary" ? "单手" : customLoad || ""
    const customWeapon: Partial<VariantWeaponData> = {
      名称: customName.trim(),
      等级: customLevel || "",
      属性: customCheck || "",
      范围: customRange || "",
      伤害: customDamage.trim(),
      负荷: effectiveLoad,
      特性名称: customFeatureName.trim(),
      描述: customDescription.trim(),
    }

    onSelect(JSON.stringify(customWeapon), currentWeaponType)
    resetCustom()
  }

  const renderRows = () => {
    if (store.loading) {
      return [
        <tr key="loading">
          <td colSpan={8} className="p-4 text-center text-sm text-gray-500">
            正在读取武器数据...
          </td>
        </tr>,
      ]
    }

    if (filteredWeapons.length === 0) {
      return [
        <tr key="empty">
          <td colSpan={8} className="p-4 text-center text-sm text-gray-500">
            当前没有可用武器
          </td>
        </tr>,
      ]
    }

    return filteredWeapons.map((weapon) => (
      <tr
        key={weapon.id}
        className="cursor-pointer border-b border-gray-200 hover:bg-gray-100"
        onClick={() => {
          resetCustom()
          onSelect(weapon.id, currentWeaponType)
        }}
      >
        <td className="w-[88px] p-1.5 text-xs sm:w-[104px] sm:text-sm">{weapon.名称}</td>
        <td className="w-[44px] p-1.5 whitespace-nowrap text-xs sm:w-[52px] sm:text-sm">{weapon.等级}</td>
        <td className="w-[44px] p-1.5 whitespace-nowrap text-xs sm:w-[52px] sm:text-sm">{weapon.负荷}</td>
        <td className="w-[48px] p-1.5 whitespace-nowrap text-xs sm:w-[56px] sm:text-sm">{weapon.范围}</td>
        <td className="w-[48px] p-1.5 whitespace-nowrap text-xs sm:w-[56px] sm:text-sm">{weapon.属性}</td>
        <td className="w-[56px] p-1.5 whitespace-nowrap text-xs sm:w-[64px] sm:text-sm">{weapon.伤害}</td>
        <td className="w-[64px] p-1.5 whitespace-nowrap text-xs sm:w-[76px] sm:text-sm">{formatEquipmentPrice(getWeaponPrice(weapon))}</td>
        <td className="max-w-[140px] truncate p-1.5 text-xs sm:max-w-[200px] sm:text-sm">
          {weapon.特性名称 || weapon.描述 ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="cursor-default">
                  {weapon.特性名称 && (
                    <span className="font-semibold">{weapon.特性名称}</span>
                  )}
                  {weapon.特性名称 && weapon.描述 && <span className="mx-0.5">·</span>}
                  {weapon.描述 && (
                    <span>{weapon.描述}</span>
                  )}
                </span>
              </TooltipTrigger>
              <TooltipContent side="bottom" align="start" className="max-w-[280px] whitespace-normal break-words">
                <div className="space-y-1">
                  {weapon.特性名称 && (
                    <div className="font-semibold">{weapon.特性名称}</div>
                  )}
                  {weapon.描述 && (
                    <div className="text-xs text-gray-600">{weapon.描述}</div>
                  )}
                </div>
              </TooltipContent>
            </Tooltip>
          ) : (
            "-"
          )}
        </td>
      </tr>
    ))
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose}></div>
      <div className="relative flex max-h-[90vh] w-full max-w-6xl flex-col overflow-hidden rounded-lg bg-white shadow-lg">
        <div className="flex flex-col gap-2 border-b border-gray-200 p-3 sm:flex-row sm:items-center sm:p-4">
          <div className="flex-1">
            <h2 className="text-lg font-bold sm:text-xl">{title}</h2>
            {weaponSlotType === "secondary" && (
              <div className="text-xs text-gray-500">副武器仅显示单手武器</div>
            )}
          </div>
          <Button
            variant="destructive"
            onClick={() => {
              resetCustom()
              onSelect("none", currentWeaponType)
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

          <select
            className="rounded border px-3 py-2 text-sm"
            value={checkFilter}
            onChange={(event) => setCheckFilter(event.target.value as Check | "")}
          >
            <option value="">检定(全部)</option>
            {CHECKS.map((check) => (
              <option key={check} value={check}>
                {check}
              </option>
            ))}
          </select>

          <select
            className="rounded border px-3 py-2 text-sm"
            value={rangeFilter}
            onChange={(event) => setRangeFilter(event.target.value as Range | "")}
          >
            <option value="">距离(全部)</option>
            {RANGES.map((range) => (
              <option key={range} value={range}>
                {range}
              </option>
            ))}
          </select>

          {weaponSlotType !== "secondary" && (
            <select
              className="rounded border px-3 py-2 text-sm"
              value={loadFilter}
              onChange={(event) => setLoadFilter(event.target.value as Load | "")}
            >
              <option value="">负荷(全部)</option>
              {LOADS.map((load) => (
                <option key={load} value={load}>
                  {load}
                </option>
              ))}
            </select>
          )}

          <Button size="sm" variant="outline" onClick={resetFilters}>
            重置筛选
          </Button>

          <input
            type="text"
            placeholder="搜索武器..."
            className="min-w-[180px] flex-1 rounded border px-3 py-2 text-sm"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
        </div>

        <ScrollArea className="flex-1 overflow-auto">
          <div className="p-2 sm:p-3">
            <TooltipProvider>
            <table className="min-w-full w-max border-collapse">
              <thead className="sticky top-0 z-10 bg-gray-800 text-white">
                <tr>
                  <th className="w-[88px] p-1.5 text-left text-xs font-semibold sm:w-[104px] sm:text-sm">名称</th>
                  <th className="w-[44px] p-1.5 text-left text-xs font-semibold sm:w-[52px] sm:text-sm">等级</th>
                  <th className="w-[44px] p-1.5 text-left text-xs font-semibold sm:w-[52px] sm:text-sm">负荷</th>
                  <th className="w-[48px] p-1.5 text-left text-xs font-semibold sm:w-[56px] sm:text-sm">距离</th>
                  <th className="w-[48px] p-1.5 text-left text-xs font-semibold sm:w-[56px] sm:text-sm">检定</th>
                  <th className="w-[56px] p-1.5 text-left text-xs font-semibold sm:w-[64px] sm:text-sm">伤害</th>
                  <th className="w-[64px] p-1.5 text-left text-xs font-semibold sm:w-[76px] sm:text-sm">价格</th>
                  <th className="p-1.5 text-left text-xs font-semibold sm:text-sm">特性</th>
                </tr>
              </thead>
              <tbody>{renderRows()}</tbody>
            </table>
            </TooltipProvider>
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </div>
    </div>
  )
}
