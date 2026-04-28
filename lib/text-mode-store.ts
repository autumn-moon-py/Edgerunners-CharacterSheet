import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface TextModeStore {
  isTextMode: boolean
  toggleTextMode: () => void
  setTextMode: (enabled: boolean) => void
}

export const useTextModeStore = create<TextModeStore>()(
  persist(
    (set) => ({
      isTextMode: true,
      
      toggleTextMode: () => set((state) => ({ 
        isTextMode: !state.isTextMode 
      })),
      
      setTextMode: (enabled: boolean) => set({ 
        isTextMode: enabled 
      }),
    }),
    {
      name: 'text-mode-storage',
      version: 1,
      migrate: () => ({
        isTextMode: true,
      }),
    }
  )
)
