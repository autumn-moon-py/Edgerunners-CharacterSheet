"use client"

import React from "react"
import { CardType, StandardCard } from "@/card/card-types"
import { getCardTypeName } from "@/card/card-ui-config"
import { CardMarkdown } from "@/components/ui/card-markdown"
import { compactDisplayItems, formatDomainCardLoadLabel, formatDomainCardPrice } from "@/lib/domain-card-price"

interface CardContentProps {
    card: StandardCard
    className?: string
}

// 共享的卡牌内容渲染组件
export const CardContent: React.FC<CardContentProps> = ({ card, className = "" }) => {
    const displayItems = compactDisplayItems([
        card.cardSelectDisplay?.item1,
        card.cardSelectDisplay?.item2,
        card.type === CardType.Domain
            ? formatDomainCardLoadLabel(card.cardSelectDisplay?.item3)
            : card.cardSelectDisplay?.item3,
        card.type === CardType.Domain ? formatDomainCardPrice(card.level) : null,
        card.cardSelectDisplay?.item4,
    ])

    return (
        <div className={`${className} flex flex-col h-full`}>
            <div className="flex items-center justify-between mb-1">
                <span className="font-semibold text-base truncate max-w-[60%]">{card.name}</span>
                <span className="text-xs text-gray-500">
                    {getCardTypeName(card.type as CardType)}
                </span>
            </div>
            {displayItems.length > 0 && (
                <div className="flex flex-row flex-wrap items-center gap-2 text-xs bg-gray-100 rounded px-2 py-1 mb-4">
                    {displayItems.map((item, index) => (
                        <React.Fragment key={`${card.id}-content-item-${index}`}>
                            {index > 0 && <span className="text-gray-400">•</span>}
                            <span className="text-gray-800">{item}</span>
                        </React.Fragment>
                    ))}
                </div>
            )}
            {card.description && (
                <div className="card-description text-xs text-gray-800 leading-snug flex-1">
                    <CardMarkdown
                        customComponents={{
                            p: ({ children }) => <p className="first:mt-0 mb-0 mt-3">{children}</p>,
                            li: ({ children }) => <li className="mb-0.5 last:mb-0">{children}</li>,
                        }}
                    >
                        {card.description}
                    </CardMarkdown>
                </div>
            )}
            {(card.type !== CardType.Profession && card.hint) && (
                <div className="text-[10px] text-gray-500 mt-auto pt-2">
                    <div className="italic text-left">{card.hint}</div>
                </div>
            )}
        </div>
    );
};
