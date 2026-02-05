const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("password123", 10);

  const user = await prisma.user.upsert({
    where: { email: "demo@redditclone.dev" },
    update: {},
    create: {
      email: "demo@redditclone.dev",
      passwordHash,
      displayName: "DemoUser",
    },
  });

  const community = await prisma.community.upsert({
    where: { id: "general" },
    update: {},
    create: {
      id: "general",
      creatorId: user.id,
      privacyType: "public",
    },
  });

  await prisma.communityMember.upsert({
    where: {
      communityId_userId: {
        communityId: community.id,
        userId: user.id,
      },
    },
    update: {},
    create: {
      communityId: community.id,
      userId: user.id,
      isModerator: true,
    },
  });

  await prisma.post.create({
    data: {
      communityId: community.id,
      creatorId: user.id,
      title: "Welcome to the new backend!",
      body: "This seed post confirms Prisma + Postgres are wired up.",
    },
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
