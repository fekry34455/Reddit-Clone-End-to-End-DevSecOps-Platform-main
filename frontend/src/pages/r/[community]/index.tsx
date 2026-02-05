import { useEffect } from "react";
import type { GetServerSidePropsContext, NextPage } from "next";
import { useRecoilState } from "recoil";
import safeJsonStringify from "safe-json-stringify";
import { Community, communityState } from "../../../atoms/communitiesAtom";
import About from "../../../components/Community/About";
import CommunityNotFound from "../../../components/Community/CommunityNotFound";
import CreatePostLink from "../../../components/Community/CreatePostLink";
import Header from "../../../components/Community/Header";
import PageContentLayout from "../../../components/Layout/PageContent";
import Posts from "../../../components/Post/Posts";
import { useAuthContext } from "../../../context/AuthContext";

interface CommunityPageProps {
  communityData: Community;
}

const CommunityPage: NextPage<CommunityPageProps> = ({ communityData }) => {
  const { user } = useAuthContext();

  const [communityStateValue, setCommunityStateValue] =
    useRecoilState(communityState);

  // useEffect(() => {
  //   // First time the user has navigated to this community page during session - add to cache
  //   const firstSessionVisit =
  //     !communityStateValue.visitedCommunities[communityData.id!];

  //   if (firstSessionVisit) {
  //     setCommunityStateValue((prev) => ({
  //       ...prev,
  //       visitedCommunities: {
  //         ...prev.visitedCommunities,
  //         [communityData.id!]: communityData,
  //       },
  //     }));
  //   }
  // }, [communityData]);

  useEffect(() => {
    setCommunityStateValue((prev) => ({
      ...prev,
      currentCommunity: communityData,
    }));
  }, [communityData]);

  // Community was not found in the database
  if (!communityData) {
    return <CommunityNotFound />;
  }

  return (
    <>
      <Header communityData={communityData} />
      <PageContentLayout>
        {/* Left Content */}
        <>
          <CreatePostLink />
          <Posts
            communityData={communityData}
            userId={user?.id}
          />
        </>
        {/* Right Content */}
        <>
          <About communityData={communityData} />
        </>
      </PageContentLayout>
    </>
  );
};

export default CommunityPage;

export async function getServerSideProps(context: GetServerSidePropsContext) {
  console.log("GET SERVER SIDE PROPS RUNNING");

  try {
    const apiBase =
      process.env.NEXT_PUBLIC_API_BASE_URL ||
      process.env.API_BASE_URL ||
      "http://localhost:4000";
    const response = await fetch(
      `${apiBase}/api/communities/${context.query.community as string}`
    );
    const communityDoc = response.ok ? await response.json() : null;
    return {
      props: {
        communityData: communityDoc
          ? JSON.parse(safeJsonStringify(communityDoc))
          : "",
      },
    };
  } catch (error) {
    // Could create error page here
    console.log("getServerSideProps error - [community]", error);
  }
}
