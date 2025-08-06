import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

// NIS Officer Reject Surveyor
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "NIS_OFFICER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { surveyorId, reason } = await request.json();

    if (!surveyorId || !reason) {
      return NextResponse.json(
        {
          error: "Surveyor ID and rejection reason are required",
        },
        { status: 400 }
      );
    }

    // Update surveyor status to NIS_REJECTED
    const surveyor = await prisma.surveyor.update({
      where: { id: surveyorId },
      data: {
        status: "NIS_REJECTED",
      },
      include: {
        user: true,
      },
    });

    // TODO: Send email notification to surveyor with rejection reason

    return NextResponse.json({
      success: true,
      message: "Surveyor registration rejected by NIS.",
      surveyor: {
        id: surveyor.id,
        status: surveyor.status,
        name: surveyor.user.name,
      },
    });
  } catch (error) {
    console.error("NIS rejection error:", error);
    return NextResponse.json(
      { error: "Failed to reject surveyor" },
      { status: 500 }
    );
  }
}
