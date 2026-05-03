"use client"

import { CardType, StandardCard, ExtendedStandardCard, CardSource } from "@/card/card-types"
import { getCardTypeName } from "@/card/card-ui-config"
import { isVariantCard, getVariantRealType } from "@/card/card-types"
import { getBatchName } from "@/card"
import { getStandardCardById } from "@/card"
import React, { useState, useEffect, useRef } from "react"
import { CardMarkdown } from "@/components/ui/card-markdown"
import { compactDisplayItems, formatDomainCardLoadLabel, formatDomainCardPrice } from "@/lib/domain-card-price"

// Helper function to get display type name, moved outside of the component
const getDisplayTypeName = (card: StandardCard) => {
    if (isVariantCard(card)) {
        const realType = getVariantRealType(card);
        if (realType) {
            return getCardTypeName(realType);
        }
    }
    return getCardTypeName(card.type);
};

// Helper function to get card type border color hex value
const getCardTypeBorderColorHex = (cardType: string): string => {
    if (cardType.includes("domain")) return "#f87171"; // red-400
    if (cardType.includes("profession")) return "#60a5fa"; // blue-400
    if (cardType.includes("ancestry")) return "#9ca3af"; // gray-400
    if (cardType.includes("subclass")) return "#c084fc"; // purple-400
    if (cardType.includes("community")) return "#2dd4bf"; // teal-400
    return "#34d399"; // green-400, variant default
};

// Helper function to get card source display name
const getCardSourceDisplayName = (card: StandardCard | ExtendedStandardCard): string => {
    // 检查是否有来源信息
    const extCard = card as ExtendedStandardCard;
    if (extCard.source !== undefined) {
        if (extCard.source === CardSource.BUILTIN) {
            return "内置卡包";
        }
        if (extCard.source === CardSource.CUSTOM) {
            // 优先使用 batchName
            if (extCard.batchName) {
                return extCard.batchName;
            }
            // 其次使用 batchId 获取名称
            if (extCard.batchId) {
                const batchName = getBatchName(extCard.batchId);
                if (batchName) {
                    return batchName;
                }
                return extCard.batchId;
            }
            return "自定义卡包";
        }
        if (extCard.source === CardSource.ADHOC) {
            return "角色自定义";
        }
        return "内置卡包";
    }

    // 如果没有来源信息，尝试通过ID查找
    const matchedCard = getStandardCardById(card.id);
    if (matchedCard && (matchedCard as ExtendedStandardCard).source !== undefined) {
        const matched = matchedCard as ExtendedStandardCard;
        if (matched.source === CardSource.BUILTIN) {
            return "内置卡包";
        }
        if (matched.source === CardSource.CUSTOM) {
            return matched.batchName || matched.batchId || "自定义卡包";
        }
        if (matched.source === CardSource.ADHOC) {
            return "角色自定义";
        }
    }

    return "未知来源";
};

interface SelectableCardProps {
    card: ExtendedStandardCard | StandardCard
    onClick: (cardId: string) => void;
    isSelected: boolean;
    showSource?: boolean; // 是否显示来源，默认为 true
    autoHeight?: boolean;
    showFavoriteButton?: boolean;
    isFavorite?: boolean;
    onFavoriteToggle?: () => void;
}

export function SelectableCard({ card, onClick, isSelected, showSource = true, autoHeight = false, showFavoriteButton = false, isFavorite = false, onFavoriteToggle }: SelectableCardProps) {
    const [_isHovered, setIsHovered] = useState(false)
    const [_isAltPressed, setIsAltPressed] = useState(false)
    const [cardSource, setCardSource] = useState<string>("加载中...")
    const cardRef = useRef<HTMLDivElement | null>(null)

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Alt") {
                setIsAltPressed(true)
            }
        }

        const handleKeyUp = (e: KeyboardEvent) => {
            if (e.key === "Alt") {
                setIsAltPressed(false)
            }
        }

        window.addEventListener("keydown", handleKeyDown)
        window.addEventListener("keyup", handleKeyUp)

        return () => {
            window.removeEventListener("keydown", handleKeyDown)
            window.removeEventListener("keyup", handleKeyUp)
        }
    }, [])

    // 获取卡牌来源信息
    useEffect(() => {
        if (!showSource) return;

        const source = getCardSourceDisplayName(card);
        setCardSource(source);
    }, [card.id, showSource, card])

    if (!card) {
        console.warn("[SelectableCard] Card prop is null or undefined.")
        return null
    }
    const cardId = card.id || `temp-id-${Math.random().toString(36).substring(2, 9)}`

    // Prepare derived values for display, handling potential undefined fields and fallbacks
    const displayName = card.name || "未命名卡牌";
    const displayDescription = card.description || "无描述。";

    // Get display items, providing empty strings as fallbacks
    const displayItem1 = card.cardSelectDisplay?.item1 || "";
    const displayItem2 = card.cardSelectDisplay?.item2 || "";
    const displayItem3 = card.type === CardType.Domain
        ? formatDomainCardLoadLabel(card.cardSelectDisplay?.item3) || ""
        : card.cardSelectDisplay?.item3 || "";
    const displayItem4 = card.cardSelectDisplay?.item4 || "";
    const domainPriceLabel = card.type === CardType.Domain ? formatDomainCardPrice(card.level) : null;

    // 构建属性徽章数组（只包含非空项）
    let badges = compactDisplayItems([displayItem1, displayItem2, displayItem3, displayItem4]);

    // 子职业卡特殊处理：只保留主职和等级
    if (card.type === CardType.Subclass) {
        badges = compactDisplayItems([displayItem1, displayItem2]);
    }

    // 领域卡特殊处理：为领域名添加"领域"后缀
    if (card.type === CardType.Domain && displayItem1) {
        const domainName = `${displayItem1}领域`;
        badges = compactDisplayItems([domainName, displayItem2, displayItem3, domainPriceLabel, displayItem4]);
    }

    // 根据卡牌类型提取右上角关键信息（视觉锚点）
    let rightAnchor: string | null = null;
    switch (card.type) {
        case CardType.Domain:
            // 领域卡：强调等级
            rightAnchor = badges.find(b => b.startsWith('LV.')) || null;
            break;
        case CardType.Subclass:
            // 子职业卡：不提取锚点，显示类型标签（"子职业"）
            rightAnchor = null;
            break;
        case CardType.Ancestry:
            // 种族卡：不提取锚点，显示类型标签（"种族"），种族名称保留在属性徽章中
            rightAnchor = null;
            break;
        default:
            // 职业卡、社群卡：不提取锚点，显示类型标签
            rightAnchor = null;
    }

    // 过滤掉已提取的锚点信息，避免重复显示
    const otherBadges = rightAnchor ? badges.filter(b => b !== rightAnchor) : badges;

    return (
        <div
            ref={cardRef}
            key={cardId}
            className={`border-2 rounded-lg bg-white p-3 sm:p-4 flex flex-col gap-0 shadow-md hover:shadow-lg transition-shadow relative cursor-pointer ${autoHeight ? 'mb-2 inline-block w-full max-w-none h-auto min-h-0 [break-inside:avoid]' : 'w-full max-w-72 h-full min-h-[280px] sm:min-h-[350px] break-inside-avoid'} ${isSelected ? 'ring-2 ring-blue-500' : ''}`}
            onClick={() => onClick(cardId)}
            onMouseEnter={() => setIsHovered(false)}
            onMouseLeave={() => {
                setIsHovered(false)
                setIsAltPressed(false)
            }}
        >
            {/* 标题区 */}
            <div className="flex items-start justify-between gap-2 mb-1.5">
                <h3 className="min-w-0 flex-1 text-base font-bold leading-tight text-gray-900 sm:text-xl" title={displayName}>
                    {displayName}
                </h3>

                <div className="flex items-start gap-1 flex-shrink-0">
                    {/* 右上角：优先显示关键锚点（小标签），否则显示类型标签 */}
                    <span className="whitespace-nowrap bg-gray-100 px-2 py-0.5 text-[10px] text-gray-600 flex-shrink-0 sm:text-sm">
                        {rightAnchor || getDisplayTypeName(card)}
                    </span>
                    {showFavoriteButton ? (
                        <button
                            type="button"
                            className="ml-1 text-amber-500 transition hover:text-amber-600"
                            onClick={(event) => {
                                event.stopPropagation();
                                onFavoriteToggle?.();
                            }}
                            aria-label={isFavorite ? '取消收藏领域卡' : '收藏领域卡'}
                        >
                            {isFavorite ? '★' : '☆'}
                        </button>
                    ) : null}
                </div>
            </div>

            {/* 属性徽章区 */}
            {otherBadges.length > 0 && (
                <div className="pb-3">
                    <div className="flex flex-wrap items-center gap-1 text-[10px] sm:gap-2 sm:text-xs">
                        {otherBadges.map((badge, index) => (
                            <React.Fragment key={index}>
                                {index > 0 && <span className="text-gray-300">•</span>}
                                <span className="text-gray-600">
                                    {badge}
                                </span>
                            </React.Fragment>
                        ))}
                    </div>
                    <div className="w-1/2 h-px mt-1.5" style={{
                        background: `linear-gradient(to right, ${getCardTypeBorderColorHex(card.type)}, transparent)`
                    }}></div>
                </div>
            )}

            {/* 描述区 */}
            <div className={`${autoHeight ? 'pt-2 text-left text-xs leading-snug text-gray-700 sm:pt-3 sm:text-sm sm:leading-loose' : 'flex-1 overflow-hidden pt-2 text-left text-xs leading-snug text-gray-700 sm:pt-3 sm:text-sm sm:leading-loose'}`}>
                <CardMarkdown>{displayDescription}</CardMarkdown>
            </div>

            {/* 底部区域（hint + 来源信息） */}
            {((card.type !== CardType.Profession && card.hint) || showSource) && (
                <div className={`${autoHeight ? 'text-xs text-gray-500 border-t border-gray-200 pt-2 mt-2 space-y-1' : 'text-xs text-gray-500 border-t border-gray-200 pt-2 mt-auto space-y-1'}`}>
                    {card.type !== CardType.Profession && card.hint && (
                        <div className="italic">{card.hint}</div>
                    )}
                    {showSource && (
                        <div className="text-right text-[10px] text-gray-400">{cardSource}</div>
                    )}
                </div>
            )}
        </div>
    )
}
