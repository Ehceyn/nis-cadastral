import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { surveyJobSchema } from "@/lib/validations";
import { Prisma } from "@prisma/client";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const jobs = await prisma.surveyJob.findMany({
      where: { userId: session.user.id },
      include: {
        surveyor: {
          include: {
            user: true,
          },
        },
        documents: true,
        workflowSteps: true,
        pillarNumbers: true,
      },
      orderBy: {
        submittedAt: "desc",
      },
    });

    return NextResponse.json(jobs);
  } catch (error) {
    console.error("Jobs fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch jobs" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { documents, ...jobData } = body;

    // Validate job data
    const validatedData = surveyJobSchema.parse(jobData);

    // Get surveyor info
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { surveyor: true },
    });

    if (!user?.surveyor) {
      return NextResponse.json(
        { error: "Surveyor profile not found" },
        { status: 400 }
      );
    }

    if (user.surveyor.status !== "VERIFIED") {
      return NextResponse.json(
        { error: "Surveyor not verified" },
        { status: 400 }
      );
    }

    // Generate job number
    const jobCount = await prisma.surveyJob.count();
    const jobNumber = `JOB-${new Date().getFullYear()}-${String(jobCount + 1).padStart(3, "0")}`;

    // Create survey job with documents
    const surveyJob = await prisma.surveyJob.create({
      data: {
        jobNumber,
        clientName: validatedData.clientName,
        clientEmail: validatedData.clientEmail || null,
        clientPhone: validatedData.clientPhone,
        location: validatedData.location,
        description: validatedData.description || null,
        coordinates: validatedData.coordinates
          ? (validatedData.coordinates as Prisma.InputJsonValue)
          : Prisma.JsonNull,
        userId: session.user.id,
        surveyorId: user.surveyor.id,
        documents: {
          create: documents.map((doc: any) => ({
            fileName: doc.fileName,
            filePath: doc.filePath,
            fileSize: doc.fileSize,
            mimeType: doc.mimeType,
            documentType: doc.documentType,
          })),
        },
        workflowSteps: {
          create: [
            {
              stepName: "Submitted",
              status: "COMPLETED",
              completedAt: new Date(),
              notes: "Job submitted by surveyor",
            },
            {
              stepName: "NIS Review",
              status: "PENDING",
            },
            {
              stepName: "Admin Review",
              status: "PENDING",
            },
            {
              stepName: "Pillar Number Assignment",
              status: "PENDING",
            },
          ],
        },
      },
      include: {
        documents: true,
        workflowSteps: true,
      },
    });

    return NextResponse.json({
      message: "Job submitted successfully",
      jobNumber: surveyJob.jobNumber,
      jobId: surveyJob.id,
    });
  } catch (error) {
    console.error("Job submission error:", error);
    return NextResponse.json(
      { error: "Failed to submit job" },
      { status: 500 }
    );
  }
}
