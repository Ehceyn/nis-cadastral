import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

// Nigerian names and locations
const nigerianNames = {
  male: ["Adebayo", "Chukwuma", "Ibrahim", "Emeka", "Olumide", "Kelechi", "Abdullahi", "Tunde"],
  female: ["Chioma", "Ngozi", "Fatima", "Blessing", "Grace", "Amina", "Folake", "Patience"],
  surnames: ["Johnson", "Okafor", "Musa", "Emenike", "Adiele", "Okoro", "Wike", "Amadi", "Dike", "Eze"],
}

const riversStateLocations = [
  "Port Harcourt Township",
  "Obio-Akpor",
  "Eleme",
  "Ikwerre",
  "Emohua",
  "Oyigbo",
  "Okrika",
  "Ogu-Bolo",
  "Degema",
  "Bonny",
  "Andoni",
  "Opobo-Nkoro",
  "Ahoada East",
  "Ahoada West",
  "Ogba-Egbema-Ndoni",
  "Omuma",
  "Etche",
  "Tai",
  "Gokana",
  "Khana",
  "Akuku-Toru",
  "Asari-Toru",
]

const firmNames = [
  "Precision Survey Solutions Ltd",
  "Delta Geospatial Services",
  "Rivers State Survey Consultants",
  "Professional Land Surveyors Ltd",
  "Accurate Mapping Services",
  "GeoTech Survey Associates",
  "Landmark Survey Company",
  "Coastal Survey Partners",
  "Niger Delta Surveyors",
  "Port City Survey Firm",
]

function generateRandomName() {
  const isMale = Math.random() > 0.5
  const firstName = isMale
    ? nigerianNames.male[Math.floor(Math.random() * nigerianNames.male.length)]
    : nigerianNames.female[Math.floor(Math.random() * nigerianNames.female.length)]
  const surname = nigerianNames.surnames[Math.floor(Math.random() * nigerianNames.surnames.length)]
  return `${firstName} ${surname}`
}

function generatePhoneNumber() {
  const prefixes = ["803", "806", "701", "809", "802", "708", "812", "814"]
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)]
  const number = Math.floor(Math.random() * 10000000)
    .toString()
    .padStart(7, "0")
  return `+234 ${prefix} ${number.slice(0, 3)} ${number.slice(3)}`
}

function generateCoordinates() {
  // Rivers State approximate bounds
  const latMin = 4.5,
    latMax = 5.2
  const lngMin = 6.4,
    lngMax = 7.8

  return {
    latitude: latMin + Math.random() * (latMax - latMin),
    longitude: lngMin + Math.random() * (lngMax - lngMin),
  }
}

function generateJobNumber(index) {
  return `JOB-2024-${String(index).padStart(3, "0")}`
}

function generateLicenseNumber(year, index) {
  return `SUR-RS-${year}-${String(index).padStart(3, "0")}`
}

async function generateRealisticData() {
  console.log("🏗️ Generating realistic Nigerian survey data...")

  try {
    // Clear existing data first
    await prisma.workflowStep.deleteMany()
    await prisma.document.deleteMany()
    await prisma.pillarNumber.deleteMany()
    await prisma.surveyJob.deleteMany()
    await prisma.surveyor.deleteMany()
    await prisma.user.deleteMany()

    // Create 10 surveyors
    const surveyors = []
    for (let i = 1; i <= 10; i++) {
      const name = generateRandomName()
      const email = `${name.toLowerCase().replace(" ", ".")}@email.com`
      const year = 2018 + Math.floor(Math.random() * 6) // 2018-2023
      const status = Math.random() > 0.2 ? "VERIFIED" : "PENDING" // 80% verified

      const user = await prisma.user.create({
        data: {
          name,
          email,
          role: "SURVEYOR",
          surveyor: {
            create: {
              licenseNumber: generateLicenseNumber(year, i),
              firmName: firmNames[Math.floor(Math.random() * firmNames.length)],
              phoneNumber: generatePhoneNumber(),
              address: `${Math.floor(Math.random() * 100) + 1} ${riversStateLocations[Math.floor(Math.random() * riversStateLocations.length)]}, Rivers State`,
              status,
              verifiedAt:
                status === "VERIFIED"
                  ? new Date(year, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1)
                  : null,
            },
          },
        },
        include: { surveyor: true },
      })

      if (user.surveyor.status === "VERIFIED") {
        surveyors.push(user)
      }
    }

    console.log(`✅ Created ${surveyors.length} verified surveyors`)

    // Create NIS Officer and Admin
    await prisma.user.create({
      data: {
        name: "Samuel Okoro",
        email: "samuel.okoro@nis.gov.ng",
        role: "NIS_OFFICER",
      },
    })

    await prisma.user.create({
      data: {
        name: "Mrs. Patricia Wike",
        email: "patricia.wike@surveyorgeneral.rs.gov.ng",
        role: "ADMIN",
      },
    })

    // Create 25 survey jobs with various statuses
    const jobStatuses = ["COMPLETED", "NIS_REVIEW", "ADMIN_REVIEW", "SUBMITTED", "NIS_REJECTED"]
    const jobs = []

    for (let i = 1; i <= 25; i++) {
      const surveyor = surveyors[Math.floor(Math.random() * surveyors.length)]
      const clientName = Math.random() > 0.3 ? generateRandomName() : `${generateRandomName()} Ltd`
      const location = `Plot ${Math.floor(Math.random() * 200) + 1}, ${riversStateLocations[Math.floor(Math.random() * riversStateLocations.length)]}, Rivers State`
      const coordinates = generateCoordinates()
      const status = jobStatuses[Math.floor(Math.random() * jobStatuses.length)]

      // Generate realistic submission dates (last 3 months)
      const submittedAt = new Date()
      submittedAt.setDate(submittedAt.getDate() - Math.floor(Math.random() * 90))

      const job = await prisma.surveyJob.create({
        data: {
          jobNumber: generateJobNumber(i),
          clientName,
          clientEmail: Math.random() > 0.4 ? `${clientName.toLowerCase().replace(/\s+/g, ".")}@email.com` : null,
          clientPhone: generatePhoneNumber(),
          location,
          description: `Cadastral survey for ${Math.random() > 0.5 ? "residential" : "commercial"} development`,
          coordinates,
          status,
          submittedAt,
          updatedAt: new Date(submittedAt.getTime() + Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000)), // Updated within a week
          userId: surveyor.id,
          surveyorId: surveyor.surveyor.id,
        },
      })

      jobs.push({ job, surveyor })

      // Create documents for each job
      const docTypes = ["SURVEY_PLAN", "SURVEY_REPORT", "COORDINATES", "LEGAL_DOCS", "OTHER"]
      const numDocs = Math.floor(Math.random() * 3) + 1 // 1-3 documents per job

      for (let d = 0; d < numDocs; d++) {
        await prisma.document.create({
          data: {
            fileName: `${job.jobNumber.toLowerCase()}_doc_${d + 1}.pdf`,
            filePath: `https://example.com/docs/${job.jobNumber.toLowerCase()}_doc_${d + 1}.pdf`,
            fileSize: Math.floor(Math.random() * 5000000) + 500000, // 0.5MB - 5MB
            mimeType: "application/pdf",
            documentType: docTypes[Math.floor(Math.random() * docTypes.length)],
            surveyJobId: job.id,
          },
        })
      }

      // Create workflow steps based on status
      const workflowSteps = [
        { name: "Submitted", status: "COMPLETED", completedAt: submittedAt },
        { name: "NIS Review", status: "PENDING" },
        { name: "Admin Review", status: "PENDING" },
        { name: "Pillar Number Assignment", status: "PENDING" },
      ]

      // Update workflow based on job status
      if (status === "NIS_REVIEW" || status === "NIS_REJECTED" || status === "ADMIN_REVIEW" || status === "COMPLETED") {
        workflowSteps[1].status = status === "NIS_REJECTED" ? "REJECTED" : "COMPLETED"
        workflowSteps[1].completedAt = new Date(
          submittedAt.getTime() + Math.floor(Math.random() * 3 * 24 * 60 * 60 * 1000),
        )
      }

      if (status === "ADMIN_REVIEW" || status === "COMPLETED") {
        workflowSteps[2].status = "IN_PROGRESS"
      }

      if (status === "COMPLETED") {
        workflowSteps[2].status = "COMPLETED"
        workflowSteps[2].completedAt = new Date(
          submittedAt.getTime() + Math.floor(Math.random() * 5 * 24 * 60 * 60 * 1000),
        )
        workflowSteps[3].status = "COMPLETED"
        workflowSteps[3].completedAt = new Date(
          submittedAt.getTime() + Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000),
        )
      }

      // Create workflow steps
      for (const step of workflowSteps) {
        await prisma.workflowStep.create({
          data: {
            stepName: step.name,
            status: step.status,
            completedAt: step.completedAt || null,
            notes:
              step.status === "REJECTED"
                ? "Incomplete documentation"
                : step.status === "COMPLETED"
                  ? `${step.name} completed successfully`
                  : null,
            surveyJobId: job.id,
          },
        })
      }

      // Create pillar number for completed jobs
      if (status === "COMPLETED") {
        await prisma.pillarNumber.create({
          data: {
            pillarNumber: `PIL-2024-${String(Math.floor(Math.random() * 1000) + 1).padStart(3, "0")}`,
            coordinates: {
              lat: coordinates.latitude,
              lng: coordinates.longitude,
            },
            issuedDate: workflowSteps[3].completedAt,
            surveyJobId: job.id,
            surveyorId: surveyor.surveyor.id,
          },
        })
      }
    }

    console.log(`✅ Created ${jobs.length} survey jobs with realistic data`)

    // Final summary
    const summary = await Promise.all([
      prisma.user.count(),
      prisma.surveyor.count(),
      prisma.surveyJob.count(),
      prisma.document.count(),
      prisma.workflowStep.count(),
      prisma.pillarNumber.count(),
    ])

    console.log("\n🎉 Realistic data generation completed!")
    console.log("📊 Summary:")
    console.log(`   👥 Users: ${summary[0]}`)
    console.log(`   🏢 Surveyors: ${summary[1]}`)
    console.log(`   📋 Survey Jobs: ${summary[2]}`)
    console.log(`   📄 Documents: ${summary[3]}`)
    console.log(`   🔄 Workflow Steps: ${summary[4]}`)
    console.log(`   📍 Pillar Numbers: ${summary[5]}`)
  } catch (error) {
    console.error("❌ Error generating realistic data:", error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

generateRealisticData().catch((e) => {
  console.error(e)
  process.exit(1)
})
