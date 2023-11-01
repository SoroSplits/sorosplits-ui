import { getUserInfo, signTransaction } from "@stellar/freighter-api"
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
  scValToNative,
} from "soroban-client"
import ba from "../utils/binascii"
import { hexToByte } from "../utils/hexToByte"
import { DataProps } from "../components/SplitterData"
import useWallet from "./useWallet"
import { config } from "../utils/config"

type ContractMethod =
  | "init"
  | "distribute_tokens"
  | "update_shares"
  | "lock_contract"

type QueryMethod =
  | "list_shares"
  | "get_config"
  | "get_token_balance"
  | "get_token_decimal"
  | "get_token_name"
  | "get_token_symbol"

interface CallContractArgs<T extends ContractMethod> {
  contractId: string
  method: ContractMethod
  args: MethodArgs<T>
}

type MethodArgs<T extends ContractMethod> = T extends "init"
  ? {
      admin: string
      shares: DataProps[]
      mutable: boolean
    }
  : T extends "distribute_tokens"
  ? { token_address: string }
  : T extends "update_shares"
  ? { shares: DataProps[] }
  : T extends "lock_contract"
  ? {}
  : never

interface QueryContractArgs<T extends QueryMethod> {
  contractId: string
  method: QueryMethod
  args: QueryArgs<T>
}

type QueryArgs<T extends QueryMethod> = T extends "list_shares"
  ? {}
  : T extends "get_config"
  ? {}
  : T extends "get_token_balance"
  ? { id: string }
  : T extends "get_token_decimal"
  ? {}
  : T extends "get_token_name"
  ? {}
  : T extends "get_token_symbol"
  ? {}
  : never

export interface ContractConfigResult {
  admin: string
  mutable: boolean
}

export interface TokenResult {
  name: string
  symbol: string
  balance: BigInt
  decimals: number
}

type QueryContractResult<T extends QueryMethod> = T extends "get_config"
  ? ContractConfigResult
  : T extends "list_shares"
  ? DataProps[]
  : T extends "get_token_balance"
  ? BigInt
  : T extends "get_token_decimal"
  ? number
  : T extends "get_token_name"
  ? string
  : T extends "get_token_symbol"
  ? string
  : never

const useContract = () => {
  const { isConnected, walletAddress } = useWallet()

  const initTxBuilder = async (publicKey: string, server: Server) => {
    const source = await server.getAccount(publicKey)
    return new TransactionBuilder(source, {
      fee: "10",
      networkPassphrase: config.networkPhrase,
    })
  }

  const checkFreighterConnection = async () => {
    if (!isConnected) {
      throw new Error("Freighter not connected")
    }
  }

  const deployAndInit = async ({
    shares,
    mutable,
  }: {
    shares: DataProps[]
    mutable: boolean
  }) => {
    await checkFreighterConnection()

    const server = new Server(config.rpcUrl)
    const userInfo = await getUserInfo()
    const account = await server.getAccount(userInfo.publicKey)
    const txBuilder = await initTxBuilder(userInfo.publicKey, server)
    const contract = new Contract(config.deployerContractId)

    let splitterArgs = [
      new Address(walletAddress || "").toScVal(),
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
      xdr.ScVal.scvBool(mutable),
    ]
    let deployerArgs = [
      nativeToScVal(account.accountId(), { type: "address" }),
      nativeToScVal(
        Buffer.from(ba.unhexlify(config.splitterWasmHash), "ascii"),
        {
          type: "bytes",
        }
      ),
      nativeToScVal(Buffer.from(randomBytes(32)), { type: "bytes" }),
      nativeToScVal("init", { type: "symbol" }),
      xdr.ScVal.scvVec(splitterArgs),
    ]
    let operation = contract.call("deploy", ...deployerArgs)

    let tx: Transaction = txBuilder
      .addOperation(operation)
      .setTimeout(TimeoutInfinite)
      .build()
    let preparedTx = (await server.prepareTransaction(tx)) as Transaction
    let signedTx = await signTransaction(preparedTx.toXDR(), {
      network: config.network,
      networkPassphrase: config.networkPhrase,
      accountToSign: userInfo.publicKey,
    })
    let transaction = TransactionBuilder.fromXDR(signedTx, config.networkPhrase)
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
          .vec()
          ?.at(0)
          ?.address()
          .contractId()
          .toString("hex") || ""
      return StrKey.encodeContract(hexToByte(contractId))
    } else throw new Error("Transaction failed")
  }

  const deploy = async () => {
    await checkFreighterConnection()

    const server = new Server(config.rpcUrl)
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
        Buffer.from(ba.unhexlify(config.splitterWasmHash), "ascii")
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
      network: config.network,
      networkPassphrase: config.networkPhrase,
      accountToSign: userInfo.publicKey,
    })
    let transaction = TransactionBuilder.fromXDR(signedTx, config.networkPhrase)
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
    shares: DataProps[],
    mutable: boolean
  ) => {
    console.log(
      new Address(shares[0].shareholder.toString()).toScVal().toXDR("base64")
    )
    console.log(
      new Address(shares[1].shareholder.toString()).toScVal().toXDR("base64")
    )

    return contract.call(
      "init",
      ...[
        new Address(walletAddress || "").toScVal(),
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
        xdr.ScVal.scvBool(mutable),
      ]
    )
  }

  const updateSharesOP = (contract: Contract, shares: DataProps[]) => {
    return contract.call(
      "update_shares",
      ...[
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

  const queryContract = async <T extends QueryMethod>({
    contractId,
    method,
    args,
  }: QueryContractArgs<T>): Promise<QueryContractResult<T>> => {
    const server = new Server(config.rpcUrl)
    const userInfo = await getUserInfo()
    const txBuilder = await initTxBuilder(userInfo.publicKey, server)
    const contract = new Contract(contractId)

    let operation: xdr.Operation<Operation>

    switch (method) {
      case "list_shares":
        operation = contract.call(method)
        break
      case "get_config":
        operation = contract.call(method)
        break
      case "get_token_balance":
        const balanceArgs = args as QueryArgs<"get_token_balance">
        operation = contract.call(
          "balance",
          ...[new Address(balanceArgs.id).toScVal()]
        )
        break
      case "get_token_decimal":
        operation = contract.call("decimals")
        break
      case "get_token_name":
        operation = contract.call("name")
        break
      case "get_token_symbol":
        operation = contract.call("symbol")
        break
      default:
        throw new Error("Invalid query method")
    }

    let tx: Transaction = txBuilder
      .addOperation(operation)
      .setTimeout(TimeoutInfinite)
      .build()

    let simulatedTx = await server.simulateTransaction(tx)

    if (SorobanRpc.isSimulationError(simulatedTx)) {
      throw new Error("Simulation failed")
    }
    let response = simulatedTx as SorobanRpc.SimulateTransactionSuccessResponse

    const scVal = response.result?.retval
    if (!scVal) throw new Error("Return value not found")

    return scValToNative(scVal)
  }

  const callContract = async <T extends ContractMethod>({
    contractId,
    method,
    args,
  }: CallContractArgs<T>) => {
    await checkFreighterConnection()

    const server = new Server(config.rpcUrl)
    const userInfo = await getUserInfo()
    const txBuilder = await initTxBuilder(userInfo.publicKey, server)
    const contract = new Contract(contractId)

    let operation: xdr.Operation<Operation>

    switch (method) {
      case "init":
        const initArgs = args as MethodArgs<"init">
        operation = initOP(contract, initArgs.shares, initArgs.mutable)
        break
      case "update_shares":
        const updateSharesArgs = args as MethodArgs<"update_shares">
        operation = updateSharesOP(contract, updateSharesArgs.shares)
        break
      case "lock_contract":
        operation = contract.call(method, ...[])
        break
      case "distribute_tokens":
        const distributeTokensArgs = args as MethodArgs<"distribute_tokens">
        operation = contract.call(
          method,
          ...[new Address(distributeTokensArgs.token_address).toScVal()]
        )
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
      network: config.network,
      networkPassphrase: config.networkPhrase,
      accountToSign: userInfo.publicKey,
    })
    let transaction = TransactionBuilder.fromXDR(signedTx, config.networkPhrase)
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
    deployAndInit,
    callContract,
    queryContract,
  }
}

export default useContract
