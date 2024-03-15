import { Chain, defineChain } from 'viem';
// import { base } from 'viem/chains';

// const syndicate = defineChain({
//   id: 5101,
//   name: "Syndicate",
//   nativeCurrency: {
//     name: "Ether",
//     symbol: "ETH",
//     decimals: 18,
//   },
//   rpcUrls: {
//     default: {
//       http: ["https://rpc-frame.syndicate.io"],
//     },
//   },
//   blockExplorerUrls: {
//     default: { name: "Blockscout", url: "https://explorer-frame.syndicate.io" },
//   },
// });

const base = defineChain({
  id: 8453,
  name: "Base",
  network: "base",
  nativeCurrency: {
    name: "Ether",
    symbol: "ETH",
    decimals: 18,
  },
  rpcUrls: {
    public: {
      http: ["https://chain-proxy.wallet.coinbase.com?targetName=base"],
    },
    default: {
      http: ["https://chain-proxy.wallet.coinbase.com?targetName=base"],
    },
  },
  blockExplorers: {
    default: { name: "Blockscout", url: "https://explorer-frame.syndicate.io" },
  },
})

//export const VOTE_CONTRACT = "0x41f999597F62991dE0f43860023fA2f29A99A8A5";
//export const VOTE_CHAIN = syndicate;
export const VOTE_CONTRACT = "0x6e259376Bac4aB281C9d1C89a6c0149D7E8a0d42";
export const VOTE_CHAIN: Chain = base;
