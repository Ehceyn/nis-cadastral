import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
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

export default async function UserManagementPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  if (session.user.role !== "ADMIN") {
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

  // Get statistics
  const stats = {
    totalUsers: users.length,
    totalSurveyors: users.filter((u) => u.role === "SURVEYOR").length,
    verifiedSurveyors: users.filter((u) => u.surveyor?.status === "VERIFIED")
      .length,
    pendingSurveyors: users.filter((u) => u.surveyor?.status === "PENDING")
      .length,
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
                  <TableHead>License Number</TableHead>
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
                    <TableCell>{user.surveyor?.licenseNumber || "-"}</TableCell>
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
                        {user.surveyor?.status === "PENDING" && (
                          <>
                            <Button size="sm" variant="outline">
                              Verify
                            </Button>
                            <Button size="sm" variant="outline">
                              Reject
                            </Button>
                          </>
                        )}
                        <Button size="sm" variant="outline">
                          View
                        </Button>
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
              .filter((u) => u.surveyor?.status === "PENDING")
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
                        className="bg-yellow-100 text-yellow-800"
                      >
                        Pending Verification
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600">{user.email}</p>
                    <div className="flex space-x-4 text-sm text-gray-500">
                      <span>License: {user.surveyor?.licenseNumber}</span>
                      <span>Firm: {user.surveyor?.firmName}</span>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <UserCheck className="h-4 w-4 mr-2" />
                      Verify
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-red-600 hover:text-red-700"
                    >
                      <UserX className="h-4 w-4 mr-2" />
                      Reject
                    </Button>
                  </div>
                </div>
              ))}
            {users.filter((u) => u.surveyor?.status === "PENDING").length ===
              0 && (
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
