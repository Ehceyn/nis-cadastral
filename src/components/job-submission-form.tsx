"use client";

import type React from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Upload, X, FileText, MapPin, User, Phone, Mail } from "lucide-react";
import { toast } from "sonner";
import { surveyJobSchema } from "@/lib/validations";

type JobSubmissionData = z.infer<typeof surveyJobSchema>;

interface FileUpload {
  file: File;
  type: string;
  progress: number;
  uploaded: boolean;
  url?: string;
}

export function JobSubmissionForm() {
  const [files, setFiles] = useState<FileUpload[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const router = useRouter();

  const form = useForm<JobSubmissionData>({
    resolver: zodResolver(surveyJobSchema),
    defaultValues: {
      clientName: "",
      clientEmail: "",
      clientPhone: "",
      location: "",
      description: "",
      stampReference: "",
      totalAmount: "",
      planNumber: "",
      depositTellerNumber: "",
      depositAmount: "",
      beaconTellerNumber: "",
      beaconAmount: "",
      titleHolderName: "",
      eastingCoordinates: "",
      northingCoordinates: "",
      areaSqm: "",
    },
  });

  const acceptedFileTypes = {
    "application/pdf": [".pdf"],
    "image/jpeg": [".jpg", ".jpeg"],
    "image/png": [".png"],
    "application/vnd.google-earth.kml+xml": [".kml"],
    "application/dxf": [".dxf"],
    "application/dwg": [".dwg"],
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || []);

    selectedFiles.forEach((file) => {
      // Check file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`File ${file.name} is too large. Maximum size is 10MB.`);
        return;
      }

      // Check file type
      const fileExtension = `.${file.name.split(".").pop()?.toLowerCase()}`;
      const isAcceptedType = Object.values(acceptedFileTypes).some(
        (extensions) => extensions.includes(fileExtension)
      );

      if (!isAcceptedType) {
        toast.error(`File type ${fileExtension} is not supported.`);
        return;
      }

      const newFile: FileUpload = {
        file,
        type: file.type,
        progress: 0,
        uploaded: false,
      };

      setFiles((prev) => [...prev, newFile]);
    });

    // Reset input
    event.target.value = "";
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const uploadFiles = async () => {
    const uploadPromises = files.map(async (fileUpload, index) => {
      if (fileUpload.uploaded) return fileUpload.url;

      const formData = new FormData();
      formData.append("file", fileUpload.file);
      formData.append("type", getDocumentType(fileUpload.file.name));

      try {
        const response = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          throw new Error(`Upload failed for ${fileUpload.file.name}`);
        }

        const result = await response.json();

        // Update file upload progress
        setFiles((prev) =>
          prev.map((f, i) =>
            i === index
              ? { ...f, progress: 100, uploaded: true, url: result.url }
              : f
          )
        );

        return result.url;
      } catch (error) {
        toast.error(`Failed to upload ${fileUpload.file.name}`);
        throw error;
      }
    });

    return Promise.all(uploadPromises);
  };

  const getDocumentType = (filename: string) => {
    const extension = filename.split(".").pop()?.toLowerCase();
    switch (extension) {
      case "pdf":
        return "PDF";
      case "jpg":
      case "jpeg":
      case "png":
        return "IMAGE";
      case "kml":
        return "KML_FILE";
      case "dxf":
        return "DXF_FILE";
      case "dwg":
        return "DWG_FILE";
      default:
        return "OTHER";
    }
  };

  const onSubmit = async (data: JobSubmissionData) => {
    setIsSubmitting(true);
    setUploadProgress(0);

    try {
      // Upload files first
      let documentUrls: string[] = [];
      if (files.length > 0) {
        setUploadProgress(25);
        documentUrls = await uploadFiles();
        setUploadProgress(50);
      }

      // Submit job data
      const jobData = {
        ...data,
        coordinates: data.coordinates
          ? {
              latitude: Number(data.coordinates.latitude),
              longitude: Number(data.coordinates.longitude),
            }
          : undefined,
        pillarNumbersRequired: data.pillarNumbersRequired
          ? Number(data.pillarNumbersRequired)
          : undefined,
        cumulativePillarsQuarter: data.cumulativePillarsQuarter
          ? Number(data.cumulativePillarsQuarter)
          : undefined,
        cumulativePillarsYear: data.cumulativePillarsYear
          ? Number(data.cumulativePillarsYear)
          : undefined,
        documents: documentUrls,
      };

      setUploadProgress(75);

      const response = await fetch("/api/jobs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(jobData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to submit job");
      }

      setUploadProgress(100);
      toast.success("Survey job submitted successfully!");

      // Reset form
      form.reset();
      setFiles([]);

      // Redirect to jobs dashboard
      router.push("/dashboard/jobs");
    } catch (error) {
      console.error("Error submitting job:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to submit job"
      );
    } finally {
      setIsSubmitting(false);
      setUploadProgress(0);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight">
          Submit New Survey Job
        </h1>
        <p className="text-muted-foreground mt-2">
          Fill out the official survey application form with all required
          details
        </p>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        {/* Client Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Client Information
            </CardTitle>
            <CardDescription>
              Basic information about the client requesting the survey
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="clientName">Client Name *</Label>
                <Input
                  id="clientName"
                  {...form.register("clientName")}
                  placeholder="Enter client's full name"
                />
                {form.formState.errors.clientName && (
                  <p className="text-sm text-red-600">
                    {form.formState.errors.clientName.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="titleHolderName">Title Holder Name</Label>
                <Input
                  id="titleHolderName"
                  {...form.register("titleHolderName")}
                  placeholder="Name on property title"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="clientPhone">Phone Number *</Label>
                <Input
                  id="clientPhone"
                  type="tel"
                  {...form.register("clientPhone")}
                  placeholder="+234 xxx xxx xxxx"
                />
                {form.formState.errors.clientPhone && (
                  <p className="text-sm text-red-600">
                    {form.formState.errors.clientPhone.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="clientEmail">Email Address</Label>
                <Input
                  id="clientEmail"
                  type="email"
                  {...form.register("clientEmail")}
                  placeholder="client@email.com"
                />
                {form.formState.errors.clientEmail && (
                  <p className="text-sm text-red-600">
                    {form.formState.errors.clientEmail.message}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Survey Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Survey Details
            </CardTitle>
            <CardDescription>
              Official survey application information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="location">Property Location *</Label>
                <Input
                  id="location"
                  {...form.register("location")}
                  placeholder="Enter property address/location"
                />
                {form.formState.errors.location && (
                  <p className="text-sm text-red-600">
                    {form.formState.errors.location.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="planNumber">Plan Number</Label>
                <Input
                  id="planNumber"
                  {...form.register("planNumber")}
                  placeholder="Survey plan number"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="areaSqm">Area (Square Meters)</Label>
                <Input
                  id="areaSqm"
                  {...form.register("areaSqm")}
                  placeholder="Property area in sqm"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Survey Description</Label>
              <Textarea
                id="description"
                {...form.register("description")}
                placeholder="Describe the survey requirements in detail..."
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Coordinates section */}
        <Card>
          <CardHeader>
            <CardTitle>Coordinates</CardTitle>
            <CardDescription>
              Property coordinates and pillar information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="eastingCoordinates">Easting Coordinates</Label>
                <Input
                  id="eastingCoordinates"
                  {...form.register("eastingCoordinates")}
                  placeholder="Easting value"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="northingCoordinates">
                  Northing Coordinates
                </Label>
                <Input
                  id="northingCoordinates"
                  {...form.register("northingCoordinates")}
                  placeholder="Northing value"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="pillarNumbersRequired">Pillars Required</Label>
                <Input
                  id="pillarNumbersRequired"
                  type="number"
                  {...form.register("pillarNumbersRequired", {
                    valueAsNumber: true,
                  })}
                  placeholder="Number of pillars needed"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cumulativePillarsQuarter">
                  Cumulative Pillars (Quarter)
                </Label>
                <Input
                  id="cumulativePillarsQuarter"
                  type="number"
                  {...form.register("cumulativePillarsQuarter", {
                    valueAsNumber: true,
                  })}
                  placeholder="Quarterly cumulative"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cumulativePillarsYear">
                  Cumulative Pillars (Year)
                </Label>
                <Input
                  id="cumulativePillarsYear"
                  type="number"
                  {...form.register("cumulativePillarsYear", {
                    valueAsNumber: true,
                  })}
                  placeholder="Yearly cumulative"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Financial Information */}
        <Card>
          <CardHeader>
            <CardTitle>Financial Information</CardTitle>
            <CardDescription>Payment and deposit details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="totalAmount">Total Amount</Label>
                <Input
                  id="totalAmount"
                  {...form.register("totalAmount")}
                  placeholder="Total survey cost"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="stampReference">Stamp Reference</Label>
                <Input
                  id="stampReference"
                  {...form.register("stampReference")}
                  placeholder="Official stamp reference"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="depositTellerNumber">
                  Deposit Teller Number
                </Label>
                <Input
                  id="depositTellerNumber"
                  {...form.register("depositTellerNumber")}
                  placeholder="Bank teller number"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="depositAmount">Deposit Amount</Label>
                <Input
                  id="depositAmount"
                  {...form.register("depositAmount")}
                  placeholder="Deposit amount"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="beaconTellerNumber">Beacon Teller Number</Label>
                <Input
                  id="beaconTellerNumber"
                  {...form.register("beaconTellerNumber")}
                  placeholder="Beacon teller number"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="beaconAmount">Beacon Amount</Label>
                <Input
                  id="beaconAmount"
                  {...form.register("beaconAmount")}
                  placeholder="Beacon amount"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* File Upload */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Document Upload
            </CardTitle>
            <CardDescription>
              Upload supporting documents (PDF, Images, KML, DXF, DWG files)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <Upload className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <div className="space-y-2">
                <Label
                  htmlFor="file-upload"
                  className="cursor-pointer text-sm font-medium text-blue-600 hover:text-blue-500"
                >
                  Click to upload files
                </Label>
                <Input
                  id="file-upload"
                  type="file"
                  multiple
                  accept=".pdf,.jpg,.jpeg,.png,.kml,.dxf,.dwg"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <p className="text-xs text-gray-500">
                  Supported formats: PDF, JPG, PNG, KML, DXF, DWG (max 10MB
                  each)
                </p>
              </div>
            </div>

            {files.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium">Uploaded Files</h4>
                {files.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium">{file.file.name}</p>
                        <p className="text-xs text-gray-500">
                          {(file.file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {file.uploaded ? (
                        <Badge variant="secondary">Uploaded</Badge>
                      ) : (
                        <Progress value={file.progress} className="w-20" />
                      )}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(index)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Submit */}
        <div className="flex justify-end space-x-4">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Submitting..." : "Submit Survey Job"}
          </Button>
        </div>

        {isSubmitting && uploadProgress > 0 && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Upload Progress</span>
              <span>{uploadProgress}%</span>
            </div>
            <Progress value={uploadProgress} />
          </div>
        )}
      </form>
    </div>
  );
}
