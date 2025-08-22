import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { jobId, documentUrl, fileName, fileSize, mimeType } = await request.json();

    if (!jobId || !documentUrl || !fileName) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Verify job exists and Blue Copy has been uploaded
    const job = await prisma.surveyJob.findUnique({
      where: { id: jobId },
    });

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    // Check if Blue Copy has been uploaded (R of O upload prerequisite)
    if (!job.blueCopyUploaded) {
      return NextResponse.json(
        { error: "R of O document upload is only available after Blue Copy is uploaded" },
        { status: 400 }
      );
    }

    // Check if R of O already uploaded
    if (job.roDocumentUploaded) {
      return NextResponse.json(
        { error: "R of O document has already been uploaded" },
        { status: 400 }
      );
    }

    // Start transaction
    const result = await prisma.$transaction(async (tx) => {
      // Update job with R of O upload status and mark as COMPLETED
      const updatedJob = await tx.surveyJob.update({
        where: { id: jobId },
        data: {
          roDocumentUploaded: true,
          roDocumentUploadedAt: new Date(),
          status: "COMPLETED", // Job is now complete!
        },
      });

      // Create document record
      await tx.document.create({
        data: {
          fileName,
          filePath: documentUrl,
          fileSize,
          mimeType,
          documentType: "RO_DOCUMENT",
          surveyJobId: jobId,
        },
      });

      // Complete R of O Document Upload workflow step
      await tx.workflowStep.updateMany({
        where: {
          surveyJobId: jobId,
          stepName: "R of O Document Upload",
        },
        data: {
          status: "COMPLETED",
          completedAt: new Date(),
          notes: `R of O document uploaded: ${fileName}`,
        },
      });

      // Complete final Completed workflow step
      await tx.workflowStep.updateMany({
        where: {
          surveyJobId: jobId,
          stepName: "Completed",
        },
        data: {
          status: "COMPLETED",
          completedAt: new Date(),
          notes: "Job completed successfully - all requirements fulfilled.",
        },
      });

      return updatedJob;
    });

    // TODO: Send email notification to surveyor about job completion

    return NextResponse.json({
      success: true,
      message: "R of O document uploaded successfully. Job marked as completed.",
      job: {
        id: result.id,
        jobNumber: result.jobNumber,
        status: result.status,
        roDocumentUploaded: result.roDocumentUploaded,
      },
    });
  } catch (error) {
    console.error("R of O document upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload R of O document" },
      { status: 500 }
    );
  }
}