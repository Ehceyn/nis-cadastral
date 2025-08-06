"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { CheckCircle, XCircle, Loader2, Hash } from "lucide-react";
import { toast } from "sonner";

interface AdminJobApprovalProps {
  jobId: string;
  jobNumber: string;
  onSuccess?: () => void;
}

export function AdminJobApproval({
  jobId,
  jobNumber,
  onSuccess,
}: AdminJobApprovalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [pillarNumber, setPillarNumber] = useState("");
  const [comments, setComments] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  const generatePillarNumber = async () => {
    setIsGenerating(true);
    try {
      const response = await fetch("/api/pillars/generate");
      const data = await response.json();

      if (response.ok) {
        setPillarNumber(data.pillarNumber);
        toast.success("Pillar number generated!");
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      toast.error("Failed to generate pillar number");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleApprove = async () => {
    if (!pillarNumber.trim()) {
      toast.error("Pillar number is required for approval");
      return;
    }

    setIsApproving(true);
    try {
      const response = await fetch("/api/jobs/admin-approve", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          jobId,
          pillarNumber: pillarNumber.trim(),
          comments:
            comments.trim() ||
            `Job ${jobNumber} approved with pillar number ${pillarNumber}`,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to approve job");
      }

      toast.success(data.message || "Job approved and pillar number issued!");
      setIsOpen(false);
      if (onSuccess) onSuccess();

      // Refresh the page to show updated status
      window.location.reload();
    } catch (error) {
      console.error("Approval error:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to approve job"
      );
    } finally {
      setIsApproving(false);
    }
  };

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
      if (onSuccess) onSuccess();

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
    <div className="flex space-x-2">
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button
            size="sm"
            className="bg-green-600 hover:bg-green-700"
            disabled={isRejecting}
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            Approve & Issue Pillar
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Approve Job & Issue Pillar Number</DialogTitle>
            <DialogDescription>
              Job {jobNumber} - Issue a pillar number to complete the approval
              process.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="pillarNumber">Pillar Number *</Label>
              <div className="flex space-x-2">
                <Input
                  id="pillarNumber"
                  placeholder="PIL-2025-001"
                  value={pillarNumber}
                  onChange={(e) => setPillarNumber(e.target.value)}
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={generatePillarNumber}
                  disabled={isGenerating}
                >
                  {isGenerating ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Hash className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <p className="text-sm text-gray-500">
                Click the # button to auto-generate next pillar number
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="comments">Comments (Optional)</Label>
              <Textarea
                id="comments"
                placeholder="Additional comments about the approval..."
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleApprove}
              disabled={isApproving || !pillarNumber.trim()}
              className="bg-green-600 hover:bg-green-700"
            >
              {isApproving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <CheckCircle className="h-4 w-4 mr-2" />
              )}
              Approve & Issue Pillar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
