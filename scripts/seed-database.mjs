import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";

// Load environment variables from .env.local
dotenv.config({ path: ".env.local" });

// Use DIRECT_URL for better connection stability
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DIRECT_URL,
    },
  },
});

async function main() {
  console.log("🌱 Starting database seeding...");

  try {
    // Clear existing data (in reverse order of dependencies)
    console.log("🧹 Cleaning existing data...");
    await prisma.workflowStep.deleteMany();
    await prisma.document.deleteMany();
    await prisma.pillarNumber.deleteMany();
    await prisma.surveyJob.deleteMany();
    await prisma.surveyor.deleteMany();
    await prisma.user.deleteMany();
    await prisma.pillarSystem.deleteMany();

    // Create Users and Surveyors
    console.log("👥 Creating users and surveyors...");

    const buildPassword = (role, fullName) => {
      const first = (fullName || "").split(" ")[0]?.toLowerCase() || "user";
      if (role === "SURVEYOR") return `surveyor${first}`;
      if (role === "ADMIN") return `admin${first}`;
      if (role === "NIS_OFFICER") return `nis${first}`;
      return `user${first}`;
    };

    const withPassword = async (role, name) => ({
      password: buildPassword(role, name),
      passwordHash: await bcrypt.hash(buildPassword(role, name), 10),
    });

    const users = await Promise.all([
      // REAL SURVEYOR - Kurotamuno Peace Jackson
      prisma.user.create({
        data: {
          name: "Kurotamuno Peace Jackson",
          email: "kpj.surveys@email.com",
          passwordHash: (
            await withPassword("SURVEYOR", "Kurotamuno Peace Jackson")
          ).passwordHash,
          role: "SURVEYOR",
          surveyor: {
            create: {
              nisMembershipNumber: "NIS/FM/KPJ001",
              surconRegistrationNumber: "R-KPJ2025",
              firmName: "KPJ Survey Consultants",
              phoneNumber: "+234 803 000 0000",
              address: "Port Harcourt, Rivers State",
              status: "VERIFIED",
              verifiedAt: new Date("2024-12-01"),
            },
          },
        },
        include: { surveyor: true },
      }),

      // Verified Surveyors
      prisma.user.create({
        data: {
          name: "Adebayo Johnson",
          email: "adebayo.johnson@email.com",
          passwordHash: (await withPassword("SURVEYOR", "Adebayo Johnson"))
            .passwordHash,
          role: "SURVEYOR",
          surveyor: {
            create: {
              nisMembershipNumber: "NIS/FM/2876",
              surconRegistrationNumber: "R-2846",
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
          passwordHash: (await withPassword("SURVEYOR", "Chioma Okafor"))
            .passwordHash,
          role: "SURVEYOR",
          surveyor: {
            create: {
              nisMembershipNumber: "NIS/FM/2877",
              surconRegistrationNumber: "R-2847",
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
          passwordHash: (await withPassword("SURVEYOR", "Ibrahim Musa"))
            .passwordHash,
          role: "SURVEYOR",
          surveyor: {
            create: {
              nisMembershipNumber: "NIS/FM/2878",
              surconRegistrationNumber: "R-2848",
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
          passwordHash: (await withPassword("SURVEYOR", "Grace Emenike"))
            .passwordHash,
          role: "SURVEYOR",
          surveyor: {
            create: {
              nisMembershipNumber: "NIS/FM/2879",
              surconRegistrationNumber: "R-2849",
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
          passwordHash: (await withPassword("NIS_OFFICER", "Samuel Okoro"))
            .passwordHash,
          role: "NIS_OFFICER",
        },
      }),

      // Admin
      prisma.user.create({
        data: {
          name: "Mrs. Patricia Wike",
          email: "patricia.wike@surveyorgeneral.rs.gov.ng",
          passwordHash: (await withPassword("ADMIN", "Mrs. Patricia Wike"))
            .passwordHash,
          role: "ADMIN",
        },
      }),
    ]);

    console.log(`✅ Created ${users.length} users`);

    // Initialize Pillar System
    console.log("⚙️ Initializing pillar system...");
    const pillarSystem = await prisma.pillarSystem.create({
      data: {
        seriesPrefix: "SC/CS",
        lastIssuedNumber: 6673, // Updated to reflect the last pillar from real data
      },
    });
    console.log(
      `✅ Initialized pillar system with prefix: ${pillarSystem.seriesPrefix}`
    );

    // Get verified surveyors for creating jobs
    const verifiedSurveyors = users.filter(
      (user) => user.surveyor && user.surveyor.status === "VERIFIED"
    );

    // KPJ Surveyor (first in the list)
    const kpjSurveyor = verifiedSurveyors[0];

    // Create Survey Jobs with realistic data
    console.log("📋 Creating survey jobs...");

    const surveyJobs = [];

    // REAL JOB 1 - Mr. Chimzi Property (Completed)
    const realJob1 = await prisma.surveyJob.create({
      data: {
        jobNumber: "JOB-2025-KPJ-001",
        clientName: "Mr. Chimzi",
        titleHolderName: "Mr. Eyikoda Kcaj",
        clientEmail: "chimzichidum@gmail.com",
        clientPhone: "08061986793",
        location:
          "Ogoin-Piri, Chief Akpan Pedro New Layout, Abonnema, Akuku-Toru Local Govt. Area, Rivers State",
        description: "Cadastral survey for residential property",
        coordinates: {
          latitude: 4.7167,
          longitude: 6.8167,
        },
        requestedCoordinates: [
          { easting: "253635.00", northing: "523028.00" },
          { easting: "253644.14", northing: "523075.98" },
          { easting: "253688.56", northing: "523055.31" },
          { easting: "253673.73", northing: "523007.64" },
        ],
        planNumber: "KPJ/AB/2025/001",
        pillarNumbersRequired: 4,
        areaSqm: "2122.89",
        totalAmount: "426000",
        depositAmount: "420000",
        beaconAmount: "6000",
        blueCopyUploaded: true,
        blueCopyUploadedAt: new Date("2025-04-17T10:30:00Z"),
        roDocumentUploaded: true,
        roDocumentUploadedAt: new Date("2025-04-18T14:15:00Z"),
        status: "COMPLETED",
        submittedAt: new Date("2025-04-16T09:00:00Z"),
        updatedAt: new Date("2025-04-18T16:45:00Z"),
        dateApproved: new Date("2025-04-17T11:30:00Z"),
        userId: kpjSurveyor.id,
        surveyorId: kpjSurveyor.surveyor.id,
      },
    });
    surveyJobs.push(realJob1);

    // REAL JOB 2 - Mr. Oibapka Maharba Homi Property (Completed)
    const realJob2 = await prisma.surveyJob.create({
      data: {
        jobNumber: "JOB-2025-KPJ-002",
        clientName: "Mr. Oibapka Maharba Homi",
        titleHolderName: "Mr. Oibapka Maharba Homi",
        clientEmail: "maharbahomi@gmail.com",
        clientPhone: "08061986775",
        location:
          "Oka-Nsimu Ebara, Aleto Eleme, Eleme Local Govt. Area, Rivers State",
        description: "Cadastral survey for property registration",
        coordinates: {
          latitude: 4.8,
          longitude: 7.15,
        },
        requestedCoordinates: [
          { easting: "289641.62", northing: "530212.85" },
          { easting: "289651.28", northing: "530228.48" },
          { easting: "289660.36", northing: "530228.20" },
          { easting: "289674.32", northing: "530220.85" },
          { easting: "289664.44", northing: "530204.45" },
        ],
        planNumber: "KPJ/EL/2025/001",
        pillarNumbersRequired: 5,
        areaSqm: "477.05",
        totalAmount: "157500",
        depositAmount: "150000",
        beaconAmount: "7500",
        blueCopyUploaded: true,
        blueCopyUploadedAt: new Date("2025-07-02T10:30:00Z"),
        roDocumentUploaded: true,
        roDocumentUploadedAt: new Date("2025-07-03T14:15:00Z"),
        status: "COMPLETED",
        submittedAt: new Date("2025-07-01T09:00:00Z"),
        updatedAt: new Date("2025-07-03T16:45:00Z"),
        dateApproved: new Date("2025-07-02T11:30:00Z"),
        userId: kpjSurveyor.id,
        surveyorId: kpjSurveyor.surveyor.id,
      },
    });
    surveyJobs.push(realJob2);

    // Job 1 - Completed
    const job1 = await prisma.surveyJob.create({
      data: {
        jobNumber: "JOB-2024-001",
        clientName: "Mr. Emeka Okonkwo",
        clientEmail: "emeka.okonkwo@gmail.com",
        clientPhone: "+234 803 567 8901",
        location:
          "Plot 15, Block C, New GRA Phase 2, Port Harcourt, Rivers State",
        description: "Cadastral survey for residential property development",
        coordinates: {
          latitude: 4.8156,
          longitude: 7.0498,
        },
        requestedCoordinates: [
          { easting: "288456.789", northing: "532123.456" },
          { easting: "288478.912", northing: "532145.678" },
        ],
        planNumber: "PH/GRA/2024/001",
        pillarNumbersRequired: 2,
        blueCopyUploaded: true,
        blueCopyUploadedAt: new Date("2024-01-23T10:30:00Z"),
        roDocumentUploaded: true,
        roDocumentUploadedAt: new Date("2024-01-25T14:15:00Z"),
        status: "COMPLETED",
        submittedAt: new Date("2024-01-10T09:30:00Z"),
        updatedAt: new Date("2024-01-25T16:45:00Z"),
        dateApproved: new Date("2024-01-22T11:30:00Z"),
        userId: verifiedSurveyors[1].id,
        surveyorId: verifiedSurveyors[1].surveyor.id,
      },
    });
    surveyJobs.push(job1);

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
        requestedCoordinates: [
          { easting: "287234.567", northing: "530456.789" },
          { easting: "287256.789", northing: "530478.123" },
          { easting: "287278.123", northing: "530499.456" },
        ],
        pillarNumbersRequired: 3,
        status: "NIS_REVIEW",
        submittedAt: new Date("2024-01-15T14:20:00Z"),
        updatedAt: new Date("2024-01-16T10:15:00Z"),
        userId: verifiedSurveyors[2].id,
        surveyorId: verifiedSurveyors[2].surveyor.id,
      },
    });
    surveyJobs.push(job2);

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
        requestedCoordinates: [
          { easting: "288789.123", northing: "532789.456" },
        ],
        pillarNumbersRequired: 1,
        status: "ADMIN_REVIEW",
        submittedAt: new Date("2024-01-08T11:45:00Z"),
        updatedAt: new Date("2024-01-20T09:30:00Z"),
        userId: verifiedSurveyors[3].id,
        surveyorId: verifiedSurveyors[3].surveyor.id,
      },
    });
    surveyJobs.push(job3);

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
        requestedCoordinates: [
          { easting: "288567.234", northing: "531234.567" },
          { easting: "288589.456", northing: "531256.789" },
        ],
        pillarNumbersRequired: 2,
        status: "SUBMITTED",
        submittedAt: new Date("2024-01-22T16:30:00Z"),
        userId: verifiedSurveyors[1].id,
        surveyorId: verifiedSurveyors[1].surveyor.id,
      },
    });
    surveyJobs.push(job4);

    // Job 5 - Rejected
    const job5 = await prisma.surveyJob.create({
      data: {
        jobNumber: "JOB-2024-005",
        clientName: "Delta Properties Ltd",
        clientEmail: "projects@deltaproperties.ng",
        clientPhone: "+234 809 876 5432",
        location: "Plot 45-50, Rumuokwuta, Port Harcourt, Rivers State",
        description: "Survey for housing estate development",
        requestedCoordinates: [
          { easting: "286789.123", northing: "529456.789" },
          { easting: "286811.456", northing: "529478.123" },
          { easting: "286833.789", northing: "529499.456" },
          { easting: "286856.123", northing: "529521.789" },
        ],
        pillarNumbersRequired: 4,
        status: "NIS_REJECTED",
        submittedAt: new Date("2024-01-05T13:15:00Z"),
        updatedAt: new Date("2024-01-12T11:20:00Z"),
        userId: verifiedSurveyors[2].id,
        surveyorId: verifiedSurveyors[2].surveyor.id,
      },
    });
    surveyJobs.push(job5);

    console.log(`✅ Created ${surveyJobs.length} survey jobs`);

    // Create Documents for each job
    console.log("📄 Creating documents...");

    const documents = [];

    // Documents for Real Job 1 (Mr. Chimzi)
    const realJob1Docs = await Promise.all([
      prisma.document.create({
        data: {
          fileName: "mandatory_deposit_chimzi.png",
          filePath: "/media/image1.png",
          fileSize: 250000,
          mimeType: "image/png",
          documentType: "OTHER",
          surveyJobId: realJob1.id,
        },
      }),
      prisma.document.create({
        data: {
          fileName: "beacon_fees_chimzi.png",
          filePath: "/media/image2.png",
          fileSize: 240000,
          mimeType: "image/png",
          documentType: "OTHER",
          surveyJobId: realJob1.id,
        },
      }),
      prisma.document.create({
        data: {
          fileName: "sketch_parcel_chimzi.png",
          filePath: "/media/image3.png",
          fileSize: 350000,
          mimeType: "image/png",
          documentType: "SURVEY_PLAN",
          surveyJobId: realJob1.id,
        },
      }),
    ]);
    documents.push(...realJob1Docs);

    // Documents for Real Job 2 (Mr. Oibapka)
    const realJob2Docs = await Promise.all([
      prisma.document.create({
        data: {
          fileName: "mandatory_deposit_oibapka.jpg",
          filePath: "/media/image5.jpg",
          fileSize: 280000,
          mimeType: "image/jpeg",
          documentType: "OTHER",
          surveyJobId: realJob2.id,
        },
      }),
      prisma.document.create({
        data: {
          fileName: "beacon_fees_oibapka.jpg",
          filePath: "/media/image4.jpg",
          fileSize: 270000,
          mimeType: "image/jpeg",
          documentType: "OTHER",
          surveyJobId: realJob2.id,
        },
      }),
      prisma.document.create({
        data: {
          fileName: "sketch_parcel_oibapka.jpg",
          filePath: "/media/image6.jpg",
          fileSize: 320000,
          mimeType: "image/jpeg",
          documentType: "SURVEY_PLAN",
          surveyJobId: realJob2.id,
        },
      }),
    ]);
    documents.push(...realJob2Docs);

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
      prisma.document.create({
        data: {
          fileName: "blue_copy_okonkwo.pdf",
          filePath: "https://example.com/docs/blue_copy_okonkwo.pdf",
          fileSize: 1234567,
          mimeType: "application/pdf",
          documentType: "BLUE_COPY",
          surveyJobId: job1.id,
        },
      }),
      prisma.document.create({
        data: {
          fileName: "ro_document_okonkwo.pdf",
          filePath: "https://example.com/docs/ro_document_okonkwo.pdf",
          fileSize: 987654,
          mimeType: "application/pdf",
          documentType: "RO_DOCUMENT",
          surveyJobId: job1.id,
        },
      }),
    ]);
    documents.push(...job1Docs);

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
    ]);
    documents.push(...job2Docs);

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
    ]);
    documents.push(...job3Docs);

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
    ]);
    documents.push(...job4Docs);

    console.log(`✅ Created ${documents.length} documents`);

    // Create Workflow Steps
    console.log("🔄 Creating workflow steps...");

    const workflowSteps = [];

    // Workflow for Real Job 1 (Mr. Chimzi - Completed)
    const realJob1Workflow = await Promise.all([
      prisma.workflowStep.create({
        data: {
          stepName: "Submitted",
          status: "COMPLETED",
          completedAt: new Date("2025-04-16T09:00:00Z"),
          notes: "Job submitted by KPJ Survey Consultants",
          surveyJobId: realJob1.id,
        },
      }),
      prisma.workflowStep.create({
        data: {
          stepName: "NIS Review",
          status: "COMPLETED",
          completedAt: new Date("2025-04-16T16:30:00Z"),
          notes: "Reviewed and approved by NIS officer",
          surveyJobId: realJob1.id,
        },
      }),
      prisma.workflowStep.create({
        data: {
          stepName: "Admin Review",
          status: "COMPLETED",
          completedAt: new Date("2025-04-17T10:00:00Z"),
          notes: "Final approval granted",
          surveyJobId: realJob1.id,
        },
      }),
      prisma.workflowStep.create({
        data: {
          stepName: "Pillar Number Assignment",
          status: "COMPLETED",
          completedAt: new Date("2025-04-17T11:30:00Z"),
          notes:
            "4 pillar numbers assigned: SC/CS 6670, SC/CS 6671, SC/CS 6672, SC/CS 6673",
          surveyJobId: realJob1.id,
        },
      }),
      prisma.workflowStep.create({
        data: {
          stepName: "Blue Copy Upload",
          status: "COMPLETED",
          completedAt: new Date("2025-04-17T10:30:00Z"),
          notes: "Blue Copy uploaded successfully",
          surveyJobId: realJob1.id,
        },
      }),
      prisma.workflowStep.create({
        data: {
          stepName: "R of O Document Upload",
          status: "COMPLETED",
          completedAt: new Date("2025-04-18T14:15:00Z"),
          notes: "R of O document uploaded successfully",
          surveyJobId: realJob1.id,
        },
      }),
      prisma.workflowStep.create({
        data: {
          stepName: "Completed",
          status: "COMPLETED",
          completedAt: new Date("2025-04-18T16:45:00Z"),
          notes: "Job completed successfully - all requirements fulfilled.",
          surveyJobId: realJob1.id,
        },
      }),
    ]);
    workflowSteps.push(...realJob1Workflow);

    // Workflow for Real Job 2 (Mr. Oibapka - Completed)
    const realJob2Workflow = await Promise.all([
      prisma.workflowStep.create({
        data: {
          stepName: "Submitted",
          status: "COMPLETED",
          completedAt: new Date("2025-07-01T09:00:00Z"),
          notes: "Job submitted by KPJ Survey Consultants",
          surveyJobId: realJob2.id,
        },
      }),
      prisma.workflowStep.create({
        data: {
          stepName: "NIS Review",
          status: "COMPLETED",
          completedAt: new Date("2025-07-01T16:30:00Z"),
          notes: "Reviewed and approved by NIS officer",
          surveyJobId: realJob2.id,
        },
      }),
      prisma.workflowStep.create({
        data: {
          stepName: "Admin Review",
          status: "COMPLETED",
          completedAt: new Date("2025-07-02T10:00:00Z"),
          notes: "Final approval granted",
          surveyJobId: realJob2.id,
        },
      }),
      prisma.workflowStep.create({
        data: {
          stepName: "Pillar Number Assignment",
          status: "COMPLETED",
          completedAt: new Date("2025-07-02T11:30:00Z"),
          notes:
            "5 pillar numbers assigned: SC/CV 0218, SC/CV 0219, SC/CV 0220, SC/CV 0221, SC/CV 0222",
          surveyJobId: realJob2.id,
        },
      }),
      prisma.workflowStep.create({
        data: {
          stepName: "Blue Copy Upload",
          status: "COMPLETED",
          completedAt: new Date("2025-07-02T10:30:00Z"),
          notes: "Blue Copy uploaded successfully",
          surveyJobId: realJob2.id,
        },
      }),
      prisma.workflowStep.create({
        data: {
          stepName: "R of O Document Upload",
          status: "COMPLETED",
          completedAt: new Date("2025-07-03T14:15:00Z"),
          notes: "R of O document uploaded successfully",
          surveyJobId: realJob2.id,
        },
      }),
      prisma.workflowStep.create({
        data: {
          stepName: "Completed",
          status: "COMPLETED",
          completedAt: new Date("2025-07-03T16:45:00Z"),
          notes: "Job completed successfully - all requirements fulfilled.",
          surveyJobId: realJob2.id,
        },
      }),
    ]);
    workflowSteps.push(...realJob2Workflow);

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
          completedAt: new Date("2024-01-22T16:45:00Z"),
          notes:
            "2 pillar numbers assigned: SC/CN 3566, SC/CN 3567. Plan number: PH/GRA/2024/001",
          surveyJobId: job1.id,
        },
      }),
      prisma.workflowStep.create({
        data: {
          stepName: "Blue Copy Upload",
          status: "COMPLETED",
          completedAt: new Date("2024-01-23T10:30:00Z"),
          notes: "Blue Copy uploaded: blue_copy_okonkwo.pdf",
          surveyJobId: job1.id,
        },
      }),
      prisma.workflowStep.create({
        data: {
          stepName: "R of O Document Upload",
          status: "COMPLETED",
          completedAt: new Date("2024-01-25T14:15:00Z"),
          notes: "R of O document uploaded: ro_document_okonkwo.pdf",
          surveyJobId: job1.id,
        },
      }),
      prisma.workflowStep.create({
        data: {
          stepName: "Completed",
          status: "COMPLETED",
          completedAt: new Date("2024-01-25T16:45:00Z"),
          notes: "Job completed successfully - all requirements fulfilled.",
          surveyJobId: job1.id,
        },
      }),
    ]);
    workflowSteps.push(...job1Workflow);

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
      prisma.workflowStep.create({
        data: {
          stepName: "Blue Copy Upload",
          status: "PENDING",
          surveyJobId: job2.id,
        },
      }),
      prisma.workflowStep.create({
        data: {
          stepName: "R of O Document Upload",
          status: "PENDING",
          surveyJobId: job2.id,
        },
      }),
      prisma.workflowStep.create({
        data: {
          stepName: "Completed",
          status: "PENDING",
          surveyJobId: job2.id,
        },
      }),
    ]);
    workflowSteps.push(...job2Workflow);

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
      prisma.workflowStep.create({
        data: {
          stepName: "Blue Copy Upload",
          status: "PENDING",
          surveyJobId: job3.id,
        },
      }),
      prisma.workflowStep.create({
        data: {
          stepName: "R of O Document Upload",
          status: "PENDING",
          surveyJobId: job3.id,
        },
      }),
      prisma.workflowStep.create({
        data: {
          stepName: "Completed",
          status: "PENDING",
          surveyJobId: job3.id,
        },
      }),
    ]);
    workflowSteps.push(...job3Workflow);

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
      prisma.workflowStep.create({
        data: {
          stepName: "Blue Copy Upload",
          status: "PENDING",
          surveyJobId: job4.id,
        },
      }),
      prisma.workflowStep.create({
        data: {
          stepName: "R of O Document Upload",
          status: "PENDING",
          surveyJobId: job4.id,
        },
      }),
      prisma.workflowStep.create({
        data: {
          stepName: "Completed",
          status: "PENDING",
          surveyJobId: job4.id,
        },
      }),
    ]);
    workflowSteps.push(...job4Workflow);

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
          notes:
            "Rejected due to incomplete documentation. Missing boundary coordinates.",
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
      prisma.workflowStep.create({
        data: {
          stepName: "Blue Copy Upload",
          status: "PENDING",
          surveyJobId: job5.id,
        },
      }),
      prisma.workflowStep.create({
        data: {
          stepName: "R of O Document Upload",
          status: "PENDING",
          surveyJobId: job5.id,
        },
      }),
      prisma.workflowStep.create({
        data: {
          stepName: "Completed",
          status: "PENDING",
          surveyJobId: job5.id,
        },
      }),
    ]);
    workflowSteps.push(...job5Workflow);

    console.log(`✅ Created ${workflowSteps.length} workflow steps`);

    // Create Pillar Numbers for completed jobs
    console.log("📍 Creating pillar numbers...");

    const pillarNumbers = await Promise.all([
      // Pillars for Real Job 1 (Mr. Chimzi - Completed)
      prisma.pillarNumber.create({
        data: {
          pillarNumber: "SC/CS 6670",
          coordinates: { easting: "253635.00", northing: "523028.00" },
          issuedDate: new Date("2025-04-17T11:30:00Z"),
          surveyJobId: realJob1.id,
          surveyorId: kpjSurveyor.surveyor.id,
        },
      }),
      prisma.pillarNumber.create({
        data: {
          pillarNumber: "SC/CS 6671",
          coordinates: { easting: "253644.14", northing: "523075.98" },
          issuedDate: new Date("2025-04-17T11:30:00Z"),
          surveyJobId: realJob1.id,
          surveyorId: kpjSurveyor.surveyor.id,
        },
      }),
      prisma.pillarNumber.create({
        data: {
          pillarNumber: "SC/CS 6672",
          coordinates: { easting: "253688.56", northing: "523055.31" },
          issuedDate: new Date("2025-04-17T11:30:00Z"),
          surveyJobId: realJob1.id,
          surveyorId: kpjSurveyor.surveyor.id,
        },
      }),
      prisma.pillarNumber.create({
        data: {
          pillarNumber: "SC/CS 6673",
          coordinates: { easting: "253673.73", northing: "523007.64" },
          issuedDate: new Date("2025-04-17T11:30:00Z"),
          surveyJobId: realJob1.id,
          surveyorId: kpjSurveyor.surveyor.id,
        },
      }),

      // Pillars for Real Job 2 (Mr. Oibapka - Completed)
      prisma.pillarNumber.create({
        data: {
          pillarNumber: "SC/CV 0218",
          coordinates: { easting: "289641.62", northing: "530212.85" },
          issuedDate: new Date("2025-07-02T11:30:00Z"),
          surveyJobId: realJob2.id,
          surveyorId: kpjSurveyor.surveyor.id,
        },
      }),
      prisma.pillarNumber.create({
        data: {
          pillarNumber: "SC/CV 0219",
          coordinates: { easting: "289651.28", northing: "530228.48" },
          issuedDate: new Date("2025-07-02T11:30:00Z"),
          surveyJobId: realJob2.id,
          surveyorId: kpjSurveyor.surveyor.id,
        },
      }),
      prisma.pillarNumber.create({
        data: {
          pillarNumber: "SC/CV 0220",
          coordinates: { easting: "289660.36", northing: "530228.20" },
          issuedDate: new Date("2025-07-02T11:30:00Z"),
          surveyJobId: realJob2.id,
          surveyorId: kpjSurveyor.surveyor.id,
        },
      }),
      prisma.pillarNumber.create({
        data: {
          pillarNumber: "SC/CV 0221",
          coordinates: { easting: "289674.32", northing: "530220.85" },
          issuedDate: new Date("2025-07-02T11:30:00Z"),
          surveyJobId: realJob2.id,
          surveyorId: kpjSurveyor.surveyor.id,
        },
      }),
      prisma.pillarNumber.create({
        data: {
          pillarNumber: "SC/CV 0222",
          coordinates: { easting: "289664.44", northing: "530204.45" },
          issuedDate: new Date("2025-07-02T11:30:00Z"),
          surveyJobId: realJob2.id,
          surveyorId: kpjSurveyor.surveyor.id,
        },
      }),

      // Pillars for Job 1 (Completed) - mapped to coordinates
      prisma.pillarNumber.create({
        data: {
          pillarNumber: "SC/CN 3566",
          coordinates: { easting: "288456.789", northing: "532123.456" },
          issuedDate: new Date("2024-01-22T16:45:00Z"),
          surveyJobId: job1.id,
          surveyorId: verifiedSurveyors[1].surveyor.id,
        },
      }),
      prisma.pillarNumber.create({
        data: {
          pillarNumber: "SC/CN 3567",
          coordinates: { easting: "288478.912", northing: "532145.678" },
          issuedDate: new Date("2024-01-22T16:45:00Z"),
          surveyJobId: job1.id,
          surveyorId: verifiedSurveyors[1].surveyor.id,
        },
      }),
    ]);

    console.log(`✅ Created ${pillarNumbers.length} pillar numbers`);

    // Summary
    console.log("\n🎉 Database seeding completed successfully!");
    console.log("📊 Summary:");
    console.log(`   👥 Users: ${users.length}`);
    console.log(`   🏢 Surveyors: ${users.filter((u) => u.surveyor).length}`);
    console.log(`   📋 Survey Jobs: ${surveyJobs.length}`);
    console.log(`   📄 Documents: ${documents.length}`);
    console.log(`   🔄 Workflow Steps: ${workflowSteps.length}`);
    console.log(`   📍 Pillar Numbers: ${pillarNumbers.length}`);
    console.log(
      `   ⚙️ Pillar System: ${pillarSystem.seriesPrefix} (Last: ${pillarSystem.lastIssuedNumber})`
    );

    console.log("\n🔐 Test Accounts (email → password):");
    console.log("   KPJ Surveyor:");
    console.log("   - kpj.surveys@email.com → surveyorkurotamuno");
    console.log("   Other Surveyors:");
    console.log("   - adebayo.johnson@email.com → surveyoradebayo");
    console.log("   - chioma.okafor@email.com → surveyorchioma");
    console.log("   - ibrahim.musa@email.com → surveyoribrahim");
    console.log("   - grace.emenike@email.com → surveyorgrace");
    console.log("   NIS Officer:");
    console.log("   - samuel.okoro@nis.gov.ng → nissamuel");
    console.log("   Admin:");
    console.log("   - patricia.wike@surveyorgeneral.rs.gov.ng → adminmrs.");

    console.log("\n📌 Real KPJ Jobs Added:");
    console.log("   - JOB-2025-KPJ-001: Mr. Chimzi (Ogoin-Piri, Abonnema)");
    console.log(
      "   - JOB-2025-KPJ-002: Mr. Oibapka Maharba Homi (Oka-Nsimu Ebara, Eleme)"
    );
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
