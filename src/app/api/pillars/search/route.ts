import { type NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// UTM Zone 32N to WGS84 conversion function
function utmToWgs84(easting: number, northing: number) {
  // UTM Zone 32N parameters
  const k0 = 0.9996; // scale factor
  const E0 = 500000; // false easting
  const N0 = 0; // false northing for northern hemisphere
  const a = 6378137; // WGS84 semi-major axis
  const e2 = 0.00669437999014; // WGS84 first eccentricity squared
  const e1 = (1 - Math.sqrt(1 - e2)) / (1 + Math.sqrt(1 - e2));
  
  const x = easting - E0;
  const y = northing - N0;
  
  const M = y / k0;
  const mu = M / (a * (1 - e2/4 - 3*e2*e2/64 - 5*e2*e2*e2/256));
  
  const phi1 = mu + (3*e1/2 - 27*e1*e1*e1/32) * Math.sin(2*mu)
                  + (21*e1*e1/16 - 55*e1*e1*e1*e1/32) * Math.sin(4*mu)
                  + (151*e1*e1*e1/96) * Math.sin(6*mu);
  
  const nu1 = a / Math.sqrt(1 - e2 * Math.sin(phi1) * Math.sin(phi1));
  
  const T1 = Math.tan(phi1) * Math.tan(phi1);
  const C1 = e2 * Math.cos(phi1) * Math.cos(phi1) / (1 - e2);
  const R1 = a * (1 - e2) / Math.pow(1 - e2 * Math.sin(phi1) * Math.sin(phi1), 3/2);
  const D = x / (nu1 * k0);
  
  const lat = phi1 - (nu1 * Math.tan(phi1) / R1) * (D*D/2 - (5 + 3*T1 + 10*C1 - 4*C1*C1 - 9*e2) * D*D*D*D/24
                + (61 + 90*T1 + 298*C1 + 45*T1*T1 - 252*e2 - 3*C1*C1) * Math.pow(D, 6)/720);
  
  const lng = 9 + (D - (1 + 2*T1 + C1) * D*D*D/6 + (5 - 2*C1 + 28*T1 - 3*C1*C1 + 8*e2 + 24*T1*T1) * Math.pow(D, 5)/120) / Math.cos(phi1);
  
  return {
    latitude: lat * 180 / Math.PI,
    longitude: lng
  };
}

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
    const utmCoords = pillar.coordinates as { easting: string; northing: string };
    let convertedCoords = { latitude: 0, longitude: 0 };
    
    if (utmCoords && utmCoords.easting && utmCoords.northing) {
      const easting = parseFloat(utmCoords.easting);
      const northing = parseFloat(utmCoords.northing);
      
      if (!isNaN(easting) && !isNaN(northing)) {
        convertedCoords = utmToWgs84(easting, northing);
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
          const nearbyUtmCoords = nearbyPillar.coordinates as { easting: string; northing: string };
          
          // Convert nearby pillar UTM coordinates to WGS84
          if (!nearbyUtmCoords || !nearbyUtmCoords.easting || !nearbyUtmCoords.northing) {
            return null;
          }
          
          const easting = parseFloat(nearbyUtmCoords.easting);
          const northing = parseFloat(nearbyUtmCoords.northing);
          
          if (isNaN(easting) || isNaN(northing)) {
            return null;
          }
          
          const nearbyWgs84Coords = utmToWgs84(easting, northing);
          
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
        .filter((pillar): pillar is NonNullable<typeof pillar> => pillar !== null && pillar.distance <= radius)
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
