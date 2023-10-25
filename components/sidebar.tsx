import { isAllowed, setAllowed, getUserInfo } from "@stellar/freighter-api"
import Button from "./button"
import { useState } from "react"
import Wallet from "./wallet"
import Link from "next/link"
import Image from "next/image"

const Sidebar = () => {
  const [isConnected, setIsConnected] = useState(false)
  const [walletAddress, setWalletAddress] = useState("")

  const toggleConnection = async () => {
    if (isConnected) {
      setIsConnected(false)
    } else {
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
  }

  return (
    <div className="min-h-screen h-full w-64 border-r-[1px] border-background-dark flex flex-col items-center justify-start py-6 px-0 gap-2">
      <Link href="/">
        <Image
          src="/logo.jpg"
          alt="SoroSplits"
          width={150}
          height={150}
          className="rounded-full mb-6"
        />
      </Link>

      <Wallet
        isConnected={isConnected}
        walletAddress={walletAddress}
        toggleButton={toggleConnection}
      />

      <Link href="/splitter/setup">
        <Button text="Setup Splitter" onClick={() => {}} type="outline" />
      </Link>

      <Link href="/splitter/search">
        <Button text="Search Splitter" onClick={() => {}} type="outline" />
      </Link>
    </div>
  )
}

export default Sidebar
