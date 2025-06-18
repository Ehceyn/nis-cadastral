"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Upload, X, FileText, MapPin, User, Phone, Mail } from "lucide-react"
import { toast } from "sonner"

const jobSubmissionSchema = z.object({
  clientName: z.string().min(2, "Client name is required"),
  clientEmail: z.string().email("Valid email is required").optional().or(z.literal("")),
  clientPhone: z.string().min(10, "Valid phone number is required"),
  location: z.string().min(5, "Location is required"),
  description: z.string().optional(),
  coordinates: z
    .object({
      latitude: z.number().min(-90).max(90),
      longitude: z.number().min(-180).max(180),
    })
    .optional(),
})

type JobSubmissionData = z.infer<typeof jobSubmissionSchema>

interface FileUpload {
  file: File
  type: string
  progress: number
  uploaded: boolean
  url?: string
}

export function JobSubmissionForm() {
  const [files, setFiles] = useState<FileUpload[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const router = useRouter()

  const form = useForm<JobSubmissionData>({
    resolver: zodResolver(jobSubmissionSchema),
    defaultValues: {
      clientName: "",
      clientEmail: "",
      clientPhone: "",
      location: "",
      description: "",
    },
  })

  const documentTypes = [
    { value: "SURVEY_PLAN", label: "Survey Plan" },
    { value: "SURVEY_REPORT", label: "Survey Report" },
    { value: "COORDINATES", label: "Coordinates File" },
    { value: "LEGAL_DOCS", label: "Legal Documents" },
    { value: "OTHER", label: "Other" },
  ]

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || [])

    selectedFiles.forEach((file) => {
      // Check file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`${file.name} is larger than 10MB`)
        return
      }

      // Check file type
      const allowedTypes = [
        "application/pdf",
        "image/jpeg",
        "image/png",
        "image/tiff",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/msword",
        "text/csv",
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      ]

      if (!allowedTypes.includes(file.type)) {
        toast.error(`${file.name} is not a supported file type`)
        return
      }

      const newFile: FileUpload = {
        file,
        type: "OTHER",
        progress: 0,
        uploaded: false,
      }

      setFiles((prev) => [...prev, newFile])
    })

    // Reset input
    event.target.value = ""
  }

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const updateFileType = (index: number, type: string) => {
    setFiles((prev) => prev.map((file, i) => (i === index ? { ...file, type } : file)))
  }

  const uploadFile = async (file: File, onProgress: (progress: number) => void): Promise<string> => {
    const formData = new FormData()
    formData.append("file", file)

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest()

      xhr.upload.addEventListener("progress", (event) => {
        if (event.lengthComputable) {
          const progress = (event.loaded / event.total) * 100
          onProgress(progress)
        }
      })

      xhr.addEventListener("load", () => {
        if (xhr.status === 200) {
          const response = JSON.parse(xhr.responseText)
          resolve(response.url)
        } else {
          reject(new Error("Upload failed"))
        }
      })

      xhr.addEventListener("error", () => {
        reject(new Error("Upload failed"))
      })

      xhr.open("POST", "/api/upload")
      xhr.send(formData)
    })
  }

  const uploadAllFiles = async () => {
    const uploadPromises = files.map(async (fileUpload, index) => {
      if (fileUpload.uploaded) return fileUpload.url

      try {
        const url = await uploadFile(fileUpload.file, (progress) => {
          setFiles((prev) => prev.map((f, i) => (i === index ? { ...f, progress } : f)))
        })

        setFiles((prev) => prev.map((f, i) => (i === index ? { ...f, uploaded: true, url, progress: 100 } : f)))

        return url
      } catch (error) {
        toast.error(`Failed to upload ${fileUpload.file.name}`)
        throw error
      }
    })

    return Promise.all(uploadPromises)
  }

  const onSubmit = async (data: JobSubmissionData) => {
    if (files.length === 0) {
      toast.error("Please upload at least one document")
      return
    }

    setIsSubmitting(true)
    setUploadProgress(0)

    try {
      // Upload files first
      setUploadProgress(25)
      const fileUrls = await uploadAllFiles()
      setUploadProgress(75)

      // Prepare documents data
      const documents = files.map((fileUpload, index) => ({
        fileName: fileUpload.file.name,
        filePath: fileUrls[index],
        fileSize: fileUpload.file.size,
        mimeType: fileUpload.file.type,
        documentType: fileUpload.type,
      }))

      // Submit job
      const response = await fetch("/api/jobs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...data,
          documents,
        }),
      })

      setUploadProgress(100)

      if (response.ok) {
        const result = await response.json()
        toast.success(`Job number: ${result.jobNumber}`)
        router.push("/dashboard/jobs")
      } else {
        const error = await response.json()
        toast.error(error.message || "An error occurred")
      }
    } catch (error) {
      toast.error("An unexpected error occurred")
    } finally {
      setIsSubmitting(false)
      setUploadProgress(0)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Submit New Survey Job</h1>
        <p className="text-gray-600 mt-2">Fill out the form below to submit a new cadastral survey job</p>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        {/* Client Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Client Information
            </CardTitle>
            <CardDescription>Details about the client requesting the survey</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="clientName">Client Name *</Label>
                <Input id="clientName" placeholder="Enter client's full name" {...form.register("clientName")} />
                {form.formState.errors.clientName && (
                  <p className="text-sm text-red-600">{form.formState.errors.clientName.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="clientPhone">Phone Number *</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="clientPhone"
                    placeholder="Enter phone number"
                    className="pl-10"
                    {...form.register("clientPhone")}
                  />
                </div>
                {form.formState.errors.clientPhone && (
                  <p className="text-sm text-red-600">{form.formState.errors.clientPhone.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="clientEmail">Email Address (Optional)</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="clientEmail"
                  type="email"
                  placeholder="Enter email address"
                  className="pl-10"
                  {...form.register("clientEmail")}
                />
              </div>
              {form.formState.errors.clientEmail && (
                <p className="text-sm text-red-600">{form.formState.errors.clientEmail.message}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Survey Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Survey Details
            </CardTitle>
            <CardDescription>Information about the survey location and requirements</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="location">Survey Location *</Label>
              <Textarea
                id="location"
                placeholder="Enter detailed location description (e.g., Plot 123, Block A, New Layout, Port Harcourt, Rivers State)"
                {...form.register("location")}
              />
              {form.formState.errors.location && (
                <p className="text-sm text-red-600">{form.formState.errors.location.message}</p>
              )}
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="latitude">Latitude (Optional)</Label>
                <Input
                  id="latitude"
                  type="number"
                  step="any"
                  placeholder="e.g., 4.8156"
                  {...form.register("coordinates.latitude", { valueAsNumber: true })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="longitude">Longitude (Optional)</Label>
                <Input
                  id="longitude"
                  type="number"
                  step="any"
                  placeholder="e.g., 7.0498"
                  {...form.register("coordinates.longitude", { valueAsNumber: true })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Additional Description (Optional)</Label>
              <Textarea
                id="description"
                placeholder="Any additional information about the survey requirements"
                {...form.register("description")}
              />
            </div>
          </CardContent>
        </Card>

        {/* Document Upload */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Document Upload
            </CardTitle>
            <CardDescription>
              Upload survey plans, reports, and other relevant documents (Max 10MB per file)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* File Upload Area */}
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
              <Upload className="mx-auto h-12 w-12 text-gray-400" />
              <div className="mt-4">
                <Label htmlFor="file-upload" className="cursor-pointer">
                  <span className="mt-2 block text-sm font-medium text-gray-900">
                    Click to upload files or drag and drop
                  </span>
                  <span className="mt-1 block text-sm text-gray-500">
                    PDF, DOC, DOCX, JPG, PNG, TIFF, CSV, XLS, XLSX up to 10MB
                  </span>
                </Label>
                <Input
                  id="file-upload"
                  type="file"
                  multiple
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.tiff,.csv,.xls,.xlsx"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>
            </div>

            {/* File List */}
            {files.length > 0 && (
              <div className="space-y-3">
                <h4 className="font-medium">Uploaded Files</h4>
                {files.map((fileUpload, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-3">
                        <FileText className="h-5 w-5 text-gray-400 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{fileUpload.file.name}</p>
                          <p className="text-sm text-gray-500">{(fileUpload.file.size / 1024 / 1024).toFixed(2)} MB</p>
                        </div>
                      </div>

                      {fileUpload.progress > 0 && fileUpload.progress < 100 && (
                        <div className="mt-2">
                          <Progress value={fileUpload.progress} className="h-2" />
                        </div>
                      )}
                    </div>

                    <div className="flex items-center space-x-2 ml-4">
                      <Select value={fileUpload.type} onValueChange={(value) => updateFileType(index, value)}>
                        <SelectTrigger className="w-40">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {documentTypes.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      {fileUpload.uploaded && (
                        <Badge variant="secondary" className="bg-green-100 text-green-800">
                          Uploaded
                        </Badge>
                      )}

                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(index)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Submit Button */}
        <div className="flex justify-end space-x-4">
          <Button type="button" variant="outline" onClick={() => router.back()} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting || files.length === 0}>
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Submitting...
              </>
            ) : (
              "Submit Survey Job"
            )}
          </Button>
        </div>

        {/* Progress Bar */}
        {isSubmitting && uploadProgress > 0 && (
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Submitting job...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <Progress value={uploadProgress} className="h-2" />
              </div>
            </CardContent>
          </Card>
        )}
      </form>
    </div>
  )
}
