import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import { JobSubmissionForm } from "@/components/job-submission-form"

export default async function NewJobPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/login")
  }

  return <JobSubmissionForm />
}
