import { VOTE_CONTRACT, VOTE_CHAIN } from "./constants";
import { createWalletClient, createPublicClient, http } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
 
export const castVote = async (address: `0x${string}`, option: number) => {
  if (!address) return {
    error: "No address provided",
    result: null,
    tx: null,
  };
  const account = privateKeyToAccount((process.env.PRIVATE_KEY || '0x0000000000000000000000000000000000000000') as `0x${string}`);
  const publicClient = createPublicClient({
    chain: VOTE_CHAIN,
    transport: http()
  }); 
  const walletClient = createWalletClient({
    account,
    chain: VOTE_CHAIN,
    transport: http()
  });
  const gasPrice = await publicClient.getGasPrice();
  const params = {
    account,
    address: VOTE_CONTRACT,
    abi: [{
      inputs: [
          { name: "_voter", type: "address" },
          { name: "_optionId", type: "uint256" }
      ],
      name: "castVoteOnBehalf",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function"
    }],
    functionName: 'castVoteOnBehalf',
    args: [address, BigInt(option)],
    gasPrice,
  } as const;
  const simulation = await publicClient.simulateContract(params);
  const result = simulation.result;
  console.log({ result, simulation })
  const tx = await walletClient.writeContract(simulation.request);
  console.log({ tx })

  return {
    result,
    tx,
    error: null
  };
};