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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Users, UserCheck, UserX, Search, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ApprovalButtons } from "@/components/approval-buttons";

export default async function UserManagementPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  // Allow both ADMIN and NIS_OFFICER to access user management
  if (session.user.role !== "ADMIN" && session.user.role !== "NIS_OFFICER") {
    redirect("/dashboard");
  }

  // Fetch all users with their surveyor info
  const users = await prisma.user.findMany({
    include: {
      surveyor: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  // Get statistics based on role access
  const stats = {
    totalUsers: users.length,
    totalSurveyors: users.filter((u) => u.role === "SURVEYOR").length,
    verifiedSurveyors: users.filter((u) => u.surveyor?.status === "VERIFIED")
      .length,
    pendingSurveyors: users.filter((u) =>
      session.user.role === "NIS_OFFICER"
        ? ["PENDING", "PENDING_NIS_REVIEW"].includes(u.surveyor?.status || "")
        : u.surveyor?.status === "NIS_APPROVED"
    ).length,
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "VERIFIED":
        return "bg-green-100 text-green-800";
      case "PENDING":
        return "bg-yellow-100 text-yellow-800";
      case "REJECTED":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
        <p className="text-gray-600 mt-2">
          Manage users and surveyor verifications
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
            <p className="text-xs text-muted-foreground">All platform users</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Surveyors</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalSurveyors}</div>
            <p className="text-xs text-muted-foreground">
              Registered surveyors
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Verified</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.verifiedSurveyors}</div>
            <p className="text-xs text-muted-foreground">Verified surveyors</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <UserX className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingSurveyors}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting verification
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>All Users</CardTitle>
              <CardDescription>
                Manage user accounts and surveyor verifications
              </CardDescription>
            </div>
            <div className="flex space-x-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search users..." className="pl-8 w-64" />
              </div>
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Filter
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>SURCON Registration</TableHead>
                  <TableHead>Firm Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={getRoleColor(user.role)}
                      >
                        {user.role.replace("_", " ")}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {user.surveyor?.surconRegistrationNumber || "-"}
                    </TableCell>
                    <TableCell>{user.surveyor?.firmName || "-"}</TableCell>
                    <TableCell>
                      {user.surveyor ? (
                        <Badge
                          variant="secondary"
                          className={getStatusColor(user.surveyor.status)}
                        >
                          {user.surveyor.status}
                        </Badge>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                    <TableCell>
                      {new Date(user.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        {user.surveyor?.status === "PENDING" ||
                        user.surveyor?.status === "PENDING_NIS_REVIEW" ? (
                          session.user.role === "NIS_OFFICER" ? (
                            <ApprovalButtons
                              itemId={user.surveyor.id}
                              itemType="surveyor"
                              userRole="NIS_OFFICER"
                            />
                          ) : null
                        ) : user.surveyor?.status === "NIS_APPROVED" ? (
                          session.user.role === "ADMIN" ? (
                            <ApprovalButtons
                              itemId={user.surveyor.id}
                              itemType="surveyor"
                              userRole="ADMIN"
                            />
                          ) : (
                            <Badge
                              variant="secondary"
                              className="bg-blue-100 text-blue-800"
                            >
                              Awaiting Admin
                            </Badge>
                          )
                        ) : null}
                        <Link href={`/dashboard/users/${user.id}`}>
                          <Button size="sm" variant="outline">
                            View
                          </Button>
                        </Link>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Pending Verifications */}
      <Card>
        <CardHeader>
          <CardTitle>Pending Verifications</CardTitle>
          <CardDescription>
            Surveyor accounts awaiting verification
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {users
              .filter((u) =>
                session.user.role === "NIS_OFFICER"
                  ? ["PENDING", "PENDING_NIS_REVIEW"].includes(
                      u.surveyor?.status || ""
                    )
                  : u.surveyor?.status === "NIS_APPROVED"
              )
              .map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">{user.name}</span>
                      <Badge
                        variant="secondary"
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
                        SURCON: {user.surveyor?.surconRegistrationNumber}
                      </span>
                      <span>Firm: {user.surveyor?.firmName}</span>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    {user.surveyor?.status === "PENDING" ||
                    user.surveyor?.status === "PENDING_NIS_REVIEW" ? (
                      session.user.role === "NIS_OFFICER" ? (
                        <ApprovalButtons
                          itemId={user.surveyor!.id}
                          itemType="surveyor"
                          userRole="NIS_OFFICER"
                        />
                      ) : null
                    ) : user.surveyor?.status === "NIS_APPROVED" ? (
                      session.user.role === "ADMIN" ? (
                        <ApprovalButtons
                          itemId={user.surveyor!.id}
                          itemType="surveyor"
                          userRole="ADMIN"
                        />
                      ) : null
                    ) : null}
                    <Link href={`/dashboard/users/${user.id}`}>
                      <Button variant="outline" size="sm">
                        View Details
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            {users.filter((u) =>
              session.user.role === "NIS_OFFICER"
                ? ["PENDING", "PENDING_NIS_REVIEW"].includes(
                    u.surveyor?.status || ""
                  )
                : u.surveyor?.status === "NIS_APPROVED"
            ).length === 0 && (
              <p className="text-gray-500 text-center py-8">
                No pending verifications
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
