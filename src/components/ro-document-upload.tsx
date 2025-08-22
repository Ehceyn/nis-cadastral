"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Upload, FileText, CheckCircle, Loader2, AlertCircle } from "lucide-react";
import { toast } from "sonner";

interface RoDocumentUploadProps {
  jobId: string;
  jobNumber: string;
  isEnabled: boolean;
  isUploaded: boolean;
  userRole: string;
  onUploadSuccess?: () => void;
}

export function RoDocumentUpload({
  jobId,
  jobNumber,
  isEnabled,
  isUploaded,
  userRole,
  onUploadSuccess,
}: RoDocumentUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const acceptedFormats = [".pdf"];

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check file size (max 20MB)
    if (file.size > 20 * 1024 * 1024) {
      toast.error("File size must be less than 20MB");
      return;
    }

    // Check file type
    const extension = `.${file.name.split(".").pop()?.toLowerCase()}`;
    if (!acceptedFormats.includes(extension)) {
      toast.error("Only PDF files are supported for R of O documents.");
      return;
    }

    setSelectedFile(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error("Please select a file to upload");
      return;
    }

    setIsUploading(true);

    try {
      // Upload file
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("type", "RO_DOCUMENT");
      formData.append("jobId", jobId);

      const uploadResponse = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!uploadResponse.ok) {
        throw new Error("File upload failed");
      }

      const uploadResult = await uploadResponse.json();

      // Update job with R of O upload
      const jobResponse = await fetch("/api/jobs/ro-document-upload", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          jobId,
          documentUrl: uploadResult.url,
          fileName: selectedFile.name,
          fileSize: selectedFile.size,
          mimeType: selectedFile.type,
        }),
      });

      if (!jobResponse.ok) {
        throw new Error("Failed to update job with R of O document");
      }

      toast.success("R of O document uploaded successfully! Job marked as completed.");
      setSelectedFile(null);
      if (onUploadSuccess) onUploadSuccess();

      // Refresh the page to show updated status
      window.location.reload();
    } catch (error) {
      console.error("R of O upload error:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to upload R of O document"
      );
    } finally {
      setIsUploading(false);
    }
  };

  if (userRole !== "ADMIN") {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5" />
          R of O Document Upload
        </CardTitle>
        <CardDescription>
          Upload the Right of Occupancy document (PDF format only)
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!isEnabled ? (
          <div className="text-center py-6">
            <AlertCircle className="w-12 h-12 mx-auto text-yellow-500 mb-4" />
            <p className="text-gray-600">
              R of O document upload will be available after the surveyor uploads the Blue Copy.
            </p>
          </div>
        ) : isUploaded ? (
          <div className="text-center py-6">
            <CheckCircle className="w-12 h-12 mx-auto text-green-500 mb-4" />
            <p className="text-green-700 font-medium">
              R of O document has been uploaded successfully!
            </p>
            <p className="text-sm text-gray-600 mt-2">
              Job has been marked as completed.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
              <div className="text-center">
                <Upload className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                <Label
                  htmlFor="roDocumentFile"
                  className="cursor-pointer text-sm font-medium text-blue-600 hover:text-blue-500"
                >
                  Click to select R of O document
                </Label>
                <Input
                  id="roDocumentFile"
                  type="file"
                  accept={acceptedFormats.join(",")}
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <p className="text-xs text-gray-500 mt-2">
                  Supported format: PDF only (max 20MB)
                </p>
              </div>
            </div>

            {selectedFile && (
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium">{selectedFile.name}</p>
                    <p className="text-xs text-gray-500">
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                <Button
                  onClick={handleUpload}
                  disabled={isUploading}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Upload R of O
                    </>
                  )}
                </Button>
              </div>
            )}

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> Once you upload the R of O document, the job will be 
                automatically marked as completed and the surveyor will be notified.
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}