import { getServerSession } from "next-auth";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  MapPin,
  Building,
  Calendar,
  FileText,
  CheckCircle,
  Clock,
  XCircle,
} from "lucide-react";
import { ApprovalButtons } from "@/components/approval-buttons";

interface UserDetailPageProps {
  params: {
    id: string;
  };
}

export default async function UserDetailPage({ params }: UserDetailPageProps) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  // Allow both ADMIN and NIS_OFFICER to access user details
  if (session.user.role !== "ADMIN" && session.user.role !== "NIS_OFFICER") {
    redirect("/dashboard");
  }

  // Fetch user with all related data
  const user = await prisma.user.findUnique({
    where: { id: params.id },
    include: {
      surveyor: true,
      surveyJobs: {
        orderBy: { submittedAt: "desc" },
        take: 10,
      },
    },
  });

  if (!user) {
    notFound();
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "VERIFIED":
        return "bg-green-100 text-green-800";
      case "PENDING_NIS_REVIEW":
        return "bg-yellow-100 text-yellow-800";
      case "NIS_APPROVED":
        return "bg-blue-100 text-blue-800";
      case "NIS_REJECTED":
      case "ADMIN_REJECTED":
      case "REJECTED":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "ADMIN":
        return "bg-purple-100 text-purple-800";
      case "NIS_OFFICER":
        return "bg-blue-100 text-blue-800";
      case "SURVEYOR":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getJobStatusColor = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return "bg-green-100 text-green-800";
      case "NIS_REVIEW":
        return "bg-yellow-100 text-yellow-800";
      case "ADMIN_REVIEW":
        return "bg-blue-100 text-blue-800";
      case "SUBMITTED":
        return "bg-purple-100 text-purple-800";
      case "NIS_REJECTED":
      case "ADMIN_REJECTED":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/dashboard/users">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Users
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{user.name}</h1>
            <p className="text-gray-600 mt-1">
              User Details & Account Information
            </p>
          </div>
        </div>
        <div className="flex space-x-2">
          <Badge variant="secondary" className={getRoleColor(user.role)}>
            {user.role.replace("_", " ")}
          </Badge>
          {user.surveyor && (
            <Badge
              variant="secondary"
              className={getStatusColor(user.surveyor.status)}
            >
              {user.surveyor.status.replace("_", " ")}
            </Badge>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* User Information */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-3">
                  <User className="h-4 w-4 text-gray-500" />
                  <div>
                    <p className="text-sm font-medium">Full Name</p>
                    <p className="text-gray-600">{user.name}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Mail className="h-4 w-4 text-gray-500" />
                  <div>
                    <p className="text-sm font-medium">Email</p>
                    <p className="text-gray-600">{user.email}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <div>
                    <p className="text-sm font-medium">Joined</p>
                    <p className="text-gray-600">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Clock className="h-4 w-4 text-gray-500" />
                  <div>
                    <p className="text-sm font-medium">Last Updated</p>
                    <p className="text-gray-600">
                      {new Date(user.updatedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Surveyor Information */}
          {user.surveyor && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="h-5 w-5" />
                  Surveyor Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium">NIS Membership Number</p>
                    <p className="text-gray-600">
                      {user.surveyor.nisMembershipNumber}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">
                      SURCON Registration Number
                    </p>
                    <p className="text-gray-600">
                      {user.surveyor.surconRegistrationNumber}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Firm Name</p>
                    <p className="text-gray-600">
                      {user.surveyor.firmName || "Not specified"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Phone Number</p>
                    <p className="text-gray-600">{user.surveyor.phoneNumber}</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Address
                  </p>
                  <p className="text-gray-600 mt-1">{user.surveyor.address}</p>
                </div>
                {user.surveyor.verifiedAt && (
                  <div>
                    <p className="text-sm font-medium flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      Verified On
                    </p>
                    <p className="text-gray-600 mt-1">
                      {new Date(user.surveyor.verifiedAt).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Survey Jobs */}
          {user.role === "SURVEYOR" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Recent Survey Jobs ({user.surveyJobs.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {user.surveyJobs.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">
                    No survey jobs submitted yet
                  </p>
                ) : (
                  <div className="space-y-4">
                    {user.surveyJobs.map((job) => (
                      <div
                        key={job.id}
                        className="flex items-center justify-between p-4 border rounded-lg"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <span className="font-medium">{job.jobNumber}</span>
                            <Badge
                              variant="secondary"
                              className={getJobStatusColor(job.status)}
                            >
                              {job.status.replace("_", " ")}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600">
                            Client: {job.clientName}
                          </p>
                          <p className="text-sm text-gray-500">
                            Location: {job.location}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-500">
                            {new Date(job.submittedAt).toLocaleDateString()}
                          </p>
                          <Link href={`/dashboard/jobs/${job.id}`}>
                            <Button
                              variant="outline"
                              size="sm"
                              className="mt-2"
                            >
                              View Job
                            </Button>
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Actions Sidebar */}
        <div className="space-y-6">
          {/* Status & Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Account Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                {user.surveyor?.status === "VERIFIED" ? (
                  <div className="flex flex-col items-center space-y-2">
                    <CheckCircle className="h-12 w-12 text-green-600" />
                    <Badge
                      variant="secondary"
                      className="bg-green-100 text-green-800"
                    >
                      Verified Surveyor
                    </Badge>
                  </div>
                ) : user.surveyor?.status === "PENDING_NIS_REVIEW" ? (
                  <div className="flex flex-col items-center space-y-2">
                    <Clock className="h-12 w-12 text-yellow-600" />
                    <Badge
                      variant="secondary"
                      className="bg-yellow-100 text-yellow-800"
                    >
                      Pending NIS Review
                    </Badge>
                  </div>
                ) : user.surveyor?.status === "NIS_APPROVED" ? (
                  <div className="flex flex-col items-center space-y-2">
                    <Clock className="h-12 w-12 text-blue-600" />
                    <Badge
                      variant="secondary"
                      className="bg-blue-100 text-blue-800"
                    >
                      Awaiting Admin Approval
                    </Badge>
                  </div>
                ) : (
                  <div className="flex flex-col items-center space-y-2">
                    <XCircle className="h-12 w-12 text-red-600" />
                    <Badge
                      variant="secondary"
                      className="bg-red-100 text-red-800"
                    >
                      Action Required
                    </Badge>
                  </div>
                )}
              </div>

              {/* Approval Actions */}
              {user.surveyor && (
                <div className="space-y-2">
                  {user.surveyor.status === "PENDING_NIS_REVIEW" &&
                  session.user.role === "NIS_OFFICER" ? (
                    <ApprovalButtons
                      itemId={user.surveyor.id}
                      itemType="surveyor"
                      userRole="NIS_OFFICER"
                    />
                  ) : user.surveyor.status === "NIS_APPROVED" &&
                    session.user.role === "ADMIN" ? (
                    <ApprovalButtons
                      itemId={user.surveyor.id}
                      itemType="surveyor"
                      userRole="ADMIN"
                    />
                  ) : null}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Statistics */}
          {user.role === "SURVEYOR" && (
            <Card>
              <CardHeader>
                <CardTitle>Statistics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-blue-600">
                      {user.surveyJobs.length}
                    </div>
                    <div className="text-xs text-gray-500">Total Jobs</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-green-600">
                      {
                        user.surveyJobs.filter(
                          (job) => job.status === "COMPLETED"
                        ).length
                      }
                    </div>
                    <div className="text-xs text-gray-500">Completed</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-yellow-600">
                      {
                        user.surveyJobs.filter((job) =>
                          ["SUBMITTED", "NIS_REVIEW", "ADMIN_REVIEW"].includes(
                            job.status
                          )
                        ).length
                      }
                    </div>
                    <div className="text-xs text-gray-500">Pending</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-red-600">
                      {
                        user.surveyJobs.filter((job) =>
                          job.status.includes("REJECTED")
                        ).length
                      }
                    </div>
                    <div className="text-xs text-gray-500">Rejected</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
