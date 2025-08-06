import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

// Generate next pillar number
async function generatePillarNumber(): Promise<string> {
  const year = new Date().getFullYear();

  // Get the latest pillar number for this year
  const latestPillar = await prisma.pillarNumber.findFirst({
    where: {
      pillarNumber: {
        startsWith: `PIL-${year}-`,
      },
    },
    orderBy: {
      pillarNumber: "desc",
    },
  });

  let sequence = 1;
  if (latestPillar) {
    const match = latestPillar.pillarNumber.match(/PIL-\d{4}-(\d+)/);
    if (match) {
      sequence = parseInt(match[1]) + 1;
    }
  }

  return `PIL-${year}-${sequence.toString().padStart(3, "0")}`;
}

// Admin Approve Job with Pillar Number Issuance
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { jobId, pillarNumber, comments, coordinates } = await request.json();

    if (!jobId) {
      return NextResponse.json(
        { error: "Job ID is required" },
        { status: 400 }
      );
    }

    // Verify job was approved by NIS first
    const job = await prisma.surveyJob.findUnique({
      where: { id: jobId },
      include: {
        surveyor: true,
      },
    });

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    if (job.status !== "ADMIN_REVIEW") {
      return NextResponse.json(
        {
          error: "Job must be approved by NIS first",
        },
        { status: 400 }
      );
    }

    // Generate pillar number if not provided
    const finalPillarNumber = pillarNumber || (await generatePillarNumber());

    // Check if pillar number already exists
    const existingPillar = await prisma.pillarNumber.findUnique({
      where: { pillarNumber: finalPillarNumber },
    });

    if (existingPillar) {
      return NextResponse.json(
        {
          error: "Pillar number already exists",
        },
        { status: 400 }
      );
    }

    // Start transaction for atomic operations
    const result = await prisma.$transaction(async (tx) => {
      // Update job status to COMPLETED
      const updatedJob = await tx.surveyJob.update({
        where: { id: jobId },
        data: {
          status: "COMPLETED",
          updatedAt: new Date(),
          dateApproved: new Date(),
        },
        include: {
          surveyor: {
            include: { user: true },
          },
        },
      });

      // Create pillar number record
      const pillar = await tx.pillarNumber.create({
        data: {
          pillarNumber: finalPillarNumber,
          coordinates: coordinates || job.coordinates || {},
          surveyJobId: jobId,
          surveyorId: job.surveyorId,
          issuedDate: new Date(),
        },
      });

      // Update Admin Review workflow step
      await tx.workflowStep.updateMany({
        where: {
          surveyJobId: jobId,
          stepName: "Admin Review",
        },
        data: {
          status: "COMPLETED",
          completedAt: new Date(),
          notes: comments || "Approved by Admin with pillar number issued",
        },
      });

      // Update Pillar Number Assignment workflow step
      await tx.workflowStep.updateMany({
        where: {
          surveyJobId: jobId,
          stepName: "Pillar Number Assignment",
        },
        data: {
          status: "COMPLETED",
          completedAt: new Date(),
          notes: `Pillar number ${finalPillarNumber} assigned`,
        },
      });

      return { updatedJob, pillar };
    });

    // TODO: Send email notification to surveyor about job completion and pillar number

    return NextResponse.json({
      success: true,
      message: "Job approved and pillar number issued successfully.",
      job: {
        id: result.updatedJob.id,
        jobNumber: result.updatedJob.jobNumber,
        status: result.updatedJob.status,
        pillarNumber: result.pillar.pillarNumber,
      },
    });
  } catch (error) {
    console.error("Admin job approval error:", error);
    return NextResponse.json(
      { error: "Failed to approve job" },
      { status: 500 }
    );
  }
}
