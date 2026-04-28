/**
 * Variant Card Converter
 * 变体卡牌转换器 - 将原始变体卡牌数据转换为标准格式
 */

import { v4 as uuidv4 } from "uuid";
import { CardType, processCardDescription, type StandardCard } from "@/card/card-types";

export const VARIANT_EDITOR_TYPES = ["武器", "护甲", "变体"] as const;
export type VariantEditorType = (typeof VARIANT_EDITOR_TYPES)[number];
export const VARIANT_LEVEL_OPTIONS = ["T1", "T2", "T3", "T4"] as const;
export const VARIANT_WEAPON_ATTRIBUTE_OPTIONS = ["敏捷", "灵巧", "知识", "力量", "本能", "风度"] as const;
export const VARIANT_WEAPON_DAMAGE_TYPE_OPTIONS = ["物理", "能量"] as const;
export const VARIANT_WEAPON_RANGE_OPTIONS = ["近战", "邻近", "近", "远", "极远"] as const;
export const VARIANT_WEAPON_LOAD_OPTIONS = ["单手", "双手"] as const;

const VARIANT_BASE_FIELD_KEYS = [
  "id",
  "名称",
  "类型",
  "imageUrl",
  "hasLocalImage"
] as const;

const VARIANT_GENERIC_FIELD_KEYS = [
  "子类别",
  "等级",
  "效果",
  "简略信息"
] as const;

const VARIANT_WEAPON_FIELD_KEYS = [
  "等级",
  "属性",
  "伤害类型",
  "范围",
  "伤害",
  "负荷",
  "特性名称",
  "描述"
] as const;

const VARIANT_ARMOR_FIELD_KEYS = [
  "等级",
  "伤害阈值",
  "护甲值",
  "特性名称",
  "描述"
] as const;

// 原始变体卡牌数据结构（用户导入的格式）
export interface RawVariantCard {
  id: string;
  名称: string;
  类型: string;          // 变体类型，如 "食物"、"人物" 等
  子类别?: string;       // 子类别，如 "饮料"、"盟友" 等
  等级?: number | string; // 可选的等级
  效果?: string;         // 卡牌效果描述
  imageUrl?: string;     // 图片URL
  hasLocalImage?: boolean;
  简略信息?: {          // 卡牌选择时显示的简要信息（选填）
    item1?: string;
    item2?: string;
    item3?: string;
    item4?: string;
  };
  属性?: string;
  伤害类型?: string;
  范围?: string;
  伤害?: string;
  负荷?: string;
  特性名称?: string;
  描述?: string;
  伤害阈值?: string;
  护甲值?: number;
  [key: string]: any;    // 允许扩展字段
}

function readString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function hasContent(value: unknown): boolean {
  return typeof value === "string" && value.trim() !== "";
}

function normalizeSummary(
  summary: RawVariantCard["简略信息"] | undefined
): NonNullable<RawVariantCard["简略信息"]> {
  return {
    item1: readString(summary?.item1),
    item2: readString(summary?.item2),
    item3: readString(summary?.item3),
    item4: readString(summary?.item4),
  };
}

function normalizeAllowedString(
  value: unknown,
  allowedValues: readonly string[]
): string {
  const normalizedValue = readString(value).trim();
  return allowedValues.includes(normalizedValue) ? normalizedValue : "";
}

function normalizeLevel(
  value: RawVariantCard["等级"],
  editorType: VariantEditorType
): RawVariantCard["等级"] {
  if (editorType === "武器" || editorType === "护甲") {
    if (typeof value === "string") {
      const trimmed = value.trim();
      return VARIANT_LEVEL_OPTIONS.includes(trimmed as (typeof VARIANT_LEVEL_OPTIONS)[number])
        ? trimmed
        : undefined;
    }

    if (typeof value === "number" && Number.isFinite(value)) {
      const normalizedValue = String(value);
      return VARIANT_LEVEL_OPTIONS.includes(normalizedValue as (typeof VARIANT_LEVEL_OPTIONS)[number])
        ? normalizedValue
        : undefined;
    }

    return undefined;
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.max(0, Math.trunc(value));
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (trimmed === "") {
      return undefined;
    }

    const parsed = Number.parseInt(trimmed, 10);
    return Number.isNaN(parsed) ? undefined : Math.max(0, parsed);
  }

  return undefined;
}

function normalizeArmorValue(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.max(0, Math.trunc(value));
  }

  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number.parseInt(value, 10);
    return Number.isNaN(parsed) ? undefined : Math.max(0, parsed);
  }

  return undefined;
}

export function isVariantEditorType(value: unknown): value is VariantEditorType {
  return (
    typeof value === "string" &&
    VARIANT_EDITOR_TYPES.includes(value.trim() as VariantEditorType)
  );
}

export function getVariantEditorType(
  cardOrType: Partial<RawVariantCard> | string | undefined | null
): VariantEditorType {
  if (typeof cardOrType === "string") {
    return isVariantEditorType(cardOrType) ? (cardOrType.trim() as VariantEditorType) : "变体";
  }

  const rawType = typeof cardOrType?.类型 === "string" ? cardOrType.类型.trim() : cardOrType?.类型;
  if (isVariantEditorType(rawType)) {
    return rawType;
  }

  if (
    hasContent(cardOrType?.伤害阈值) ||
    typeof cardOrType?.护甲值 === "number"
  ) {
    return "护甲";
  }

  if (
    hasContent(cardOrType?.属性) ||
    hasContent(cardOrType?.伤害类型) ||
    hasContent(cardOrType?.范围) ||
    hasContent(cardOrType?.伤害) ||
    hasContent(cardOrType?.负荷)
  ) {
    return "武器";
  }

  return "变体";
}

export function getVariantAllowedFields(type: VariantEditorType): readonly string[] {
  if (type === "武器") {
    return [...VARIANT_BASE_FIELD_KEYS, ...VARIANT_WEAPON_FIELD_KEYS];
  }

  if (type === "护甲") {
    return [...VARIANT_BASE_FIELD_KEYS, ...VARIANT_ARMOR_FIELD_KEYS];
  }

  return [...VARIANT_BASE_FIELD_KEYS, ...VARIANT_GENERIC_FIELD_KEYS];
}

export function sanitizeRawVariantCard(
  card: Partial<RawVariantCard> | undefined
): RawVariantCard {
  const editorType = getVariantEditorType(card);
  const originalType = readString(card?.类型).trim();
  const originalSubCategory = readString(card?.子类别);
  const fallbackEffect =
    editorType === "变体" && !hasContent(card?.效果) ? readString(card?.描述) : "";
  const normalizedEffect = readString(card?.效果) || fallbackEffect;
  const normalizedSubCategory =
    editorType === "变体" &&
    originalSubCategory.trim() === "" &&
    originalType !== "" &&
    !isVariantEditorType(originalType)
      ? originalType
      : originalSubCategory;

  const normalizedBase: RawVariantCard = {
    id: readString(card?.id),
    名称: readString(card?.名称),
    类型: editorType,
    imageUrl: readString(card?.imageUrl),
    hasLocalImage: Boolean(card?.hasLocalImage),
  };

  if (editorType === "武器") {
    return {
      ...normalizedBase,
      等级: normalizeLevel(card?.等级, editorType),
      属性: normalizeAllowedString(card?.属性, VARIANT_WEAPON_ATTRIBUTE_OPTIONS),
      伤害类型: normalizeAllowedString(card?.伤害类型, VARIANT_WEAPON_DAMAGE_TYPE_OPTIONS),
      范围: normalizeAllowedString(card?.范围, VARIANT_WEAPON_RANGE_OPTIONS),
      伤害: readString(card?.伤害),
      负荷: normalizeAllowedString(card?.负荷, VARIANT_WEAPON_LOAD_OPTIONS),
      特性名称: readString(card?.特性名称),
      描述: readString(card?.描述),
    };
  }

  if (editorType === "护甲") {
    return {
      ...normalizedBase,
      等级: normalizeLevel(card?.等级, editorType),
      伤害阈值: readString(card?.伤害阈值),
      护甲值: normalizeArmorValue(card?.护甲值),
      特性名称: readString(card?.特性名称),
      描述: readString(card?.描述),
    };
  }

  return {
    ...normalizedBase,
    子类别: normalizedSubCategory,
    等级: normalizeLevel(card?.等级, editorType),
    效果: normalizedEffect,
    简略信息: normalizeSummary(card?.简略信息),
  };
}

export function createDefaultVariantCard(cardId: string): RawVariantCard {
  return sanitizeRawVariantCard({
    id: cardId,
    名称: "新物品",
    类型: "变体",
    效果: "",
    子类别: "",
    等级: undefined,
    简略信息: {
      item1: "",
      item2: "",
      item3: "",
      item4: "",
    },
  });
}

/**
 * 变体卡牌转换器类
 */
export class VariantCardConverter {
  /**
   * 将原始变体卡牌转换为标准格式
   */
  toStandard(card: RawVariantCard): StandardCard {
    return {
      standarized: true,
      id: card.id || uuidv4(),
      name: card.名称,
      type: CardType.Variant,
      class: card.子类别 || "",              // 将 "子类别" 映射到 class 字段，确保为字符串
      level: card.等级,
      description: processCardDescription(card.效果 || card.描述 || "") || "",
      imageUrl: card.imageUrl || "",
      hasLocalImage: card.hasLocalImage,
      headerDisplay: card.名称,
      cardSelectDisplay: {
        item1: card.简略信息?.item1 || "",
        item2: card.简略信息?.item2 || "",
        item3: card.简略信息?.item3 || "",
        item4: card.简略信息?.item4 || "",
      },
      // 添加变体卡牌信息，保存真实类型
      variantSpecial: {
        realType: card.类型,           // 保存真实卡牌类型（如"食物"、"人物"）
        subCategory: card.子类别,      // 保存子类别信息
        属性: card.属性,
        伤害类型: card.伤害类型,
        范围: card.范围,
        伤害: card.伤害,
        负荷: card.负荷,
        特性名称: card.特性名称,
        描述: card.描述 || card.效果,
        伤害阈值: card.伤害阈值,
        护甲值: card.护甲值
      }
    };
  }
}

export const variantCardConverter = new VariantCardConverter();
