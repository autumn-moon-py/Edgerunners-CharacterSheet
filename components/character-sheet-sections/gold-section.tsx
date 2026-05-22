"use client"

import type { ChangeEvent } from "react";
import { useMemo } from "react";
import { CardType, type StandardCard } from "@/card/card-types";
import { useCardStore } from "@/card/stores/unified-card-store";
import { GOLD_SLOT_LIMIT } from "@/lib/default-sheet-data";
import { getCyberwareEchoCost, getInitialHumanity, hasManualHumanityValue } from "@/lib/humanity-metrics";
import { safeEvaluateExpression } from "@/lib/number-utils";
import { useSafeSheetData, useSheetStore } from "@/lib/sheet-store";

const getCyberpsychoMarks = (currentHumanity: number, initialHumanity: number): number => {
  if (initialHumanity <= 0 || currentHumanity <= 0) {
    return 4
  }

  const ratio = currentHumanity / initialHumanity

  if (ratio <= 0.25) {
    return 3
  }

  if (ratio <= 0.5) {
    return 2
  }

  if (ratio <= 0.75) {
    return 1
  }

  return 0
}

const getCyberpsychoStage = (marks: number): string => {
  if (marks >= 7) {
    return "崩坏边缘"
  }

  if (marks >= 5) {
    return "临界"
  }

  if (marks >= 3) {
    return "裂痕"
  }

  if (marks >= 1) {
    return "征兆"
  }

  return "稳定"
}


export function useHumanityMetrics() {
  const safeFormData = useSafeSheetData()
  const store = useCardStore()

  const initialHumanity = getInitialHumanity(safeFormData)
  const autoCyberLoad = useMemo(() => {
    return safeFormData.cards.reduce((total, card) => {
      if (!card?.id) {
        return total
      }

      const latestCard = store.getCardById(card.id) ?? card
      return total + getCyberwareEchoCost(latestCard)
    }, 0)
  }, [safeFormData.cards, store.batches, store.cards, store.initialized])
  const cyberLoadInput = hasManualHumanityValue(safeFormData.humanityCyberLoad)
    ? safeFormData.humanityCyberLoad
    : String(autoCyberLoad)
  const cyberLoad = safeEvaluateExpression(cyberLoadInput)
  const currentHumanityInput = hasManualHumanityValue(safeFormData.humanityCurrent)
    ? safeFormData.humanityCurrent
    : String(initialHumanity - cyberLoad)
  const currentHumanity = safeEvaluateExpression(currentHumanityInput)
  const cyberpsychoMarks = getCyberpsychoMarks(currentHumanity, initialHumanity)
  const cyberpsychoStage = getCyberpsychoStage(cyberpsychoMarks)

  return {
    initialHumanity,
    currentHumanity,
    currentHumanityInput,
    cyberLoad,
    cyberLoadInput,
    cyberpsychoMarks,
    cyberpsychoStage,
  }
}

export function HumanitySection() {
  const setSheetData = useSheetStore((state) => state.setSheetData)
  const {
    initialHumanity,
    currentHumanityInput,
    cyberLoadInput,
    cyberpsychoMarks,
    cyberpsychoStage,
  } = useHumanityMetrics()

  const handleCurrentHumanityChange = (event: ChangeEvent<HTMLInputElement>) => {
    setSheetData({
      humanityCurrent: event.target.value,
    })
  }

  const handleCyberLoadChange = (event: ChangeEvent<HTMLInputElement>) => {
    setSheetData({
      humanityCyberLoad: event.target.value,
    })
  }

  return (
    <div className="w-[126px] h-24 shrink-0 rounded-lg overflow-hidden border border-gray-800 flex flex-col">
      <div className="bg-gray-800 text-white py-1 px-2">
        <div className="text-ms font-bold text-center">人性值</div>
      </div>
      <div className="flex-1 bg-white px-2 pt-[3px] pb-1.5 flex flex-col justify-between">
        <div className="grid grid-cols-[20px_20px_20px_20px] justify-between items-end text-[8px] leading-tight">
          <span className="text-gray-600">初始</span>
          <span className="flex h-4 w-5 translate-y-[4px] items-end justify-center border-b border-transparent pb-0.5 text-sm font-bold leading-none tabular-nums text-gray-800">
            {initialHumanity}
          </span>
          <label htmlFor="humanity-cyber-load" className="text-gray-600">负荷</label>
          <input
            id="humanity-cyber-load"
            type="text"
            value={cyberLoadInput}
            onChange={handleCyberLoadChange}
            className="h-4 w-5 translate-y-[4px] justify-self-center text-center bg-transparent border-b border-gray-400 focus:outline-none text-sm font-bold leading-none tabular-nums text-gray-800 pb-0.5"
          />
        </div>

        <div className="grid grid-cols-[20px_20px_20px_20px] justify-between items-end text-[8px] leading-tight">
          <label htmlFor="humanity-current" className="text-gray-600">当前</label>
          <input
            id="humanity-current"
            type="text"
            value={currentHumanityInput}
            onChange={handleCurrentHumanityChange}
            className="h-4 w-5 translate-y-[4px] justify-self-center text-center bg-transparent border-b border-gray-400 focus:outline-none text-sm font-bold leading-none tabular-nums text-gray-800 pb-0.5"
          />
          <span className="text-gray-600">标记</span>
          <span className="flex h-4 w-5 translate-y-[5px] items-end justify-center border-b border-transparent pb-0.5 text-sm font-bold leading-none tabular-nums text-gray-800">
            {cyberpsychoMarks}
          </span>
        </div>

        <div className="grid w-full grid-cols-[20px_auto] justify-center gap-x-3 pt-0.5 text-[8px] leading-tight">
          <span className="translate-y-[2px] justify-self-start text-gray-600">阶段</span>
          <span className="translate-y-[1px] justify-self-start whitespace-nowrap text-[10px] font-bold tracking-[0.08em] text-gray-800">
            {cyberpsychoStage}
          </span>
        </div>
      </div>
    </div>
  )
}

export function GoldSection() {
  const safeFormData = useSafeSheetData()
  const gold = Array.from({ length: GOLD_SLOT_LIMIT }, (_, index) => Boolean(safeFormData.gold?.[index]))
  const { updateGold } = useSheetStore()

  const handleCheckboxChange = (index: number) => {
    updateGold(index)
  }

  return (
    <div className="py-1">
      <h3 className="text-xs font-bold text-center mb-2">欧元</h3>
      <div className="flex flex-row gap-6 items-end justify-center">
        {/* HANDFULS */}
        <div className="flex flex-col items-center">
          <div className="text-[9px] mb-1">百</div>
          <div className="flex flex-col gap-1">
            <div className="flex gap-2">
              {gold.slice(0, 5).map((checked: boolean, i: number) => (
                <div
                  key={`gold-handful-${i}`}
                  className={`w-4 h-4 border-2 border-gray-800 cursor-pointer rounded-full ${checked ? "bg-gray-800" : "bg-white"
                    }`}
                  onClick={() => handleCheckboxChange(i)}
                ></div>
              ))}
            </div>
            <div className="flex gap-2">
              {gold.slice(5, 10).map((checked: boolean, i: number) => (
                <div
                  key={`gold-handful-${i + 5}`}
                  className={`w-4 h-4 border-2 border-gray-800 cursor-pointer rounded-full ${checked ? "bg-gray-800" : "bg-white"
                    }`}
                  onClick={() => handleCheckboxChange(i + 5)}
                ></div>
              ))}
            </div>
          </div>
        </div>
        {/* BAGS */}
        <div className="flex flex-col items-center">
          <div className="text-[9px] mb-1">千</div>
          <div className="flex flex-col gap-1">
            <div className="flex gap-2">
              {gold.slice(10, 15).map((checked: boolean, i: number) => (
                <div
                  key={`gold-bag-${i + 10}`}
                  className={`w-4 h-4 border-2 border-gray-800 cursor-pointer ${checked ? "bg-gray-800" : "bg-white"
                    }`}
                  onClick={() => handleCheckboxChange(i + 10)}
                ></div>
              ))}
            </div>
            <div className="flex gap-2">
              {gold.slice(15, 20).map((checked: boolean, i: number) => (
                <div
                  key={`gold-bag-${i + 15}`}
                  className={`w-4 h-4 border-2 border-gray-800 cursor-pointer ${checked ? "bg-gray-800" : "bg-white"
                    }`}
                  onClick={() => handleCheckboxChange(i + 15)}
                ></div>
              ))}
            </div>
          </div>
        </div>
        {/* HIGH VALUE */}
        <div className="flex flex-col items-center">
          <div className="text-[9px] mb-1">万</div>
            <div className="grid grid-cols-3 gap-1">
            {gold.slice(20, 26).map((checked: boolean, i: number) => (
              <div
                key={`gold-high-${i + 20}`}
                className={`w-4 h-4 border-2 border-gray-800 cursor-pointer ${checked ? "bg-gray-800" : "bg-white"
                  }`}
                onClick={() => handleCheckboxChange(i + 20)}
              ></div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
