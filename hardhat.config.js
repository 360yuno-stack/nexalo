require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();
require("solidity-coverage");
require("hardhat-gas-reporter");

const PRIVATE_KEY = process.env.PRIVATE_KEY || "";

module.exports = {
  solidity: {
    version: "0.8.20",
    settings: {
      viaIR: true,
      optimizer: { enabled: true, runs: 200 },
    },
  },

  networks: {
    hardhat: {
      chainId: 31337,
      blockGasLimit: 30_000_000,
      gasPrice: "auto",
      allowUnlimitedContractSize: true,
      throwOnCallFailures: true,
      throwOnTransactionFailures: true,
      mining: {
        auto: true,
        interval: 0
      }
    },
    bscTestnet: {
      url:
        process.env.BSC_TESTNET_RPC_URL ||
        "https://data-seed-prebsc-1-s1.binance.org:8545/",
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
      chainId: 97,
    },
  },

  etherscan: {
    apiKey: process.env.BSCSCAN_API_KEY || "",
    customChains: [
      {
        network: "bscTestnet",
        chainId: 97,
        urls: {
          apiURL: "https://api-testnet.bscscan.com/api",
          browserURL: "https://testnet.bscscan.com",
        },
      },
    ],
  },

  gasReporter: {
    enabled: true,
    currency: "USD",
    outputFile: "reports/gas-report.txt",
    noColors: true,
  },
};
