import { useCallback, useEffect, useState } from "react"
import Input from "../../components/Input"
import useContract, {
  ContractConfigResult,
  TokenResult,
} from "../../hooks/useContract"
import { loadingToast, successToast, errorToast } from "../../utils/toast"
import SplitterData, { DataProps } from "../../components/SplitterData"
import Button from "../../components/Button"
import Link from "next/link"
import { TbExternalLink } from "react-icons/tb"
import PageHeader from "../../components/PageHeader"
import { useRouter } from "next/router"
import checkSplitterData from "../../utils/checkSplitterData"
import { Address } from "soroban-client"
import useAppStore from "../../store"

export default function SearchSplitter() {
  const { query } = useRouter()
  const { callContract, queryContract } = useContract()
  const { loading, setLoading } = useAppStore()

  const [tokenAddress, setTokenAddress] = useState("")
  const [contractAddress, setContractAddress] = useState("")

  const [contractConfig, setContractConfig] = useState<ContractConfigResult>()
  const [contractShares, setContractShares] = useState<DataProps[]>()

  const [tokenInfo, setTokenInfo] = useState<TokenResult>()

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

        loadingToast("Searching for Splitter contract...")

        let results = await Promise.all([
          queryContract({
            contractId: contractAddress,
            method: "get_config",
            args: {},
          }),
          queryContract({
            contractId: contractAddress,
            method: "list_shares",
            args: {},
          }),
        ]).catch((error) => {
          throw new Error(error)
        })

        if (results) {
          successToast("Found Splitter contract!")

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
        setContractConfig(undefined)
        setContractShares(undefined)
        errorToast(error)
      }
    }, 1000)

    return () => clearTimeout(fetchContractData)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contractAddress])

  const fetchTokenBalance = useCallback(async () => {
    try {
      if (tokenAddress === "") {
        setTokenInfo(undefined)
        return
      }

      loadingToast("Fetching token information...")

      let results = await Promise.all([
        queryContract({
          contractId: tokenAddress,
          method: "get_token_name",
          args: {},
        }),
        queryContract({
          contractId: tokenAddress,
          method: "get_token_symbol",
          args: {},
        }),
        queryContract({
          contractId: tokenAddress,
          method: "get_token_decimal",
          args: {},
        }),
        queryContract({
          contractId: tokenAddress,
          method: "get_token_balance",
          args: { id: contractAddress },
        }),
      ]).catch((error) => {
        throw new Error(error)
      })

      if (results) {
        successToast(`Token information fetched!`)

        let name = results[0] as string
        let symbol = results[1] as string
        let decimals = results[2] as number
        let balance = results[3] as BigInt

        setTokenInfo({
          name,
          symbol,
          decimals,
          balance,
        })
      }
    } catch (error: any) {
      setTokenInfo(undefined)
      errorToast(error)
    }
  }, [contractAddress, tokenAddress, queryContract])

  useEffect(() => {
    const timeout = setTimeout(async () => {
      await fetchTokenBalance()
    })
    return () => clearTimeout(timeout)
  }, [tokenAddress, fetchTokenBalance])

  const lockSplitter = async () => {
    try {
      setLoading(true)

      loadingToast("Locking Splitter for updates...")

      await callContract({
        contractId: contractAddress,
        method: "lock_contract",
        args: {},
      })

      setLoading(false)
      successToast("Splitter locked!")

      setContractConfig(Object.assign({}, contractConfig, { mutable: false }))
    } catch (error: any) {
      setLoading(false)
      errorToast(error)
    }
  }

  const updateSplitter = async () => {
    try {
      setLoading(true)

      if (!contractShares) return
      checkSplitterData(contractShares)

      loadingToast("Updating Splitter shareholders and shares...")

      const shares = contractShares.map((item) => {
        return {
          shareholder: Address.fromString(item.shareholder),
          share: BigInt(item.share * 100),
        }
      })

      await callContract({
        contractId: contractAddress,
        method: "update_shares",
        args: {
          shares,
        },
      })

      setLoading(false)
      successToast("Shareholders and shares updated successfully!")
    } catch (error: any) {
      setLoading(false)
      errorToast(error)
    }
  }

  const distributeTokens = async () => {
    try {
      setLoading(true)

      if (!tokenInfo) return

      loadingToast("Distributing tokens to shareholders...")

      await callContract({
        contractId: contractAddress,
        method: "distribute_tokens",
        args: {
          token_address: tokenAddress,
        },
      })

      await fetchTokenBalance()

      setLoading(false)
      successToast("Tokens distributed successfully!")
    } catch (error) {
      setLoading(false)
      errorToast(error)
    }
  }

  const displayTokenBalance = () => {
    if (!tokenInfo) return 0
    const balance = Number(tokenInfo.balance) / Math.pow(10, tokenInfo.decimals)
    if (balance === 0) return 0
    else return balance.toFixed(tokenInfo.decimals)
  }

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
          disabled={loading}
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
                  loading={loading}
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
            <h3 className="text-xl font-bold mb-2">Shareholders & Shares</h3>

            <SplitterData
              initialData={contractShares}
              updateData={setContractShares}
              locked={loading || !contractConfig?.mutable}
            />

            <div className="h-8" />
            <Button
              text="Update Splitter"
              onClick={updateSplitter}
              type="primary"
              loading={loading || !contractConfig?.mutable}
            />
          </div>
        )}

        {contractConfig && (
          <div>
            <h3 className="text-xl font-bold mb-2">Token Distribution</h3>
            <p className="mb-2">
              Search for a token address to distribute tokens to shareholders.
            </p>

            <div className="flex">
              <Input
                placeholder="Enter token address"
                onChange={setTokenAddress}
                value={tokenAddress}
              />
            </div>

            {tokenInfo && (
              <div className="flex gap-8 mt-4">
                <div>
                  <h3 className="text-lg font-bold">Token Name</h3>
                  <p>{tokenInfo.name}</p>
                </div>

                <div>
                  <h3 className="text-lg font-bold">Splitter Balance</h3>
                  <p>
                    {displayTokenBalance()} {tokenInfo.symbol}
                  </p>
                </div>
              </div>
            )}

            {tokenInfo && (
              <>
                <div className="h-8" />
                <Button
                  text="Distribute Tokens"
                  onClick={distributeTokens}
                  type="primary"
                  loading={loading || Number(tokenInfo.balance) === 0}
                />
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
