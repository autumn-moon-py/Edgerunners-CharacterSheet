"use client"

import "@/components/mobile-sheet/register-mobile-pages"

import { useEffect, useMemo, useRef, useState } from "react"
import { getStandardCardById } from "@/card"
import CharacterSheetPageTwo from "@/components/character-sheet-page-two"
import CharacterSheetPageAdventureNotes from "@/components/character-sheet-page-adventure-notes"
import { MobileBottomDock } from "@/components/mobile-sheet/mobile-bottom-dock"
import { MobileDesktopPageFrame } from "@/components/mobile-sheet/mobile-desktop-page-frame"
import { MobilePageOne } from "@/components/mobile-sheet/mobile-page-one"
import { MobilePreviewDock } from "@/components/mobile-sheet/mobile-preview-dock"
import { MobilePageThreeLoveSection } from "@/components/mobile-sheet/mobile-page-three-love-section"
import { MobilePageThreeRelationsSection } from "@/components/mobile-sheet/mobile-page-three-relations-section"
import { MobilePageTwoCardSection } from "@/components/mobile-sheet/mobile-page-two-card-section"
import { MobilePageTwoTextSection } from "@/components/mobile-sheet/mobile-page-two-text-section"
import { MobilePageTwoUpgradeSection } from "@/components/mobile-sheet/mobile-page-two-upgrade-section"
import { MobilePageThreeTopSection } from "@/components/mobile-sheet/mobile-page-three-top-section"
import { MobilePageTabs } from "@/components/mobile-sheet/mobile-page-tabs"
import { CharacterManagementModal } from "@/components/modals/character-management-modal"
import { SealDiceExportModal } from "@/components/modals/seal-dice-export-modal"
import { MobilePrintPageRenderer } from "@/components/print/mobile-print-page-renderer"
import { PrintPageRenderer } from "@/components/print/print-page-renderer"
import { PrintReadyChecker } from "@/components/print/print-ready-checker"
import { MemoryAlert } from "@/components/memory-alert"
import { BottomDock } from "@/components/layout/bottom-dock"
import { PinnedCardWindow } from "@/components/ui/pinned-card-window"
import { BUILTIN_PACKAGE_UPDATE_SIGNAL_KEY } from "@/lib/builtin-package-refresh"
import { syncSheetCardSnapshots } from "@/lib/card-snapshot-sync"
import { saveCharacterById } from "@/lib/multi-character-storage"
import { getTabPages } from "@/lib/page-registry"
import { usePinnedCardsStore } from "@/lib/pinned-cards-store"
import { memoryMonitor } from "@/lib/memory-monitor"
import { useSheetStore } from "@/lib/sheet-store"
import { useCharacterManagement } from "@/hooks/use-character-management"
import { useExportHandlers } from "@/hooks/use-export-handlers"
import { useUnifiedCardStore } from "@/card/stores/unified-card-store"
import { PrintProvider } from "@/contexts/print-context"
import PrintHelper from "@/app/print-helper"

export function MobileHome() {
  const { sheetData: formData, setSheetData: setFormData } = useSheetStore()
  const initializeCardSystem = useUnifiedCardStore((state) => state.initializeSystem)
  const refreshBuiltinCards = useUnifiedCardStore((state) => state.refreshBuiltinCards)
  const getCardById = useUnifiedCardStore((state) => state.getCardById)
  const loadAllCards = useUnifiedCardStore((state) => state.loadAllCards)
  const cardStoreInitialized = useUnifiedCardStore((state) => state.initialized)
  const cardStoreLoading = useUnifiedCardStore((state) => state.loading)
  const cardStoreCards = useUnifiedCardStore((state) => state.cards)
  const cardStoreBatches = useUnifiedCardStore((state) => state.batches)
  const { pinnedCards } = usePinnedCardsStore()

  const [isClient, setIsClient] = useState(false)
  const [isPrintingAll, setIsPrintingAll] = useState(false)
  const [isLandscapePrintingAll, setIsLandscapePrintingAll] = useState(false)
  const [characterManagementModalOpen, setCharacterManagementModalOpen] = useState(false)
  const [sealDiceExportModalOpen, setSealDiceExportModalOpen] = useState(false)
  const [currentTabValue, setCurrentTabValue] = useState("page1")
  const printContainerRef = useRef<HTMLDivElement>(null)

  const {
    currentCharacterId,
    characterList,
    isLoading,
    switchToCharacter,
    createNewCharacterHandler,
    deleteCharacterHandler,
    duplicateCharacterHandler,
    renameCharacterHandler,
    handleQuickCreateArchive,
  } = useCharacterManagement({ isClient, setCurrentTabValue })

  const { handlePrintAll, handleExportHTML, handleQuickExportPDF, handleQuickExportHTML } = useExportHandlers({
    formData,
    setIsPrintingAll,
  })

  const buildPrintTitle = () => {
    const getCardClass = (cardId: string | undefined): string => {
      if (!cardId) return '()'
      try {
        const card = getStandardCardById(cardId)
        return card && card.class ? String(card.class) : '()'
      } catch {
        return '()'
      }
    }

    const name = formData.name || '()'
    const level = formData.level || '()'
    const ancestry1Class = getCardClass(formData.ancestry1Ref?.id)
    const professionClass = getCardClass(formData.professionRef?.id)
    const ancestry2Class = getCardClass(formData.ancestry2Ref?.id)
    const communityClass = getCardClass(formData.communityRef?.id)

    return `${name}-${professionClass}-${ancestry1Class}-${ancestry2Class}-${communityClass}-LV${level}`
  }

  useEffect(() => {
    setIsClient(true)
    document.title = "Character Sheet"
  }, [])

  useEffect(() => {
    memoryMonitor.start()
    return () => {
      memoryMonitor.stop()
    }
  }, [])

  useEffect(() => {
    if (!currentCharacterId) {
      return
    }

    memoryMonitor.logAction({
      timestamp: Date.now(),
      type: "store",
      target: "switchCharacter",
      detail: currentCharacterId,
    })
  }, [currentCharacterId])

  useEffect(() => {
    if (!isClient) {
      return
    }

    const handleBuiltinPackageStorageUpdate = async (event: StorageEvent) => {
      if (event.key !== BUILTIN_PACKAGE_UPDATE_SIGNAL_KEY || !event.newValue) {
        return
      }

      try {
        if (!cardStoreInitialized) {
          const result = await initializeCardSystem()
          if (!result.initialized) {
            return
          }
        }

        await refreshBuiltinCards()
      } catch (error) {
        console.error("[MobileHome] Failed to refresh builtin package after storage update:", error)
      }
    }

    window.addEventListener("storage", handleBuiltinPackageStorageUpdate)
    return () => window.removeEventListener("storage", handleBuiltinPackageStorageUpdate)
  }, [cardStoreInitialized, initializeCardSystem, isClient, refreshBuiltinCards])

  useEffect(() => {
    if (isLoading || !formData || !cardStoreInitialized || cardStoreLoading) {
      return
    }

    const syncedSheetData = syncSheetCardSnapshots(formData, getCardById, loadAllCards())
    if (syncedSheetData) {
      setFormData(syncedSheetData)
    }
  }, [
    cardStoreBatches,
    cardStoreCards,
    cardStoreInitialized,
    cardStoreLoading,
    formData,
    getCardById,
    isLoading,
    loadAllCards,
    setFormData,
  ])

  useEffect(() => {
    if (!isLoading && currentCharacterId && formData) {
      const saveTimeout = setTimeout(() => {
        try {
          saveCharacterById(currentCharacterId, formData)
        } catch (error) {
          console.error(`[MobileHome] Error auto-saving character ${currentCharacterId}:`, error)
        }
      }, 300)

      return () => clearTimeout(saveTimeout)
    }
  }, [formData, currentCharacterId, isLoading])

  const visibleTabs = useMemo(() => {
    if (!formData) {
      return []
    }

    return getTabPages(formData)
  }, [formData])

  const visibleTabValues = useMemo(() => visibleTabs.map((tab) => tab.tabValue || tab.id), [visibleTabs])
  const adventureNotesVisible = Boolean(formData.pageVisibility?.adventureNotes)

  useEffect(() => {
    if (visibleTabValues.length === 0) {
      return
    }

    if (!visibleTabValues.includes(currentTabValue)) {
      setCurrentTabValue(visibleTabValues[0])
    }
  }, [currentTabValue, visibleTabValues])

  const fallbackCurrentTab = visibleTabValues.find((value) => value !== "page3") || visibleTabValues[0] || "page1"

  const setAdventureNotesVisibility = (visible: boolean) => {
    setFormData((prev) => ({
      ...prev,
      pageVisibility: {
        adventureNotes: visible,
      },
    }))

    if (visible) {
      setCurrentTabValue("page3")
      return
    }

    if (currentTabValue === "page3") {
      setCurrentTabValue(fallbackCurrentTab)
    }
  }

  const handleQuickImportFromHTML = () => {
    const input = document.createElement("input")
    input.type = "file"
    input.accept = ".html"
    input.onchange = async (event) => {
      const file = (event.target as HTMLInputElement).files?.[0]
      if (!file) {
        return
      }

      try {
        const { importCharacterFromHTMLFile } = await import("@/lib/html-importer")
        const result = await importCharacterFromHTMLFile(file)

        if (result.success && result.data) {
          const characterName = result.data.name || "未命名角色"
          const defaultSaveName = `${characterName} (HTML导入)`
          const saveName = prompt("请输入新存档的名称:", defaultSaveName)

          if (saveName && saveName.trim()) {
            const success = createNewCharacterHandler(saveName.trim())
            if (success) {
              setFormData(result.data)
              if (result.warnings && result.warnings.length > 0) {
                alert(`HTML导入成功并创建新存档\"${saveName}\"，但有以下警告：\n${result.warnings.join("\n")}`)
              } else {
                alert(`HTML导入成功并创建新存档\"${saveName}\"`)
              }
            } else {
              alert("创建新存档失败")
            }
          }
        } else {
          alert(`HTML导入失败：${result.error}`)
        }
      } catch (error) {
        console.error("HTML导入失败:", error)
        alert(`HTML导入失败: ${error instanceof Error ? error.message : "未知错误"}`)
      }
    }
    input.click()
  }

  if (!isClient) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-gray-50">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-gray-900"></div>
        <div className="text-base text-gray-700">初始化中...</div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-gray-50">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-gray-900"></div>
        <div className="text-base text-gray-700">正在加载角色数据...</div>
      </div>
    )
  }

  if (isPrintingAll) {
    return (
      <PrintProvider containerRef={printContainerRef}>
        <PrintReadyChecker onSkipWaiting={() => undefined}>
          <div className="print-all-pages pb-20">
            <PrintHelper />

            <MobilePreviewDock
              onExportHTML={handleExportHTML}
              onOpenSealDiceExport={() => {
                setSealDiceExportModalOpen(true)
                setIsPrintingAll(false)
              }}
              onClose={() => setIsPrintingAll(false)}
            />

            <div ref={printContainerRef}>
              <MobilePrintPageRenderer sheetData={formData} />
            </div>
          </div>
        </PrintReadyChecker>
      </PrintProvider>
    )
  }

  if (isLandscapePrintingAll) {
    const handleSkipWaiting = () => {
      console.log('[MobileHome] 用户选择跳过图片加载等待，页面将立即显示')
    }

    return (
      <PrintProvider containerRef={printContainerRef}>
        <PrintReadyChecker onSkipWaiting={handleSkipWaiting}>
          <div className="print-all-pages">
            <PrintHelper />

            <BottomDock
              mode="preview"
              isMobile
              onExportPDF={() => window.print()}
              onExportHTML={handleExportHTML}
              onOpenSealDiceExport={() => {
                setSealDiceExportModalOpen(true)
                setIsLandscapePrintingAll(false)
              }}
              onClose={() => {
                setIsLandscapePrintingAll(false)
                document.title = "Character Sheet"
              }}
            />

            <div ref={printContainerRef}>
              <PrintPageRenderer sheetData={formData} />
            </div>
          </div>
        </PrintReadyChecker>
      </PrintProvider>
    )
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,#f5f5f5,transparent_38%),linear-gradient(180deg,#fafafa_0%,#f2f2f2_100%)] pb-20">
      <div className="mx-auto max-w-xl px-3 pb-3 pt-4">
        <MobilePageTabs
          tabs={visibleTabs}
          currentTabValue={currentTabValue}
          onSelectTab={setCurrentTabValue}
          adventureNotesVisible={adventureNotesVisible}
          onAddAdventureNotes={() => setAdventureNotesVisibility(true)}
          onRemoveAdventureNotes={() => setAdventureNotesVisibility(false)}
        />

        <div className="mt-4">
          {currentTabValue === "page1" ? <MobilePageOne /> : null}

          {currentTabValue === "page2" ? (
            <div className="space-y-2 rounded-[3px] border border-gray-200 bg-white p-2 shadow-sm">
              <MobilePageTwoTextSection />
              <MobilePageTwoCardSection />
              <MobilePageTwoUpgradeSection />
            </div>
          ) : null}

          {currentTabValue === "page3" ? (
            <div className="space-y-2 rounded-[3px] border border-gray-200 bg-white p-2 shadow-sm">
              <MobilePageThreeTopSection />
              <MobilePageThreeLoveSection />
              <MobilePageThreeRelationsSection />
            </div>
          ) : null}
        </div>
      </div>

      <MobileBottomDock
        onPrintAll={handlePrintAll}
        onOpenSealDiceExport={() => setSealDiceExportModalOpen(true)}
        onQuickExportPDF={() => {
          document.title = buildPrintTitle()
          setIsLandscapePrintingAll(true)
        }}
        onQuickExportHTML={handleQuickExportHTML}
        onOpenCharacterManagement={() => setCharacterManagementModalOpen(true)}
        onQuickCreateArchive={handleQuickCreateArchive}
        onQuickImportFromHTML={handleQuickImportFromHTML}
      />

      <CharacterManagementModal
        isOpen={characterManagementModalOpen}
        onClose={() => setCharacterManagementModalOpen(false)}
        characterList={characterList}
        currentCharacterId={currentCharacterId}
        onSwitchCharacter={switchToCharacter}
        onCreateCharacter={createNewCharacterHandler}
        onDeleteCharacter={deleteCharacterHandler}
        onDuplicateCharacter={duplicateCharacterHandler}
        onRenameCharacter={renameCharacterHandler}
      />

      <SealDiceExportModal isOpen={sealDiceExportModalOpen} onClose={() => setSealDiceExportModalOpen(false)} sheetData={formData} />

      {pinnedCards.map((pinnedCard) => (
        <PinnedCardWindow key={pinnedCard.id} pinnedCard={pinnedCard} />
      ))}

      <MemoryAlert />
    </main>
  )
}
