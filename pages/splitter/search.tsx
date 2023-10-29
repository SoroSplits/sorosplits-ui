import { useEffect, useState } from "react"
import Input from "../../components/Input"
import useContract, { ContractConfigResult } from "../../hooks/useContract"
import toast from "react-hot-toast"
import SplitterData, { DataProps } from "../../components/SplitterData"
import Button from "../../components/Button"
import Link from "next/link"
import { TbExternalLink } from "react-icons/tb"
import PageHeader from "../../components/PageHeader"
import { useRouter } from "next/router"

export default function SearchSplitter() {
  const { query } = useRouter()

  const [contractAddress, setContractAddress] = useState("")
  const { callContract, queryContract } = useContract()

  const [contractConfig, setContractConfig] = useState<ContractConfigResult>()
  const [contractShares, setContractShares] = useState<DataProps[]>()

  useEffect(() => {
    if (query.contractId) {
      setContractAddress(query.contractId as string)
    }
  }, [query])

  useEffect(() => {
    const fetchContractData = setTimeout(async () => {
      try {
        if (contractAddress === "") {
          setContractConfig(undefined)
          setContractShares(undefined)
          return
        }
        toast.loading("Searching for Splitter contract...")

        let results = await Promise.all([
          queryContract({ contractId: contractAddress, method: "get_config" }),
          queryContract({ contractId: contractAddress, method: "list_shares" }),
        ]).catch((err) => {
          toast.dismiss()
          toast.error(err.message)
        })

        if (results) {
          toast.dismiss()
          toast.success("Found Splitter contract!")

          let config = results[0] as ContractConfigResult
          setContractConfig(config)

          let shares = results[1] as DataProps[]
          let shareData = shares.map((item) => {
            return {
              shareholder: item.shareholder.toString(),
              share: Number(BigInt(item.share)) / 100,
            }
          })
          setContractShares(shareData)
        }
      } catch (error: any) {
        toast.dismiss()
        if (error.message) toast.error(error.message)
        else toast.error(error)
      }
    }, 1000)

    return () => clearTimeout(fetchContractData)
  }, [contractAddress])

  const lockSplitter = async () => {
    try {
      toast.loading("Locking Splitter...")

      await callContract({
        contractId: contractAddress,
        method: "lock_contract",
        args: {},
      })

      toast.dismiss()
      toast.success("Splitter locked!")

      setContractConfig(Object.assign({}, contractConfig, { mutable: false }))
    } catch (error: any) {
      toast.dismiss()
      if (error.message) toast.error(error.message)
      else toast.error(error)
    }
  }

  const updateSplitter = async () => {}

  return (
    <div className="flex flex-col w-full">
      <PageHeader
        title="Search Splitter"
        subtitle="Search for a Splitter contract by entering the contract address below."
      />

      <div className="flex mb-6">
        <Input
          placeholder="Enter Splitter address"
          onChange={setContractAddress}
          value={contractAddress}
        />
      </div>

      <div className="flex flex-col gap-6">
        {contractConfig && (
          <div>
            <h3 className="text-xl font-bold mb-2">Contract Admin</h3>
            <Link
              href={`https://futurenet.stellarchain.io/accounts/${contractConfig.admin.toString()}`}
              target="_blank"
              className="flex items-center gap-2 underline hover:text-accent"
            >
              {contractConfig.admin.toString()}
              <TbExternalLink size={16} />
            </Link>
          </div>
        )}

        {contractConfig && (
          <div>
            <h3 className="text-xl font-bold mb-2">Contract State</h3>
            {contractConfig.mutable ? (
              <>
                <p className="mb-4">
                  Contract is mutable. Shareholders and shares can be updated.
                </p>
                <Button
                  text="Lock Splitter"
                  onClick={lockSplitter}
                  type="primary"
                />
              </>
            ) : (
              <p>
                Contract is immutable. Shareholders and shares are locked for
                updates.
              </p>
            )}
          </div>
        )}

        {contractShares && (
          <div>
            <h3 className="text-xl font-bold mb-2">Shareholders & Shares:</h3>

            <SplitterData
              initialData={contractShares}
              updateData={setContractShares}
            />

            <div className="h-8" />

            <Button
              text="Update Splitter"
              onClick={updateSplitter}
              type="primary"
            />
          </div>
        )}
      </div>
    </div>
  )
}
