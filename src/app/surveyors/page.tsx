import { prisma } from "@/lib/db";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  MapPin,
  User,
  Building,
  Phone,
  Mail,
  Calendar,
  Award,
  Search,
} from "lucide-react";
import { ContactSurveyorButton } from "@/components/contact-surveyor-button";
import Link from "next/link";

interface SearchParams {
  search?: string;
}

export default async function SurveyorMarketplacePage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const searchQuery = searchParams.search || "";

  // Build the where clause for filtering
  const whereClause = {
    status: "VERIFIED" as const,
    ...(searchQuery && {
      OR: [
        {
          user: {
            name: {
              contains: searchQuery,
              mode: "insensitive" as const,
            },
          },
        },
        {
          firmName: {
            contains: searchQuery,
            mode: "insensitive" as const,
          },
        },
        {
          address: {
            contains: searchQuery,
            mode: "insensitive" as const,
          },
        },
      ],
    }),
  };

  // Fetch filtered surveyors
  const surveyors = await prisma.surveyor.findMany({
    where: whereClause,
    include: {
      user: {
        select: {
          name: true,
          email: true,
          createdAt: true,
        },
      },
      surveyJobs: {
        where: {
          status: "COMPLETED",
        },
        select: {
          id: true,
          status: true,
          submittedAt: true,
        },
      },
    },
    orderBy: {
      verifiedAt: "desc",
    },
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <MapPin className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Surveyor Marketplace
                </h1>
                <p className="text-gray-600">
                  Find verified surveyors in Rivers State
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/search">
                <Button variant="outline">
                  <MapPin className="h-4 w-4 mr-2" />
                  Search Pillars
                </Button>
              </Link>
              <Link href="/login">
                <Button>Login</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Stats and Search Section */}
        <div className="mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Verified Surveyors
                </CardTitle>
                <User className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{surveyors.length}</div>
                <p className="text-xs text-muted-foreground">
                  Active professionals
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Completed Jobs
                </CardTitle>
                <Award className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {surveyors.reduce(
                    (total, surveyor) => total + surveyor.surveyJobs.length,
                    0
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Successfully completed
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Registered Firms
                </CardTitle>
                <Building className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {
                    new Set(
                      surveyors.filter((s) => s.firmName).map((s) => s.firmName)
                    ).size
                  }
                </div>
                <p className="text-xs text-muted-foreground">Unique firms</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Experience
                </CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">5+</div>
                <p className="text-xs text-muted-foreground">Years average</p>
              </CardContent>
            </Card>
          </div>

          {/* Search Bar */}
          <Card>
            <CardHeader>
              <CardTitle>Find a Surveyor</CardTitle>
              <CardDescription>
                Search by name, firm, or location to find the right surveyor for
                your project
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form method="GET" className="flex gap-4">
                <Input
                  name="search"
                  placeholder="Search by name, firm, or location..."
                  className="flex-1"
                  defaultValue={searchQuery}
                />
                <Button type="submit">
                  <Search className="h-4 w-4 mr-2" />
                  Search
                </Button>
              </form>
              {searchQuery && (
                <div className="mt-3 flex items-center gap-2">
                  <span className="text-sm text-gray-600">
                    Showing results for:{" "}
                    <strong>&quot;{searchQuery}&quot;</strong>
                  </span>
                  <Link href="/surveyors">
                    <Button variant="outline" size="sm">
                      Clear
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Surveyors Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {surveyors.map((surveyor) => (
            <SurveyorCard key={surveyor.id} surveyor={surveyor} />
          ))}
        </div>

        {surveyors.length === 0 && (
          <Card className="text-center py-12">
            <CardContent>
              <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <CardTitle className="mb-2">No Verified Surveyors</CardTitle>
              <CardDescription>
                There are currently no verified surveyors in the system.
              </CardDescription>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Footer */}
      <footer className="border-t bg-white/80 backdrop-blur-sm mt-16">
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <MapPin className="h-6 w-6 text-blue-600" />
                <span className="text-lg font-semibold">
                  Rivers State Cadastral
                </span>
              </div>
              <p className="text-gray-600 text-sm">
                Modernizing cadastral survey processes for Rivers State,
                Nigeria.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>
                  <Link href="/search" className="hover:text-blue-600">
                    Search Pillars
                  </Link>
                </li>
                <li>
                  <Link href="/surveyors" className="hover:text-blue-600">
                    Find Surveyors
                  </Link>
                </li>
                <li>
                  <Link href="/register" className="hover:text-blue-600">
                    Register
                  </Link>
                </li>
                <li>
                  <Link href="/login" className="hover:text-blue-600">
                    Login
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">For Surveyors</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>
                  <Link href="/register" className="hover:text-blue-600">
                    Join Platform
                  </Link>
                </li>
                <li>
                  <Link href="/login" className="hover:text-blue-600">
                    Submit Jobs
                  </Link>
                </li>
                <li>
                  <Link href="/dashboard" className="hover:text-blue-600">
                    Dashboard
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Contact</h4>
              <div className="space-y-2 text-sm text-gray-600">
                <p>Rivers State Ministry of Lands</p>
                <p>Port Harcourt, Rivers State</p>
                <p>Nigeria</p>
              </div>
            </div>
          </div>
          <div className="border-t mt-8 pt-8 text-center text-sm text-gray-600">
            <p>
              &copy; 2024 Rivers State Cadastral Survey System. All rights
              reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

function SurveyorCard({ surveyor }: { surveyor: any }) {
  const completedJobs = surveyor.surveyJobs.length;
  const memberSince = new Date(surveyor.user.createdAt).getFullYear();

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <User className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <CardTitle className="text-lg">{surveyor.user.name}</CardTitle>
              <CardDescription>Professional Surveyor</CardDescription>
            </div>
          </div>
          <Badge variant="secondary" className="bg-green-100 text-green-800">
            Verified
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Basic Info */}
        <div className="space-y-2">
          {surveyor.firmName && (
            <div className="flex items-center gap-2 text-sm">
              <Building className="h-4 w-4 text-gray-500" />
              <span>{surveyor.firmName}</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-sm">
            <Phone className="h-4 w-4 text-gray-500" />
            <span>{surveyor.phoneNumber}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <MapPin className="h-4 w-4 text-gray-500" />
            <span>{surveyor.address}</span>
          </div>
        </div>

        {/* Stats */}
        <div className="border-t pt-4">
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-blue-600">
                {completedJobs}
              </div>
              <div className="text-xs text-gray-500">Completed Jobs</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">
                {memberSince}
              </div>
              <div className="text-xs text-gray-500">Member Since</div>
            </div>
          </div>
        </div>

        {/* Registration Details */}
        <div className="border-t pt-4 space-y-2">
          <div className="text-sm">
            <span className="font-medium">NIS Membership:</span>
            <p className="text-gray-600">{surveyor.nisMembershipNumber}</p>
          </div>
          <div className="text-sm">
            <span className="font-medium">SURCON Registration:</span>
            <p className="text-gray-600">{surveyor.surconRegistrationNumber}</p>
          </div>
        </div>

        {/* Contact Button */}
        <div className="border-t pt-4">
          <ContactSurveyorButton
            surveyorName={surveyor.user.name}
            surveyorEmail={surveyor.user.email}
            surveyorPhone={surveyor.phoneNumber}
          />
        </div>
      </CardContent>
    </Card>
  );
}
