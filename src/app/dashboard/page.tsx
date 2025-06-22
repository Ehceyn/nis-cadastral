import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
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
  FileText,
  MapPin,
  Clock,
  CheckCircle,
  AlertTriangle,
  UserCheck,
  Plus,
} from "lucide-react";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  // Fetch user data with surveyor info
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      surveyor: true,
    },
  });

  // Fetch user's jobs if they are a surveyor
  let jobs = [];
  let stats = {
    totalJobs: 0,
    pendingJobs: 0,
    approvedJobs: 0,
    rejectedJobs: 0,
  };

  if (user?.surveyor) {
    jobs = await prisma.surveyJob.findMany({
      where: { userId: user.id },
      orderBy: { submittedAt: "desc" },
      take: 5,
    });

    // Calculate stats
    const allJobs = await prisma.surveyJob.findMany({
      where: { userId: user.id },
    });

    stats = {
      totalJobs: allJobs.length,
      pendingJobs: allJobs.filter((job) =>
        ["SUBMITTED", "NIS_REVIEW", "ADMIN_REVIEW"].includes(job.status)
      ).length,
      approvedJobs: allJobs.filter((job) => job.status === "COMPLETED").length,
      rejectedJobs: allJobs.filter((job) => job.status.includes("REJECTED"))
        .length,
    };
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return "bg-green-100 text-green-800";
      case "NIS_REVIEW":
        return "bg-yellow-100 text-yellow-800";
      case "SUBMITTED":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome back, {session.user.name}
        </h1>
        <p className="text-gray-600 mt-2">
          Here&apos;s an overview of your survey activities
        </p>
      </div>

      {/* Verification Status for Surveyors */}
      {user?.surveyor && (
        <Card
          className={
            user.surveyor.status === "VERIFIED"
              ? "border-green-200 bg-green-50"
              : user.surveyor.status === "PENDING"
                ? "border-yellow-200 bg-yellow-50"
                : "border-red-200 bg-red-50"
          }
        >
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {user.surveyor.status === "VERIFIED" ? (
                <>
                  <UserCheck className="h-5 w-5 text-green-600" />
                  Account Verified
                </>
              ) : user.surveyor.status === "PENDING" ? (
                <>
                  <Clock className="h-5 w-5 text-yellow-600" />
                  Verification Pending
                </>
              ) : (
                <>
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                  Verification Required
                </>
              )}
            </CardTitle>
            <CardDescription>
              {user.surveyor.status === "VERIFIED"
                ? `Your surveyor account has been verified. You can submit survey jobs.${user.surveyor.verifiedAt ? ` Verified on ${new Date(user.surveyor.verifiedAt).toLocaleDateString()}` : ""}`
                : user.surveyor.status === "PENDING"
                  ? "Your surveyor account is under review. You'll receive an email once verified. Job submission is temporarily disabled."
                  : "Your surveyor account requires verification before you can submit jobs. Please contact the administrator."}
            </CardDescription>
          </CardHeader>
          {user.surveyor.status !== "VERIFIED" && (
            <CardContent>
              <div className="bg-white p-4 rounded-lg border">
                <h4 className="font-medium mb-2">Account Details:</h4>
                <div className="grid md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">License Number:</span>
                    <p className="text-gray-600">
                      {user.surveyor.licenseNumber}
                    </p>
                  </div>
                  <div>
                    <span className="font-medium">Firm Name:</span>
                    <p className="text-gray-600">{user.surveyor.firmName}</p>
                  </div>
                </div>
                {user.surveyor.status === "PENDING" && (
                  <p className="text-sm text-yellow-700 mt-3">
                    <Clock className="h-4 w-4 inline mr-1" />
                    Your account is being reviewed by our administrators. This
                    typically takes 1-3 business days.
                  </p>
                )}
              </div>
            </CardContent>
          )}
        </Card>
      )}

      {/* Stats Cards - Only show for verified surveyors */}
      {user?.surveyor?.status === "VERIFIED" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Jobs</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalJobs}</div>
              <p className="text-xs text-muted-foreground">All survey jobs</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pendingJobs}</div>
              <p className="text-xs text-muted-foreground">Awaiting review</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Approved</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.approvedJobs}</div>
              <p className="text-xs text-muted-foreground">
                Successfully completed
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Pillar Numbers
              </CardTitle>
              <MapPin className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.approvedJobs}</div>
              <p className="text-xs text-muted-foreground">Issued pillars</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Recent Jobs - Only show for verified surveyors */}
      {user?.surveyor?.status === "VERIFIED" && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Recent Survey Jobs</CardTitle>
                <CardDescription>
                  Your latest survey job submissions and their status
                </CardDescription>
              </div>
              <Link href="/dashboard/jobs/new">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  New Job
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {jobs.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No survey jobs yet
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Get started by submitting your first survey job
                  </p>
                  <Link href="/dashboard/jobs/new">
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Submit New Job
                    </Button>
                  </Link>
                </div>
              ) : (
                jobs.map((job) => (
                  <div
                    key={job.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">{job.jobNumber}</span>
                        <Badge className={getStatusColor(job.status)}>
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
                        <Button variant="outline" size="sm" className="mt-2">
                          View Details
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* For non-surveyors or non-verified surveyors */}
      {(!user?.surveyor || user.surveyor.status !== "VERIFIED") &&
        user?.role === "SURVEYOR" && (
          <Card>
            <CardContent className="text-center py-12">
              <UserCheck className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Account Verification Required
              </h3>
              <p className="text-gray-600 mb-4">
                Your surveyor account needs to be verified before you can submit
                jobs.
              </p>
            </CardContent>
          </Card>
        )}
    </div>
  );
}
