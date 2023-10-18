import { isAllowed, setAllowed, getUserInfo } from "@stellar/freighter-api"
import Button from "./button"
import { useState } from "react"
import Wallet from "./wallet"
import Link from "next/link"

const Sidebar = () => {
  const [isConnected, setIsConnected] = useState(false)
  const [walletAddress, setWalletAddress] = useState("")

  const connect = async () => {
    let allowed = await isAllowed()

    if (!allowed) {
      await setAllowed()
    }

    if (allowed) {
      const info = await getUserInfo()

      if (info.publicKey === "") {
        alert("Please unlock your wallet")
      }

      setWalletAddress(info.publicKey)
      setIsConnected(true)
    }
  }

  return (
    <div className="h-screen w-56 border-r-[1px] border-[#d2d2d2] flex flex-col items-center justify-start py-6 px-0 gap-2">
      <h1 className="text-2xl">SoroSplits</h1>

      <br />

      <Wallet
        isConnected={isConnected}
        walletAddress={walletAddress}
        connect={connect}
      />

      <Link href="/splitter/setup">
        <Button text="Setup Splitter" onClick={() => {}} type="primary" />
      </Link>

      <Link href="/splitter/search">
        <Button text="Search Splitter" onClick={() => {}} type="secondary" />
      </Link>
    </div>
  )
}

export default Sidebar
