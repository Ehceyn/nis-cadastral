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
  Download,
} from "lucide-react";

export default async function ReviewQueuePage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  if (session.user.role !== "NIS_OFFICER") {
    redirect("/dashboard");
  }

  // Fetch jobs pending NIS review
  const pendingJobs = await prisma.surveyJob.findMany({
    where: {
      status: "NIS_REVIEW",
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

  // Fetch recently submitted jobs
  const recentlySubmitted = await prisma.surveyJob.findMany({
    where: {
      status: "SUBMITTED",
    },
    include: {
      surveyor: {
        include: {
          user: true,
        },
      },
      documents: true,
      workflowSteps: true,
    },
    orderBy: {
      submittedAt: "desc",
    },
  });

  // Fetch recently reviewed jobs
  const recentlyReviewed = await prisma.surveyJob.findMany({
    where: {
      OR: [{ status: "ADMIN_REVIEW" }, { status: "NIS_REJECTED" }],
      workflowSteps: {
        some: {
          stepName: "NIS Review",
          status: "COMPLETED",
        },
      },
    },
    include: {
      surveyor: {
        include: {
          user: true,
        },
      },
      documents: true,
      workflowSteps: true,
    },
    orderBy: {
      updatedAt: "desc",
    },
    take: 10,
  });

  const stats = {
    pendingReview: pendingJobs.length,
    newSubmissions: recentlySubmitted.length,
    reviewedToday: recentlyReviewed.filter(
      (job) =>
        new Date(job.updatedAt).toDateString() === new Date().toDateString()
    ).length,
    totalReviewed: recentlyReviewed.length,
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "NIS_REVIEW":
        return "bg-yellow-100 text-yellow-800";
      case "ADMIN_REVIEW":
        return "bg-blue-100 text-blue-800";
      case "NIS_REJECTED":
        return "bg-red-100 text-red-800";
      case "SUBMITTED":
        return "bg-gray-100 text-gray-800";
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
            <Button size="sm" className="bg-green-600 hover:bg-green-700">
              <CheckCircle className="h-4 w-4 mr-2" />
              Approve
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="text-red-600 hover:text-red-700"
            >
              <XCircle className="h-4 w-4 mr-2" />
              Reject
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Review Queue</h1>
        <p className="text-gray-600 mt-2">
          Review and approve survey job submissions
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Pending Review
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingReview}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting your review
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              New Submissions
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.newSubmissions}</div>
            <p className="text-xs text-muted-foreground">Recently submitted</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Reviewed Today
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.reviewedToday}</div>
            <p className="text-xs text-muted-foreground">Jobs reviewed today</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Reviewed
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalReviewed}</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>
      </div>

      {/* Review Tabs */}
      <Tabs defaultValue="pending" className="space-y-6">
        <TabsList>
          <TabsTrigger value="pending">
            Pending Review ({pendingJobs.length})
          </TabsTrigger>
          <TabsTrigger value="new">
            New Submissions ({recentlySubmitted.length})
          </TabsTrigger>
          <TabsTrigger value="reviewed">
            Recently Reviewed ({recentlyReviewed.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-6">
          {pendingJobs.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <CheckCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  All caught up!
                </h3>
                <p className="text-gray-600">
                  No jobs pending your review at the moment.
                </p>
              </CardContent>
            </Card>
          ) : (
            pendingJobs.map((job) => <JobCard key={job.id} job={job} />)
          )}
        </TabsContent>

        <TabsContent value="new" className="space-y-6">
          {recentlySubmitted.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No new submissions
                </h3>
                <p className="text-gray-600">
                  No recently submitted jobs to review.
                </p>
              </CardContent>
            </Card>
          ) : (
            recentlySubmitted.map((job) => <JobCard key={job.id} job={job} />)
          )}
        </TabsContent>

        <TabsContent value="reviewed" className="space-y-6">
          {recentlyReviewed.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No recent reviews
                </h3>
                <p className="text-gray-600">
                  You haven&apos;t reviewed any jobs recently.
                </p>
              </CardContent>
            </Card>
          ) : (
            recentlyReviewed.map((job) => <JobCard key={job.id} job={job} />)
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
