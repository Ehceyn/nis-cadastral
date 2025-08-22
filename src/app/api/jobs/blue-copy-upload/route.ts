import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "SURVEYOR") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { jobId, documentUrl, fileName, fileSize, mimeType } = await request.json();

    if (!jobId || !documentUrl || !fileName) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Verify job exists and belongs to the surveyor
    const job = await prisma.surveyJob.findUnique({
      where: { id: jobId },
      include: {
        pillarNumbers: true,
      },
    });

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    if (job.userId !== session.user.id) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Check if pillar numbers have been issued (Blue Copy upload prerequisite)
    if (job.pillarNumbers.length === 0) {
      return NextResponse.json(
        { error: "Blue Copy upload is only available after pillar numbers are issued" },
        { status: 400 }
      );
    }

    // Check if Blue Copy already uploaded
    if (job.blueCopyUploaded) {
      return NextResponse.json(
        { error: "Blue Copy has already been uploaded" },
        { status: 400 }
      );
    }

    // Start transaction
    const result = await prisma.$transaction(async (tx) => {
      // Update job with Blue Copy upload status
      const updatedJob = await tx.surveyJob.update({
        where: { id: jobId },
        data: {
          blueCopyUploaded: true,
          blueCopyUploadedAt: new Date(),
        },
      });

      // Create document record
      await tx.document.create({
        data: {
          fileName,
          filePath: documentUrl,
          fileSize,
          mimeType,
          documentType: "BLUE_COPY",
          surveyJobId: jobId,
        },
      });

      // Update workflow step
      await tx.workflowStep.updateMany({
        where: {
          surveyJobId: jobId,
          stepName: "Blue Copy Upload",
        },
        data: {
          status: "COMPLETED",
          completedAt: new Date(),
          notes: `Blue Copy uploaded: ${fileName}`,
        },
      });

      // Activate R of O Document Upload workflow step for admin
      await tx.workflowStep.updateMany({
        where: {
          surveyJobId: jobId,
          stepName: "R of O Document Upload",
        },
        data: {
          status: "IN_PROGRESS",
          notes: "Blue Copy uploaded. Admin can now upload R of O document.",
        },
      });

      return updatedJob;
    });

    return NextResponse.json({
      success: true,
      message: "Blue Copy uploaded successfully",
      job: {
        id: result.id,
        jobNumber: result.jobNumber,
        blueCopyUploaded: result.blueCopyUploaded,
      },
    });
  } catch (error) {
    console.error("Blue Copy upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload Blue Copy" },
      { status: 500 }
    );
  }
}