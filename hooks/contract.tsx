import { useEffect, useState } from "react"
import { isConnected, isAllowed, getUserInfo, signTransaction } from "@stellar/freighter-api"
import { Contract, networks, ShareDataKey } from "sorosplits-splitter"
import { randomBytes } from "crypto"

import {
  Account,
  Address,
  Asset,
  Memo,
  Operation,
  Server,
  SorobanRpc,
  TimeoutInfinite,
  Transaction,
  TransactionBuilder,
  xdr,
} from "soroban-client"

const useContract = () => {
  const [contract, setContract] = useState<Contract>()

  useEffect(() => {
    const contract = new Contract({
      contractId: networks.futurenet.contractId,
      rpcUrl: "https://rpc-futurenet.stellar.org",
      networkPassphrase: networks.futurenet.networkPassphrase,
    })
    setContract(contract)
  }, [])

  const checkFreighterConnection = async () => {
    const connected = await isConnected()
    const allowed = await isAllowed()
    const userInfo = await getUserInfo()
    if (!connected || !allowed) throw new Error("Freighter not connected")
    if (userInfo.publicKey === "") throw new Error("Freighter not connected")
  }

  const deploy = async () => {
    const server = new Server("https://rpc-futurenet.stellar.org")
    const userInfo = await getUserInfo()

    const account = await server.getAccount(userInfo.publicKey)

    const func = xdr.HostFunction.hostFunctionTypeCreateContract(
      new xdr.CreateContractArgs({
        contractIdPreimage:
          xdr.ContractIdPreimage.contractIdPreimageFromAddress(
            new xdr.ContractIdPreimageFromAddress({
              address: Address.fromString(account.accountId()).toScAddress(),
              salt: randomBytes(32),
            })
          ),
        executable: xdr.ContractExecutable.contractExecutableWasm(
          Buffer.from(
            "b053248d579b13717ea635c70727658eb8fee731c01f658152ddc72a1035e246",
            "hex"
          )
        ),
      })
    )

    // console.log(func.toXDR('base64'))

    let txBuilder = new TransactionBuilder(account, {
      fee: "10000",
      networkPassphrase: "Test SDF Future Network ; October 2022",
      // networkPassphrase: "Test SDF Network ; September 2015",
    })

    let operation = Operation.invokeHostFunction({
      func,
      auth: [],
    })

    txBuilder.addOperation(operation)
    txBuilder.setTimeout(10)

    let transaction = txBuilder.build()

    await server.prepareTransaction(transaction)

    let res = await signTransaction(transaction.toXDR())
    console.log(res)

    let tx = TransactionBuilder.fromXDR(res, "Test SDF Future Network ; October 2022")

    let str = await server.sendTransaction(tx)
    console.log(str)
  }

  const init = async (admin: string, shares: ShareDataKey[]) => {
    if (!contract) return
    await checkFreighterConnection()

    const res = await contract.init({
      admin: Address.fromString(admin),
      shares,
    })

    console.log(res)

    if (res.isOk()) {
      console.log(res.unwrap())
    } else {
      console.log(res.unwrapErr())
    }
  }

  const distributeTokens = async (tokenAddress: string) => {
    if (!contract) return
    await checkFreighterConnection()

    const res = await contract.distributeTokens({
      token_address: Address.fromString(tokenAddress),
    })
    if (res.isOk()) {
      console.log(res.unwrap())
    } else {
      console.log(res.unwrapErr())
    }
  }

  const updateShares = async (shares: ShareDataKey[]) => {
    if (!contract) return
    await checkFreighterConnection()

    const res = await contract.updateShares({ shares })

    if (res.isOk && res.isOk()) {
      console.log(res.unwrap())
    } else if (res.isErr && res.isErr()) {
      console.log(res.unwrapErr())
    }
  }

  const lockContract = async () => {
    if (!contract) return
    await checkFreighterConnection()

    const res = await contract.lockContract()

    console.log(res)

    if (res.isOk && res.isOk()) {
      console.log(res.unwrap())
    } else if (res.isErr && res.isErr()) {
      console.log(res.unwrapErr())
    }
  }

  const getShare = async (shareholder: string) => {
    if (!contract) return
    await checkFreighterConnection()

    const res = await contract.getShare({
      shareholder: Address.fromString(shareholder),
    })
    if (res.isOk()) {
      console.log(res.unwrap())
    } else {
      console.log(res.unwrapErr())
    }
  }

  const listShares = async () => {
    if (!contract) return
    await checkFreighterConnection()

    const res = await contract.listShares()
    if (res.isOk()) return res.unwrap() 
    else throw new Error(res.unwrapErr().message)
  }

  const getConfig = async () => {
    if (!contract) return
    await checkFreighterConnection()

    const res = await contract.getConfig()
    if (res.isOk()) return res.unwrap() 
    else throw new Error(res.unwrapErr().message)
  }

  return {
    init,
    distributeTokens,
    updateShares,
    lockContract,
    getShare,
    listShares,
    getConfig,
    deploy,
  }
}

export default useContract
