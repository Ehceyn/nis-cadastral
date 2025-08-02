import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { JobSubmissionForm } from "@/components/job-submission-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Clock, UserX } from "lucide-react";
import Link from "next/link";

export default async function NewJobPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  // Check user's surveyor status
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      surveyor: true,
    },
  });

  // Redirect if not a surveyor
  if (!user?.surveyor) {
    redirect("/dashboard");
  }

  // Show verification status if not verified
  if (user.surveyor.status !== "VERIFIED") {
    return (
      <div className="max-w-2xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Submit New Survey Job
          </h1>
          <p className="text-gray-600 mt-2">
            Create a new cadastral survey job submission
          </p>
        </div>

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
                  Account Verification Pending
                </>
              ) : (
                <>
                  <UserX className="h-5 w-5 text-red-600" />
                  Account Not Verified
                </>
              )}
            </CardTitle>
            <CardDescription>
              {user.surveyor.status === "PENDING"
                ? "Your surveyor account is currently under review. You cannot submit jobs until verification is complete."
                : "Your surveyor account has not been verified. Please contact the administrator for verification."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-white p-4 rounded-lg border">
              <h4 className="font-medium mb-3">Your Account Information:</h4>
              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Name:</span>
                  <p className="text-gray-600">{user.name}</p>
                </div>
                <div>
                  <span className="font-medium">Email:</span>
                  <p className="text-gray-600">{user.email}</p>
                </div>
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
                <div className="mt-4 p-3 bg-yellow-100 border border-yellow-200 rounded-lg">
                  <div className="flex items-center gap-2 text-yellow-800">
                    <Clock className="h-4 w-4" />
                    <span className="font-medium">
                      Verification in Progress
                    </span>
                  </div>
                  <p className="text-sm text-yellow-700 mt-1">
                    Our administrators are reviewing your account. This
                    typically takes 1-3 business days. You&apos;ll receive an
                    email notification once verification is complete.
                  </p>
                </div>
              )}

              {user.surveyor.status === "REJECTED" && (
                <div className="mt-4 p-3 bg-red-100 border border-red-200 rounded-lg">
                  <div className="flex items-center gap-2 text-red-800">
                    <AlertTriangle className="h-4 w-4" />
                    <span className="font-medium">Verification Required</span>
                  </div>
                  <p className="text-sm text-red-700 mt-1">
                    Your account verification was not successful. Please contact
                    the administrator or submit updated documentation for
                    review.
                  </p>
                </div>
              )}
            </div>

            <div className="flex space-x-4">
              <Link href="/dashboard">
                <Button variant="outline">Back to Dashboard</Button>
              </Link>
              {user.surveyor.status === "REJECTED" && (
                <Button>Contact Administrator</Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <JobSubmissionForm />;
}
