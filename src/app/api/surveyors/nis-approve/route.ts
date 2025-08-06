import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

// NIS Officer Approve Surveyor
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "NIS_OFFICER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { surveyorId, comments } = await request.json();

    if (!surveyorId) {
      return NextResponse.json(
        { error: "Surveyor ID is required" },
        { status: 400 }
      );
    }

    // Update surveyor status to NIS_APPROVED
    const surveyor = await prisma.surveyor.update({
      where: { id: surveyorId },
      data: {
        status: "NIS_APPROVED",
        verifiedAt: new Date(),
      },
      include: {
        user: true,
      },
    });

    // TODO: Send email notification to surveyor and admin

    return NextResponse.json({
      success: true,
      message:
        "Surveyor approved by NIS. Forwarded to Admin for final approval.",
      surveyor: {
        id: surveyor.id,
        status: surveyor.status,
        name: surveyor.user.name,
      },
    });
  } catch (error) {
    console.error("NIS approval error:", error);
    return NextResponse.json(
      { error: "Failed to approve surveyor" },
      { status: 500 }
    );
  }
}
