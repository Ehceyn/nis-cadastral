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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  FileText,
  MapPin,
  User,
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  Hash,
} from "lucide-react";
import { AdminJobApproval } from "@/components/admin-job-approval";
import { ApprovalButtons } from "@/components/approval-buttons";

export default async function AdminReviewPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  if (session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  // Fetch jobs pending admin review (approved by NIS)
  const pendingJobs = await prisma.surveyJob.findMany({
    where: {
      status: "ADMIN_REVIEW",
    },
    include: {
      surveyor: {
        include: {
          user: true,
        },
      },
      documents: true,
      workflowSteps: {
        orderBy: {
          createdAt: "asc",
        },
      },
    },
    orderBy: {
      submittedAt: "asc", // Oldest first
    },
  });

  // Fetch recently approved jobs
  const recentlyApproved = await prisma.surveyJob.findMany({
    where: {
      status: "COMPLETED",
    },
    include: {
      surveyor: {
        include: {
          user: true,
        },
      },
      documents: true,
      pillarNumbers: true,
    },
    orderBy: {
      updatedAt: "desc",
    },
    take: 10,
  });

  // Fetch surveyors needing final approval
  const pendingSurveyors = await prisma.surveyor.findMany({
    where: {
      status: "NIS_APPROVED",
    },
    include: {
      user: true,
    },
    orderBy: {
      verifiedAt: "asc",
    },
  });

  const stats = {
    pendingJobs: pendingJobs.length,
    pendingSurveyors: pendingSurveyors.length,
    approvedToday: recentlyApproved.filter(
      (job) =>
        new Date(job.updatedAt).toDateString() === new Date().toDateString()
    ).length,
    totalApproved: recentlyApproved.length,
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ADMIN_REVIEW":
        return "bg-blue-100 text-blue-800";
      case "COMPLETED":
        return "bg-green-100 text-green-800";
      case "ADMIN_REJECTED":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusText = (status: string) => {
    return status
      .replace("_", " ")
      .toLowerCase()
      .replace(/\b\w/g, (l) => l.toUpperCase());
  };

  const JobCard = ({ job }: { job: any }) => (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              {job.jobNumber}
            </CardTitle>
            <CardDescription className="mt-1">
              Submitted {new Date(job.submittedAt).toLocaleDateString()}
            </CardDescription>
          </div>
          <Badge className={getStatusColor(job.status)}>
            {getStatusText(job.status)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <User className="h-4 w-4 text-gray-500" />
              <span className="font-medium">Client:</span>
              <span>{job.clientName}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="font-medium">Surveyor:</span>
              <span>{job.surveyor.user.name}</span>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-start gap-2 text-sm">
              <MapPin className="h-4 w-4 text-gray-500 mt-0.5 flex-shrink-0" />
              <div>
                <span className="font-medium">Location:</span>
                <p className="text-gray-600">{job.location}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Documents */}
        <div>
          <h4 className="font-medium text-sm mb-2">
            Documents ({job.documents.length})
          </h4>
          <div className="flex flex-wrap gap-2">
            {job.documents.map((doc: any, index: number) => (
              <Badge key={index} variant="outline" className="text-xs">
                {doc.fileName}
              </Badge>
            ))}
          </div>
        </div>

        <div className="flex justify-between items-center pt-2 border-t">
          <div className="text-sm text-gray-500">
            <Calendar className="h-4 w-4 inline mr-1" />
            {Math.ceil(
              (new Date().getTime() - new Date(job.submittedAt).getTime()) /
                (1000 * 60 * 60 * 24)
            )}{" "}
            days ago
          </div>
          <div className="flex space-x-2">
            <Link href={`/dashboard/jobs/${job.id}`}>
              <Button variant="outline" size="sm">
                <Eye className="h-4 w-4 mr-2" />
                Review
              </Button>
            </Link>
            <AdminJobApproval jobId={job.id} jobNumber={job.jobNumber} />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Admin Review Center
        </h1>
        <p className="text-gray-600 mt-2">
          Final approval and pillar number issuance for survey jobs
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Jobs</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingJobs}</div>
            <p className="text-xs text-muted-foreground">
              Ready for final approval
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Pending Surveyors
            </CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingSurveyors}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting final verification
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Approved Today
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.approvedToday}</div>
            <p className="text-xs text-muted-foreground">Jobs approved today</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Pillars Issued
            </CardTitle>
            <Hash className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalApproved}</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>
      </div>

      {/* Review Tabs */}
      <Tabs defaultValue="jobs" className="space-y-6">
        <TabsList>
          <TabsTrigger value="jobs">
            Pending Jobs ({stats.pendingJobs})
          </TabsTrigger>
          <TabsTrigger value="surveyors">
            Pending Surveyors ({stats.pendingSurveyors})
          </TabsTrigger>
          <TabsTrigger value="approved">
            Recently Approved ({stats.totalApproved})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="jobs" className="space-y-6">
          {pendingJobs.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <CheckCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  All caught up!
                </h3>
                <p className="text-gray-600">
                  No jobs pending admin approval at the moment.
                </p>
              </CardContent>
            </Card>
          ) : (
            pendingJobs.map((job) => <JobCard key={job.id} job={job} />)
          )}
        </TabsContent>

        <TabsContent value="surveyors" className="space-y-6">
          {pendingSurveyors.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No pending surveyors
                </h3>
                <p className="text-gray-600">
                  All surveyor registrations are up to date.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {pendingSurveyors.map((surveyor) => (
                <Card key={surveyor.id}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium">
                            {surveyor.user.name}
                          </span>
                          <Badge
                            variant="secondary"
                            className="bg-blue-100 text-blue-800"
                          >
                            NIS Approved - Awaiting Final Approval
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600">
                          {surveyor.user.email}
                        </p>
                        <div className="flex space-x-4 text-sm text-gray-500">
                          <span>NIS: {surveyor.nisMembershipNumber}</span>
                          <span>
                            SURCON: {surveyor.surconRegistrationNumber}
                          </span>
                          <span>Firm: {surveyor.firmName}</span>
                        </div>
                      </div>
                      <ApprovalButtons
                        itemId={surveyor.id}
                        itemType="surveyor"
                        userRole="ADMIN"
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="approved" className="space-y-6">
          {recentlyApproved.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No recent approvals
                </h3>
                <p className="text-gray-600">
                  No recently approved jobs to display.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {recentlyApproved.map((job) => (
                <Card key={job.id}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium">{job.jobNumber}</span>
                          <Badge className="bg-green-100 text-green-800">
                            Completed
                          </Badge>
                          {job.pillarNumbers[0] && (
                            <Badge variant="outline">
                              {job.pillarNumbers[0].pillarNumber}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-600">
                          Client: {job.clientName} | Surveyor:{" "}
                          {job.surveyor.user.name}
                        </p>
                        <p className="text-sm text-gray-500">
                          Approved:{" "}
                          {new Date(job.updatedAt).toLocaleDateString()}
                        </p>
                      </div>
                      <Link href={`/dashboard/jobs/${job.id}`}>
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4 mr-2" />
                          View
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
