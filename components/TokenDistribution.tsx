import { useCallback, useEffect, useState } from "react"
import Input from "./Input"
import useContract, { TokenResult } from "../hooks/useContract"
import { errorToast, loadingToast, successToast } from "../utils/toast"
import useAppStore from "../store"
import Button from "./Button"

interface TokenDistributionProps {
  splitterContractAddress: string
}

const TokenDistribution = ({
  splitterContractAddress,
}: TokenDistributionProps) => {
  const { callContract, queryContract } = useContract()
  const { loading, setLoading } = useAppStore()

  const [tokenAddress, setTokenAddress] = useState("")
  const [tokenInfo, setTokenInfo] = useState<TokenResult>()

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
          args: { id: splitterContractAddress },
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
  }, [tokenAddress])

  useEffect(() => {
    const timeout = setTimeout(async () => {
      await fetchTokenBalance()
    })
    return () => clearTimeout(timeout)
  }, [tokenAddress, fetchTokenBalance])

  const distributeTokens = async () => {
    try {
      setLoading(true)

      if (!tokenInfo) return

      loadingToast("Distributing tokens to shareholders...")

      await callContract({
        contractId: splitterContractAddress,
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
  )
}

export default TokenDistribution
