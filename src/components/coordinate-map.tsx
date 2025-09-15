"use client";

import { useState, useEffect, useRef } from "react";
import { googleMapsLoader } from "@/lib/google-maps-loader";
import { utmToWgs84 } from "@/lib/utils";

interface Coordinate {
  easting: string;
  northing: string;
}

interface CoordinateMapProps {
  coordinates: Coordinate[];
  zoom?: number;
  height?: string;
}

export function CoordinateMap({
  coordinates,
  zoom = 15,
  height = "400px",
}: CoordinateMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadGoogleMaps = async () => {
      try {
        // Use the singleton loader
        await googleMapsLoader.load();
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
        .filter((coord) => coord.easting && coord.northing)
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
            index,
          };
        })
        .filter((coord) => coord !== null);

      if (wgs84Coordinates.length === 0) {
        setError("No valid coordinates to display");
        return;
      }

      // Calculate center point
      const centerLat =
        wgs84Coordinates.reduce((sum, coord) => sum + coord.latitude, 0) /
        wgs84Coordinates.length;
      const centerLng =
        wgs84Coordinates.reduce((sum, coord) => sum + coord.longitude, 0) /
        wgs84Coordinates.length;

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
          position: { lat: coord.latitude, lng: coord.longitude },
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
              <p>Lat: ${coord.latitude.toFixed(6)}</p>
              <p>Lng: ${coord.longitude.toFixed(6)}</p>
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
        wgs84Coordinates.forEach((coord) => {
          bounds.extend({ lat: coord.latitude, lng: coord.longitude });
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
