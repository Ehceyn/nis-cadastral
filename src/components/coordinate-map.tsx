"use client";

import { useState, useEffect, useRef } from "react";
import { Loader } from "@googlemaps/js-api-loader";

interface Coordinate {
  easting: string;
  northing: string;
}

interface CoordinateMapProps {
  coordinates: Coordinate[];
  zoom?: number;
  height?: string;
}

export function CoordinateMap({ coordinates, zoom = 15, height = "400px" }: CoordinateMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // UTM Zone 32N to WGS84 conversion function
  const utmToWgs84 = (easting: number, northing: number) => {
    // This is a simplified conversion - in a real application,
    // you would use a proper coordinate transformation library like proj4js
    // For now, this assumes the coordinates are close to the central meridian (9°E)
    
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
    
    const rho1 = a * (1 - e2) / Math.pow(1 - e2 * Math.sin(phi1) * Math.sin(phi1), 3/2);
    const nu1 = a / Math.sqrt(1 - e2 * Math.sin(phi1) * Math.sin(phi1));
    
    const T1 = Math.tan(phi1) * Math.tan(phi1);
    const C1 = e2 * Math.cos(phi1) * Math.cos(phi1) / (1 - e2);
    const R1 = a * (1 - e2) / Math.pow(1 - e2 * Math.sin(phi1) * Math.sin(phi1), 3/2);
    const D = x / (nu1 * k0);
    
    const lat = phi1 - (nu1 * Math.tan(phi1) / R1) * (D*D/2 - (5 + 3*T1 + 10*C1 - 4*C1*C1 - 9*e2) * D*D*D*D/24
                  + (61 + 90*T1 + 298*C1 + 45*T1*T1 - 252*e2 - 3*C1*C1) * Math.pow(D, 6)/720);
    
    const lng = 9 + (D - (1 + 2*T1 + C1) * D*D*D/6 + (5 - 2*C1 + 28*T1 - 3*C1*C1 + 8*e2 + 24*T1*T1) * Math.pow(D, 5)/120) / Math.cos(phi1);
    
    return {
      lat: lat * 180 / Math.PI,
      lng: lng
    };
  };

  useEffect(() => {
    const loadGoogleMaps = async () => {
      try {
        // Get API key from environment variable
        const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
        if (!apiKey) {
          setError("Google Maps API key not configured");
          return;
        }

        const loader = new Loader({
          apiKey,
          version: "weekly",
          libraries: ["maps", "marker"],
        });

        await loader.load();
        setIsLoaded(true);
      } catch (err) {
        console.error("Error loading Google Maps:", err);
        setError("Failed to load Google Maps");
      }
    };

    loadGoogleMaps();
  }, []);

  useEffect(() => {
    if (!isLoaded || !mapRef.current || coordinates.length === 0) return;

    try {
      // Convert UTM coordinates to WGS84
      const wgs84Coordinates = coordinates
        .filter(coord => coord.easting && coord.northing)
        .map((coord, index) => {
          const easting = parseFloat(coord.easting);
          const northing = parseFloat(coord.northing);
          
          if (isNaN(easting) || isNaN(northing)) {
            console.warn(`Invalid coordinates at index ${index}:`, coord);
            return null;
          }

          const wgs84 = utmToWgs84(easting, northing);
          return {
            ...wgs84,
            original: coord,
            index
          };
        })
        .filter(coord => coord !== null);

      if (wgs84Coordinates.length === 0) {
        setError("No valid coordinates to display");
        return;
      }

      // Calculate center point
      const centerLat = wgs84Coordinates.reduce((sum, coord) => sum + coord.lat, 0) / wgs84Coordinates.length;
      const centerLng = wgs84Coordinates.reduce((sum, coord) => sum + coord.lng, 0) / wgs84Coordinates.length;

      // Initialize map
      const map = new google.maps.Map(mapRef.current, {
        center: { lat: centerLat, lng: centerLng },
        zoom: zoom,
        mapTypeId: google.maps.MapTypeId.SATELLITE,
      });

      mapInstanceRef.current = map;

      // Add markers for each coordinate
      wgs84Coordinates.forEach((coord, index) => {
        const marker = new google.maps.Marker({
          position: { lat: coord.lat, lng: coord.lng },
          map: map,
          title: `Coordinate ${coord.index + 1}`,
          label: `${coord.index + 1}`,
        });

        // Add info window with UTM coordinates
        const infoWindow = new google.maps.InfoWindow({
          content: `
            <div>
              <h4>Coordinate ${coord.index + 1}</h4>
              <p><strong>UTM Zone 32N:</strong></p>
              <p>Easting: ${coord.original.easting}</p>
              <p>Northing: ${coord.original.northing}</p>
              <p><strong>WGS84:</strong></p>
              <p>Lat: ${coord.lat.toFixed(6)}</p>
              <p>Lng: ${coord.lng.toFixed(6)}</p>
            </div>
          `,
        });

        marker.addListener("click", () => {
          infoWindow.open(map, marker);
        });
      });

      // Fit bounds to show all markers
      if (wgs84Coordinates.length > 1) {
        const bounds = new google.maps.LatLngBounds();
        wgs84Coordinates.forEach(coord => {
          bounds.extend({ lat: coord.lat, lng: coord.lng });
        });
        map.fitBounds(bounds);
      }

    } catch (err) {
      console.error("Error initializing map:", err);
      setError("Failed to initialize map");
    }
  }, [isLoaded, coordinates, zoom]);

  if (error) {
    return (
      <div 
        className="flex items-center justify-center bg-gray-100 rounded-lg border"
        style={{ height }}
      >
        <div className="text-center text-gray-600">
          <p className="font-medium">Map Error</p>
          <p className="text-sm">{error}</p>
        </div>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div 
        className="flex items-center justify-center bg-gray-100 rounded-lg border animate-pulse"
        style={{ height }}
      >
        <div className="text-center text-gray-600">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          <p>Loading map...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg overflow-hidden border">
      <div ref={mapRef} style={{ height }} />
      <div className="bg-gray-50 p-2 text-xs text-gray-600 border-t">
        <p>
          <strong>Coordinate System:</strong> UTM Zone 32N | 
          <strong> Map View:</strong> Google Earth Satellite Imagery
        </p>
      </div>
    </div>
  );
}