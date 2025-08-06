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
import { DocumentsSection } from "./components/documents-section";
import { ApprovalButtons } from "@/components/approval-buttons";
import { AdminJobApproval } from "@/components/admin-job-approval";
import {
  ArrowLeft,
  FileText,
  MapPin,
  User,
  Phone,
  Mail,
  Calendar,
  Download,
  CheckCircle,
  Clock,
  XCircle,
  Eye,
} from "lucide-react";

interface JobDetailPageProps {
  params: {
    id: string;
  };
}

export default async function JobDetailPage({ params }: JobDetailPageProps) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  // Fetch job details from database
  const job = await prisma.surveyJob.findUnique({
    where: { id: params.id },
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
      pillarNumbers: true,
    },
  });

  if (!job) {
    notFound();
  }

  // Check if user has access to this job
  if (job.userId !== session.user.id && session.user.role === "SURVEYOR") {
    redirect("/dashboard/jobs");
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return "bg-green-100 text-green-800";
      case "NIS_REVIEW":
        return "bg-yellow-100 text-yellow-800";
      case "ADMIN_REVIEW":
        return "bg-blue-100 text-blue-800";
      case "SUBMITTED":
        return "bg-gray-100 text-gray-800";
      case "NIS_REJECTED":
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

  const getStepIcon = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case "IN_PROGRESS":
        return <Clock className="h-5 w-5 text-yellow-600" />;
      case "REJECTED":
        return <XCircle className="h-5 w-5 text-red-600" />;
      default:
        return <Clock className="h-5 w-5 text-gray-400" />;
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link
            href={
              session.user.role === "SURVEYOR"
                ? "/dashboard/jobs"
                : "/dashboard"
            }
          >
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Jobs
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {job.jobNumber}
            </h1>
            <p className="text-gray-600 mt-1">Survey Job Details</p>
          </div>
        </div>
        <Badge className={getStatusColor(job.status)} variant="secondary">
          {getStatusText(job.status)}
        </Badge>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Client Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Client Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Client Name
                  </label>
                  <p className="text-gray-900">{job.clientName}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Email
                  </label>
                  <p className="text-gray-900">
                    {job.clientEmail || "Not provided"}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Phone
                  </label>
                  <p className="text-gray-900">{job.clientPhone}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Survey Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Survey Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Location
                </label>
                <p className="text-gray-900 mt-1">{job.location}</p>
              </div>
              {job.description && (
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Description
                  </label>
                  <p className="text-gray-900 mt-1">{job.description}</p>
                </div>
              )}
              {job.coordinates && (
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Coordinates
                  </label>
                  <p className="text-gray-900 mt-1">
                    Lat: {(job.coordinates as any).latitude}, Lng:{" "}
                    {(job.coordinates as any).longitude}
                  </p>
                </div>
              )}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Submitted
                  </label>
                  <p className="text-gray-900">
                    {new Date(job.submittedAt).toLocaleString()}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Last Updated
                  </label>
                  <p className="text-gray-900">
                    {new Date(job.updatedAt).toLocaleString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Documents */}
          <DocumentsSection documents={job.documents} />

          {/* Pillar Numbers */}
          {job.pillarNumbers.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Assigned Pillar Numbers</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {job.pillarNumbers.map((pillar) => (
                    <div
                      key={pillar.id}
                      className="flex items-center justify-between p-3 border rounded-lg bg-green-50"
                    >
                      <div>
                        <p className="font-medium text-green-800">
                          {pillar.pillarNumber}
                        </p>
                        <p className="text-sm text-green-600">
                          Issued:{" "}
                          {new Date(pillar.issuedDate).toLocaleDateString()}
                        </p>
                      </div>
                      <Link href={`/search?q=${pillar.pillarNumber}`}>
                        <Button variant="outline" size="sm">
                          View Details
                        </Button>
                      </Link>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Workflow Progress */}
          <Card>
            <CardHeader>
              <CardTitle>Workflow Progress</CardTitle>
              <CardDescription>
                Track the progress of your survey job
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {job.workflowSteps.map((step, index) => (
                  <div key={step.id} className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-0.5">
                      {getStepIcon(step.status)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">
                        {step.stepName}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {step.status === "COMPLETED" && step.completedAt
                          ? `Completed: ${new Date(step.completedAt).toLocaleDateString()}`
                          : step.status === "IN_PROGRESS"
                            ? "In Progress"
                            : step.status === "REJECTED"
                              ? "Rejected"
                              : "Pending"}
                      </p>
                      {step.notes && (
                        <p className="text-xs text-gray-600 mt-1">
                          {step.notes}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Surveyor Info */}
          <Card>
            <CardHeader>
              <CardTitle>Surveyor Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Name
                </label>
                <p className="text-gray-900">{job.surveyor.user.name}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Firm
                </label>
                <p className="text-gray-900">{job.surveyor.firmName}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">
                  SURCON Registration
                </label>
                <p className="text-gray-900">
                  {job.surveyor.surconRegistrationNumber}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Contact
                </label>
                <p className="text-gray-900">{job.surveyor.phoneNumber}</p>
              </div>
            </CardContent>
          </Card>

          {/* Job Actions - Show approval buttons for NIS Officers and Admins */}
          {(session.user.role === "NIS_OFFICER" ||
            session.user.role === "ADMIN") && (
            <Card>
              <CardHeader>
                <CardTitle>Job Review Actions</CardTitle>
                <CardDescription>
                  {session.user.role === "NIS_OFFICER"
                    ? "Review and approve/reject this survey job"
                    : "Final approval and pillar number assignment"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">
                          Current Status
                        </p>
                        <p className="text-sm text-gray-600">
                          {getStatusText(job.status)}
                        </p>
                      </div>
                      <Badge
                        className={getStatusColor(job.status)}
                        variant="secondary"
                      >
                        {getStatusText(job.status)}
                      </Badge>
                    </div>
                  </div>

                  {/* Show approval buttons based on job status and user role */}
                  {(job.status === "SUBMITTED" ||
                    job.status === "NIS_REVIEW") &&
                  session.user.role === "NIS_OFFICER" ? (
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-gray-700">
                        NIS Officer Review
                      </p>
                      <ApprovalButtons
                        itemId={job.id}
                        itemType="job"
                        userRole="NIS_OFFICER"
                      />
                    </div>
                  ) : (job.status === "ADMIN_REVIEW" ||
                      job.status === "NIS_APPROVED") &&
                    session.user.role === "ADMIN" ? (
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-gray-700">
                        Admin Final Approval & Pillar Assignment
                      </p>
                      <AdminJobApproval
                        jobId={job.id}
                        jobNumber={job.jobNumber}
                        onSuccess={() => window.location.reload()}
                      />
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-sm text-gray-500">
                        {job.status === "COMPLETED"
                          ? "Job has been completed and approved"
                          : job.status.includes("REJECTED")
                            ? "Job has been rejected"
                            : "No actions available for current status"}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
