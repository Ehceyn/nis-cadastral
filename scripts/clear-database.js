import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function clearDatabase() {
  console.log("🧹 Clearing database...")

  try {
    // Delete in reverse order of dependencies
    await prisma.workflowStep.deleteMany()
    console.log("   ✅ Cleared workflow steps")

    await prisma.document.deleteMany()
    console.log("   ✅ Cleared documents")

    await prisma.pillarNumber.deleteMany()
    console.log("   ✅ Cleared pillar numbers")

    await prisma.surveyJob.deleteMany()
    console.log("   ✅ Cleared survey jobs")

    await prisma.surveyor.deleteMany()
    console.log("   ✅ Cleared surveyors")

    await prisma.user.deleteMany()
    console.log("   ✅ Cleared users")

    console.log("🎉 Database cleared successfully!")
  } catch (error) {
    console.error("❌ Error clearing database:", error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

clearDatabase().catch((e) => {
  console.error(e)
  process.exit(1)
})
