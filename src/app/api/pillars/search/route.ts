import { type NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { utmToWgs84 } from "@/lib/utils";

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

    // Convert UTM coordinates to WGS84 for display and mapping
    const utmCoords = pillar.coordinates as {
      easting: string;
      northing: string;
    };
    let convertedCoords = {
      latitude: 0,
      longitude: 0,
      easting: "",
      northing: "",
    };

    if (utmCoords && utmCoords.easting && utmCoords.northing) {
      const easting = parseFloat(utmCoords.easting);
      const northing = parseFloat(utmCoords.northing);

      if (!isNaN(easting) && !isNaN(northing)) {
        convertedCoords = {
          ...utmToWgs84(easting, northing),
          easting: utmCoords.easting,
          northing: utmCoords.northing,
        };
      }
    }

    const result = {
      pillarNumber: pillar.pillarNumber,
      coordinates: convertedCoords,
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

      // Filter pillars within the specified radius
      const nearbyPillars = allPillars
        .map((nearbyPillar) => {
          const nearbyUtmCoords = nearbyPillar.coordinates as {
            easting: string;
            northing: string;
          };

          // Convert nearby pillar UTM coordinates to WGS84
          if (
            !nearbyUtmCoords ||
            !nearbyUtmCoords.easting ||
            !nearbyUtmCoords.northing
          ) {
            return null;
          }

          const easting = parseFloat(nearbyUtmCoords.easting);
          const northing = parseFloat(nearbyUtmCoords.northing);

          if (isNaN(easting) || isNaN(northing)) {
            return null;
          }

          const nearbyWgs84Coords = {
            ...utmToWgs84(easting, northing),
            easting: nearbyUtmCoords.easting,
            northing: nearbyUtmCoords.northing,
          };

          const distance = calculateDistance(
            convertedCoords.latitude,
            convertedCoords.longitude,
            nearbyWgs84Coords.latitude,
            nearbyWgs84Coords.longitude
          );

          return {
            pillarNumber: nearbyPillar.pillarNumber,
            coordinates: nearbyWgs84Coords,
            distance,
          };
        })
        .filter(
          (pillar): pillar is NonNullable<typeof pillar> =>
            pillar !== null && pillar.distance <= radius
        )
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
