"use client"

import React from "react"
import { useSafeSheetData, useSheetStore } from "@/lib/sheet-store";
import { useAutoResizeFont } from "@/hooks/use-auto-resize-font"

export function ExperienceSection() {
  const safeFormData = useSafeSheetData()
  const { updateExperience, updateExperienceValues } = useSheetStore();
  
  const { getElementProps } = useAutoResizeFont({
    maxFontSize: 14,
    minFontSize: 10,
  })

  const experienceTexts = safeFormData.experience.slice(0, 4)
  const experienceValues = (safeFormData.experienceValues || ["0", "", "", ""]).slice(0, 4)

  return (
    <div className="-mt-0.5 pb-1">
      <h3 className="text-xs font-bold text-center mb-[10px]">经历</h3>

      <div className="grid grid-cols-[52fr_28px_48fr_28px] gap-x-1 gap-y-1">
        {experienceTexts.map((exp: string, i: number) => (
          <React.Fragment key={`exp-${i}`}>
            <input
              type="text"
              name={`experience${i + 1}`}
              value={exp}
              onChange={(e) => {
                updateExperience(i, e.target.value)
              }}
              {...getElementProps(exp, `exp-${i}`, "w-full min-w-0 border-b border-gray-400 p-1 focus:outline-none print-empty-hide")}
            />
            <input
              type="text"
              name={`experienceValue${i + 1}`}
              value={experienceValues[i]}
              onChange={(e) => {
                updateExperienceValues(i, e.target.value)
              }}
              {...getElementProps(experienceValues[i], `exp-value-${i}`, "w-full border border-gray-400 rounded text-center text-xs print-empty-hide")}
              placeholder="#"
            />
          </React.Fragment>
        ))}
      </div>
    </div>
  )
}
