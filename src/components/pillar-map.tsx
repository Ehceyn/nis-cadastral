"use client";

import { useEffect, useRef, useState } from "react";
import { Loader } from "@googlemaps/js-api-loader";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Navigation, Copy, ExternalLink } from "lucide-react";
import { toast } from "sonner";

interface PillarMapProps {
  pillar: {
    pillarNumber: string;
    coordinates: { lat: number; lng: number };
    issuedDate: string;
    surveyor: {
      name: string;
      firmName: string;
      surconRegistrationNumber: string;
    };
    surveyJob: {
      location: string;
      clientName: string;
      status: string;
    };
  } | null;
  nearbyPillars?: Array<{
    pillarNumber: string;
    coordinates: { lat: number; lng: number };
    distance?: number;
  }>;
}

export function PillarMap({ pillar, nearbyPillars = [] }: PillarMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [mapError, setMapError] = useState<string | null>(null);

  useEffect(() => {
    if (!pillar || !mapRef.current) return;

    const initMap = async () => {
      try {
        setIsLoading(true);
        setMapError(null);

        // Note: In production, you'll need to add your Google Maps API key
        // For now, we'll use a placeholder that shows the concept
        const loader = new Loader({
          apiKey:
            process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "YOUR_API_KEY_HERE",
          version: "weekly",
          libraries: ["places", "geometry"],
        });

        const google = await loader.load();

        const map = new (google as any).maps.Map(mapRef.current!, {
          center: pillar.coordinates,
          zoom: 16,
          mapTypeId: (google as any).maps.MapTypeId.HYBRID,
          mapTypeControl: true,
          streetViewControl: true,
          fullscreenControl: true,
          zoomControl: true,
        });

        mapInstanceRef.current = map;

        // Create custom marker for the main pillar
        const mainMarker = new (google as any).maps.Marker({
          position: pillar.coordinates,
          map: map,
          title: pillar.pillarNumber,
          icon: {
            url:
              "data:image/svg+xml;charset=UTF-8," +
              encodeURIComponent(`
              <svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
                <circle cx="20" cy="20" r="18" fill="#dc2626" stroke="#fff" stroke-width="3"/>
                <circle cx="20" cy="20" r="8" fill="#fff"/>
                <text x="20" y="25" text-anchor="middle" font-family="Arial" font-size="10" fill="#dc2626">P</text>
              </svg>
            `),
            scaledSize: new (google as any).maps.Size(40, 40),
            anchor: new (google as any).maps.Point(20, 20),
          },
        });

        // Create info window for main pillar
        const infoWindow = new (google as any).maps.InfoWindow({
          content: `
            <div class="p-3 max-w-xs">
              <h3 class="font-bold text-lg mb-2">${pillar.pillarNumber}</h3>
              <div class="space-y-1 text-sm">
                <p><strong>Location:</strong> ${pillar.surveyJob.location}</p>
                <p><strong>Client:</strong> ${pillar.surveyJob.clientName}</p>
                <p><strong>Surveyor:</strong> ${pillar.surveyor.name}</p>
                <p><strong>Firm:</strong> ${pillar.surveyor.firmName}</p>
                <p><strong>Coordinates:</strong> ${pillar.coordinates.lat.toFixed(6)}, ${pillar.coordinates.lng.toFixed(6)}</p>
                <p><strong>Issued:</strong> ${new Date(pillar.issuedDate).toLocaleDateString()}</p>
              </div>
            </div>
          `,
        });

        mainMarker.addListener("click", () => {
          infoWindow.open(map, mainMarker);
        });

        // Add nearby pillars if available
        nearbyPillars.forEach((nearbyPillar, index) => {
          const nearbyMarker = new (google as any).maps.Marker({
            position: nearbyPillar.coordinates,
            map: map,
            title: nearbyPillar.pillarNumber,
            icon: {
              url:
                "data:image/svg+xml;charset=UTF-8," +
                encodeURIComponent(`
                <svg width="30" height="30" viewBox="0 0 30 30" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="15" cy="15" r="13" fill="#2563eb" stroke="#fff" stroke-width="2"/>
                  <circle cx="15" cy="15" r="6" fill="#fff"/>
                  <text x="15" y="19" text-anchor="middle" font-family="Arial" font-size="8" fill="#2563eb">P</text>
                </svg>
              `),
              scaledSize: new (google as any).maps.Size(30, 30),
              anchor: new (google as any).maps.Point(15, 15),
            },
          });

          const nearbyInfoWindow = new (google as any).maps.InfoWindow({
            content: `
              <div class="p-2">
                <h4 class="font-bold">${nearbyPillar.pillarNumber}</h4>
                <p class="text-sm">Distance: ${nearbyPillar.distance?.toFixed(2)} km</p>
                <p class="text-sm">Coordinates: ${nearbyPillar.coordinates.lat.toFixed(6)}, ${nearbyPillar.coordinates.lng.toFixed(6)}</p>
              </div>
            `,
          });

          nearbyMarker.addListener("click", () => {
            nearbyInfoWindow.open(map, nearbyMarker);
          });
        });

        // Add a circle to show search radius if nearby pillars exist
        if (nearbyPillars.length > 0) {
          new google.maps.Circle({
            strokeColor: "#2563eb",
            strokeOpacity: 0.8,
            strokeWeight: 2,
            fillColor: "#2563eb",
            fillOpacity: 0.1,
            map: map,
            center: pillar.coordinates,
            radius: 5000, // 5km radius
          });
        }

        setIsLoading(false);
      } catch (error) {
        console.error("Error loading map:", error);
        setMapError(
          "Failed to load map. Please check your internet connection."
        );
        setIsLoading(false);
      }
    };

    initMap();
  }, [pillar, nearbyPillars]);

  const copyCoordinates = () => {
    if (pillar) {
      const coords = `${pillar.coordinates.lat}, ${pillar.coordinates.lng}`;
      navigator.clipboard.writeText(coords);
      toast.success("Coordinates copied to clipboard!");
    }
  };

  const openInGoogleMaps = () => {
    if (pillar) {
      const url = `https://www.google.com/maps?q=${pillar.coordinates.lat},${pillar.coordinates.lng}`;
      window.open(url, "_blank");
    }
  };

  const openInGoogleEarth = () => {
    if (pillar) {
      const url = `https://earth.google.com/web/@${pillar.coordinates.lat},${pillar.coordinates.lng},0a,1000d,35y,0h,0t,0r`;
      window.open(url, "_blank");
    }
  };

  if (!pillar) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Location Map
          </CardTitle>
          <CardDescription>
            Search for a pillar to view its location on the map
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-96 bg-gray-100 rounded-lg flex items-center justify-center">
            <div className="text-center text-gray-500">
              <MapPin className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No pillar selected</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Pillar Location
            </CardTitle>
            <CardDescription>
              {pillar.pillarNumber} - Interactive map view
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={copyCoordinates}>
              <Copy className="h-4 w-4 mr-2" />
              Copy Coordinates
            </Button>
            <Button variant="outline" size="sm" onClick={openInGoogleMaps}>
              <ExternalLink className="h-4 w-4 mr-2" />
              Google Maps
            </Button>
            <Button variant="outline" size="sm" onClick={openInGoogleEarth}>
              <Navigation className="h-4 w-4 mr-2" />
              Google Earth
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {mapError ? (
          <div className="h-96 bg-red-50 rounded-lg flex items-center justify-center">
            <div className="text-center text-red-600">
              <MapPin className="h-12 w-12 mx-auto mb-2" />
              <p className="font-medium">Map Error</p>
              <p className="text-sm">{mapError}</p>
              <p className="text-xs mt-2">
                Note: Google Maps API key required for production
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="relative">
              {isLoading && (
                <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10 rounded-lg">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                    <p className="text-sm text-gray-600">Loading map...</p>
                  </div>
                </div>
              )}
              <div ref={mapRef} className="h-96 w-full rounded-lg" />
            </div>

            {/* Legend */}
            <div className="flex items-center justify-between text-sm text-gray-600 border-t pt-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-red-600 rounded-full"></div>
                  <span>Main Pillar</span>
                </div>
                {nearbyPillars.length > 0 && (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-blue-600 rounded-full"></div>
                    <span>Nearby Pillars ({nearbyPillars.length})</span>
                  </div>
                )}
              </div>
              <div className="text-xs">
                <Badge variant="outline">
                  {pillar.coordinates.lat.toFixed(6)},{" "}
                  {pillar.coordinates.lng.toFixed(6)}
                </Badge>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
