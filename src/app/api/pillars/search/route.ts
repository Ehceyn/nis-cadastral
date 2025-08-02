import { type NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// Helper function to calculate distance between two coordinates using Haversine formula
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q");
    const includeNearby = searchParams.get("includeNearby") === "true";
    const radius = parseFloat(searchParams.get("radius") || "5"); // Default 5km radius

    if (!query) {
      return NextResponse.json(
        { message: "Search query is required" },
        { status: 400 }
      );
    }

    const pillar = await prisma.pillarNumber.findUnique({
      where: { pillarNumber: query },
      include: {
        surveyor: {
          include: {
            user: true,
          },
        },
        surveyJob: true,
      },
    });

    if (!pillar) {
      return NextResponse.json(null);
    }

    const result = {
      pillarNumber: pillar.pillarNumber,
      coordinates: pillar.coordinates,
      issuedDate: pillar.issuedDate,
      surveyor: {
        name: pillar.surveyor.user.name,
        firmName: pillar.surveyor.firmName,
        surconRegistrationNumber: pillar.surveyor.surconRegistrationNumber,
      },
      surveyJob: {
        location: pillar.surveyJob.location,
        clientName: pillar.surveyJob.clientName,
        status: pillar.surveyJob.status,
      },
      nearbyPillars: [] as any[],
    };

    // Find nearby pillars if requested
    if (includeNearby) {
      const allPillars = await prisma.pillarNumber.findMany({
        where: {
          pillarNumber: {
            not: query, // Exclude the main pillar
          },
        },
        select: {
          pillarNumber: true,
          coordinates: true,
        },
      });

      const mainCoords = pillar.coordinates as { lat: number; lng: number };

      // Filter pillars within the specified radius
      const nearbyPillars = allPillars
        .map((nearbyPillar) => {
          const nearbyCoords = nearbyPillar.coordinates as {
            lat: number;
            lng: number;
          };
          const distance = calculateDistance(
            mainCoords.lat,
            mainCoords.lng,
            nearbyCoords.lat,
            nearbyCoords.lng
          );

          return {
            pillarNumber: nearbyPillar.pillarNumber,
            coordinates: nearbyCoords,
            distance,
          };
        })
        .filter((pillar) => pillar.distance <= radius)
        .sort((a, b) => a.distance - b.distance)
        .slice(0, 10); // Limit to 10 nearest pillars

      result.nearbyPillars = nearbyPillars;
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
