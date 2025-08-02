import { Suspense } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { JobsServerSearch } from "@/components/jobs-server-search";
import { Plus, Loader2 } from "lucide-react";

export default function JobsPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Survey Jobs</h1>
          <p className="text-muted-foreground">
            Manage and track your survey job submissions
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/jobs/new">
            <Plus className="mr-2 h-4 w-4" />
            New Survey Job
          </Link>
        </Button>
      </div>

      <Suspense
        fallback={
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        }
      >
        <JobsServerSearch />
      </Suspense>
    </div>
  );
}
