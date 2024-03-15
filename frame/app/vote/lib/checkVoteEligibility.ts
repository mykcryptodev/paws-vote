import { VOTE_CONTRACT, VOTE_CHAIN } from "./constants";
import { getAddressForFid } from "frames.js";
import { createPublicClient, http } from 'viem'

export const checkVoteEligibility = async (requesterFid: number | undefined) => {
  if (!requesterFid) return {
    hasVoted: false,
    votingEnded: false,
    isEligible: false,
    hasVotingTokens: false,
  };
  const address = await getAddressForFid({
    fid: requesterFid,
    options: { fallbackToCustodyAddress: true }
  });
  if (!address) return {
    hasVoted: false,
    votingEnded: false,
    isEligible: false,
  };
  const publicClient = createPublicClient({
    chain: VOTE_CHAIN,
    transport: http()
  });
  const [hasVoted, voteEnded, votingTokenBalance] = await Promise.all([
    publicClient.readContract({
      address: VOTE_CONTRACT,
      abi: [{
        inputs: [{ name: "address", type: "address"}],
        name: "hasVoted",
        outputs: [{ name: "", type: "bool" }],
        stateMutability: "view",
        type: "function",
      }],
      functionName: "hasVoted",
      args: [address],
    }),
    publicClient.readContract({
      address: VOTE_CONTRACT,
      abi: [{
        inputs: [],
        name: "votingEnd",
        outputs: [{ name: "", type: "uint256" }],
        stateMutability: "view",
        type: "function",
      }],
      functionName: "votingEnd",
    }),
    publicClient.readContract({
      address: VOTE_CONTRACT,
      abi: [{
        inputs: [{ name: "address", type: "address"}],
        name: "balanceOf",
        outputs: [{ name: "", type: "uint256" }],
        stateMutability: "view",
        type: "function",
      }],
      functionName: "balanceOf",
      args: [address],
    }),
  ]);
  const now = Math.floor(Date.now() / 1000);
  const votingEndTimestamp = Number(voteEnded.toString());
  console.log(
    {
      now: now.toLocaleString(),
      votingEndTimestamp: votingEndTimestamp.toLocaleString(),
      votingTokenBalance: votingTokenBalance.toLocaleString(),
    }
  )
  const hasVotingTokens = Number(votingTokenBalance.toString()) > 0;
  const votingEnded = now > votingEndTimestamp;
  const isEligible = !hasVoted && !votingEnded && hasVotingTokens;

  console.log({
    hasVoted,
    votingEnded,
    isEligible,
    hasVotingTokens,
    votingTokenBalance: votingTokenBalance.toString(),
  });

  return {
    hasVoted,
    votingEnded,
    isEligible,
    hasVotingTokens,
  };
};