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
  Plus,
  FileText,
  MapPin,
  User,
  Clock,
  AlertTriangle,
} from "lucide-react";

export default async function JobsPage() {
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

  // Fetch real jobs from database
  const jobs = await prisma.surveyJob.findMany({
    where: {
      userId: session.user.id,
    },
    include: {
      documents: true,
      surveyor: {
        include: {
          user: true,
        },
      },
    },
    orderBy: {
      submittedAt: "desc",
    },
  });

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
      case "REJECTED":
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

  return (
    <div className="space-y-8">
      {" "}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Survey Jobs</h1>
          <p className="text-gray-600 mt-2">
            Manage your survey job submissions
          </p>
        </div>
        {user?.surveyor?.status === "VERIFIED" && (
          <Link href="/dashboard/jobs/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Survey Job
            </Button>
          </Link>
        )}
      </div>
      {/* Verification Status for Surveyors */}
      {user?.surveyor && user.surveyor.status !== "VERIFIED" && (
        <Card
          className={
            user.surveyor.status === "PENDING"
              ? "border-yellow-200 bg-yellow-50"
              : "border-red-200 bg-red-50"
          }
        >
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {user.surveyor.status === "PENDING" ? (
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
              {user.surveyor.status === "PENDING"
                ? "Your account is under review. Job submission is temporarily disabled until verification is complete."
                : "Your account requires verification before you can submit jobs. Please contact the administrator."}
            </CardDescription>
          </CardHeader>
        </Card>
      )}
      {/* Jobs List */}
      <div className="space-y-6">
        {jobs.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
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
            </CardContent>
          </Card>
        ) : (
          jobs.map((job) => (
            <Card key={job.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      {job.jobNumber}
                    </CardTitle>
                    <CardDescription className="mt-1">
                      Submitted on{" "}
                      {new Date(job.submittedAt).toLocaleDateString()}
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
                    {" "}
                    <div className="flex items-center gap-2 text-sm">
                      <User className="h-4 w-4 text-gray-500" />
                      <span className="font-medium">Client:</span>
                      <span>{job.clientName}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-medium">Phone:</span>
                      <span>{job.clientPhone}</span>
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
                    {job.documents.map((doc, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {doc.fileName}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <Link href={`/dashboard/jobs/${job.id}`}>
                    <Button variant="outline" size="sm">
                      View Details
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
