"use client";

import type React from "react";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { MapPin, Search, Calendar, User, Map } from "lucide-react";
import { toast } from "sonner";
import { PillarMap } from "@/components/pillar-map";

interface PillarResult {
  pillarNumber: string;
  coordinates: { latitude: number; longitude: number };
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
  nearbyPillars?: Array<{
    pillarNumber: string;
    coordinates: { latitude: number; longitude: number };
    distance: number;
  }>;
}

export default function SearchPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<PillarResult | null>(null);
  const [includeNearby, setIncludeNearby] = useState(true);
  const [showMap, setShowMap] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;

    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        q: searchTerm,
        includeNearby: includeNearby.toString(),
        radius: "5",
      });

      const response = await fetch(`/api/pillars/search?${params}`);

      if (response.ok) {
        const data = await response.json();
        setResult(data);
        if (!data) {
          toast.error("No pillar found with that number");
        } else {
          toast.success("Pillar found!");
          setShowMap(true); // Auto-show map when pillar is found
        }
      } else {
        toast.error("An error occurred while searching");
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <MapPin className="h-8 w-8 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900">Pillar Search</h1>
          </div>
          <Button variant="outline" onClick={() => window.history.back()}>
            Back to Home
          </Button>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Search Form */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Search Pillar Numbers
              </CardTitle>
              <CardDescription>
                Enter a pillar number to view its details and verification
                status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSearch} className="space-y-4">
                <div className="flex gap-4">
                  <div className="flex-1">
                    <Label htmlFor="search" className="sr-only">
                      Pillar Number
                    </Label>
                    <Input
                      id="search"
                      placeholder="Enter pillar number (e.g., PIL-2024-001)"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? "Searching..." : "Search"}
                  </Button>
                </div>

                {/* Search Options */}
                <div className="flex items-center justify-between pt-2 border-t">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="nearby"
                      checked={includeNearby}
                      onCheckedChange={setIncludeNearby}
                    />
                    <Label htmlFor="nearby" className="text-sm">
                      Include nearby pillars (5km radius)
                    </Label>
                  </div>
                  {result && (
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="map"
                        checked={showMap}
                        onCheckedChange={setShowMap}
                      />
                      <Label htmlFor="map" className="text-sm">
                        Show map view
                      </Label>
                    </div>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Search Results */}
          {result && (
            <div className="space-y-6">
              {/* Map View */}
              {showMap && (
                <PillarMap
                  pillar={result}
                  nearbyPillars={result.nearbyPillars || []}
                />
              )}

              {/* Pillar Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Pillar Details</span>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="secondary"
                        className="bg-green-100 text-green-800"
                      >
                        Verified
                      </Badge>
                      {result.nearbyPillars &&
                        result.nearbyPillars.length > 0 && (
                          <Badge variant="outline">
                            {result.nearbyPillars.length} nearby pillar
                            {result.nearbyPillars.length !== 1 ? "s" : ""}
                          </Badge>
                        )}
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Basic Info */}
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="font-semibold text-lg mb-3">
                        Pillar Information
                      </h3>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-gray-500" />
                          <span className="font-medium">Pillar Number:</span>
                          <span>{result.pillarNumber}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-gray-500" />
                          <span className="font-medium">Issued Date:</span>
                          <span>
                            {new Date(result.issuedDate).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-gray-500" />
                          <span className="font-medium">Coordinates:</span>
                          <span>
                            {result.coordinates.latitude},{" "}
                            {result.coordinates.longitude}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="font-semibold text-lg mb-3">
                        Survey Details
                      </h3>
                      <div className="space-y-2">
                        <div>
                          <span className="font-medium">Location:</span>
                          <p className="text-gray-600">
                            {result.surveyJob.location}
                          </p>
                        </div>
                        <div>
                          <span className="font-medium">Client:</span>
                          <p className="text-gray-600">
                            {result.surveyJob.clientName}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">Status:</span>
                          <Badge variant="outline">
                            {result.surveyJob.status}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Surveyor Info */}
                  <div className="border-t pt-6">
                    <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                      <User className="h-5 w-5" />
                      Surveyor Information
                    </h3>
                    <div className="grid md:grid-cols-3 gap-4">
                      <div>
                        <span className="font-medium">Name:</span>
                        <p className="text-gray-600">{result.surveyor.name}</p>
                      </div>
                      <div>
                        <span className="font-medium">Firm:</span>
                        <p className="text-gray-600">
                          {result.surveyor.firmName}
                        </p>
                      </div>
                      <div>
                        <span className="font-medium">
                          SURCON Registration:
                        </span>
                        <p className="text-gray-600">
                          {result.surveyor.surconRegistrationNumber}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Nearby Pillars Section */}
                  {result.nearbyPillars && result.nearbyPillars.length > 0 && (
                    <div className="border-t pt-6">
                      <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                        <Map className="h-5 w-5" />
                        Nearby Pillars ({result.nearbyPillars.length})
                      </h3>
                      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {result.nearbyPillars.map((nearbyPillar, index) => (
                          <div
                            key={index}
                            className="p-3 border rounded-lg bg-gray-50"
                          >
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="font-medium text-sm">
                                  {nearbyPillar.pillarNumber}
                                </span>
                                <Badge variant="secondary" className="text-xs">
                                  {nearbyPillar.distance.toFixed(2)} km
                                </Badge>
                              </div>
                              <p className="text-xs text-gray-600">
                                {nearbyPillar.coordinates.latitude.toFixed(6)},{" "}
                                {nearbyPillar.coordinates.longitude.toFixed(6)}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
