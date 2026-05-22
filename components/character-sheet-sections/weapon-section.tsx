"use client"

import type React from "react"
import { useState } from "react"
import { ContentEditableField } from "@/components/ui/content-editable-field"
import { formatEquipmentPrice, getWeaponPrice } from "@/lib/equipment-price"
import { loadWeaponVariantsFromStore } from "@/lib/equipment-variants"
import { useSheetStore } from "@/lib/sheet-store"
import { getProficiencyCount } from "@/lib/proficiency"

interface WeaponSectionProps {
  isPrimary?: boolean
  fieldPrefix: string
  onOpenWeaponModal: (fieldName: string, slotType: "primary" | "secondary" | "inventory") => void;
}

export function WeaponSection({
  isPrimary = false,
  fieldPrefix,
  onOpenWeaponModal,
}: WeaponSectionProps) {
  const { sheetData: formData, setSheetData } = useSheetStore()
  const [isEditingName, setIsEditingName] = useState(false)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    const nextValue = name === damageField ? stripDisplayedProficiencyPrefix(value) : value
    setSheetData((prev) => ({ ...prev, [name]: nextValue }))
  }

  const openWeaponModal = (fieldName: string, slotType: "primary" | "secondary" | "inventory") => {
    onOpenWeaponModal(fieldName, slotType)
  }

  const handleEditName = () => {
    setIsEditingName(true)
  }

  const handleNameChange = (value: string) => {
    setSheetData((prev) => ({ ...prev, [nameField]: value }))
  }

  const handleNameSubmit = () => {
    setIsEditingName(false)
  }

  const handleNameKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleNameSubmit()
    }
  }


  const nameField = `${fieldPrefix}Name`
  const traitField = `${fieldPrefix}Trait`
  const damageField = `${fieldPrefix}Damage`
  const featureField = `${fieldPrefix}Feature`
  const proficiencyCount = getProficiencyCount(formData.proficiency)
  const rawDamageValue = typeof (formData as any)[damageField] === "string" ? (formData as any)[damageField] : ""
  const weaponName = typeof (formData as any)[nameField] === "string" ? (formData as any)[nameField] : ""
  const selectedWeapon = loadWeaponVariantsFromStore().find((weapon) => weapon.名称 === weaponName)
  const weaponFeature = typeof (formData as any)[featureField] === "string" ? (formData as any)[featureField] : ""
  const priceLabel = formatEquipmentPrice(
    getWeaponPrice(selectedWeapon ?? { 名称: weaponName, 特性名称: weaponFeature })
  )

  const stripDisplayedProficiencyPrefix = (value: string): string => {
    const trimmedValue = value.trim()
    const prefix = String(proficiencyCount)
    if (proficiencyCount > 0 && trimmedValue.startsWith(prefix) && /^[dD]/.test(trimmedValue.slice(prefix.length))) {
      return trimmedValue.slice(prefix.length)
    }

    return value
  }

  const displayDamageValue = stripDisplayedProficiencyPrefix(rawDamageValue)
  const mergedDamageValue =
    displayDamageValue.trim().length > 0 && proficiencyCount > 0
      ? `${proficiencyCount}${displayDamageValue.trim()}`
      : displayDamageValue

  return (
    <div className="mb-3.5">
      <div className="flex items-center justify-between rounded-t-md bg-gray-800 p-1 text-white">
        <h4 className="font-bold text-[10px]">{isPrimary ? "主武器" : "副武器"}</h4>
        {priceLabel ? <span className="text-[10px] font-medium">价格 {priceLabel}</span> : null}
      </div>
      <div className="grid grid-cols-10 gap-1 -mt-0.5">
        <div className="col-span-4">
          <label className="text-[8px] text-gray-600">名称</label>
          {isEditingName ? (
            <input
              type="text"
              value={(formData as any)[nameField] || ""}
              onChange={(e) => handleNameChange(e.target.value)}
              onKeyDown={handleNameKeyDown}
              onBlur={handleNameSubmit}
              className="w-full border border-gray-400 rounded p-0.5 h-6 text-sm px-2 bg-white focus:outline-none focus:border-blue-500"
              autoFocus
            />
          ) : (
            <div className="group flex w-full border border-gray-400 rounded h-6 bg-white overflow-hidden">
              <button
                type="button"
                onClick={() => openWeaponModal(nameField, isPrimary ? "primary" : "secondary")}
                className="flex-1 text-sm text-left px-2 py-0.5 hover:bg-gray-50 focus:outline-none"
              >
                {(formData as any)[nameField] || <span className="print:hidden">选择武器</span>}
              </button>
              <div className="w-px bg-gray-300 hidden group-hover:block"></div>
              <button
                type="button"
                onClick={handleEditName}
                className="w-8 hidden group-hover:flex items-center justify-center hover:bg-gray-50 focus:outline-none print:hidden"
                title="编辑名称"
              >
                <svg className="w-3 h-3 text-gray-500" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M11.498 1.5a.5.5 0 0 1 .707 0l2.295 2.295a.5.5 0 0 1 0 .707l-9.435 9.435a.5.5 0 0 1-.354.146H1.5a.5.5 0 0 1-.5-.5v-3.211a.5.5 0 0 1 .146-.354L10.582 1.5h.916zm-1 2.207-8.646 8.646v2.36h2.36l8.647-8.647L10.498 3.707z" />
                </svg>
              </button>
            </div>
          )}
        </div>
        <div className="col-span-3">
          <label className="text-[8px] text-gray-600">基本信息</label>
          <div className="flex h-6 w-full items-end border-b border-gray-400">
            <input
              type="text"
              name={traitField}
              value={(formData as any)[traitField] || ""}
              onChange={handleInputChange}
              className="min-w-0 flex-1 bg-transparent focus:outline-none print-empty-hide text-[12px]"
            />
          </div>
        </div>
        <div className="col-span-3">
          <label className="text-[8px] text-gray-600">伤害骰</label>
          <div className="flex h-6 w-full items-end border-b border-gray-400">
            <input
              type="text"
              name={damageField}
              value={mergedDamageValue}
              onChange={handleInputChange}
              className="min-w-0 flex-1 bg-transparent focus:outline-none print-empty-hide text-sm"
            />
          </div>
        </div>
      </div>
      {weaponFeature ? (
        <div className="mt-1">
          <ContentEditableField
            name={featureField}
            value={weaponFeature}
            onChange={handleInputChange}
            placeholder=""
            maxLines={2}
          />
        </div>
      ) : null}
    </div>
  )
}
