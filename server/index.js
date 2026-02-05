require("dotenv").config();

const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();
const app = express();

app.use(cors());
app.use(express.json({ limit: "10mb" }));

const toCommunityResponse = (community, memberCount) => ({
  id: community.id,
  creatorId: community.creatorId,
  numberOfMembers: memberCount ?? community._count?.members ?? 0,
  privacyType: community.privacyType,
  createdAt: community.createdAt,
  imageURL: community.imageURL || undefined,
});

const toPostResponse = (post, voteStatus, currentUserVote) => ({
  id: post.id,
  communityId: post.communityId,
  communityImageURL: post.community?.imageURL || undefined,
  userDisplayText: post.creator?.displayName || "Anonymous",
  creatorId: post.creatorId,
  title: post.title,
  body: post.body,
  numberOfComments: post.numberOfComments,
  voteStatus,
  currentUserVoteStatus: currentUserVote || undefined,
  imageURL: post.imageURL || undefined,
  createdAt: post.createdAt,
  editedAt: post.updatedAt,
});

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

app.post("/api/auth/signup", async (req, res) => {
  const { email, password, displayName } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required." });
  }

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    return res.status(409).json({ message: "Email already in use." });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      displayName: displayName || email.split("@")[0],
    },
  });

  res.json({ id: user.id, email: user.email, displayName: user.displayName });
});

app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required." });
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return res.status(401).json({ message: "Invalid credentials." });
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    return res.status(401).json({ message: "Invalid credentials." });
  }

  res.json({ id: user.id, email: user.email, displayName: user.displayName });
});

app.post("/api/auth/reset", async (req, res) => {
  res.json({ message: "Password reset email queued." });
});

app.get("/api/communities", async (req, res) => {
  const limit = Number(req.query.limit) || 10;
  const communities = await prisma.community.findMany({
    take: limit,
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { members: true } } },
  });
  res.json(communities.map((community) => toCommunityResponse(community)));
});

app.get("/api/communities/:id", async (req, res) => {
  const community = await prisma.community.findUnique({
    where: { id: req.params.id },
    include: { _count: { select: { members: true } } },
  });

  if (!community) {
    return res.status(404).json({ message: "Community not found." });
  }

  res.json(toCommunityResponse(community));
});

app.post("/api/communities", async (req, res) => {
  const { id, creatorId, privacyType } = req.body;
  if (!id || !creatorId || !privacyType) {
    return res.status(400).json({ message: "Missing required fields." });
  }

  const existing = await prisma.community.findUnique({ where: { id } });
  if (existing) {
    return res.status(409).json({ message: "Community already exists." });
  }

  const community = await prisma.community.create({
    data: {
      id,
      creatorId,
      privacyType,
      members: {
        create: {
          userId: creatorId,
          isModerator: true,
        },
      },
    },
    include: { _count: { select: { members: true } } },
  });

  res.json(toCommunityResponse(community));
});

app.patch("/api/communities/:id", async (req, res) => {
  const { imageURL } = req.body;
  const community = await prisma.community.update({
    where: { id: req.params.id },
    data: { imageURL },
    include: { _count: { select: { members: true } } },
  });

  res.json(toCommunityResponse(community));
});

app.get("/api/users/:id/communities", async (req, res) => {
  const memberships = await prisma.communityMember.findMany({
    where: { userId: req.params.id },
    include: { community: true },
  });

  res.json(
    memberships.map((membership) => ({
      communityId: membership.communityId,
      isModerator: membership.isModerator,
      imageURL: membership.community.imageURL || undefined,
    }))
  );
});

app.post("/api/communities/:id/join", async (req, res) => {
  const { userId } = req.body;
  if (!userId) {
    return res.status(400).json({ message: "userId is required." });
  }

  const membership = await prisma.communityMember.upsert({
    where: {
      communityId_userId: {
        communityId: req.params.id,
        userId,
      },
    },
    update: {},
    create: {
      communityId: req.params.id,
      userId,
      isModerator: false,
    },
    include: { community: true },
  });

  res.json({
    communityId: membership.communityId,
    isModerator: membership.isModerator,
    imageURL: membership.community.imageURL || undefined,
  });
});

app.delete("/api/communities/:id/join", async (req, res) => {
  const { userId } = req.query;
  if (!userId) {
    return res.status(400).json({ message: "userId is required." });
  }

  await prisma.communityMember.delete({
    where: {
      communityId_userId: {
        communityId: req.params.id,
        userId: String(userId),
      },
    },
  });

  res.json({ success: true });
});

app.get("/api/posts", async (req, res) => {
  const communityId = req.query.communityId;
  const userId = req.query.userId;
  const posts = await prisma.post.findMany({
    where: communityId ? { communityId: String(communityId) } : undefined,
    orderBy: { createdAt: "desc" },
    include: {
      community: true,
      creator: true,
      votes: true,
    },
  });

  const response = posts.map((post) => {
    const voteStatus = post.votes.reduce((total, vote) => total + vote.voteValue, 0);
    const matchingVote =
      userId && post.votes.find((vote) => vote.userId === String(userId));
    const currentUserVote = matchingVote
      ? { id: matchingVote.id, voteValue: matchingVote.voteValue }
      : undefined;
    return toPostResponse(post, voteStatus, currentUserVote);
  });

  res.json(response);
});

app.get("/api/posts/:id", async (req, res) => {
  const userId = req.query.userId;
  const post = await prisma.post.findUnique({
    where: { id: req.params.id },
    include: {
      community: true,
      creator: true,
      votes: true,
    },
  });

  if (!post) {
    return res.status(404).json({ message: "Post not found." });
  }

  const voteStatus = post.votes.reduce((total, vote) => total + vote.voteValue, 0);
  const matchingVote =
    userId && post.votes.find((vote) => vote.userId === String(userId));
  const currentUserVote = matchingVote
    ? { id: matchingVote.id, voteValue: matchingVote.voteValue }
    : undefined;
  res.json(toPostResponse(post, voteStatus, currentUserVote));
});

app.post("/api/posts", async (req, res) => {
  const { communityId, creatorId, title, body, imageURL } = req.body;
  if (!communityId || !creatorId || !title) {
    return res.status(400).json({ message: "Missing required fields." });
  }

  const post = await prisma.post.create({
    data: {
      communityId,
      creatorId,
      title,
      body: body || "",
      imageURL,
    },
    include: { community: true, creator: true },
  });

  res.json(toPostResponse(post, 0));
});

app.delete("/api/posts/:id", async (req, res) => {
  await prisma.post.delete({ where: { id: req.params.id } });
  res.json({ success: true });
});

app.post("/api/posts/:id/votes", async (req, res) => {
  const { userId, voteValue } = req.body;
  if (!userId || !voteValue) {
    return res.status(400).json({ message: "Missing required fields." });
  }

  const vote = await prisma.postVote.upsert({
    where: {
      postId_userId: {
        postId: req.params.id,
        userId,
      },
    },
    update: { voteValue },
    create: {
      postId: req.params.id,
      userId,
      voteValue,
    },
  });

  res.json({ id: vote.id, voteValue: vote.voteValue });
});

app.delete("/api/posts/:id/votes", async (req, res) => {
  const { userId } = req.query;
  if (!userId) {
    return res.status(400).json({ message: "userId is required." });
  }

  await prisma.postVote.delete({
    where: {
      postId_userId: {
        postId: req.params.id,
        userId: String(userId),
      },
    },
  });

  res.json({ success: true });
});

app.get("/api/posts/:id/comments", async (req, res) => {
  const comments = await prisma.comment.findMany({
    where: { postId: req.params.id },
    orderBy: { createdAt: "desc" },
    include: { creator: true },
  });

  res.json(
    comments.map((comment) => ({
      id: comment.id,
      creatorId: comment.creatorId,
      creatorDisplayText: comment.creator.displayName,
      creatorPhotoURL: "",
      communityId: "",
      postId: comment.postId,
      postTitle: "",
      text: comment.text,
      createdAt: comment.createdAt,
    }))
  );
});

app.post("/api/posts/:id/comments", async (req, res) => {
  const { creatorId, text } = req.body;
  if (!creatorId || !text) {
    return res.status(400).json({ message: "Missing required fields." });
  }

  const comment = await prisma.comment.create({
    data: {
      postId: req.params.id,
      creatorId,
      text,
    },
    include: { creator: true },
  });

  await prisma.post.update({
    where: { id: req.params.id },
    data: { numberOfComments: { increment: 1 } },
  });

  res.json({
    id: comment.id,
    creatorId: comment.creatorId,
    creatorDisplayText: comment.creator.displayName,
    creatorPhotoURL: "",
    communityId: "",
    postId: comment.postId,
    postTitle: "",
    text: comment.text,
    createdAt: comment.createdAt,
  });
});

app.delete("/api/comments/:id", async (req, res) => {
  await prisma.comment.delete({ where: { id: req.params.id } });
  res.json({ success: true });
});

const port = process.env.PORT || 4000;
app.listen(port, () => {
  console.log(`API server running on port ${port}`);
});
