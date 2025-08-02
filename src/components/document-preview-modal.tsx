"use client";

import { useState } from "react";
import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, X, FileText, Image as ImageIcon } from "lucide-react";

interface DocumentPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: {
    id: string;
    fileName: string;
    filePath: string;
    mimeType: string;
    fileSize: number;
    documentType: string;
  };
}

export function DocumentPreviewModal({
  isOpen,
  onClose,
  document,
}: DocumentPreviewModalProps) {
  const [isLoading, setIsLoading] = useState(true);

  const handleDownload = async () => {
    try {
      const response = await fetch(`/api/documents/${document.id}/download`);
      if (response.ok) {
        // For Vercel Blob URLs, the API redirects to the file
        window.open(`/api/documents/${document.id}/download`, "_blank");
      } else {
        console.error("Download failed");
      }
    } catch (error) {
      console.error("Download error:", error);
    }
  };

  const canPreview = () => {
    return (
      document.mimeType.startsWith("image/") ||
      document.mimeType === "application/pdf"
    );
  };

  const renderPreview = () => {
    if (!canPreview()) {
      return (
        <div className="flex flex-col items-center justify-center h-96 bg-gray-50 rounded-lg">
          <FileText className="h-16 w-16 text-gray-400 mb-4" />
          <p className="text-gray-600 text-center">
            Preview not available for this file type
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Click download to view the file
          </p>
        </div>
      );
    }

    if (document.mimeType.startsWith("image/")) {
      return (
        <div className="relative">
          <img
            src={document.filePath}
            alt={document.fileName}
            className="max-w-full max-h-96 mx-auto rounded-lg"
            onLoad={() => setIsLoading(false)}
            onError={() => setIsLoading(false)}
          />
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-50 rounded-lg">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          )}
        </div>
      );
    }

    if (document.mimeType === "application/pdf") {
      return (
        <div className="h-96 w-full">
          <iframe
            src={`${document.filePath}#toolbar=0`}
            className="w-full h-full rounded-lg border"
            onLoad={() => setIsLoading(false)}
            title={document.fileName}
          />
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-50 rounded-lg">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          )}
        </div>
      );
    }

    return null;
  };

  const formatFileSize = (bytes: number) => {
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(2)} MB`;
  };

  const formatDocumentType = (type: string) => {
    return type
      .replace(/_/g, " ")
      .toLowerCase()
      .replace(/\b\w/g, (l) => l.toUpperCase());
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-lg font-semibold">
                {document.fileName}
              </DialogTitle>
              <DialogDescription className="mt-1">
                {formatDocumentType(document.documentType)} •{" "}
                {formatFileSize(document.fileSize)}
              </DialogDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={handleDownload} size="sm">
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="mt-4">{renderPreview()}</div>

        {!canPreview() && (
          <div className="flex justify-center mt-4">
            <Button onClick={handleDownload} className="w-full max-w-xs">
              <Download className="h-4 w-4 mr-2" />
              Download {document.fileName}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
