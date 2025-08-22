import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

// Generate next available pillar number(s)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get or create pillar system configuration
    let pillarSystem = await prisma.pillarSystem.findFirst();
    if (!pillarSystem) {
      pillarSystem = await prisma.pillarSystem.create({
        data: {
          seriesPrefix: "SC/CN",
          lastIssuedNumber: 0,
        },
      });
    }

    const nextNumber = pillarSystem.lastIssuedNumber + 1;
    const pillarNumber = `${pillarSystem.seriesPrefix} ${nextNumber}`;

    return NextResponse.json({
      pillarNumber,
      nextNumber,
      seriesPrefix: pillarSystem.seriesPrefix,
    });
  } catch (error) {
    console.error("Pillar number generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate pillar number" },
      { status: 500 }
    );
  }
}

// Generate multiple pillar numbers
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { count = 1, seriesPrefix } = await request.json();

    if (count < 1 || count > 50) {
      return NextResponse.json(
        { error: "Count must be between 1 and 50" },
        { status: 400 }
      );
    }

    // Get or create pillar system configuration
    let pillarSystem = await prisma.pillarSystem.findFirst();
    if (!pillarSystem) {
      pillarSystem = await prisma.pillarSystem.create({
        data: {
          seriesPrefix: seriesPrefix || "SC/CN",
          lastIssuedNumber: 0,
        },
      });
    }

    // Update series prefix if provided
    if (seriesPrefix && seriesPrefix !== pillarSystem.seriesPrefix) {
      pillarSystem = await prisma.pillarSystem.update({
        where: { id: pillarSystem.id },
        data: { seriesPrefix },
      });
    }

    // Generate consecutive pillar numbers
    const pillarNumbers = [];
    const startNumber = pillarSystem.lastIssuedNumber + 1;
    
    for (let i = 0; i < count; i++) {
      const number = startNumber + i;
      pillarNumbers.push(`${pillarSystem.seriesPrefix} ${number}`);
    }

    // Update the last issued number
    await prisma.pillarSystem.update({
      where: { id: pillarSystem.id },
      data: {
        lastIssuedNumber: startNumber + count - 1,
      },
    });

    return NextResponse.json({
      pillarNumbers,
      count,
      seriesPrefix: pillarSystem.seriesPrefix,
      startNumber,
      endNumber: startNumber + count - 1,
    });
  } catch (error) {
    console.error("Pillar numbers generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate pillar numbers" },
      { status: 500 }
    );
  }
}
