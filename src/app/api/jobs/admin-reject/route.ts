import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

// Admin Reject Job
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { jobId, reason } = await request.json();

    if (!jobId || !reason) {
      return NextResponse.json(
        {
          error: "Job ID and rejection reason are required",
        },
        { status: 400 }
      );
    }

    // Update job status to ADMIN_REJECTED
    const job = await prisma.surveyJob.update({
      where: { id: jobId },
      data: {
        status: "ADMIN_REJECTED",
        updatedAt: new Date(),
      },
      include: {
        surveyor: {
          include: { user: true },
        },
      },
    });

    // Update Admin Review workflow step
    await prisma.workflowStep.updateMany({
      where: {
        surveyJobId: jobId,
        stepName: "Admin Review",
      },
      data: {
        status: "REJECTED",
        completedAt: new Date(),
        notes: reason,
      },
    });

    // TODO: Send email notification to surveyor about job rejection

    return NextResponse.json({
      success: true,
      message: "Job rejected by Admin.",
      job: {
        id: job.id,
        jobNumber: job.jobNumber,
        status: job.status,
      },
    });
  } catch (error) {
    console.error("Admin job rejection error:", error);
    return NextResponse.json(
      { error: "Failed to reject job" },
      { status: 500 }
    );
  }
}
