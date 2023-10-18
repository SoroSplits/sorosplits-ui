import { useMemo } from "react"
import Button from "./button"

interface WalletProps {
  isConnected: boolean
  walletAddress: string
  connect: () => void
}

const Wallet = ({ isConnected, walletAddress, connect }: WalletProps) => {
  const displayFirstLastChars = useMemo(() => {
    const firstChars = walletAddress.slice(0, 6)
    const lastChars = walletAddress.slice(-6)

    return `${firstChars}.....${lastChars}`
  }, [walletAddress])

  return (
    <>
      {isConnected ? (
        <div className="w-40 h-10 flex items-center justify-center py-2 px-4 rounded-lg">
          {displayFirstLastChars}
        </div>
      ) : (
        <Button text="Connect Wallet" onClick={connect} type="wallet" />
      )}
    </>
  )
}

export default Wallet
