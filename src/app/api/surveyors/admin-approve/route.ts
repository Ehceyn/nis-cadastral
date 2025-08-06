import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

// Admin Final Approve Surveyor
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { surveyorId, comments } = await request.json();

    if (!surveyorId) {
      return NextResponse.json(
        { error: "Surveyor ID is required" },
        { status: 400 }
      );
    }

    // Verify surveyor was approved by NIS first
    const surveyor = await prisma.surveyor.findUnique({
      where: { id: surveyorId },
      include: { user: true },
    });

    if (!surveyor) {
      return NextResponse.json(
        { error: "Surveyor not found" },
        { status: 404 }
      );
    }

    if (surveyor.status !== "NIS_APPROVED") {
      return NextResponse.json(
        {
          error: "Surveyor must be approved by NIS first",
        },
        { status: 400 }
      );
    }

    // Update surveyor status to VERIFIED (final approval)
    const updatedSurveyor = await prisma.surveyor.update({
      where: { id: surveyorId },
      data: {
        status: "VERIFIED",
        verifiedAt: new Date(),
      },
      include: {
        user: true,
      },
    });

    // TODO: Send email notification to surveyor about final approval

    return NextResponse.json({
      success: true,
      message: "Surveyor fully verified and can now submit jobs.",
      surveyor: {
        id: updatedSurveyor.id,
        status: updatedSurveyor.status,
        name: updatedSurveyor.user.name,
      },
    });
  } catch (error) {
    console.error("Admin approval error:", error);
    return NextResponse.json(
      { error: "Failed to approve surveyor" },
      { status: 500 }
    );
  }
}
