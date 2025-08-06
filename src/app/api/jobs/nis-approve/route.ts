import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

// NIS Officer Approve Job
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "NIS_OFFICER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { jobId, comments } = await request.json();

    if (!jobId) {
      return NextResponse.json(
        { error: "Job ID is required" },
        { status: 400 }
      );
    }

    // Update job status to NIS_APPROVED and forward to admin
    const job = await prisma.surveyJob.update({
      where: { id: jobId },
      data: {
        status: "ADMIN_REVIEW",
        updatedAt: new Date(),
      },
      include: {
        surveyor: {
          include: { user: true },
        },
      },
    });

    // Update NIS Review workflow step
    await prisma.workflowStep.updateMany({
      where: {
        surveyJobId: jobId,
        stepName: "NIS Review",
      },
      data: {
        status: "COMPLETED",
        completedAt: new Date(),
        notes: comments || "Approved by NIS officer",
      },
    });

    // Update Admin Review workflow step to IN_PROGRESS
    await prisma.workflowStep.updateMany({
      where: {
        surveyJobId: jobId,
        stepName: "Admin Review",
      },
      data: {
        status: "IN_PROGRESS",
      },
    });

    // TODO: Send email notification to admin about job ready for review

    return NextResponse.json({
      success: true,
      message: "Job approved by NIS and forwarded to Admin for final approval.",
      job: {
        id: job.id,
        jobNumber: job.jobNumber,
        status: job.status,
      },
    });
  } catch (error) {
    console.error("NIS job approval error:", error);
    return NextResponse.json(
      { error: "Failed to approve job" },
      { status: 500 }
    );
  }
}
