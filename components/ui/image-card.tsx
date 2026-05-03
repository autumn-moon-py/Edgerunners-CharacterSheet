"use client"

import { CardType, StandardCard, ExtendedStandardCard } from "@/card/card-types"
import { CardSource } from "@/card/card-types"
import { getBatchName } from "@/card"
import { getCardTypeName } from "@/card/card-ui-config"
import { isVariantCard, getVariantRealType } from "@/card/card-types"
import { getStandardCardById } from "@/card"
import React, { useState, useEffect, useRef } from "react"
import Image from "next/image"
import { getCardImageUrl } from "@/lib/utils"
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

    // 领域卡特殊处理：只显示领域名称，等级通过徽章显示
    if (card.type === CardType.Domain) {
        const domainName = card.class || '未知';
        return `${domainName}领域`;
    }

    return getCardTypeName(card.type);
};

// Helper function to get card source display name (optimized)
const getCardSourceDisplayName = (card: StandardCard | ExtendedStandardCard): string => {
    // 如果已经有来源信息，直接使用
    if (hasSourceInfo(card)) {
        if (card.source === CardSource.BUILTIN) {
            return "内置卡包";
        }
        if (card.source === CardSource.CUSTOM) {
            // 如果已经有 batchName，直接使用
            if (card.batchName) {
                return card.batchName;
            }
            // 如果没有 batchName 但有 batchId，通过 getBatchName 获取名称
            if (card.batchId) {
                const batchName = getBatchName(card.batchId);
                if (batchName) {
                    return batchName;
                }
                return card.batchId;
            }
            return "自定义卡包";
        }
        if (card.source === CardSource.ADHOC) {
            return "角色自定义";
        }
        return "内置卡包";
    }

    // 使用优化的同步查找方法
    const matchedCard = getStandardCardById(card.id);
    if (matchedCard && hasSourceInfo(matchedCard)) {
        if (matchedCard.source === CardSource.BUILTIN) {
            return "内置卡包";
        }
        if (matchedCard.source === CardSource.CUSTOM) {
            return matchedCard.batchName || matchedCard.batchId || "自定义卡包";
        }
        if (matchedCard.source === CardSource.ADHOC) {
            return "角色自定义";
        }
    }

    // 如果找不到匹配的卡牌
    return "未知来源";
};

// 辅助函数：检查卡牌是否有来源信息
const hasSourceInfo = (card: any): card is ExtendedStandardCard => {
    return 'source' in card && card.source !== undefined;
};

interface ImageCardProps {
    card: ExtendedStandardCard | StandardCard
    onClick: (cardId: string) => void;
    isSelected: boolean;
    showSource?: boolean; // 是否显示来源，默认为 true
    priority?: boolean; // 是否优先加载图片
    refreshTrigger?: number; // 用于手动触发刷新动画
    autoHeight?: boolean;
    showFavoriteButton?: boolean;
    isFavorite?: boolean;
    onFavoriteToggle?: () => void;
}

export function ImageCard({ card, onClick, isSelected, showSource = true, priority = false, refreshTrigger, autoHeight = false, showFavoriteButton = false, isFavorite = false, onFavoriteToggle }: ImageCardProps) {
    const [_isHovered, setIsHovered] = useState(false)
    const [_isAltPressed, setIsAltPressed] = useState(false)
    const [cardSource, setCardSource] = useState<string>("加载中...")
    const [_imageLoaded, setImageLoaded] = useState(false)
    const [imageError, setImageError] = useState(false)
    const [imageSrc, setImageSrc] = useState<string | null>(null)
    const [cardScale, setCardScale] = useState('scale(1)')
    const cardRef = useRef<HTMLDivElement | null>(null)

    // 当卡牌更换时，重置图片加载状态并获取图片URL
    useEffect(() => {
        setImageLoaded(false);
        setImageError(false);

        // 轻微缩放动画
        setCardScale('scale(0.99)');

        // 获取图片URL (异步支持IndexedDB)
        const loadImageUrl = async () => {
            try {
                const { getCardImageUrlAsync } = await import('@/lib/utils');
                const url = await getCardImageUrlAsync(card, false);
                setImageSrc(url);
            } catch (error) {
                console.error('[ImageCard] Failed to load image URL:', error);
                // Fallback to sync version
                const url = getCardImageUrl(card, false);
                setImageSrc(url);
            }
        };

        loadImageUrl();

        // 100ms后恢复正常大小
        const timer = setTimeout(() => {
            setCardScale('scale(1)');
        }, 100);

        return () => clearTimeout(timer);
    }, [card]); // 移除 imageError 依赖，避免无限循环

    // 当图片加载失败时，获取备用图片URL
    useEffect(() => {
        if (imageError && !imageSrc?.includes('empty-card.webp')) {
            const url = getCardImageUrl(card, true); // 传递错误状态以获取默认图片
            setImageSrc(url);
        }
    }, [imageError, card, imageSrc]);

    // 监听手动刷新触发器
    useEffect(() => {
        if (refreshTrigger) {
            // 触发缩放动画反馈
            setCardScale('scale(0.99)');

            const timer = setTimeout(() => {
                setCardScale('scale(1)');
            }, 100);

            return () => clearTimeout(timer);
        }
    }, [refreshTrigger]);

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
    }, [card.id, showSource]);

    if (!card) {
        console.warn("[ImageCard] Card prop is null or undefined.")
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
    const showDomainLevelBadge = card.type === CardType.Domain && typeof card.level === 'number' && card.level > 0;

    // 根据卡牌类型过滤需要显示的标签信息（去重逻辑）
    const getFilteredDisplayItems = (): string[] => {
        const items = compactDisplayItems([displayItem1, displayItem2, displayItem3, displayItem4]);

        switch (card.type) {
            case CardType.Domain:
                // 领域卡：保留领域名、属性、回想和价格，移除等级（item4，因为已经在徽章显示）
                return compactDisplayItems([displayItem1, displayItem2, displayItem3, domainPriceLabel]);

            case CardType.Profession:
                // 职业卡：保留所有（两个领域）
                return items;

            case CardType.Subclass:
                return compactDisplayItems([displayItem1, displayItem2]);

            case CardType.Ancestry:
                // 种族卡：保留所有（种族名）
                return items;

            case CardType.Community:
                // 社群卡：保留所有（特性）
                return items;

            default:
                return items;
        }
    };

    const filteredItems = getFilteredDisplayItems();

    return (
        <div
            ref={cardRef}
            key={cardId}
            className={`group relative flex w-full max-w-sm flex-col overflow-hidden rounded-xl bg-white shadow-md transition-all duration-300 ease-in-out hover:shadow-xl ${autoHeight ? 'min-h-0' : 'min-h-[420px] sm:min-h-[520px]'} ${isSelected ? 'ring-2 ring-blue-500' : 'border'}`}
            style={{
                transform: cardScale,
                transition: 'transform 100ms ease-out'
            }}
            onClick={() => onClick(cardId)}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => {
                setIsHovered(false)
                setIsAltPressed(false)
            }}
        >
            {/* Image Container */}
            <div className="relative w-full aspect-[1.4] overflow-hidden">
                {imageSrc && (
                    <Image
                        src={imageSrc}
                        alt={displayName}
                        width={300}
                        height={420}
                        className="w-full h-auto object-cover transition-transform duration-300 ease-in-out group-hover:scale-105"
                        priority={priority}
                        sizes="(max-width: 768px) 50vw, (max-width: 1280px) 50vw, 33vw"
                        onLoad={() => setImageLoaded(true)}
                        onError={() => setImageError(true)}
                    />
                )}

                {showFavoriteButton ? (
                    <button
                        type="button"
                        className={`absolute top-2 z-10 rounded-full bg-black/40 px-2 py-1 text-white backdrop-blur-md transition hover:bg-black/55 ${showDomainLevelBadge ? 'right-14' : 'right-2'}`}
                        onClick={(event) => {
                            event.stopPropagation();
                            onFavoriteToggle?.();
                        }}
                        aria-label={isFavorite ? '取消收藏领域卡' : '收藏领域卡'}
                    >
                        {isFavorite ? '★' : '☆'}
                    </button>
                ) : null}

                {/* Level badge for Domain cards with frosted glass effect */}
                {showDomainLevelBadge && (
                    <div className="absolute top-2 right-2 bg-black/40 backdrop-blur-md text-white text-xs font-bold px-2.5 py-1 rounded-lg shadow-lg border border-white/20 pointer-events-none">
                        <span style={{ textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>
                            Lv.{card.level}
                        </span>
                    </div>
                )}


                {/* 轻度遮罩 + 文字阴影 */}
                <div className="absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-black/25 to-transparent pointer-events-none" />
                <div className="absolute inset-x-0 bottom-0 flex items-end p-4 pointer-events-none">
                    <div className="w-full space-y-0.5">
                        <h3 className="text-xl font-extrabold text-white leading-none" style={{ textShadow: '0 2px 10px rgba(0,0,0,1)' }}>{displayName}</h3>
                        {/* 种族卡特殊处理：副标题只显示具体种族名称 */}
                        {card.type === CardType.Ancestry ? (
                            <div className="flex items-center gap-1.5 flex-wrap leading-tight">
                                {filteredItems.map((item, index) => (
                                    <React.Fragment key={index}>
                                        {index > 0 && <span className="text-gray-300 text-xs" style={{ textShadow: '0 1px 5px rgba(0,0,0,1)' }}>•</span>}
                                        <span className="text-xs font-normal tracking-widest text-gray-200 leading-tight" style={{ textShadow: '0 1px 5px rgba(0,0,0,1)' }}>{item}</span>
                                    </React.Fragment>
                                ))}
                            </div>
                        ) : (
                            <span className="text-xs font-normal tracking-widest text-gray-200 leading-tight block" style={{ textShadow: '0 1px 5px rgba(0,0,0,1)' }}>{getDisplayTypeName(card)}</span>
                        )}
                    </div>
                </div>
            </div>

            {/* Content Container */}
            <div className="flex flex-1 flex-col p-3 sm:p-4">
                {/* Display Items - 使用去重后的标签（胶囊样式） */}
                {card.type === CardType.Ancestry ? (
                    /* 种族卡特殊处理：显示"种族"和具体种族名称两个标签 */
                    <div className="mb-2 flex flex-row flex-wrap items-center gap-1 border-b border-dashed border-gray-200 pb-2 text-[10px] sm:mb-3 sm:gap-2 sm:pb-3 sm:text-xs">
                        <div className="rounded-full bg-white border border-gray-200 px-2.5 py-1 text-xs font-semibold text-gray-700">
                            {getDisplayTypeName(card)}
                        </div>
                        {filteredItems.map((item, index) => (
                            <div key={index} className="rounded-full bg-white border border-gray-200 px-2.5 py-1 text-xs font-semibold text-gray-700">
                                {item}
                            </div>
                        ))}
                    </div>
                ) : (
                    filteredItems.length > 0 && (
                        <div className="mb-2 flex flex-row flex-wrap items-center gap-1 border-b border-dashed border-gray-200 pb-2 text-[10px] sm:mb-3 sm:gap-2 sm:pb-3 sm:text-xs">
                            {filteredItems.map((item, index) => (
                                <div key={index} className="rounded-full bg-white border border-gray-200 px-2.5 py-1 text-xs font-semibold text-gray-700">
                                    {item}
                                </div>
                            ))}
                            </div>
                        )
                )}

                {/* Description */}
                <div className={`${autoHeight ? 'text-left text-xs leading-snug text-gray-700 sm:text-sm sm:leading-relaxed' : 'flex-1 overflow-hidden text-left text-xs leading-snug text-gray-700 sm:text-sm sm:leading-relaxed'}`}>
                    <CardMarkdown>{displayDescription}</CardMarkdown>
                </div>

                {/* Footer */}
                <div className={`${autoHeight ? 'pt-2' : 'mt-auto pt-4'}`}>
                    {(card.type !== CardType.Profession && card.hint) || showSource ? (
                        <div className="border-t border-gray-100 pt-3 text-[10px] text-gray-500">
                            {card.type !== CardType.Profession && card.hint && (
                                <div className="text-left mb-1 italic">{card.hint}</div>
                            )}
                            {showSource && (
                                <div className="text-right">{cardSource}</div>
                            )}
                        </div>
                    ) : null}
                </div>
            </div>
        </div>
    )
}
