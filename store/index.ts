import { create } from "zustand"

interface AppState {
  isConnected: boolean
  setIsConnected: (value: boolean) => void

  walletAddress: string | null
  setWalletAddress: (value: string) => void
}

const useAppStore = create<AppState>()((set) => ({
  isConnected: false,
  setIsConnected: (value: boolean) => set(() => ({ isConnected: value })),

  walletAddress: null,
  setWalletAddress: (value: string) =>
    set(() => ({ walletAddress: value })),
}))

export default useAppStore
