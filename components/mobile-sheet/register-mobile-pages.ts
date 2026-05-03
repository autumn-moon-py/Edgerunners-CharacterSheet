"use client"

import CharacterSheet from "@/components/character-sheet"
import CharacterSheetPageTwo from "@/components/character-sheet-page-two"
import CharacterSheetPageAdventureNotes from "@/components/character-sheet-page-adventure-notes"
import { CharacterSheetPageFour, CharacterSheetPageFive } from "@/components/character-sheet-page-card-print"
import { isEmptyCard } from "@/card/card-types"
import { registerPages } from "@/lib/page-registry"

registerPages([
  {
    id: "page1",
    label: "第一页",
    component: CharacterSheet,
    printClass: "page-one",
    visibility: { type: "always" },
    printOrder: 1,
    showInTabs: true,
  },
  {
    id: "page2",
    label: "第二页",
    component: CharacterSheetPageTwo,
    printClass: "page-two",
    visibility: { type: "always" },
    printOrder: 2,
    showInTabs: true,
  },
  {
    id: "page3",
    label: "第三页",
    component: CharacterSheetPageAdventureNotes,
    printClass: "page-adventure-notes",
    visibility: { type: "config", configKey: "adventureNotes" },
    printOrder: 3,
    showInTabs: true,
  },
  {
    id: "focused-cards",
    label: "聚焦卡组",
    component: CharacterSheetPageFour,
    printClass: "page-four",
    visibility: {
      type: "data",
      dataCheck: (data) => {
        return data.cards && data.cards.length > 1 && data.cards.slice(1).some((card) => card && !isEmptyCard(card))
      },
    },
    printOrder: 6,
    showInTabs: false,
  },
  {
    id: "inventory-cards",
    label: "库存卡组",
    component: CharacterSheetPageFive,
    printClass: "page-five",
    visibility: {
      type: "data",
      dataCheck: (data) => {
        return !!(
          data.inventory_cards &&
          data.inventory_cards.length > 0 &&
          data.inventory_cards.some((card) => card && !isEmptyCard(card))
        )
      },
    },
    printOrder: 7,
    showInTabs: false,
  },
])

export {}
