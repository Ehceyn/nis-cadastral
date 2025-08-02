"use client";

import { useState, useMemo } from "react";
import Fuse from "fuse.js";
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
import { Calendar } from "lucide-react";
import { Search, Filter, X } from "lucide-react";

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

interface JobsSearchFilterProps {
  jobs: JobData[];
  children: (filteredJobs: JobData[]) => React.ReactNode;
}

export function JobsSearchFilter({ jobs, children }: JobsSearchFilterProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Fuse.js configuration for fuzzy search
  const fuse = useMemo(() => {
    const fuseOptions = {
      keys: [
        { name: "jobNumber", weight: 0.3 },
        { name: "clientName", weight: 0.25 },
        { name: "location", weight: 0.2 },
        { name: "description", weight: 0.1 },
        { name: "planNumber", weight: 0.05 },
        { name: "titleHolderName", weight: 0.05 },
        { name: "areaSqm", weight: 0.05 },
      ],
      threshold: 0.3,
      includeScore: true,
      ignoreLocation: true,
    };
    return new Fuse(jobs, fuseOptions);
  }, [jobs]);

  // Filter jobs based on search and filters
  const filteredJobs = useMemo(() => {
    let result = jobs;

    // Apply search
    if (searchQuery.trim()) {
      const searchResults = fuse.search(searchQuery);
      result = searchResults.map((result) => result.item);
    }

    // Apply status filter
    if (statusFilter !== "all") {
      result = result.filter((job) => job.status === statusFilter);
    }

    // Apply date filter
    if (dateFilter !== "all") {
      const now = new Date();
      const jobDate = (job: JobData) => new Date(job.submittedAt);

      switch (dateFilter) {
        case "today":
          result = result.filter((job) => {
            const jDate = jobDate(job);
            return jDate.toDateString() === now.toDateString();
          });
          break;
        case "week":
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          result = result.filter((job) => jobDate(job) >= weekAgo);
          break;
        case "month":
          const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          result = result.filter((job) => jobDate(job) >= monthAgo);
          break;
        case "quarter":
          const quarterAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
          result = result.filter((job) => jobDate(job) >= quarterAgo);
          break;
        case "custom":
          if (startDate && endDate) {
            const start = new Date(startDate);
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999); // Include the entire end date
            result = result.filter((job) => {
              const jDate = jobDate(job);
              return jDate >= start && jDate <= end;
            });
          }
          break;
      }
    }

    return result;
  }, [jobs, searchQuery, statusFilter, dateFilter, startDate, endDate, fuse]);

  const clearFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
    setDateFilter("all");
    setStartDate("");
    setEndDate("");
  };

  const hasActiveFilters =
    searchQuery || statusFilter !== "all" || dateFilter !== "all";

  // Get unique statuses for filter dropdown
  const uniqueStatuses = useMemo(() => {
    const statuses = Array.from(new Set(jobs.map((job) => job.status)));
    return statuses.sort();
  }, [jobs]);

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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Status Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  {uniqueStatuses.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status
                        .replace("_", " ")
                        .toLowerCase()
                        .replace(/\b\w/g, (l: string) => l.toUpperCase())}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Date Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Date Range</label>
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All dates" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Dates</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="week">Last 7 Days</SelectItem>
                  <SelectItem value="month">Last 30 Days</SelectItem>
                  <SelectItem value="quarter">Last 90 Days</SelectItem>
                  <SelectItem value="custom">Custom Range</SelectItem>
                </SelectContent>
              </Select>
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

          {/* Custom Date Range */}
          {dateFilter === "custom" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t">
              <div className="space-y-2">
                <label className="text-sm font-medium">Start Date</label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">End Date</label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>
          )}

          {/* Results Summary */}
          <div className="flex items-center justify-between pt-2 border-t">
            <div className="text-sm text-gray-600">
              Showing {filteredJobs.length} of {jobs.length} jobs
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

      {/* Render filtered jobs */}
      {children(filteredJobs)}
    </div>
  );
}
