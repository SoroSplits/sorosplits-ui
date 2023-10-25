import { useEffect, useState } from "react"
import { isConnected, isAllowed, getUserInfo } from "@stellar/freighter-api"
import { Contract, networks, ShareDataKey } from "sorosplits-splitter"
import { randomBytes } from "crypto"

const SorobanClient = require("soroban-client")
import { Operation, Address, xdr } from "stellar-base"

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
    const server = new SorobanClient.Server("https://rpc-futurenet.stellar.org")
    const userInfo = await getUserInfo()

    const account = await server.getAccount(userInfo.publicKey)

    const func = xdr.HostFunction.hostFunctionTypeCreateContract(
      new xdr.CreateContractArgs({
        contractIdPreimage:
          xdr.ContractIdPreimage.contractIdPreimageFromAddress(
            new xdr.ContractIdPreimageFromAddress({
              address: Address.fromString(account._accountId).toScAddress(),
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

    let txBuilder = new SorobanClient.TransactionBuilder(account, {
      fee: '10000',
      networkPassphrase: "Test SDF Future Network ; October 2022",
      // networkPassphrase: "Test SDF Network ; September 2015",
    })

    let operation = Operation.invokeHostFunction({
      func,
      auth: [],
    })
  
    // console.log(operation.toXDR('base64'))
  
    txBuilder.addOperation(operation)
    txBuilder.setTimeout(10)
    
    let transaction = txBuilder.build()
    // console.log(JSON.stringify(transaction))

    console.log(transaction.toXDR())

    // let response = await server.simulateTransaction(transaction)
    // console.log(response)
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
    if (res.isOk()) {
      console.log(res.unwrap())
    } else {
      console.log(res.unwrapErr())
    }
  }

  const getConfig = async () => {
    if (!contract) return
    await checkFreighterConnection()

    const res = await contract.getConfig()
    if (res.isOk()) {
      console.log(res.unwrap())
    } else {
      console.log(res.unwrapErr())
    }
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
