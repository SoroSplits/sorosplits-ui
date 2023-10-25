import { useState } from "react"
import { debounce } from "../../hooks/debounce"
import Input from "../../components/input"
import useContract from "../../hooks/contract"
import { ConfigDataKey, ShareDataKey } from 'sorosplits-splitter'

export default function SearchSplitter() {

  const { listShares, getConfig } = useContract()

  const [contractAddress, setContractAddress] = useState("")
  const [loading, setLoading] = useState(false)

  const [contractConfig, setContractConfig] = useState<ConfigDataKey>()
  const [contractShares, setContractShares] = useState<ShareDataKey[]>()

  const searchContract = debounce(async (searchTerm: string) => {
    if (searchTerm === "") return
    fetchContractData()
  }, 1000)

  const fetchContractData = async () => {
    let results = await Promise.all([getConfig(), listShares()]).catch(err=>console.log(err))  

    if (results) {
      setContractConfig(results[0])
      setContractShares(results[1])
    }
  }

  const searchOnChange = (value: string) => {
    setContractAddress(value)
    searchContract(value)
  }

  return (
    <div className="flex flex-col w-full">
      <h1 className="text-[64px] font-bold">Setup Splitter</h1>
      <p>Enter addresses and their shares to setup your splitter.</p>
      <br />

      <div className="flex">
        <Input
          placeholder="Enter Splitter address"
          onChange={searchOnChange}
          value={contractAddress}
        />
      </div>


      <div>
        Admin: {contractConfig?.admin.toString()}
      </div>
    </div>
  )
}
