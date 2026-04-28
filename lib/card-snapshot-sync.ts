import { CardType } from "@/card"
import { createEmptyCard, isEmptyCard, type StandardCard } from "@/card/card-types"
import type { SheetCardReference, SheetData } from "./sheet-data"

type CardLookup = (cardId: string) => StandardCard | null | undefined

const buildProfessionRefName = (card: StandardCard): string => {
  if (card.cardSelectDisplay?.item1 && card.cardSelectDisplay?.item2) {
    return `${card.name}  -  ${card.cardSelectDisplay.item1}&${card.cardSelectDisplay.item2}`
  }

  return card.name
}

const getCardsByType = (allCards: StandardCard[] | undefined, cardType: CardType): StandardCard[] => {
  if (!Array.isArray(allCards)) {
    return []
  }

  return allCards.filter((card) => card?.type === cardType)
}

const pickFallbackAncestryCard = (
  ancestryCards: StandardCard[],
  excludeIds: string[] = [],
): StandardCard | undefined => {
  const preferredCards = ancestryCards.filter(
    (card) => card.class === "赛博人类" && !excludeIds.includes(card.id),
  )

  if (preferredCards.length > 0) {
    return preferredCards[0]
  }

  return ancestryCards.find((card) => !excludeIds.includes(card.id))
}

const isSameCardSnapshot = (currentCard?: StandardCard, nextCard?: StandardCard): boolean => {
  if (!currentCard && !nextCard) {
    return true
  }

  if (!currentCard || !nextCard) {
    return false
  }

  if (isEmptyCard(currentCard) && isEmptyCard(nextCard)) {
    return true
  }

  return JSON.stringify(currentCard) === JSON.stringify(nextCard)
}

const getLatestTypedCard = (
  getCardById: CardLookup,
  id: string | undefined,
  allowedTypes: CardType | CardType[],
): StandardCard | undefined => {
  if (!id) {
    return undefined
  }

  const card = getCardById(id)
  const allowedTypeList = Array.isArray(allowedTypes) ? allowedTypes : [allowedTypes]
  return card && allowedTypeList.includes(card.type as CardType) ? card : undefined
}

const getEmptySlotCard = (currentCard?: StandardCard): StandardCard => {
  return currentCard && isEmptyCard(currentCard) ? currentCard : createEmptyCard()
}

const resolveStoredCard = (getCardById: CardLookup, card?: StandardCard): StandardCard => {
  if (!card || isEmptyCard(card) || !card.id) {
    return card ?? createEmptyCard()
  }

  return getCardById(card.id) ?? card
}

const resolveSpecialCard = (
  getCardById: CardLookup,
  currentCard: StandardCard | undefined,
  refId: string | undefined,
  allowedTypes: CardType | CardType[],
): StandardCard => {
  if (!refId) {
    return getEmptySlotCard(currentCard)
  }

  const latestCard = getLatestTypedCard(getCardById, refId, allowedTypes)
  if (latestCard) {
    return latestCard
  }

  if (currentCard && currentCard.id === refId && !isEmptyCard(currentCard)) {
    return currentCard
  }

  return getEmptySlotCard(currentCard)
}

const buildNextRef = (
  currentRef: SheetCardReference | undefined,
  latestCard: StandardCard | undefined,
  nameResolver?: (card: StandardCard) => string,
): SheetCardReference => {
  if (!latestCard) {
    return currentRef ?? { id: "", name: "" }
  }

  return {
    id: latestCard.id,
    name: nameResolver ? nameResolver(latestCard) : latestCard.name,
  }
}

export function syncSheetCardSnapshots(
  sheetData: SheetData,
  getCardById: CardLookup,
  allCards?: StandardCard[],
): SheetData | null {
  const currentCards = Array.isArray(sheetData.cards) ? sheetData.cards : []
  const currentInventoryCards = Array.isArray(sheetData.inventory_cards) ? sheetData.inventory_cards : []
  const updatedCards = [...currentCards]
  const ancestryCards = getCardsByType(allCards, CardType.Ancestry)
  const professionLookupId = sheetData.professionRef?.id || sheetData.profession
  const subclassLookupId = sheetData.subclassRef?.id || sheetData.subclass
  const ancestry1LookupId = sheetData.ancestry1Ref?.id || sheetData.ancestry1
  const ancestry2LookupId = sheetData.ancestry2Ref?.id || sheetData.ancestry2
  const communityLookupId = sheetData.communityRef?.id || sheetData.community

  while (updatedCards.length < 5) {
    updatedCards.push(createEmptyCard("unknown"))
  }

  let latestProfessionCard = getLatestTypedCard(getCardById, professionLookupId, CardType.Profession)
  let latestSubclassCard = getLatestTypedCard(
    getCardById,
    subclassLookupId,
    [CardType.Subclass, CardType.Profession],
  )
  let latestAncestry1Card = getLatestTypedCard(getCardById, ancestry1LookupId, CardType.Ancestry)
  let latestAncestry2Card = getLatestTypedCard(getCardById, ancestry2LookupId, CardType.Ancestry)
  let latestCommunityCard = getLatestTypedCard(getCardById, communityLookupId, CardType.Community)

  if (!latestAncestry1Card) {
    latestAncestry1Card = pickFallbackAncestryCard(ancestryCards)
  }

  if (!latestAncestry2Card) {
    latestAncestry2Card = pickFallbackAncestryCard(
      ancestryCards,
      latestAncestry1Card ? [latestAncestry1Card.id] : [],
    )
  }

  updatedCards[0] = resolveSpecialCard(getCardById, currentCards[0], latestProfessionCard?.id || professionLookupId, CardType.Profession)
  updatedCards[1] = resolveSpecialCard(
    getCardById,
    currentCards[1],
    latestSubclassCard?.id || subclassLookupId,
    [CardType.Subclass, CardType.Profession],
  )
  updatedCards[2] = resolveSpecialCard(getCardById, currentCards[2], latestAncestry1Card?.id || ancestry1LookupId, CardType.Ancestry)
  updatedCards[3] = resolveSpecialCard(getCardById, currentCards[3], latestAncestry2Card?.id || ancestry2LookupId, CardType.Ancestry)
  updatedCards[4] = resolveSpecialCard(getCardById, currentCards[4], latestCommunityCard?.id || communityLookupId, CardType.Community)

  for (let index = 5; index < updatedCards.length; index += 1) {
    updatedCards[index] = resolveStoredCard(getCardById, updatedCards[index])
  }

  const updatedInventoryCards = currentInventoryCards.map((card) => resolveStoredCard(getCardById, card))

  const nextProfessionRef = buildNextRef(sheetData.professionRef, latestProfessionCard, buildProfessionRefName)
  const nextSubclassRef = buildNextRef(sheetData.subclassRef, latestSubclassCard)
  const nextAncestry1Ref = buildNextRef(sheetData.ancestry1Ref, latestAncestry1Card)
  const nextAncestry2Ref = buildNextRef(sheetData.ancestry2Ref, latestAncestry2Card)
  const nextCommunityRef = buildNextRef(sheetData.communityRef, latestCommunityCard)
  const nextProfessionId = latestProfessionCard?.id ?? professionLookupId ?? ""
  const nextSubclassId = latestSubclassCard?.id ?? subclassLookupId ?? ""
  const nextAncestry1Id = latestAncestry1Card?.id ?? ancestry1LookupId ?? ""
  const nextAncestry2Id = latestAncestry2Card?.id ?? ancestry2LookupId ?? ""
  const nextCommunityId = latestCommunityCard?.id ?? communityLookupId ?? ""

  const cardsChanged =
    updatedCards.length !== currentCards.length ||
    updatedCards.some((card, index) => !isSameCardSnapshot(currentCards[index], card))

  const inventoryCardsChanged =
    updatedInventoryCards.length !== currentInventoryCards.length ||
    updatedInventoryCards.some((card, index) => !isSameCardSnapshot(currentInventoryCards[index], card))

  const refsChanged =
    nextProfessionRef.id !== (sheetData.professionRef?.id ?? "") ||
    nextProfessionRef.name !== (sheetData.professionRef?.name ?? "") ||
    nextSubclassRef.id !== (sheetData.subclassRef?.id ?? "") ||
    nextSubclassRef.name !== (sheetData.subclassRef?.name ?? "") ||
    nextAncestry1Ref.id !== (sheetData.ancestry1Ref?.id ?? "") ||
    nextAncestry1Ref.name !== (sheetData.ancestry1Ref?.name ?? "") ||
    nextAncestry2Ref.id !== (sheetData.ancestry2Ref?.id ?? "") ||
    nextAncestry2Ref.name !== (sheetData.ancestry2Ref?.name ?? "") ||
    nextCommunityRef.id !== (sheetData.communityRef?.id ?? "") ||
    nextCommunityRef.name !== (sheetData.communityRef?.name ?? "")

  const specialIdsChanged =
    nextProfessionId !== (sheetData.profession ?? "") ||
    nextSubclassId !== (sheetData.subclass ?? "") ||
    nextAncestry1Id !== (sheetData.ancestry1 ?? "") ||
    nextAncestry2Id !== (sheetData.ancestry2 ?? "") ||
    nextCommunityId !== (sheetData.community ?? "")

  if (!cardsChanged && !inventoryCardsChanged && !refsChanged && !specialIdsChanged) {
    return null
  }

  return {
    ...sheetData,
    profession: nextProfessionId,
    subclass: nextSubclassId,
    ancestry1: nextAncestry1Id,
    ancestry2: nextAncestry2Id,
    community: nextCommunityId,
    cards: updatedCards,
    inventory_cards: updatedInventoryCards,
    professionRef: nextProfessionRef,
    subclassRef: nextSubclassRef,
    ancestry1Ref: nextAncestry1Ref,
    ancestry2Ref: nextAncestry2Ref,
    communityRef: nextCommunityRef,
  }
}
