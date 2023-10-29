import {
  getUserInfo,
  signTransaction,
} from "@stellar/freighter-api"
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

const FUTURENET_RPC = "https://rpc-futurenet.stellar.org"
const TESTNET_RPC = "https://soroban-testnet.stellar.org:443"
const RPC_URL = FUTURENET_RPC

const FUTURENET_NETWORK_PASSPHRASE = "Test SDF Future Network ; October 2022"
const TESTNET_NETWORK_PASSPHRASE = "Test SDF Network ; September 2015"
const NETWORK_PASSPHRASE = FUTURENET_NETWORK_PASSPHRASE

type ContractMethod =
  | "init"
  | "distributeTokens"
  | "updateShares"
  | "lock_contract"

type QueryMethod = "list_shares" | "get_config"

interface CallContractArgs<T extends ContractMethod> {
  contractId: string
  method: ContractMethod
  args: MethodArgs<T>
}

type MethodArgs<T extends ContractMethod> = T extends "init"
  ? {
      admin: string
      shares: DataProps[]
    }
  : T extends "distributeTokens"
  ? { token_address: string }
  : T extends "updateShares"
  ? { shares: DataProps[] }
  : T extends "lock_contract"
  ? {}
  : never

interface QueryContractArgs {
  contractId: string
  method: QueryMethod
}

export interface ContractConfigResult {
  admin: string
  mutable: boolean
}

type QueryContractResult<T extends QueryMethod> = T extends "get_config"
  ? ContractConfigResult
  : T extends "list_shares"
  ? DataProps[]
  : never

const useContract = () => {
  const { isConnected, walletAddress } = useWallet()

  const initTxBuilder = async (publicKey: string, server: Server) => {
    const source = await server.getAccount(publicKey)
    return new TransactionBuilder(source, {
      fee: "10",
      networkPassphrase: NETWORK_PASSPHRASE,
    })
  }

  const checkFreighterConnection = async () => {
    if (!isConnected) {
      throw new Error("Freighter not connected")
    }
  }

  const deploy = async () => {
    await checkFreighterConnection()

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
      networkPassphrase: NETWORK_PASSPHRASE,
      accountToSign: userInfo.publicKey,
    })
    let transaction = TransactionBuilder.fromXDR(
      signedTx,
      NETWORK_PASSPHRASE
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
    shares: DataProps[]
  ) => {
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

  const updateShares = async (contractId: string, shares: DataProps[]) => {
    await checkFreighterConnection()
    // const contract = getContract(contractId)

    // const res = await contract.updateShares({ shares })
    // if (res.isErr()) throw new Error(res.unwrapErr().message)
  }

  const queryContract = async <T extends QueryMethod>({
    contractId,
    method,
  }: QueryContractArgs): Promise<QueryContractResult<T>> => {
    const server = new Server(RPC_URL)
    const userInfo = await getUserInfo()
    const txBuilder = await initTxBuilder(userInfo.publicKey, server)
    const contract = new Contract(contractId)

    let operation: xdr.Operation<Operation>

    switch (method) {
      case "list_shares":
        operation = contract.call(method, ...[])
        break
      case "get_config":
        operation = contract.call(method, ...[])
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

    const server = new Server(RPC_URL)
    const userInfo = await getUserInfo()
    const txBuilder = await initTxBuilder(userInfo.publicKey, server)
    const contract = new Contract(contractId)

    let operation: xdr.Operation<Operation>

    switch (method) {
      case "init":
        const { shares } = args as MethodArgs<"init">
        operation = initOP(contract, shares)
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
      networkPassphrase: NETWORK_PASSPHRASE,
      accountToSign: userInfo.publicKey,
    })
    let transaction = TransactionBuilder.fromXDR(
      signedTx,
      NETWORK_PASSPHRASE
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
    queryContract,
  }
}

export default useContract
