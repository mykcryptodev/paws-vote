import {
  FrameButton,
  FrameContainer,
  FrameImage,
  FrameReducer,
  NextServerPageProps,
  getFrameMessage,
  getPreviousFrame,
  useFramesReducer,
} from "frames.js/next/server";
import Link from "next/link";
import { currentURL } from "../utils";
import { DEFAULT_DEBUGGER_HUB_URL, createDebugUrl } from "../debug";
import { getAddressForFid } from "frames.js";
import { VOTE_CONTRACT } from "./lib/constants";
import { checkVoteEligibility } from "./lib/checkVoteEligibility";
import { castVote } from "./lib/castVote";

type State = {
  vote: null | 1 | 2 | 3 | 4;
  pageIndex: number;
  transactionId: string | null;
};

const votingPage = 4;
const initialState: State = { pageIndex: 0, vote: null, transactionId: null };
let trustedData: string | undefined | null = null;

const reducer: FrameReducer<State> = (state, action) => {
  console.log(JSON.stringify(state))
  const buttonIndex = action.postBody?.untrustedData.buttonIndex;

  // user wants to skip to vote
  if (buttonIndex && buttonIndex === 2 && state.pageIndex === 0) {
    return {
      pageIndex: votingPage,
      transactionId: null,
      vote: null,
    };
  }

  // user wants to go home
  if (buttonIndex && buttonIndex === 1 && state.pageIndex < votingPage && state.pageIndex > 0) {
    return {
      pageIndex: 0,
      transactionId: null,
      vote: null,
    };
  }

  return {
    pageIndex: state.pageIndex + 1,
    vote: state.pageIndex === votingPage ? buttonIndex as 1 | 2 | 3 | 4 : null,
    transactionId: null,
  };
};

// This is a react server component only
export default async function Home({
  params,
  searchParams,
}: NextServerPageProps) {
  const url = currentURL("/examples/user-data");
  const previousFrame = getPreviousFrame<State>(searchParams);

  const imageBaseUrl = 'https://ipfs.io/ipfs/QmVBkV18Nmuk3ktkQXpUCUtQEt6rwZyP1NP4xkEGor4a9Q/';
  const imageOops = 'https://ipfs.io/ipfs/QmeFuPTqSXJWrfs5sD58anr2xgWHPss7oFdCiC7CjvSLmt/oops.png';
  const voteImgUrl = 'https://ipfs.io/ipfs/QmS9YyjVtcbCGdbfL4dJwPwDLo2ZNSppWgRaJYYSEhn8ew/Copy%20of%20Vote!.png';

  const frameMessage = await getFrameMessage(previousFrame.postBody, {
    // hubHttpUrl: DEFAULT_DEBUGGER_HUB_URL,
    hubHttpUrl: "https://hub.freefarcasterhub.com:3281",
    fetchHubContext: true,
  });

  if (frameMessage && !frameMessage?.isValid) {
    throw new Error("Invalid frame payload");
  }

  const [state, dispatch] = useFramesReducer<State>(
    reducer,
    initialState,
    previousFrame
  );

  // Here: do a server side side effect either sync or async (using await), such as minting an NFT if you want.
  // example: load the users credentials & check they have an NFT
  console.log("info: state is:", state);
  const imageUri = () => {
    switch (state.pageIndex) {
      case 0:
        return 'page1.png'
      case 1:
        return 'history1.png'
      case 2:
        return 'history2.png'
      case 3:
        return 'airdrop.png'
      case 4:
        return 'vote.png'
      case 5:
        return 'thanks.png'
    }
  }
  let imageUrl = `${imageBaseUrl}${imageUri()}`;

  // check eligibility
  if (state.pageIndex === votingPage) {
    const { hasVoted, votingEnded, isEligible, userVote } = await checkVoteEligibility(
      frameMessage?.requesterFid
    );
    if (hasVoted) {
      const tyImgBase = 'https://ipfs.io/ipfs/QmaHe4DFzWjQKpyR9SKWHUZq47G7baQeZkGHde5s3aVyQE/'
      switch (userVote) {
        case 0:
          imageUrl = `${tyImgBase}1.png`;
          break;
        case 1:
          imageUrl = `${tyImgBase}2.png`;
          break;
        case 2:
          imageUrl = `${tyImgBase}3.png`;
          break;
        case 3:
          imageUrl = `${tyImgBase}4.png`;
          break;
        default:
          imageUrl = `${imageBaseUrl}thanks.png`;
          break;
      }
      state.pageIndex = votingPage + 2;
    } else if (votingEnded) {
      imageUrl = `${imageBaseUrl}over.png`;
      state.pageIndex = votingPage + 2;
    } else if (!isEligible) {
      imageUrl = imageOops;
      state.pageIndex = votingPage + 2;
    }
  }

  // Cast vote if user voted
  if (state.pageIndex === votingPage + 1 && previousFrame && frameMessage && state.vote !== null) {
    trustedData = previousFrame.postBody?.trustedData.messageBytes;
    const address = await getAddressForFid({
      fid: frameMessage.requesterFid,
      options: { fallbackToCustodyAddress: true }
    });

    console.log('state.vote is', state.vote);
    console.log('voting option is: ', state.vote - 1);

    try {
      const result = await castVote(address, state.vote - 1);
      if (!result.tx || result.error !== null) {
        state.pageIndex = -1;
        return (
          <FrameContainer
            pathname="/vote"
            postUrl="/vote/frames"
            state={state}
            previousFrame={previousFrame}
          >
            <FrameImage src={imageOops}></FrameImage>
            <FrameButton>🏠</FrameButton>
            <FrameButton>→</FrameButton>
          </FrameContainer>
        )
      }
      state.transactionId = result.tx;
    } catch (e) {
      return (
        <FrameContainer
          pathname="/vote"
          postUrl="/vote/frames"
          state={state}
          previousFrame={previousFrame}
        >
          <FrameImage src={imageOops}></FrameImage>
          <FrameButton>🏠</FrameButton>
          <FrameButton>→</FrameButton>
        </FrameContainer>
      )
    }
  }

  // then, when done, return next frame
  return (
    <div>
      GM user data example. <Link href={createDebugUrl(url)}>Debug</Link>
      <FrameContainer
        pathname="/vote"
        postUrl="/vote/frames"
        state={state}
        previousFrame={previousFrame}
      >
        <FrameImage src={state.pageIndex === votingPage ? voteImgUrl : imageUrl}></FrameImage>

        {state.pageIndex === 0 ? (<FrameButton>Read Proposal</FrameButton>) : null}
        {state.pageIndex === 0 ? (<FrameButton>Skip to Vote</FrameButton>) : null} 

        {state.pageIndex && state.pageIndex < votingPage ? (<FrameButton>🏠</FrameButton>) : null}

        {state.pageIndex === 1 ? (<FrameButton action="link" target={`https://www.paws.org/donate/cryptocurrency-giving/pawthereum/`}>Read Blog</FrameButton>) : null} 
        {state.pageIndex === 2 ? (<FrameButton action="link" target={`https://www.youtube.com/live/jOtKj7gN3eY?si=5p0Oxmwz4d0bHZRf&t=443`}>Watch Podcast</FrameButton>) : null} 
        {state.pageIndex === 3 ? (<FrameButton action="link" target={`https://blog.pawthereum.com/airdrop-campaign-for-wildlife-center-room-naming-initiative-12acee6eeaa3`}>Airdrop Eligibility</FrameButton>) : null} 
        {state.pageIndex === 5 ? (<FrameButton action="link" target={`https://snapshot.org/#/pawthereum.eth/proposal/0xc19f4895f248a344d8bd761d477a17ee00c78f74ce7810f69edcb8a1551efe22`}>Base Migration</FrameButton>) : null} 

        {state.pageIndex && state.pageIndex < votingPage ? (<FrameButton>→</FrameButton>) : null}

        {state.pageIndex === votingPage ? (<FrameButton>1️⃣</FrameButton>) : null}
        {state.pageIndex === votingPage ? (<FrameButton>2️⃣</FrameButton>) : null} 
        {state.pageIndex === votingPage ? (<FrameButton>3️⃣</FrameButton>) : null}
        {state.pageIndex === votingPage ? (<FrameButton>4️⃣</FrameButton>) : null}

        {state.pageIndex > votingPage ? (
          <FrameButton action="link" target={`https://pawswap.exchange/vote/paws`}>
            Results
          </FrameButton>
        ) : null}
      </FrameContainer>
    </div>
  );
}
