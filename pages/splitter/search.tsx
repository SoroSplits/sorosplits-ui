import { useState } from "react"
import { debounce } from "../../hooks/debounce"

export default function SearchSplitter() {
  const [contractAddress, setContractAddress] = useState("")

  const searchContract = debounce(async (searchTerm: string) => {}, 1000)

  return (
    <div>
      <h1 className="text-5xl">Search Splitter</h1>

      <br />

      <input
        className="w-96 h-10 flex items-center justify-center py-2 px-4 rounded-lg border-[1px] border-[#d2d2d2]"
        type="text"
        onChange={(e) => searchContract(e.target.value)}
        placeholder="Splitter address"
      />
    </div>
  )
}
