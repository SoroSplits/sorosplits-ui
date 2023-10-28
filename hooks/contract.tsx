import { useEffect, useState } from "react"
import {
  isConnected,
  isAllowed,
  getUserInfo,
  signTransaction,
} from "@stellar/freighter-api"
import {
  networks,
  ShareDataKey,
  Contract as SplitterContract,
} from "sorosplits-splitter"
import { randomBytes } from "crypto"

import {
  Address,
  Operation,
  Server,
  SorobanRpc,
  TimeoutInfinite,
  Transaction,
  TransactionBuilder,
  xdr,
  Contract,
  nativeToScVal,
  StrKey,
} from "soroban-client"
import ba from "../utils/binascii"
import { hexToByte } from "../utils/hexToByte"

// const TESTNET_RPC = "https://soroban-testnet.stellar.org:443"
const FUTURENET_RPC = "https://rpc-futurenet.stellar.org"
const RPC_URL = FUTURENET_RPC

type ContractMethod =
  | "init"
  | "distributeTokens"
  | "updateShares"
  | "lock_contract"

interface CallContractArgs<T extends ContractMethod> {
  contractId: string
  method: ContractMethod
  args: MethodArgs<T>
}

type MethodArgs<T extends ContractMethod> = T extends "init"
  ? {
      admin: string
      shares: ShareDataKey[]
    }
  : T extends "distributeTokens"
  ? { token_address: string }
  : T extends "updateShares"
  ? { shares: ShareDataKey[] }
  : T extends "lock_contract"
  ? {}
  : never

const useContract = () => {
  const initTxBuilder = async (publicKey: string, server: Server) => {
    const source = await server.getAccount(publicKey)
    return new TransactionBuilder(source, {
      fee: "10",
      networkPassphrase: networks.futurenet.networkPassphrase,
    })
  }

  const checkFreighterConnection = async () => {
    const connected = await isConnected()
    const allowed = await isAllowed()
    const userInfo = await getUserInfo()
    if (!connected || !allowed) throw new Error("Freighter not connected")
    if (userInfo.publicKey === "") throw new Error("Freighter not connected")
  }

  const getSplitterContract = (contractId: string) => {
    return new SplitterContract({
      contractId,
      rpcUrl: RPC_URL,
      networkPassphrase: networks.futurenet.networkPassphrase,
    })
  }

  const deploy = async () => {
    const server = new Server(RPC_URL)
    const userInfo = await getUserInfo()
    const account = await server.getAccount(userInfo.publicKey)
    const txBuilder = await initTxBuilder(userInfo.publicKey, server)

    const contractIdPreimageFromAddress = new xdr.ContractIdPreimageFromAddress(
      {
        address: Address.fromString(account.accountId()).toScAddress(),
        salt: Buffer.from(randomBytes(32)),
      }
    )
    const contractIdPreimage =
      xdr.ContractIdPreimage.contractIdPreimageFromAddress(
        contractIdPreimageFromAddress
      )

    const createContract = new xdr.CreateContractArgs({
      contractIdPreimage: contractIdPreimage,
      executable: xdr.ContractExecutable.contractExecutableWasm(
        Buffer.from(
          ba.unhexlify(
            "b053248d579b13717ea635c70727658eb8fee731c01f658152ddc72a1035e246"
          ),
          "ascii"
        )
      ),
    })

    let hf: xdr.HostFunction =
      xdr.HostFunction.hostFunctionTypeCreateContract(createContract)
    let op: any = Operation.invokeHostFunction({
      func: hf,
      auth: [],
    })

    let tx: Transaction = txBuilder
      .addOperation(op)
      .setTimeout(TimeoutInfinite)
      .build()
    let preparedTx = (await server.prepareTransaction(tx)) as Transaction
    let signedTx = await signTransaction(preparedTx.toXDR(), {
      network: "futurenet",
      networkPassphrase: networks.futurenet.networkPassphrase,
      accountToSign: userInfo.publicKey,
    })
    let transaction = TransactionBuilder.fromXDR(
      signedTx,
      networks.futurenet.networkPassphrase
    )
    let txRes = await server.sendTransaction(transaction)

    let confirmation
    do {
      confirmation = await server.getTransaction(txRes.hash)
      if (confirmation.status !== SorobanRpc.GetTransactionStatus.NOT_FOUND) {
        break
      }
      await new Promise((resolve) => setTimeout(resolve, 1000))
    } while (true)

    if (
      confirmation.status === SorobanRpc.GetTransactionStatus.SUCCESS &&
      confirmation.resultMetaXdr
    ) {
      console.log(confirmation.resultMetaXdr.toXDR("base64"))
      const buff = Buffer.from(
        confirmation.resultMetaXdr.toXDR("base64"),
        "base64"
      )
      const txMeta = xdr.TransactionMeta.fromXDR(buff)
      const contractId =
        txMeta
          .v3()
          .sorobanMeta()
          ?.returnValue()
          .address()
          .contractId()
          .toString("hex") || ""
      return StrKey.encodeContract(hexToByte(contractId))
    } else throw new Error("Transaction failed")
  }

  const initOP = (
    contract: Contract,
    admin: string,
    shares: ShareDataKey[]
  ) => {
    return contract.call(
      "init",
      ...[
        new Address(admin).toScVal(),
        xdr.ScVal.scvVec(
          shares.map((item) => {
            xdr.ScVal
            return xdr.ScVal.scvMap([
              new xdr.ScMapEntry({
                key: xdr.ScVal.scvSymbol("share"),
                val: nativeToScVal(item.share, { type: "i128" }),
              }),
              new xdr.ScMapEntry({
                key: xdr.ScVal.scvSymbol("shareholder"),
                val: new Address(item.shareholder.toString()).toScVal(),
              }),
            ])
          })
        ),
      ]
    )
  }

  const distributeTokens = async (tokenAddress: string) => {
    await checkFreighterConnection()

    // const res = await contract.distributeTokens({
    //   token_address: Address.fromString(tokenAddress),
    // })
    // if (res.isErr()) throw new Error(res.unwrapErr().message)
  }

  const updateShares = async (contractId: string, shares: ShareDataKey[]) => {
    await checkFreighterConnection()
    // const contract = getContract(contractId)

    // const res = await contract.updateShares({ shares })
    // if (res.isErr()) throw new Error(res.unwrapErr().message)
  }

  const lockContract = async (contractId: string) => {
    await checkFreighterConnection()
    // const contract = getContract(contractId)

    // const res = await contract.lockContract()
    // if (res.isErr()) throw new Error(res.unwrapErr().message)
  }

  const listShares = async (contractId: string) => {
    await checkFreighterConnection()
    const contract = getSplitterContract(contractId)

    const res = await contract.listShares()
    if (res.isOk()) return res.unwrap()
    else throw new Error(res.unwrapErr().message)
  }

  const getConfig = async (contractId: string) => {
    await checkFreighterConnection()
    const contract = getSplitterContract(contractId)

    const res = await contract.getConfig()
    if (res.isOk()) return res.unwrap()
    else throw new Error(res.unwrapErr().message)
  }

  const callContract = async <T extends ContractMethod>({
    contractId,
    method,
    args,
  }: CallContractArgs<T>) => {
    await checkFreighterConnection()

    const server = new Server(RPC_URL)
    const userInfo = await getUserInfo()
    const txBuilder = await initTxBuilder(userInfo.publicKey, server)
    const contract = new Contract(contractId)

    let operation: xdr.Operation<Operation>

    switch (method) {
      case "init":
        const { admin, shares } = args as MethodArgs<"init">
        operation = initOP(contract, admin, shares)
        break
      case "lock_contract":
        operation = contract.call(method, ...[])
        break
      default:
        throw new Error("Invalid method")
    }

    let tx: Transaction = txBuilder
      .addOperation(operation)
      .setTimeout(TimeoutInfinite)
      .build()
    let preparedTx = (await server.prepareTransaction(tx)) as Transaction
    let signedTx = await signTransaction(preparedTx.toXDR(), {
      network: "futurenet",
      networkPassphrase: networks.futurenet.networkPassphrase,
      accountToSign: userInfo.publicKey,
    })
    let transaction = TransactionBuilder.fromXDR(
      signedTx,
      networks.futurenet.networkPassphrase
    )
    let txRes = await server.sendTransaction(transaction)

    let confirmation
    do {
      confirmation = await server.getTransaction(txRes.hash)
      if (confirmation.status !== SorobanRpc.GetTransactionStatus.NOT_FOUND) {
        break
      }
      await new Promise((resolve) => setTimeout(resolve, 1000))
    } while (true)

    if (confirmation.status === SorobanRpc.GetTransactionStatus.FAILED) {
      throw new Error("Transaction failed")
    }
  }

  return {
    deploy,
    callContract,
    listShares,
    getConfig,
  }
}

export default useContract
