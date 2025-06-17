import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { FileText, MapPin, Clock, CheckCircle } from "lucide-react"

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/login")
  }

  // Mock data - in real app, fetch from database
  const stats = {
    totalJobs: 12,
    pendingJobs: 3,
    approvedJobs: 8,
    rejectedJobs: 1,
  }

  const recentJobs = [
    {
      id: "1",
      jobNumber: "JOB-2024-001",
      clientName: "John Doe",
      location: "Port Harcourt, Rivers State",
      status: "NIS_REVIEW",
      submittedAt: "2024-01-15",
    },
    {
      id: "2",
      jobNumber: "JOB-2024-002",
      clientName: "Jane Smith",
      location: "Obio-Akpor, Rivers State",
      status: "COMPLETED",
      submittedAt: "2024-01-10",
    },
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return "bg-green-100 text-green-800"
      case "NIS_REVIEW":
        return "bg-yellow-100 text-yellow-800"
      case "SUBMITTED":
        return "bg-blue-100 text-blue-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Welcome back, {session.user.name}</h1>
        <p className="text-gray-600 mt-2">Here's an overview of your survey activities</p>
      </div>

      {/* Stats Cards */}
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
            <p className="text-xs text-muted-foreground">Successfully completed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pillar Numbers</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.approvedJobs}</div>
            <p className="text-xs text-muted-foreground">Issued pillars</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Jobs */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Survey Jobs</CardTitle>
          <CardDescription>Your latest survey job submissions and their status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentJobs.map((job) => (
              <div key={job.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium">{job.jobNumber}</span>
                    <Badge className={getStatusColor(job.status)}>{job.status.replace("_", " ")}</Badge>
                  </div>
                  <p className="text-sm text-gray-600">Client: {job.clientName}</p>
                  <p className="text-sm text-gray-500">Location: {job.location}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">Submitted: {new Date(job.submittedAt).toLocaleDateString()}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
