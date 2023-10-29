import { isAllowed, setAllowed, getUserInfo } from "@stellar/freighter-api"
import toast from "react-hot-toast"
import useAppStore from "../store"

const useWallet = () => {
    const { isConnected, walletAddress, setIsConnected, setWalletAddress } = useAppStore()

    const connect = async () => {
        try {
            const allowed = await isAllowed()
            if (!allowed) {
                await setAllowed()
            }
            const info = await getUserInfo()
            if (info.publicKey === "") {
                return toast.error("Please unlock your wallet")
            }
            setWalletAddress(info.publicKey)
            setIsConnected(true)
        } catch (error: any) {
            toast.error(error.message)
        }
    }

    const disconnect = async () => {
        setIsConnected(false)
        setWalletAddress("")
    }

    return {
        connect,
        disconnect,
        walletAddress,
        isConnected,
    }
}

export default useWallet
