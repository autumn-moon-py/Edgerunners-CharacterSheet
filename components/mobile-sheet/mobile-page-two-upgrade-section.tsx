"use client"

import { UpgradeSection } from "@/components/character-sheet-page-two-sections/upgrade-section"
import { useSafeSheetData } from "@/lib/sheet-store"

export function MobilePageTwoUpgradeSection() {
  const formData = useSafeSheetData()

  return (
    <div className="space-y-2" data-mobile-upgrade-section>
      <div className="pl-[3px] text-sm font-semibold text-gray-900">升级区</div>

      <div className="space-y-2" data-mobile-upgrade-cards>
        <UpgradeSection
          tier={1}
          title="T2 等级 2-4"
          description="当你到达2级时：获得一项额外+2经历，人性值+5，熟练度标记+1。"
          formData={formData}
        />
        <UpgradeSection
          tier={2}
          title="T3 等级 5-7"
          description="当你到达5级时：获得一项额外+2经历，人性值+10，清除所有属性升级标记，熟练度标记+1。"
          formData={formData}
        />
        <UpgradeSection
          tier={3}
          title="T4 等级 8-10"
          description="当你到达8级时：获得一项额外+2经历，人性值+15，清除所有属性升级标记，熟练度标记+1。"
          formData={formData}
        />
      </div>

      <style jsx global>{`
        [data-mobile-upgrade-cards] {
          display: grid;
          gap: 8px;
        }

        [data-mobile-upgrade-cards] > div {
          border-radius: 3px;
          box-shadow: none;
        }

        [data-mobile-upgrade-cards] > div > div:first-child {
          padding: 4px 6px;
          font-size: 13px;
          line-height: 1.2;
        }

        [data-mobile-upgrade-cards] > div > div:nth-child(2) {
          padding: 4px 6px;
          font-size: 10px;
          line-height: 1.35;
        }

        [data-mobile-upgrade-cards] > div > div:last-child {
          padding: 6px;
        }

        [data-mobile-upgrade-cards] p {
          margin-bottom: 6px;
          font-size: 11px;
          line-height: 1.45;
        }

        [data-mobile-upgrade-cards] .space-y-1 > :not([hidden]) ~ :not([hidden]) {
          margin-top: 4px;
        }

        [data-mobile-upgrade-cards] .text-\[10px\] {
          font-size: 11px !important;
          line-height: 1.45 !important;
        }

        [data-mobile-upgrade-cards] .w-3.h-3 {
          width: 14px;
          height: 14px;
        }

        [data-mobile-upgrade-cards] .ml-2 {
          margin-left: 6px;
        }

        [data-mobile-upgrade-cards] .rounded-md {
          border-radius: 3px;
        }
      `}</style>
    </div>
  )
}
