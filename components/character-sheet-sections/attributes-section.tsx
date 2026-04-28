"use client"

import type { SheetData, AttributeValue } from "@/lib/sheet-data"
import { useSheetStore } from "@/lib/sheet-store";

export function AttributesSection() {
  const { sheetData: formData, updateAttribute, toggleAttributeChecked } = useSheetStore();

  const handleAttributeValueChange = (attribute: keyof SheetData, value: string) => {
    updateAttribute(attribute, value)
  }

  const handleBooleanChange = (field: keyof SheetData) => {
    toggleAttributeChecked(field)
  }

  return (
    <div className="mt-2.5">
      <div className="grid grid-cols-3 gap-x-2 gap-y-1">
        {[
          { name: "敏捷", key: "agility", skills: ["冲刺", "跳跃", "机动"] },
          { name: "力量", key: "strength", skills: ["举起", "猛击", "擒抱"] },
          { name: "灵巧", key: "finesse", skills: ["控制", "隐藏", "巧手"] },
          { name: "本能", key: "instinct", skills: ["感知", "察觉", "导航"] },
          { name: "风度", key: "presence", skills: ["魅力", "表演", "欺骗"] },
          { name: "知识", key: "knowledge", skills: ["回忆", "分析", "理解"] },
        ].map((attr) => (
          <div key={attr.name} className="flex flex-col items-center">
            <div className="flex items-center justify-between w-full bg-gray-800 text-white px-1 rounded-t-md py-0.5">
              <div className="text-[12px] font-bold">{attr.name}</div>
              {(() => {
                const attrValue = formData[attr.key as keyof typeof formData];
                function isAttributeValue(val: unknown): val is AttributeValue {
                  return val !== undefined && typeof val === "object" && val !== null && "checked" in val && "value" in val;
                }

                return (
                  <div
                    className={`w-2 h-2 rounded-full border border-white cursor-pointer ${isAttributeValue(attrValue) && attrValue.checked ? "bg-gray-800" : "bg-white"
                      }`}
                    onClick={() => handleBooleanChange(attr.key as keyof SheetData)}
                  >
                  </div>
                );
              })()}
            </div>
            <div className="w-full h-14 relative">
              <div className="absolute inset-0 rounded-b-md bg-white border border-t-0 border-gray-800 flex flex-col items-center justify-center">
                <input
                  type="text"
                  name={attr.key}
                  value={(() => {
                    const attrValue = formData[attr.key as keyof typeof formData];
                    function isAttributeValue(val: unknown): val is AttributeValue {
                      return val !== undefined && typeof val === "object" && val !== null && "checked" in val && "value" in val;
                    }
                    return isAttributeValue(attrValue) ? attrValue.value : "";
                  })()}
                  onChange={(e) => handleAttributeValueChange(attr.key as keyof SheetData, e.target.value)}
                  className="w-16 text-center bg-transparent border-b border-gray-400 focus:outline-none text-lg font-bold text-gray-800 print-empty-hide"
                />
                <div className="text-[8px] text-center text-gray-600">{attr.skills.join(", ")}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
