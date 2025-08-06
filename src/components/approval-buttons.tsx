"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface ApprovalButtonsProps {
  itemId: string;
  itemType: "surveyor" | "job";
  userRole: "NIS_OFFICER" | "ADMIN";
  onSuccess?: () => void;
}

export function ApprovalButtons({
  itemId,
  itemType,
  userRole,
  onSuccess,
}: ApprovalButtonsProps) {
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);

  const handleApprove = async () => {
    setIsApproving(true);
    try {
      const endpoint =
        itemType === "surveyor"
          ? `/api/surveyors/${userRole.toLowerCase()}-approve`
          : `/api/jobs/${userRole.toLowerCase()}-approve`;

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          [itemType === "surveyor" ? "surveyorId" : "jobId"]: itemId,
          comments: `Approved by ${userRole}`,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to approve");
      }

      toast.success(data.message || "Approved successfully!");
      if (onSuccess) onSuccess();

      // Refresh the page to show updated status
      window.location.reload();
    } catch (error) {
      console.error("Approval error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to approve");
    } finally {
      setIsApproving(false);
    }
  };

  const handleReject = async () => {
    const reason = prompt("Please provide a reason for rejection:");
    if (!reason) return;

    setIsRejecting(true);
    try {
      const endpoint =
        itemType === "surveyor"
          ? `/api/surveyors/${userRole.toLowerCase()}-reject`
          : `/api/jobs/${userRole.toLowerCase()}-reject`;

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          [itemType === "surveyor" ? "surveyorId" : "jobId"]: itemId,
          reason,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to reject");
      }

      toast.success(data.message || "Rejected successfully!");
      if (onSuccess) onSuccess();

      // Refresh the page to show updated status
      window.location.reload();
    } catch (error) {
      console.error("Rejection error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to reject");
    } finally {
      setIsRejecting(false);
    }
  };

  return (
    <div className="flex space-x-2">
      <Button
        size="sm"
        className="bg-green-600 hover:bg-green-700"
        onClick={handleApprove}
        disabled={isApproving || isRejecting}
      >
        {isApproving ? (
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        ) : (
          <CheckCircle className="h-4 w-4 mr-2" />
        )}
        Approve
      </Button>
      <Button
        size="sm"
        variant="outline"
        className="text-red-600 hover:text-red-700"
        onClick={handleReject}
        disabled={isApproving || isRejecting}
      >
        {isRejecting ? (
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        ) : (
          <XCircle className="h-4 w-4 mr-2" />
        )}
        Reject
      </Button>
    </div>
  );
}
