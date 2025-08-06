import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

// Generate next available pillar number
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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

    const nextPillarNumber = `PIL-${year}-${sequence.toString().padStart(3, "0")}`;

    return NextResponse.json({
      pillarNumber: nextPillarNumber,
      sequence,
      year,
    });
  } catch (error) {
    console.error("Pillar number generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate pillar number" },
      { status: 500 }
    );
  }
}

// Validate pillar number availability
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { pillarNumber } = await request.json();

    if (!pillarNumber) {
      return NextResponse.json(
        { error: "Pillar number is required" },
        { status: 400 }
      );
    }

    // Check if pillar number already exists
    const existingPillar = await prisma.pillarNumber.findUnique({
      where: { pillarNumber },
    });

    return NextResponse.json({
      available: !existingPillar,
      pillarNumber,
      exists: !!existingPillar,
    });
  } catch (error) {
    console.error("Pillar number validation error:", error);
    return NextResponse.json(
      { error: "Failed to validate pillar number" },
      { status: 500 }
    );
  }
}
