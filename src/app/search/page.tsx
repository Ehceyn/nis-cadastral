"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MapPin, Search, Calendar, User } from "lucide-react"
import { toast } from "sonner"

interface PillarResult {
  pillarNumber: string
  coordinates: { lat: number; lng: number }
  issuedDate: string
  surveyor: {
    name: string
    firmName: string
    licenseNumber: string
  }
  surveyJob: {
    location: string
    clientName: string
    status: string
  }
}

export default function SearchPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<PillarResult | null>(null)

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!searchTerm.trim()) return

    setIsLoading(true)
    try {
      const response = await fetch(`/api/pillars/search?q=${encodeURIComponent(searchTerm)}`)

      if (response.ok) {
        const data = await response.json()
        setResult(data)
        if (!data) {
          toast.error("No pillar found with that number")
        } else {
          toast.success("Pillar found!")
        }
      } else {
        toast.error("An error occurred while searching")
      }
    } catch (error) {
      toast.error("An unexpected error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 to-green-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-xs">
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
              <CardDescription>Enter a pillar number to view its details and verification status</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSearch} className="flex gap-4">
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
              </form>
            </CardContent>
          </Card>

          {/* Search Results */}
          {result && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Pillar Details</span>
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    Verified
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Basic Info */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold text-lg mb-3">Pillar Information</h3>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-gray-500" />
                        <span className="font-medium">Pillar Number:</span>
                        <span>{result.pillarNumber}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-gray-500" />
                        <span className="font-medium">Issued Date:</span>
                        <span>{new Date(result.issuedDate).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-gray-500" />
                        <span className="font-medium">Coordinates:</span>
                        <span>
                          {result.coordinates.lat}, {result.coordinates.lng}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold text-lg mb-3">Survey Details</h3>
                    <div className="space-y-2">
                      <div>
                        <span className="font-medium">Location:</span>
                        <p className="text-gray-600">{result.surveyJob.location}</p>
                      </div>
                      <div>
                        <span className="font-medium">Client:</span>
                        <p className="text-gray-600">{result.surveyJob.clientName}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Status:</span>
                        <Badge variant="outline">{result.surveyJob.status}</Badge>
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
                      <p className="text-gray-600">{result.surveyor.firmName}</p>
                    </div>
                    <div>
                      <span className="font-medium">License:</span>
                      <p className="text-gray-600">{result.surveyor.licenseNumber}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
