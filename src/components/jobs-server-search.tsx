"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Input } from "@/components/ui/input";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  Filter,
  X,
  ChevronLeft,
  ChevronRight,
  Loader2,
  FileText,
  Calendar,
  MapPin,
  Phone,
  Mail,
  Plus,
} from "lucide-react";
import { toast } from "sonner";

interface JobData {
  id: string;
  jobNumber: string;
  clientName: string;
  clientPhone: string | null;
  clientEmail?: string | null;
  location: string;
  status: string;
  submittedAt: Date;
  documents: Array<{ fileName: string }>;
  description?: string | null;
  planNumber?: string | null;
  titleHolderName?: string | null;
  areaSqm?: string | null;
  totalAmount?: string | null;
  stampReference?: string | null;
  depositTellerNumber?: string | null;
  depositAmount?: string | null;
  beaconTellerNumber?: string | null;
  beaconAmount?: string | null;
  pillarNumbersRequired?: number | null;
  cumulativePillarsQuarter?: number | null;
  cumulativePillarsYear?: number | null;
  eastingCoordinates?: string | null;
  northingCoordinates?: string | null;
  surveyorName?: string | null;
  referenceNumber?: string | null;
}

interface PaginationData {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  limit: number;
}

interface ApiResponse {
  jobs: JobData[];
  pagination: PaginationData;
  filters: {
    search: string;
    status: string;
    dateFrom: string;
    dateTo: string;
    sortBy: string;
    sortOrder: string;
  };
}

interface JobsServerSearchProps {
  // Remove children prop to make it self-contained
}

export function JobsServerSearch() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [jobs, setJobs] = useState<JobData[]>([]);
  const [pagination, setPagination] = useState<PaginationData>({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    hasNextPage: false,
    hasPrevPage: false,
    limit: 10,
  });
  const [loading, setLoading] = useState(true);

  // Filter states
  const [searchQuery, setSearchQuery] = useState(
    searchParams.get("search") || ""
  );
  const [statusFilter, setStatusFilter] = useState(
    searchParams.get("status") || "ALL"
  );
  const [dateFrom, setDateFrom] = useState(searchParams.get("dateFrom") || "");
  const [dateTo, setDateTo] = useState(searchParams.get("dateTo") || "");
  const [sortBy, setSortBy] = useState(
    searchParams.get("sortBy") || "submittedAt"
  );
  const [sortOrder, setSortOrder] = useState(
    searchParams.get("sortOrder") || "desc"
  );

  // Update URL params and fetch data
  const updateFilters = useCallback(
    (updates: Record<string, string | number>) => {
      const params = new URLSearchParams(searchParams.toString());

      Object.entries(updates).forEach(([key, value]) => {
        if (value) {
          params.set(key, value.toString());
        } else {
          params.delete(key);
        }
      });

      router.push(`?${params.toString()}`, { scroll: false });
    },
    [searchParams, router]
  );

  // Handle search input change with debouncing
  useEffect(() => {
    const handler = setTimeout(() => {
      if (searchQuery !== (searchParams.get("search") || "")) {
        updateFilters({ search: searchQuery, page: 1 });
      }
    }, 300);

    return () => clearTimeout(handler);
  }, [searchQuery, searchParams, updateFilters]);

  // Fetch jobs from API
  const fetchJobs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: searchParams.get("page") || "1",
        limit: searchParams.get("limit") || "10",
        search: searchParams.get("search") || "",
        status: searchParams.get("status") || "",
        dateFrom: searchParams.get("dateFrom") || "",
        dateTo: searchParams.get("dateTo") || "",
        sortBy: searchParams.get("sortBy") || "submittedAt",
        sortOrder: searchParams.get("sortOrder") || "desc",
      });

      const response = await fetch(`/api/jobs?${params.toString()}`);

      if (!response.ok) {
        throw new Error("Failed to fetch jobs");
      }

      const data: ApiResponse = await response.json();
      setJobs(data.jobs);
      setPagination(data.pagination);
    } catch (error) {
      console.error("Error fetching jobs:", error);
      toast.error("Failed to fetch jobs");
    } finally {
      setLoading(false);
    }
  }, [searchParams]);

  // Fetch jobs when search params change
  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  const clearFilters = () => {
    setSearchQuery("");
    setStatusFilter("ALL");
    setDateFrom("");
    setDateTo("");
    setSortBy("submittedAt");
    setSortOrder("desc");
    router.push("/dashboard/jobs");
  };

  const hasActiveFilters = searchQuery || (statusFilter && statusFilter !== "ALL") || dateFrom || dateTo;

  const handlePageChange = (page: number) => {
    updateFilters({ page });
  };

  const handleStatusChange = (status: string) => {
    setStatusFilter(status);
    // Convert "ALL" to empty string for the API
    const apiStatus = status === "ALL" ? "" : status;
    updateFilters({ status: apiStatus, page: 1 });
  };

  const handleDateFromChange = (date: string) => {
    setDateFrom(date);
    updateFilters({ dateFrom: date, page: 1 });
  };

  const handleDateToChange = (date: string) => {
    setDateTo(date);
    updateFilters({ dateTo: date, page: 1 });
  };

  const handleSortChange = (newSortBy: string, newSortOrder: string) => {
    setSortBy(newSortBy);
    setSortOrder(newSortOrder);
    updateFilters({ sortBy: newSortBy, sortOrder: newSortOrder, page: 1 });
  };

  return (
    <div className="space-y-6">
      {/* Search and Filter Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Search & Filter Jobs
          </CardTitle>
          <CardDescription>
            Search by job number, client name, location, or use filters to
            narrow down results
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search jobs by number, client name, location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Filters Row */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Status Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select value={statusFilter} onValueChange={handleStatusChange}>
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Statuses</SelectItem>
                  <SelectItem value="SUBMITTED">Submitted</SelectItem>
                  <SelectItem value="UNDER_REVIEW">Under Review</SelectItem>
                  <SelectItem value="APPROVED">Approved</SelectItem>
                  <SelectItem value="REJECTED">Rejected</SelectItem>
                  <SelectItem value="COMPLETED">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Date From */}
            <div className="space-y-2">
              <label className="text-sm font-medium">From Date</label>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => handleDateFromChange(e.target.value)}
              />
            </div>

            {/* Date To */}
            <div className="space-y-2">
              <label className="text-sm font-medium">To Date</label>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => handleDateToChange(e.target.value)}
              />
            </div>

            {/* Clear Filters */}
            <div className="space-y-2">
              <label className="text-sm font-medium">&nbsp;</label>
              <Button
                variant="outline"
                onClick={clearFilters}
                disabled={!hasActiveFilters}
                className="w-full"
              >
                <X className="h-4 w-4 mr-2" />
                Clear Filters
              </Button>
            </div>
          </div>

          {/* Sort Options */}
          <div className="flex items-center gap-4 pt-2 border-t">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Sort by:</label>
              <Select
                value={sortBy}
                onValueChange={(value) => handleSortChange(value, sortOrder)}
              >
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="submittedAt">Date Submitted</SelectItem>
                  <SelectItem value="jobNumber">Job Number</SelectItem>
                  <SelectItem value="clientName">Client Name</SelectItem>
                  <SelectItem value="location">Location</SelectItem>
                  <SelectItem value="status">Status</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Order:</label>
              <Select
                value={sortOrder}
                onValueChange={(value) => handleSortChange(sortBy, value)}
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="desc">Newest First</SelectItem>
                  <SelectItem value="asc">Oldest First</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Results Summary */}
          <div className="flex items-center justify-between pt-2 border-t">
            <div className="text-sm text-gray-600">
              {loading ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading jobs...
                </div>
              ) : (
                `Showing ${jobs.length} of ${pagination.totalCount} jobs`
              )}
            </div>
            {hasActiveFilters && (
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs">
                  <Filter className="h-3 w-3 mr-1" />
                  Filters Active
                </Badge>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Render jobs */}
      {loading ? (
        <JobsLoadingSkeleton />
      ) : jobs.length === 0 ? (
        <EmptyJobsState />
      ) : (
        <div className="grid gap-6">
          {jobs.map((job) => (
            <JobCard key={job.id} job={job} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {!loading && pagination.totalPages > 1 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Page {pagination.currentPage} of {pagination.totalPages}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.currentPage - 1)}
                  disabled={!pagination.hasPrevPage}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.currentPage + 1)}
                  disabled={!pagination.hasNextPage}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function JobCard({ job }: { job: JobData }) {
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "submitted":
        return "bg-blue-100 text-blue-800";
      case "nis_review":
        return "bg-yellow-100 text-yellow-800";
      case "admin_review":
        return "bg-orange-100 text-orange-800";
      case "nis_rejected":
      case "admin_rejected":
        return "bg-red-100 text-red-800";
      case "nis_approved":
      case "admin_approved":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">
              <Link
                href={`/dashboard/jobs/${job.id}`}
                className="hover:text-blue-600 transition-colors"
              >
                {job.jobNumber}
              </Link>
            </CardTitle>
            <CardDescription className="mt-1">
              Submitted on {formatDate(job.submittedAt)}
            </CardDescription>
          </div>
          <Badge className={getStatusColor(job.status)}>
            {job.status
              .replace("_", " ")
              .toLowerCase()
              .replace(/\b\w/g, (l: string) => l.toUpperCase())}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <FileText className="h-4 w-4 text-gray-500" />
              <span className="font-medium">Client:</span>
              <span>{job.clientName}</span>
            </div>
            {job.clientPhone && (
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4 text-gray-500" />
                <span>{job.clientPhone}</span>
              </div>
            )}
            {job.clientEmail && (
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-gray-500" />
                <span>{job.clientEmail}</span>
              </div>
            )}
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="h-4 w-4 text-gray-500" />
              <span className="font-medium">Location:</span>
              <span className="truncate">{job.location}</span>
            </div>
            {job.planNumber && (
              <div className="flex items-center gap-2 text-sm">
                <FileText className="h-4 w-4 text-gray-500" />
                <span className="font-medium">Plan:</span>
                <span>{job.planNumber}</span>
              </div>
            )}
            {job.totalAmount && (
              <div className="flex items-center gap-2 text-sm">
                <span className="font-medium">Amount:</span>
                <span>₦{job.totalAmount}</span>
              </div>
            )}
          </div>
        </div>

        {job.description && (
          <div className="pt-2 border-t">
            <p className="text-sm text-gray-600 line-clamp-2">
              {job.description}
            </p>
          </div>
        )}

        <div className="flex justify-between items-center pt-2 border-t">
          <div className="text-xs text-gray-500">
            {job.documents?.length || 0} document(s) uploaded
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link href={`/dashboard/jobs/${job.id}`}>View Details</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function JobsLoadingSkeleton() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin" />
            <div className="h-6 bg-gray-200 rounded w-48 animate-pulse" />
          </div>
          <div className="h-4 bg-gray-200 rounded w-96 animate-pulse" />
        </CardHeader>
        <CardContent className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="h-4 bg-gray-200 rounded w-full animate-pulse" />
              <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse" />
            </div>
          ))}
        </CardContent>
      </Card>
      {Array.from({ length: 3 }).map((_, i) => (
        <Card key={i}>
          <CardHeader>
            <div className="flex justify-between">
              <div className="space-y-2">
                <div className="h-6 bg-gray-200 rounded w-32 animate-pulse" />
                <div className="h-4 bg-gray-200 rounded w-24 animate-pulse" />
              </div>
              <div className="h-6 bg-gray-200 rounded w-20 animate-pulse" />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-full animate-pulse" />
                <div className="h-4 bg-gray-200 rounded w-2/3 animate-pulse" />
              </div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-full animate-pulse" />
                <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function EmptyJobsState() {
  return (
    <Card className="text-center py-12">
      <CardContent>
        <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <CardTitle className="mb-2">No survey jobs found</CardTitle>
        <CardDescription className="mb-6">
          Get started by submitting your first survey job or adjust your search
          filters.
        </CardDescription>
        <Button asChild>
          <Link href="/dashboard/jobs/new">
            <Plus className="mr-2 h-4 w-4" />
            Submit New Job
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
