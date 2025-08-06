const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function migrateSurveyorStatus() {
  console.log("🔄 Migrating surveyor status values...");

  try {
    // First, let's see what we have
    const surveyors = await prisma.surveyor.findMany({
      select: { id: true, status: true, user: { select: { name: true } } },
    });

    console.log("Current surveyors:", surveyors);

    // Update PENDING to PENDING_NIS_REVIEW using raw SQL
    const result = await prisma.$executeRaw`
      UPDATE "surveyors" 
      SET "status" = 'PENDING_NIS_REVIEW' 
      WHERE "status" = 'PENDING'
    `;

    console.log(`✅ Updated ${result} surveyor records`);
  } catch (error) {
    console.error("❌ Migration failed:", error);
  } finally {
    await prisma.$disconnect();
  }
}

migrateSurveyorStatus();
