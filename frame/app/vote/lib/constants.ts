import { defineChain } from 'viem';

const syndicate = defineChain({
  id: 5101,
  name: "Syndicate",
  nativeCurrency: {
    name: "Ether",
    symbol: "ETH",
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ["https://rpc-frame.syndicate.io"],
    },
  },
  blockExplorerUrls: {
    default: { name: "Blockscout", url: "https://explorer-frame.syndicate.io" },
  },
});

export const VOTE_CONTRACT = "0x41f999597F62991dE0f43860023fA2f29A99A8A5";
export const VOTE_CHAIN = syndicate;
