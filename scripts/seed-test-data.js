import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function createTestData() {
  console.log("🧪 Creating minimal test data...")

  try {
    // Create a test surveyor
    const testUser = await prisma.user.create({
      data: {
        name: "Test Surveyor",
        email: "test@surveyor.com",
        role: "SURVEYOR",
        surveyor: {
          create: {
            licenseNumber: "TEST-001",
            firmName: "Test Survey Firm",
            phoneNumber: "+234 800 000 0000",
            address: "Test Address, Port Harcourt",
            status: "VERIFIED",
            verifiedAt: new Date(),
          },
        },
      },
      include: { surveyor: true },
    })

    // Create a simple test job
    const testJob = await prisma.surveyJob.create({
      data: {
        jobNumber: "TEST-JOB-001",
        clientName: "Test Client",
        clientPhone: "+234 800 111 1111",
        location: "Test Location, Port Harcourt",
        description: "Test survey job for development",
        status: "SUBMITTED",
        userId: testUser.id,
        surveyorId: testUser.surveyor.id,
        documents: {
          create: [
            {
              fileName: "test_document.pdf",
              filePath: "https://example.com/test_document.pdf",
              fileSize: 1024000,
              mimeType: "application/pdf",
              documentType: "SURVEY_PLAN",
            },
          ],
        },
        workflowSteps: {
          create: [
            {
              stepName: "Submitted",
              status: "COMPLETED",
              completedAt: new Date(),
              notes: "Test job submitted",
            },
            {
              stepName: "NIS Review",
              status: "PENDING",
            },
          ],
        },
      },
    })

    console.log("✅ Test data created successfully!")
    console.log(`   User: ${testUser.email}`)
    console.log(`   Job: ${testJob.jobNumber}`)
  } catch (error) {
    console.error("❌ Error creating test data:", error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

createTestData().catch((e) => {
  console.error(e)
  process.exit(1)
})
