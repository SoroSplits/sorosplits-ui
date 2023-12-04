interface Config {
  network: string
  rpcUrl: string
  networkPhrase: string
  deployerContractId: string
  splitterWasmHash: string
}

const NETWORK = process.env.NETWORK || ""
const SPLITTER_WASM_HASH = process.env.SPLITTER_WASM_HASH || ""
const DEPLOYER_CONTRACT_ID = process.env.DEPLOYER_CONTRACT_ID || ""

const getRpcUrl = () => {
  switch (NETWORK) {
    case "futurenet":
      return "https://rpc-futurenet.stellar.org"
    case "testnet":
      return "https://soroban-testnet.stellar.org:443"
    case "mainnet":
      return ""
    default:
      return ""
  }
}

const getNetworkPhrase = () => {
  switch (NETWORK) {
    case "futurenet":
      return "Test SDF Future Network ; October 2022"
    case "testnet":
      return "Test SDF Network ; September 2015"
    case "mainnet":
      return ""
    default:
      return ""
  }
}

export const CONFIG: Config = {
  network: NETWORK,
  rpcUrl: getRpcUrl(),
  networkPhrase: getNetworkPhrase(),
  splitterWasmHash: SPLITTER_WASM_HASH,
  deployerContractId: DEPLOYER_CONTRACT_ID
}

export const config = CONFIG
