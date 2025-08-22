import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";


// Admin Approve Job with Pillar Number Issuance
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { jobId, pillarNumbers, planNumber, requestedCoordinates, comments } = await request.json();

    if (!jobId) {
      return NextResponse.json(
        { error: "Job ID is required" },
        { status: 400 }
      );
    }

    if (!pillarNumbers || !Array.isArray(pillarNumbers) || pillarNumbers.length === 0) {
      return NextResponse.json(
        { error: "Pillar numbers are required" },
        { status: 400 }
      );
    }

    if (!planNumber) {
      return NextResponse.json(
        { error: "Plan number is required" },
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

    // Check if any pillar numbers already exist
    const existingPillars = await prisma.pillarNumber.findMany({
      where: {
        pillarNumber: {
          in: pillarNumbers,
        },
      },
    });

    if (existingPillars.length > 0) {
      return NextResponse.json(
        {
          error: `Pillar number(s) already exist: ${existingPillars.map(p => p.pillarNumber).join(', ')}`,
        },
        { status: 400 }
      );
    }

    // Start transaction for atomic operations
    const result = await prisma.$transaction(async (tx) => {
      // Update job status to ADMIN_APPROVED (not COMPLETED yet - awaits Blue Copy workflow)
      const updatedJob = await tx.surveyJob.update({
        where: { id: jobId },
        data: {
          status: "ADMIN_APPROVED",
          planNumber: planNumber,
          updatedAt: new Date(),
          dateApproved: new Date(),
        },
        include: {
          surveyor: {
            include: { user: true },
          },
        },
      });

      // Create pillar number records mapped to coordinates
      const pillars = await Promise.all(
        pillarNumbers.map((pillarNumber: string, index: number) =>
          tx.pillarNumber.create({
            data: {
              pillarNumber,
              coordinates: requestedCoordinates?.[index] || {},
              surveyJobId: jobId,
              surveyorId: job.surveyorId,
              issuedDate: new Date(),
            },
          })
        )
      );

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
          notes: `${pillarNumbers.length} pillar numbers assigned: ${pillarNumbers.join(', ')}`,
        },
      });

      // Activate Blue Copy Upload workflow step
      await tx.workflowStep.updateMany({
        where: {
          surveyJobId: jobId,
          stepName: "Blue Copy Upload",
        },
        data: {
          status: "IN_PROGRESS",
          notes: "Pillar numbers issued. Blue copy upload now available.",
        },
      });

      return { updatedJob, pillars };
    });

    // TODO: Send email notification to surveyor about job completion and pillar number

    return NextResponse.json({
      success: true,
      message: `Job approved and ${pillarNumbers.length} pillar numbers issued successfully.`,
      job: {
        id: result.updatedJob.id,
        jobNumber: result.updatedJob.jobNumber,
        status: result.updatedJob.status,
        planNumber: result.updatedJob.planNumber,
        pillarNumbers: result.pillars.map(p => p.pillarNumber),
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
