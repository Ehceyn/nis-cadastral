import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
  console.log("🌱 Starting database seeding...")

  try {
    // Clear existing data (in reverse order of dependencies)
    console.log("🧹 Cleaning existing data...")
    await prisma.workflowStep.deleteMany()
    await prisma.document.deleteMany()
    await prisma.pillarNumber.deleteMany()
    await prisma.surveyJob.deleteMany()
    await prisma.surveyor.deleteMany()
    await prisma.user.deleteMany()

    // Create Users and Surveyors
    console.log("👥 Creating users and surveyors...")

    const users = await Promise.all([
      // Verified Surveyors
      prisma.user.create({
        data: {
          name: "Adebayo Johnson",
          email: "adebayo.johnson@email.com",
          role: "SURVEYOR",
          surveyor: {
            create: {
              licenseNumber: "SUR-RS-2020-001",
              firmName: "Johnson & Associates Surveyors",
              phoneNumber: "+234 803 123 4567",
              address: "15 Aba Road, Port Harcourt, Rivers State",
              status: "VERIFIED",
              verifiedAt: new Date("2023-01-15"),
            },
          },
        },
        include: { surveyor: true },
      }),

      prisma.user.create({
        data: {
          name: "Chioma Okafor",
          email: "chioma.okafor@email.com",
          role: "SURVEYOR",
          surveyor: {
            create: {
              licenseNumber: "SUR-RS-2021-045",
              firmName: "Precision Survey Solutions Ltd",
              phoneNumber: "+234 806 987 6543",
              address: "23 Trans Amadi Industrial Layout, Port Harcourt",
              status: "VERIFIED",
              verifiedAt: new Date("2023-03-20"),
            },
          },
        },
        include: { surveyor: true },
      }),

      prisma.user.create({
        data: {
          name: "Ibrahim Musa",
          email: "ibrahim.musa@email.com",
          role: "SURVEYOR",
          surveyor: {
            create: {
              licenseNumber: "SUR-RS-2019-078",
              firmName: "Musa Geospatial Services",
              phoneNumber: "+234 701 456 7890",
              address: "8 Old Aba Road, Port Harcourt, Rivers State",
              status: "VERIFIED",
              verifiedAt: new Date("2022-11-10"),
            },
          },
        },
        include: { surveyor: true },
      }),

      // Pending Surveyor
      prisma.user.create({
        data: {
          name: "Grace Emenike",
          email: "grace.emenike@email.com",
          role: "SURVEYOR",
          surveyor: {
            create: {
              licenseNumber: "SUR-RS-2024-012",
              firmName: "Emenike Survey Consultants",
              phoneNumber: "+234 809 234 5678",
              address: "45 Rumuola Road, Port Harcourt, Rivers State",
              status: "PENDING",
            },
          },
        },
        include: { surveyor: true },
      }),

      // NIS Officer
      prisma.user.create({
        data: {
          name: "Samuel Okoro",
          email: "samuel.okoro@nis.gov.ng",
          role: "NIS_OFFICER",
        },
      }),

      // Admin
      prisma.user.create({
        data: {
          name: "Mrs. Patricia Wike",
          email: "patricia.wike@surveyorgeneral.rs.gov.ng",
          role: "ADMIN",
        },
      }),
    ])

    console.log(`✅ Created ${users.length} users`)

    // Get verified surveyors for creating jobs
    const verifiedSurveyors = users.filter((user) => user.surveyor && user.surveyor.status === "VERIFIED")

    // Create Survey Jobs with realistic data
    console.log("📋 Creating survey jobs...")

    const surveyJobs = []

    // Job 1 - Completed
    const job1 = await prisma.surveyJob.create({
      data: {
        jobNumber: "JOB-2024-001",
        clientName: "Mr. Emeka Okonkwo",
        clientEmail: "emeka.okonkwo@gmail.com",
        clientPhone: "+234 803 567 8901",
        location: "Plot 15, Block C, New GRA Phase 2, Port Harcourt, Rivers State",
        description: "Cadastral survey for residential property development",
        coordinates: {
          latitude: 4.8156,
          longitude: 7.0498,
        },
        status: "COMPLETED",
        submittedAt: new Date("2024-01-10T09:30:00Z"),
        updatedAt: new Date("2024-01-25T16:45:00Z"),
        userId: verifiedSurveyors[0].id,
        surveyorId: verifiedSurveyors[0].surveyor.id,
      },
    })
    surveyJobs.push(job1)

    // Job 2 - NIS Review
    const job2 = await prisma.surveyJob.create({
      data: {
        jobNumber: "JOB-2024-002",
        clientName: "Blessed Construction Company Ltd",
        clientEmail: "info@blessedconstruction.com",
        clientPhone: "+234 806 123 4567",
        location: "Plot 8-12, Industrial Layout, Trans Amadi, Port Harcourt",
        description: "Survey for commercial complex development",
        coordinates: {
          latitude: 4.7892,
          longitude: 7.0156,
        },
        status: "NIS_REVIEW",
        submittedAt: new Date("2024-01-15T14:20:00Z"),
        updatedAt: new Date("2024-01-16T10:15:00Z"),
        userId: verifiedSurveyors[1].id,
        surveyorId: verifiedSurveyors[1].surveyor.id,
      },
    })
    surveyJobs.push(job2)

    // Job 3 - Admin Review
    const job3 = await prisma.surveyJob.create({
      data: {
        jobNumber: "JOB-2024-003",
        clientName: "Mrs. Ngozi Adiele",
        clientEmail: "ngozi.adiele@yahoo.com",
        clientPhone: "+234 701 987 6543",
        location: "Plot 23, Eliozu Housing Estate, Port Harcourt, Rivers State",
        description: "Boundary survey for property dispute resolution",
        coordinates: {
          latitude: 4.8445,
          longitude: 7.0234,
        },
        status: "ADMIN_REVIEW",
        submittedAt: new Date("2024-01-08T11:45:00Z"),
        updatedAt: new Date("2024-01-20T09:30:00Z"),
        userId: verifiedSurveyors[2].id,
        surveyorId: verifiedSurveyors[2].surveyor.id,
      },
    })
    surveyJobs.push(job3)

    // Job 4 - Recently Submitted
    const job4 = await prisma.surveyJob.create({
      data: {
        jobNumber: "JOB-2024-004",
        clientName: "Chief Williams Amadi",
        clientPhone: "+234 803 456 7890",
        location: "Plot 5, Woji Road, Port Harcourt, Rivers State",
        description: "Survey for residential property acquisition",
        coordinates: {
          latitude: 4.8012,
          longitude: 7.0567,
        },
        status: "SUBMITTED",
        submittedAt: new Date("2024-01-22T16:30:00Z"),
        userId: verifiedSurveyors[0].id,
        surveyorId: verifiedSurveyors[0].surveyor.id,
      },
    })
    surveyJobs.push(job4)

    // Job 5 - Rejected
    const job5 = await prisma.surveyJob.create({
      data: {
        jobNumber: "JOB-2024-005",
        clientName: "Delta Properties Ltd",
        clientEmail: "projects@deltaproperties.ng",
        clientPhone: "+234 809 876 5432",
        location: "Plot 45-50, Rumuokwuta, Port Harcourt, Rivers State",
        description: "Survey for housing estate development",
        status: "NIS_REJECTED",
        submittedAt: new Date("2024-01-05T13:15:00Z"),
        updatedAt: new Date("2024-01-12T11:20:00Z"),
        userId: verifiedSurveyors[1].id,
        surveyorId: verifiedSurveyors[1].surveyor.id,
      },
    })
    surveyJobs.push(job5)

    console.log(`✅ Created ${surveyJobs.length} survey jobs`)

    // Create Documents for each job
    console.log("📄 Creating documents...")

    const documents = []

    // Documents for Job 1 (Completed)
    const job1Docs = await Promise.all([
      prisma.document.create({
        data: {
          fileName: "survey_plan_okonkwo.pdf",
          filePath: "https://example.com/docs/survey_plan_okonkwo.pdf",
          fileSize: 2456789,
          mimeType: "application/pdf",
          documentType: "SURVEY_PLAN",
          surveyJobId: job1.id,
        },
      }),
      prisma.document.create({
        data: {
          fileName: "coordinates_data.csv",
          filePath: "https://example.com/docs/coordinates_data.csv",
          fileSize: 15432,
          mimeType: "text/csv",
          documentType: "COORDINATES",
          surveyJobId: job1.id,
        },
      }),
      prisma.document.create({
        data: {
          fileName: "survey_report_final.pdf",
          filePath: "https://example.com/docs/survey_report_final.pdf",
          fileSize: 3789456,
          mimeType: "application/pdf",
          documentType: "SURVEY_REPORT",
          surveyJobId: job1.id,
        },
      }),
    ])
    documents.push(...job1Docs)

    // Documents for Job 2 (NIS Review)
    const job2Docs = await Promise.all([
      prisma.document.create({
        data: {
          fileName: "blessed_construction_plan.pdf",
          filePath: "https://example.com/docs/blessed_construction_plan.pdf",
          fileSize: 4567890,
          mimeType: "application/pdf",
          documentType: "SURVEY_PLAN",
          surveyJobId: job2.id,
        },
      }),
      prisma.document.create({
        data: {
          fileName: "site_photos.zip",
          filePath: "https://example.com/docs/site_photos.zip",
          fileSize: 8901234,
          mimeType: "application/zip",
          documentType: "OTHER",
          surveyJobId: job2.id,
        },
      }),
    ])
    documents.push(...job2Docs)

    // Documents for Job 3 (Admin Review)
    const job3Docs = await Promise.all([
      prisma.document.create({
        data: {
          fileName: "boundary_survey_adiele.pdf",
          filePath: "https://example.com/docs/boundary_survey_adiele.pdf",
          fileSize: 1987654,
          mimeType: "application/pdf",
          documentType: "SURVEY_PLAN",
          surveyJobId: job3.id,
        },
      }),
      prisma.document.create({
        data: {
          fileName: "legal_documents.pdf",
          filePath: "https://example.com/docs/legal_documents.pdf",
          fileSize: 876543,
          mimeType: "application/pdf",
          documentType: "LEGAL_DOCS",
          surveyJobId: job3.id,
        },
      }),
    ])
    documents.push(...job3Docs)

    // Documents for Job 4 (Recently Submitted)
    const job4Docs = await Promise.all([
      prisma.document.create({
        data: {
          fileName: "amadi_property_survey.pdf",
          filePath: "https://example.com/docs/amadi_property_survey.pdf",
          fileSize: 2345678,
          mimeType: "application/pdf",
          documentType: "SURVEY_PLAN",
          surveyJobId: job4.id,
        },
      }),
    ])
    documents.push(...job4Docs)

    console.log(`✅ Created ${documents.length} documents`)

    // Create Workflow Steps
    console.log("🔄 Creating workflow steps...")

    const workflowSteps = []

    // Workflow for Job 1 (Completed)
    const job1Workflow = await Promise.all([
      prisma.workflowStep.create({
        data: {
          stepName: "Submitted",
          status: "COMPLETED",
          completedAt: new Date("2024-01-10T09:30:00Z"),
          notes: "Job submitted by surveyor",
          surveyJobId: job1.id,
        },
      }),
      prisma.workflowStep.create({
        data: {
          stepName: "NIS Review",
          status: "COMPLETED",
          completedAt: new Date("2024-01-15T14:20:00Z"),
          notes: "Reviewed and approved by NIS officer",
          surveyJobId: job1.id,
        },
      }),
      prisma.workflowStep.create({
        data: {
          stepName: "Admin Review",
          status: "COMPLETED",
          completedAt: new Date("2024-01-20T11:45:00Z"),
          notes: "Final approval by Surveyor General office",
          surveyJobId: job1.id,
        },
      }),
      prisma.workflowStep.create({
        data: {
          stepName: "Pillar Number Assignment",
          status: "COMPLETED",
          completedAt: new Date("2024-01-25T16:45:00Z"),
          notes: "Pillar number PIL-2024-001 assigned",
          surveyJobId: job1.id,
        },
      }),
    ])
    workflowSteps.push(...job1Workflow)

    // Workflow for Job 2 (NIS Review)
    const job2Workflow = await Promise.all([
      prisma.workflowStep.create({
        data: {
          stepName: "Submitted",
          status: "COMPLETED",
          completedAt: new Date("2024-01-15T14:20:00Z"),
          notes: "Job submitted by surveyor",
          surveyJobId: job2.id,
        },
      }),
      prisma.workflowStep.create({
        data: {
          stepName: "NIS Review",
          status: "IN_PROGRESS",
          notes: "Under review by NIS officer",
          surveyJobId: job2.id,
        },
      }),
      prisma.workflowStep.create({
        data: {
          stepName: "Admin Review",
          status: "PENDING",
          surveyJobId: job2.id,
        },
      }),
      prisma.workflowStep.create({
        data: {
          stepName: "Pillar Number Assignment",
          status: "PENDING",
          surveyJobId: job2.id,
        },
      }),
    ])
    workflowSteps.push(...job2Workflow)

    // Workflow for Job 3 (Admin Review)
    const job3Workflow = await Promise.all([
      prisma.workflowStep.create({
        data: {
          stepName: "Submitted",
          status: "COMPLETED",
          completedAt: new Date("2024-01-08T11:45:00Z"),
          notes: "Job submitted by surveyor",
          surveyJobId: job3.id,
        },
      }),
      prisma.workflowStep.create({
        data: {
          stepName: "NIS Review",
          status: "COMPLETED",
          completedAt: new Date("2024-01-18T16:30:00Z"),
          notes: "Approved by NIS officer",
          surveyJobId: job3.id,
        },
      }),
      prisma.workflowStep.create({
        data: {
          stepName: "Admin Review",
          status: "IN_PROGRESS",
          notes: "Under final review",
          surveyJobId: job3.id,
        },
      }),
      prisma.workflowStep.create({
        data: {
          stepName: "Pillar Number Assignment",
          status: "PENDING",
          surveyJobId: job3.id,
        },
      }),
    ])
    workflowSteps.push(...job3Workflow)

    // Workflow for Job 4 (Recently Submitted)
    const job4Workflow = await Promise.all([
      prisma.workflowStep.create({
        data: {
          stepName: "Submitted",
          status: "COMPLETED",
          completedAt: new Date("2024-01-22T16:30:00Z"),
          notes: "Job submitted by surveyor",
          surveyJobId: job4.id,
        },
      }),
      prisma.workflowStep.create({
        data: {
          stepName: "NIS Review",
          status: "PENDING",
          surveyJobId: job4.id,
        },
      }),
      prisma.workflowStep.create({
        data: {
          stepName: "Admin Review",
          status: "PENDING",
          surveyJobId: job4.id,
        },
      }),
      prisma.workflowStep.create({
        data: {
          stepName: "Pillar Number Assignment",
          status: "PENDING",
          surveyJobId: job4.id,
        },
      }),
    ])
    workflowSteps.push(...job4Workflow)

    // Workflow for Job 5 (Rejected)
    const job5Workflow = await Promise.all([
      prisma.workflowStep.create({
        data: {
          stepName: "Submitted",
          status: "COMPLETED",
          completedAt: new Date("2024-01-05T13:15:00Z"),
          notes: "Job submitted by surveyor",
          surveyJobId: job5.id,
        },
      }),
      prisma.workflowStep.create({
        data: {
          stepName: "NIS Review",
          status: "REJECTED",
          completedAt: new Date("2024-01-12T11:20:00Z"),
          notes: "Rejected due to incomplete documentation. Missing boundary coordinates.",
          surveyJobId: job5.id,
        },
      }),
      prisma.workflowStep.create({
        data: {
          stepName: "Admin Review",
          status: "PENDING",
          surveyJobId: job5.id,
        },
      }),
      prisma.workflowStep.create({
        data: {
          stepName: "Pillar Number Assignment",
          status: "PENDING",
          surveyJobId: job5.id,
        },
      }),
    ])
    workflowSteps.push(...job5Workflow)

    console.log(`✅ Created ${workflowSteps.length} workflow steps`)

    // Create Pillar Numbers for completed jobs
    console.log("📍 Creating pillar numbers...")

    const pillarNumbers = await Promise.all([
      prisma.pillarNumber.create({
        data: {
          pillarNumber: "PIL-2024-001",
          coordinates: {
            lat: 4.8156,
            lng: 7.0498,
          },
          issuedDate: new Date("2024-01-25T16:45:00Z"),
          surveyJobId: job1.id,
          surveyorId: verifiedSurveyors[0].surveyor.id,
        },
      }),
    ])

    console.log(`✅ Created ${pillarNumbers.length} pillar numbers`)

    // Summary
    console.log("\n🎉 Database seeding completed successfully!")
    console.log("📊 Summary:")
    console.log(`   👥 Users: ${users.length}`)
    console.log(`   🏢 Surveyors: ${users.filter((u) => u.surveyor).length}`)
    console.log(`   📋 Survey Jobs: ${surveyJobs.length}`)
    console.log(`   📄 Documents: ${documents.length}`)
    console.log(`   🔄 Workflow Steps: ${workflowSteps.length}`)
    console.log(`   📍 Pillar Numbers: ${pillarNumbers.length}`)

    console.log("\n🔐 Test Accounts:")
    console.log("   Surveyors:")
    console.log("   - adebayo.johnson@email.com (Verified)")
    console.log("   - chioma.okafor@email.com (Verified)")
    console.log("   - ibrahim.musa@email.com (Verified)")
    console.log("   - grace.emenike@email.com (Pending)")
    console.log("   NIS Officer:")
    console.log("   - samuel.okoro@nis.gov.ng")
    console.log("   Admin:")
    console.log("   - patricia.wike@surveyorgeneral.rs.gov.ng")
  } catch (error) {
    console.error("❌ Error seeding database:", error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
