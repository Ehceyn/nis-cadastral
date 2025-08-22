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
  Users,
} from "lucide-react";
import { ApprovalButtons } from "@/components/approval-buttons";

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
  type SurveyJob = {
    id: string;
    jobNumber: string;
    status: string;
    clientName: string;
    location: string;
    submittedAt: Date;
  };
  let jobs: SurveyJob[] = [];
  let stats = {
    totalJobs: 0,
    pendingJobs: 0,
    approvedJobs: 0,
    rejectedJobs: 0,
  };

  // System-wide stats for admins and NIS officers
  let systemStats = {
    totalUsers: 0,
    totalSurveyors: 0,
    pendingSurveyors: 0,
    totalJobs: 0,
    pendingReview: 0,
    completedJobs: 0,
  };

  // Pending surveyors for NIS officers and admins
  let pendingSurveyors: any[] = [];

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
  } else if (
    session.user.role === "ADMIN" ||
    session.user.role === "NIS_OFFICER"
  ) {
    // Fetch system-wide statistics
    const [allUsers, allJobs] = await Promise.all([
      prisma.user.findMany({
        include: { surveyor: true },
      }),
      prisma.surveyJob.findMany({
        include: {
          surveyor: {
            include: { user: true },
          },
        },
        orderBy: { submittedAt: "desc" },
        take: 10,
      }),
    ]);

    // Get pending surveyors based on role
    pendingSurveyors = allUsers.filter((u) =>
      session.user.role === "NIS_OFFICER"
        ? u.surveyor?.status === "PENDING_NIS_REVIEW"
        : u.surveyor?.status === "NIS_APPROVED"
    );

    systemStats = {
      totalUsers: allUsers.length,
      totalSurveyors: allUsers.filter((u) => u.role === "SURVEYOR").length,
      pendingSurveyors: allUsers.filter((u) =>
        session.user.role === "NIS_OFFICER"
          ? u.surveyor?.status === "PENDING_NIS_REVIEW"
          : u.surveyor?.status === "NIS_APPROVED"
      ).length,
      totalJobs: allJobs.length,
      pendingReview: allJobs.filter((job) =>
        session.user.role === "NIS_OFFICER"
          ? job.status === "NIS_REVIEW" || job.status === "SUBMITTED"
          : job.status === "ADMIN_REVIEW" || job.status === "NIS_APPROVED" || job.status === "ADMIN_APPROVED"
      ).length,
      completedJobs: allJobs.filter(
        (job) => job.status === "COMPLETED" || job.status === "ADMIN_APPROVED"
      ).length,
    };

    // For role-specific jobs
    jobs = allJobs.filter((job) =>
      session.user.role === "NIS_OFFICER"
        ? ["SUBMITTED", "NIS_REVIEW"].includes(job.status)
        : session.user.role === "ADMIN"
          ? ["ADMIN_REVIEW", "NIS_APPROVED", "ADMIN_APPROVED"].includes(job.status)
          : false
    ) as any;
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return "bg-green-100 text-green-800";
      case "ADMIN_APPROVED":
        return "bg-emerald-100 text-emerald-800";
      case "NIS_REVIEW":
      case "PENDING_NIS_REVIEW":
        return "bg-yellow-100 text-yellow-800";
      case "ADMIN_REVIEW":
      case "NIS_APPROVED":
        return "bg-blue-100 text-blue-800";
      case "SUBMITTED":
        return "bg-purple-100 text-purple-800";
      case "NIS_REJECTED":
      case "ADMIN_REJECTED":
      case "REJECTED":
        return "bg-red-100 text-red-800";
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
          {session.user.role === "NIS_OFFICER"
            ? "Review pending registrations and survey job submissions"
            : session.user.role === "ADMIN"
              ? "Manage final approvals and system oversight"
              : "Here's an overview of your survey activities"}
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
                    <span className="font-medium">SURCON Registration:</span>
                    <p className="text-gray-600">
                      {user.surveyor.surconRegistrationNumber}
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

      {/* System Dashboard for NIS Officers and Admins */}
      {(session.user.role === "NIS_OFFICER" ||
        session.user.role === "ADMIN") && (
        <div className="space-y-6">
          {/* System Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {session.user.role === "NIS_OFFICER"
                    ? "Pending NIS Review"
                    : "Pending Admin Review"}
                </CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {systemStats.pendingReview}
                </div>
                <p className="text-xs text-muted-foreground">
                  {session.user.role === "NIS_OFFICER"
                    ? "Jobs awaiting NIS review"
                    : "Jobs awaiting final approval"}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {session.user.role === "NIS_OFFICER"
                    ? "Pending Surveyors"
                    : "NIS Approved Surveyors"}
                </CardTitle>
                <UserCheck className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {systemStats.pendingSurveyors}
                </div>
                <p className="text-xs text-muted-foreground">
                  {session.user.role === "NIS_OFFICER"
                    ? "New registrations to review"
                    : "Awaiting final approval"}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Jobs
                </CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {systemStats.totalJobs}
                </div>
                <p className="text-xs text-muted-foreground">
                  All survey jobs in system
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>
                    {session.user.role === "NIS_OFFICER"
                      ? "Jobs Pending NIS Review"
                      : "Jobs Pending Admin Review"}
                  </CardTitle>
                  <CardDescription>
                    {session.user.role === "NIS_OFFICER"
                      ? "Recent job submissions requiring your review"
                      : "Jobs approved by NIS awaiting final approval"}
                  </CardDescription>
                </div>
                <Link
                  href={
                    session.user.role === "NIS_OFFICER"
                      ? "/dashboard/review"
                      : "/dashboard/admin-review"
                  }
                >
                  <Button>
                    <FileText className="h-4 w-4 mr-2" />
                    View All
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {jobs.length === 0 ? (
                  <div className="text-center py-8">
                    <CheckCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      No pending reviews
                    </h3>
                    <p className="text-gray-600 mb-4">
                      All jobs are up to date. Great work!
                    </p>
                  </div>
                ) : (
                  jobs.slice(0, 5).map((job: any) => (
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
                          Surveyor: {job.surveyor?.user?.name}
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
                            Review
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Pending Surveyor Registrations - NIS Officers and Admins */}
          {(session.user.role === "NIS_OFFICER" ||
            session.user.role === "ADMIN") && (
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>
                      {session.user.role === "NIS_OFFICER"
                        ? "Pending Surveyor Registrations"
                        : "NIS Approved Surveyors"}
                    </CardTitle>
                    <CardDescription>
                      {session.user.role === "NIS_OFFICER"
                        ? "New surveyor registrations requiring NIS verification"
                        : "Surveyors approved by NIS awaiting final admin approval"}
                    </CardDescription>
                  </div>
                  <Link href="/dashboard/users">
                    <Button>
                      <Users className="h-4 w-4 mr-2" />
                      View All
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {pendingSurveyors.length === 0 ? (
                    <div className="text-center py-8">
                      <UserCheck className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        No pending registrations
                      </h3>
                      <p className="text-gray-600 mb-4">
                        {session.user.role === "NIS_OFFICER"
                          ? "No new surveyor registrations to review at the moment."
                          : "No NIS-approved surveyors awaiting admin approval."}
                      </p>
                    </div>
                  ) : (
                    pendingSurveyors.slice(0, 5).map((user: any) => (
                      <div
                        key={user.id}
                        className="flex items-center justify-between p-4 border rounded-lg"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <span className="font-medium">{user.name}</span>
                            <Badge
                              className={
                                user.surveyor?.status === "NIS_APPROVED"
                                  ? "bg-blue-100 text-blue-800"
                                  : "bg-yellow-100 text-yellow-800"
                              }
                            >
                              {user.surveyor?.status === "NIS_APPROVED"
                                ? "Awaiting Admin Approval"
                                : "Pending NIS Review"}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600">{user.email}</p>
                          <div className="flex space-x-4 text-sm text-gray-500">
                            <span>
                              NIS: {user.surveyor?.nisMembershipNumber}
                            </span>
                            <span>
                              SURCON: {user.surveyor?.surconRegistrationNumber}
                            </span>
                            {user.surveyor?.firmName && (
                              <span>Firm: {user.surveyor.firmName}</span>
                            )}
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          {user.surveyor?.status === "PENDING_NIS_REVIEW" &&
                          session.user.role === "NIS_OFFICER" ? (
                            <ApprovalButtons
                              itemId={user.surveyor.id}
                              itemType="surveyor"
                              userRole="NIS_OFFICER"
                            />
                          ) : user.surveyor?.status === "NIS_APPROVED" &&
                            session.user.role === "ADMIN" ? (
                            <ApprovalButtons
                              itemId={user.surveyor.id}
                              itemType="surveyor"
                              userRole="ADMIN"
                            />
                          ) : (
                            <Button variant="outline" size="sm">
                              View Details
                            </Button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>
                Common tasks for{" "}
                {session.user.role === "NIS_OFFICER"
                  ? "NIS officers"
                  : "administrators"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Link
                  href={
                    session.user.role === "NIS_OFFICER"
                      ? "/dashboard/review"
                      : "/dashboard/admin-review"
                  }
                >
                  <Button variant="outline" className="w-full justify-start">
                    <Clock className="h-4 w-4 mr-2" />
                    Review Queue
                  </Button>
                </Link>
                <Link href="/dashboard/users">
                  <Button variant="outline" className="w-full justify-start">
                    <UserCheck className="h-4 w-4 mr-2" />
                    Manage Users
                  </Button>
                </Link>
                <Link href="/search">
                  <Button variant="outline" className="w-full justify-start">
                    <MapPin className="h-4 w-4 mr-2" />
                    Search Pillars
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
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
