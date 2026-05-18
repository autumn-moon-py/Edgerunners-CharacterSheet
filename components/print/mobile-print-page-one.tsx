"use client"

import ReactMarkdown from "react-markdown"
import { formatEquipmentPrice, getArmorPrice, getWeaponPrice } from "@/lib/equipment-price"
import { getInitialHumanity } from "@/lib/humanity-metrics"
import { useSafeSheetData } from "@/lib/sheet-store"
import { getProficiencyCount } from "@/lib/proficiency"

function MobilePrintSection({
  title,
  titleRight,
  children,
}: {
  title: string
  titleRight?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <section className="rounded-[3px] border border-gray-200 bg-white p-2 shadow-sm">
      <div className="mb-2 flex items-center justify-between gap-3">
        <div className="pl-[3px] text-base font-semibold text-gray-900">{title}</div>
        {titleRight}
      </div>
      <div className="space-y-2">{children}</div>
    </section>
  )
}

function MobilePrintField({ label, value, centered = false }: { label: string; value?: string; centered?: boolean }) {
  return (
    <div className="space-y-1">
      <div className="pl-[3px] text-xs font-medium uppercase tracking-[0.12em] text-gray-500">{label}</div>
      <div className={`flex h-10 items-center rounded-[3px] border border-gray-300 bg-white px-2 text-sm text-gray-900 ${centered ? 'justify-center text-center' : ''}`}>{value || ""}</div>
    </div>
  )
}

function MobilePrintStat({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-[3px] border border-gray-200 bg-gray-50 px-1.5 py-1.5">
      <div className="mb-1 pl-[3px] text-xs font-medium uppercase tracking-[0.12em] text-gray-500">{label}</div>
      {children}
    </div>
  )
}

export function MobilePrintPageOne() {
  const formData = useSafeSheetData()
  const professionCard = formData.cards?.[0]
  const proficiencyCount = getProficiencyCount(formData.proficiency)
  const initialHumanity = getInitialHumanity(formData)
  const hpValue = String(formData.hp?.filter(Boolean).length || 0)
  const hpMaxValue = String(formData.hpMax ?? professionCard?.professionSpecial?.["起始生命"] ?? 6)
  const stressValue = String(formData.stress?.filter(Boolean).length || 0)
  const stressMaxValue = String(formData.stressMax ?? 6)
  const primaryWeaponPriceLabel = formatEquipmentPrice(
    getWeaponPrice({ 名称: formData.primaryWeaponName, 特性名称: formData.primaryWeaponFeature })
  )
  const secondaryWeaponPriceLabel = formatEquipmentPrice(
    getWeaponPrice({ 名称: formData.secondaryWeaponName, 特性名称: formData.secondaryWeaponFeature })
  )
  const armorPriceLabel = formatEquipmentPrice(getArmorPrice({ 名称: formData.armorName, 特性名称: formData.armorFeature }))

  return (
    <div className="space-y-2">
      <MobilePrintSection title="角色身份">
        <MobilePrintField label="职业" value={formData.professionRef?.name} />
        <div className="grid grid-cols-[1fr_112px] gap-2">
          <MobilePrintField label="名称" value={formData.name} />
          <MobilePrintField label="等级" value={formData.level} centered />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <MobilePrintField label="社群" value={formData.communityRef?.name} />
          <MobilePrintField label="子职业" value={formData.subclassRef?.name} />
        </div>
      </MobilePrintSection>

      <MobilePrintSection title="职业特性">
        <div className="prose prose-sm max-w-none rounded-[3px] border border-gray-200 bg-gray-50 p-2 text-gray-700 prose-headings:mb-1 prose-p:mt-1 prose-p:mb-1">
          <ReactMarkdown>{professionCard?.description || ""}</ReactMarkdown>
        </div>
      </MobilePrintSection>

      <MobilePrintSection title="生存概览">
        <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
          <MobilePrintStat label="闪避"><div className="rounded-[3px] border border-gray-300 bg-white px-2 py-2 text-center text-sm text-gray-900">{formData.evasion || ""}</div></MobilePrintStat>
          <MobilePrintStat label="护甲槽"><div className="rounded-[3px] border border-gray-300 bg-white px-2 py-2 text-center text-sm text-gray-900">{formData.armorValue || formData.armorBaseScore || ""}</div></MobilePrintStat>
          <MobilePrintStat label="HP"><div className="rounded-[3px] border border-gray-300 bg-white px-2 py-2 text-center text-sm text-gray-900">{hpValue}/{hpMaxValue}</div></MobilePrintStat>
          <MobilePrintStat label="压力"><div className="rounded-[3px] border border-gray-300 bg-white px-2 py-2 text-center text-sm text-gray-900">{stressValue}/{stressMaxValue}</div></MobilePrintStat>
          <MobilePrintStat label="轻度伤害"><div className="rounded-[3px] border border-gray-300 bg-white px-2 py-2 text-center text-sm text-gray-900">{formData.minorThreshold || ""}</div></MobilePrintStat>
          <MobilePrintStat label="重度伤害"><div className="rounded-[3px] border border-gray-300 bg-white px-2 py-2 text-center text-sm text-gray-900">{formData.majorThreshold || ""}</div></MobilePrintStat>
          <MobilePrintStat label="初始人性"><div className="rounded-[3px] border border-gray-300 bg-white px-2 py-2 text-center text-sm text-gray-900">{initialHumanity}</div></MobilePrintStat>
          <MobilePrintStat label="义体负荷"><div className="rounded-[3px] border border-gray-300 bg-white px-2 py-2 text-center text-sm text-gray-900">{formData.humanityCyberLoad || ""}</div></MobilePrintStat>
          <MobilePrintStat label="当前人性"><div className="rounded-[3px] border border-gray-300 bg-white px-2 py-2 text-center text-sm text-gray-900">{formData.humanityCurrent || ""}</div></MobilePrintStat>
          <MobilePrintStat label="精神状态"><div className="rounded-[3px] border border-gray-300 bg-white px-2 py-2 text-center text-sm text-gray-900">稳定</div></MobilePrintStat>
        </div>
      </MobilePrintSection>

      <MobilePrintSection title="属性">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {[
            { name: "敏捷", key: "agility" },
            { name: "力量", key: "strength" },
            { name: "灵巧", key: "finesse" },
            { name: "本能", key: "instinct" },
            { name: "风度", key: "presence" },
            { name: "知识", key: "knowledge" },
          ].map((attr) => {
            const attrValue = formData[attr.key as keyof typeof formData]
            const currentValue = typeof attrValue === "object" && attrValue && "value" in attrValue && typeof attrValue.value === "string" ? attrValue.value : ""
            return (
              <div key={attr.key} className="rounded-[3px] border border-gray-200 bg-gray-50 p-[5px]">
                <div className="mb-1 flex items-center justify-between">
                  <div className="text-sm font-semibold text-gray-900">{attr.name}</div>
                </div>
                <div className="rounded-[3px] border border-gray-300 bg-white px-2 py-2 text-center text-sm text-gray-900">{currentValue}</div>
              </div>
            )
          })}
        </div>
      </MobilePrintSection>

      <MobilePrintSection
        title="战斗装备"
        titleRight={
          <div className="flex items-center gap-2">
            <div className="pl-[3px] text-xs font-medium text-gray-900">熟练度</div>
            <div className="flex h-7 w-12 items-center justify-center rounded-[3px] border border-gray-300 bg-white px-1 text-center text-sm font-normal text-gray-900">
              {proficiencyCount}
            </div>
          </div>
        }
      >

        <div className="rounded-[3px] border border-gray-200 bg-gray-50 p-1.5">
          <div className="mb-2 text-sm font-semibold text-gray-900">主武器</div>
          <div className="grid grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] gap-1.5">
            <MobilePrintField label="名称" value={formData.primaryWeaponName} />
            <MobilePrintField label="基本信息" value={formData.primaryWeaponTrait} />
          </div>
          <div className="mt-2 grid gap-2">
            {primaryWeaponPriceLabel ? <MobilePrintField label="价格" value={primaryWeaponPriceLabel} /> : null}
            <MobilePrintField label="伤害骰" value={formData.primaryWeaponDamage} />
            {formData.primaryWeaponFeature?.trim() ? <MobilePrintField label="特性" value={formData.primaryWeaponFeature} /> : null}
          </div>
        </div>

        <div className="rounded-[3px] border border-gray-200 bg-gray-50 p-1.5">
          <div className="mb-2 text-sm font-semibold text-gray-900">副武器</div>
          <div className="grid grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] gap-1.5">
            <MobilePrintField label="名称" value={formData.secondaryWeaponName} />
            <MobilePrintField label="基本信息" value={formData.secondaryWeaponTrait} />
          </div>
          <div className="mt-2 grid gap-2">
            {secondaryWeaponPriceLabel ? <MobilePrintField label="价格" value={secondaryWeaponPriceLabel} /> : null}
            <MobilePrintField label="伤害骰" value={formData.secondaryWeaponDamage} />
            {formData.secondaryWeaponFeature?.trim() ? <MobilePrintField label="特性" value={formData.secondaryWeaponFeature} /> : null}
          </div>
        </div>

        <div className="rounded-[3px] border border-gray-200 bg-gray-50 p-1.5">
          <div className="mb-2 text-sm font-semibold text-gray-900">护甲</div>
          <div className="grid grid-cols-[minmax(0,1.2fr)_72px_88px] gap-1.5">
            <MobilePrintField label="名称" value={formData.armorName} />
            <MobilePrintField label="护甲值" value={formData.armorBaseScore} />
            <MobilePrintField label="阈值" value={formData.armorThreshold} />
          </div>
          <div className="mt-2 grid gap-2">
            {armorPriceLabel ? <MobilePrintField label="价格" value={armorPriceLabel} /> : null}
            {formData.armorFeature?.trim() ? <MobilePrintField label="特性" value={formData.armorFeature} /> : null}
          </div>
        </div>
      </MobilePrintSection>

      <MobilePrintSection title="资源与经历">
        <div className="rounded-[3px] border border-gray-200 bg-gray-50 p-1.5">
          <div className="text-center text-sm font-semibold text-gray-900">希望</div>
          <div className="mt-2 flex items-center justify-center gap-2 text-sm text-gray-900">{formData.hope}/{formData.hopeMax || 6}</div>
        </div>
        <div className="grid gap-2 lg:grid-cols-2">
          <div className="rounded-[3px] border border-gray-200 bg-gray-50 p-1.5">
            <div className="mb-2 text-sm font-semibold text-gray-900">经历</div>
            <div className="space-y-2">
              {formData.experience.slice(0, 4).map((exp, index) => (
                <div key={`print-exp-${index}`} className="grid grid-cols-[1fr_72px] gap-2">
                  <div className="rounded-[3px] border border-gray-300 bg-white px-2 py-2 text-sm text-gray-900">{exp}</div>
                  <div className="rounded-[3px] border border-gray-300 bg-white px-2 py-2 text-center text-sm text-gray-900">{formData.experienceValues?.[index] || ""}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-[3px] border border-gray-200 bg-gray-50 p-1.5">
            <div className="mb-2 text-sm font-semibold text-gray-900">库存</div>
            <div className="rounded-[3px] border border-gray-300 bg-white px-2 py-2 text-sm leading-5 text-gray-900 whitespace-pre-wrap">
              {formData.inventory.filter((item) => item.trim() !== "").join("\n")}
            </div>
          </div>
        </div>
      </MobilePrintSection>
    </div>
  )
}
