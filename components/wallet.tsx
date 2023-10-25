import { useMemo } from "react"
import Button from "./button"
import { FiLogOut } from 'react-icons/fi'

interface WalletProps {
  isConnected: boolean
  walletAddress: string
  toggleButton: () => void
}

const Wallet = ({ isConnected, walletAddress, toggleButton }: WalletProps) => {
  const displayFirstLastChars = useMemo(() => {
    const firstChars = walletAddress.slice(0, 4)
    const lastChars = walletAddress.slice(-4)

    return `${firstChars}.....${lastChars}`
  }, [walletAddress])

  return (
    <>
      {isConnected ? (
        <div className="flex items-center gap-2">
          <div className="w-[140px] h-10 flex items-center justify-center py-2 px-4 rounded-lg text-sm border-2 border-accent border-opacity-30 cursor-pointer opacity-90 hover:bg-background-dark">
            {displayFirstLastChars}
          </div>
          <button onClick={toggleButton}>
            <FiLogOut color="black" size={14} />
          </button>  
        </div>
      ) : (
        <Button text="Connect Wallet" onClick={toggleButton} type="wallet" />
      )}
    </>
  )
}

export default Wallet
