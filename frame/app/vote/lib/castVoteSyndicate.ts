// try {
//   const result = await castVote(address, state.vote - 1);
//   const voteRes = await fetch(`https://frame.syndicate.io/api/v2/sendTransaction`, {
//     method: "POST",
//     headers: {
//       "Content-Type": "application/json",
//       "Authorization": `Bearer ${process.env.SYNDICATE_API_KEY}`,
//     },
//     body: JSON.stringify({
//       frameTrustedData: trustedData,
//       contractAddress: VOTE_CONTRACT,
//       functionSignature: "castVoteOnBehalf(address _voter, uint256 _optionId)",
//       args: { _voter: address, _optionId: state.vote - 1 },
//     }),
//   });

//   const voteResJson = await voteRes.json();
//   console.log({ voteResJson })
//   if (voteResJson.status ? voteResJson.status === "false" : false) {
//     state.pageIndex = -1;
//     return (
//       <FrameContainer
//         pathname="/vote"
//         postUrl="/vote/frames"
//         state={state}
//         previousFrame={previousFrame}
//       >
//         <FrameImage src={imageOops}></FrameImage>
//         <FrameButton>🏠</FrameButton>
//         <FrameButton>→</FrameButton>
//       </FrameContainer>
//     )
//   }
//   state.transactionId = voteResJson.data.transactionId;
// } catch (e) {
//   return (
//     <FrameContainer
//       pathname="/vote"
//       postUrl="/vote/frames"
//       state={state}
//       previousFrame={previousFrame}
//     >
//       <FrameImage src={imageOops}></FrameImage>
//       <FrameButton>🏠</FrameButton>
//       <FrameButton>→</FrameButton>
//     </FrameContainer>
//   )
// }