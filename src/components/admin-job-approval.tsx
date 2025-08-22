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
  requestedCoordinates?: Array<{ easting: string; northing: string }>;
  onSuccess?: () => void;
}

export function AdminJobApproval({
  jobId,
  jobNumber,
  requestedCoordinates,
  onSuccess,
}: AdminJobApprovalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [pillarNumbers, setPillarNumbers] = useState<string[]>([]);
  const [planNumber, setPlanNumber] = useState("");
  const [seriesPrefix, setSeriesPrefix] = useState("SC/CN");
  const [comments, setComments] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [coordinateCount, setCoordinateCount] = useState(requestedCoordinates?.length || 1);

  const generatePillarNumbers = async () => {
    setIsGenerating(true);
    try {
      const response = await fetch("/api/pillars/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          count: coordinateCount,
          seriesPrefix
        }),
      });
      const data = await response.json();

      if (response.ok) {
        setPillarNumbers(data.pillarNumbers);
        toast.success(`${coordinateCount} pillar numbers generated!`);
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      toast.error("Failed to generate pillar numbers");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleApprove = async () => {
    if (pillarNumbers.length !== coordinateCount) {
      toast.error("Please generate pillar numbers for all coordinates");
      return;
    }

    if (!planNumber.trim()) {
      toast.error("Plan number is required for approval");
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
          pillarNumbers,
          planNumber: planNumber.trim(),
          requestedCoordinates,
          comments:
            comments.trim() ||
            `Job ${jobNumber} approved with ${pillarNumbers.length} pillar numbers and plan number ${planNumber}`,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to approve job");
      }

      toast.success(data.message || "Job approved and pillar numbers issued!");
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
              <Label htmlFor="seriesPrefix">Series Prefix *</Label>
              <Input
                id="seriesPrefix"
                placeholder="SC/CN"
                value={seriesPrefix}
                onChange={(e) => setSeriesPrefix(e.target.value)}
              />
              <p className="text-sm text-gray-500">
                Configure the pillar number prefix (e.g., SC/CN, SC/BN)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="planNumber">Plan Number *</Label>
              <Input
                id="planNumber"
                placeholder="Enter plan number"
                value={planNumber}
                onChange={(e) => setPlanNumber(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Pillar Numbers ({coordinateCount} needed) *</Label>
              <div className="flex space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={generatePillarNumbers}
                  disabled={isGenerating}
                >
                  {isGenerating ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Hash className="h-4 w-4 mr-2" />
                  )}
                  Generate {coordinateCount} Pillar Numbers
                </Button>
              </div>
              
              {pillarNumbers.length > 0 && (
                <div className="mt-3 space-y-2">
                  <h5 className="font-medium text-sm">Generated Pillar Numbers:</h5>
                  <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
                    {pillarNumbers.map((number, index) => (
                      <div key={index} className="p-2 bg-green-50 border rounded text-sm">
                        <span className="font-mono">{number}</span>
                        {requestedCoordinates && requestedCoordinates[index] && (
                          <div className="text-xs text-gray-600 mt-1">
                            E: {requestedCoordinates[index].easting}, N: {requestedCoordinates[index].northing}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <p className="text-sm text-gray-500">
                Click to auto-generate consecutive pillar numbers for all coordinates
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
              disabled={isApproving || pillarNumbers.length !== coordinateCount || !planNumber.trim()}
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
