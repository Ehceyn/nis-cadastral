"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  FileText,
  Download,
  Eye,
  Image as ImageIcon,
  FileIcon,
} from "lucide-react";
import { DocumentPreviewModal } from "@/components/document-preview-modal";

interface Document {
  id: string;
  fileName: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  documentType: string;
}

interface DocumentsSectionProps {
  documents: Document[];
}

export function DocumentsSection({ documents }: DocumentsSectionProps) {
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(
    null
  );
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const handleDownload = async (documentId: string) => {
    try {
      window.open(`/api/documents/${documentId}/download`, "_blank");
    } catch (error) {
      console.error("Download error:", error);
    }
  };

  const handlePreview = (document: Document) => {
    setSelectedDocument(document);
    setIsPreviewOpen(true);
  };

  const canPreview = (mimeType: string) => {
    return mimeType.startsWith("image/") || mimeType === "application/pdf";
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith("image/")) {
      return <ImageIcon className="h-5 w-5 text-blue-500" />;
    }
    if (mimeType === "application/pdf") {
      return <FileText className="h-5 w-5 text-red-500" />;
    }
    return <FileIcon className="h-5 w-5 text-gray-400" />;
  };

  const formatFileSize = (bytes: number) => {
    return (bytes / 1024 / 1024).toFixed(2);
  };

  const formatDocumentType = (type: string) => {
    return type.replace("_", " ");
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Documents ({documents.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {documents.length === 0 ? (
            <p className="text-gray-500">No documents uploaded</p>
          ) : (
            <div className="space-y-3">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex items-center space-x-3">
                    {getFileIcon(doc.mimeType)}
                    <div>
                      <p className="font-medium">{doc.fileName}</p>
                      <p className="text-sm text-gray-500">
                        {formatDocumentType(doc.documentType)} •{" "}
                        {formatFileSize(doc.fileSize)} MB
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {canPreview(doc.mimeType) && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handlePreview(doc)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDownload(doc.id)}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {selectedDocument && (
        <DocumentPreviewModal
          isOpen={isPreviewOpen}
          onClose={() => {
            setIsPreviewOpen(false);
            setSelectedDocument(null);
          }}
          document={selectedDocument}
        />
      )}
    </>
  );
}
