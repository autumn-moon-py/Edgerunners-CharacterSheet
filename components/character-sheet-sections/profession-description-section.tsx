"use client"

import { CardMarkdown } from "@/components/ui/card-markdown"

interface ProfessionDescriptionSectionProps {
  description?: string
}

export function ProfessionDescriptionSection({ description }: ProfessionDescriptionSectionProps) {
  return (
    <div className="h-[250px] overflow-auto rounded-lg border border-gray-300 px-2 py-1.5 text-xs">
      {description ? (
        <CardMarkdown
          className="leading-[1.4]"
          customComponents={{
            p: ({ children }) => <p className="mt-1 first:mt-0">{children}</p>,
            li: ({ children }) => <li className="mb-0.5 last:mb-0">{children}</li>,
          }}
        >
          {description}
        </CardMarkdown>
      ) : (
        <div className="flex h-full items-center justify-center text-[11px] text-gray-400">
          选择职业后会在这里显示职业特性
        </div>
      )}
    </div>
  )
}
