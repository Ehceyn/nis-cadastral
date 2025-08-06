"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { AdminJobApproval } from "@/components/admin-job-approval";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface AdminApprovalSectionProps {
  jobId: string;
  jobNumber: string;
  jobStatus: string;
}

export function AdminApprovalSection({
  jobId,
  jobNumber,
  jobStatus,
}: AdminApprovalSectionProps) {
  const [isRejecting, setIsRejecting] = useState(false);

  const handleReject = async () => {
    const reason = prompt("Please provide a reason for rejection:");
    if (!reason) return;

    setIsRejecting(true);
    try {
      const response = await fetch("/api/jobs/admin-reject", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          jobId,
          reason,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to reject job");
      }

      toast.success(data.message || "Job rejected successfully!");

      // Refresh the page to show updated status
      window.location.reload();
    } catch (error) {
      console.error("Rejection error:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to reject job"
      );
    } finally {
      setIsRejecting(false);
    }
  };

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-gray-700">
        Admin Final Approval & Pillar Assignment
      </p>
      <AdminJobApproval jobId={jobId} jobNumber={jobNumber} />
    </div>
  );
}
