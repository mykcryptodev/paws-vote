# paws-vote

1. Deploy a new contract via thirdweb to the base network ✅
2. Use postman to make a new api key for syndicate on the base network (https://frame.syndicate.io/) ✅

- Don't skip this. Each contract needs its own api key!!

3. Make the address from syndicate as a VOTE_ON_BEHALF role on the contract ✅
4. In frame/app/vote/lib/constants, update VOTE_CONTRACT to the address of the new contract ✅
5. Update the contractAddress in airdrop/airdrop.js to be the gaslite airdrop contract address ✅
6. Update the tokenAddress in airdrop/airdrop.js to be the contract deployed in step 1 ✅
7. Create the vote in the vote contract
8. Run the airdrop by going to /airdrop and running node airdrop.js (this could be gassy before decun)
9. Update the contract address in the nft marketplace template github to let people vote on the dapp ✅
10. Post the farcaster frame
