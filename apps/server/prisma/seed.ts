import { PrismaClient } from "@prisma/client";
import { questions, tracks } from "../src/data/content.js";

process.env.DATABASE_URL ??= "file:./dev.db";

const prisma = new PrismaClient();

const main = async () => {
  await prisma.option.deleteMany();
  await prisma.question.deleteMany();
  await prisma.track.deleteMany();

  for (const [trackIndex, track] of tracks.entries()) {
    await prisma.track.create({
      data: {
        id: track.id,
        slug: track.slug,
        name: track.name,
        description: track.description,
        icon: track.icon,
        ods: JSON.stringify(track.ods),
        accent: track.accent,
        sortOrder: trackIndex + 1
      }
    });
  }

  for (const [questionIndex, question] of questions.entries()) {
    await prisma.question.create({
      data: {
        id: question.id,
        trackId: question.trackId,
        sortOrder: questionIndex + 1,
        prompt: question.prompt,
        explanation: question.explanation,
        ods: question.ods,
        timeLimit: question.timeLimit,
        correctOptionId: question.correctOptionId,
        options: {
          create: question.options.map((item) => ({
            id: item.id,
            label: item.label,
            text: item.text
          }))
        }
      }
    });
  }
};

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
