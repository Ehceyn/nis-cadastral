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
import {
  Upload,
  FileText,
  CheckCircle,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";

interface BlueCopyUploadProps {
  jobId: string;
  jobNumber: string;
  isEnabled: boolean;
  isUploaded: boolean;
  userRole: string;
  onUploadSuccess?: () => void;
  roUploaded?: boolean;
}

export function BlueCopyUpload({
  jobId,
  jobNumber,
  isEnabled,
  isUploaded,
  userRole,
  onUploadSuccess,
  roUploaded,
}: BlueCopyUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const acceptedFormats = [".pdf", ".png", ".jpeg", ".jpg", ".dwg"];

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
      toast.error(
        "File type not supported. Please upload PDF, PNG, JPEG, or DWG files."
      );
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
      formData.append("type", "BLUE_COPY");
      formData.append("jobId", jobId);

      const uploadResponse = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!uploadResponse.ok) {
        throw new Error("File upload failed");
      }

      const uploadResult = await uploadResponse.json();

      // Update job with Blue Copy upload
      const jobResponse = await fetch("/api/jobs/blue-copy-upload", {
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
        throw new Error("Failed to update job with Blue Copy");
      }

      toast.success("Blue Copy uploaded successfully!");
      setSelectedFile(null);
      if (onUploadSuccess) onUploadSuccess();

      // Refresh the page to show updated status
      window.location.reload();
    } catch (error) {
      console.error("Blue Copy upload error:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to upload Blue Copy"
      );
    } finally {
      setIsUploading(false);
    }
  };

  if (userRole !== "SURVEYOR") {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Blue Copy Upload
        </CardTitle>
        <CardDescription>
          Upload the Blue Copy document (PDF, PNG, JPEG, or DWG format)
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!isEnabled ? (
          <div className="text-center py-6">
            <AlertCircle className="w-12 h-12 mx-auto text-yellow-500 mb-4" />
            <p className="text-gray-600">
              Blue Copy upload will be available after pillar numbers are
              issued.
            </p>
          </div>
        ) : isUploaded ? (
          <div className="text-center py-6">
            <CheckCircle className="w-12 h-12 mx-auto text-green-500 mb-4" />
            <p className="text-green-700 font-medium">
              Blue Copy has been uploaded successfully!
            </p>
            {roUploaded ? (
              <p className="text-sm text-gray-600 mt-2">
                R of O uploaded. Job completed.
              </p>
            ) : (
              <p className="text-sm text-gray-600 mt-2">
                Waiting for admin to upload the R of O document.
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
              <div className="text-center">
                <Upload className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                <Label
                  htmlFor="blueCopyFile"
                  className="cursor-pointer text-sm font-medium text-blue-600 hover:text-blue-500"
                >
                  Click to select Blue Copy file
                </Label>
                <Input
                  id="blueCopyFile"
                  type="file"
                  accept={acceptedFormats.join(",")}
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <p className="text-xs text-gray-500 mt-2">
                  Supported formats: PDF, PNG, JPEG, DWG (max 20MB)
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
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Blue Copy
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
