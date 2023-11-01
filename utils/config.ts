interface ConfigItem {
  network: string
  rpcUrl: string
  networkPhrase: string
  deployerContractId: string
  splitterWasmHash: string
}

interface Config {
  futurenet: ConfigItem
  testnet: ConfigItem
}

const SPLITTER_WASM_HASH =
  "d743d91093fc8dfbc59db3395f70bafa0a61ea46bd21d206e52b3d4822ea5c5d"

export const CONFIG: Config = {
  futurenet: {
    network: "futurenet",
    rpcUrl: "https://rpc-futurenet.stellar.org",
    networkPhrase: "Test SDF Future Network ; October 2022",
    deployerContractId:
      "CDWA37HMQ7DDOR4JKLKWHE4AILNHZS434QS53OR7MCVLLOUISC4GA777",
    splitterWasmHash: SPLITTER_WASM_HASH,
  },
  testnet: {
    network: "testnet",
    rpcUrl: "https://soroban-testnet.stellar.org:443",
    networkPhrase: "Test SDF Network ; September 2015",
    deployerContractId: "",
    splitterWasmHash: SPLITTER_WASM_HASH,
  },
}

export const config = CONFIG["futurenet"]
