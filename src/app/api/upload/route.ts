import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { put } from "@vercel/blob";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Check file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "File too large" }, { status: 400 });
    }

    // Check file type and support new formats
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
      // New CAD and GIS file formats
      "application/vnd.google-earth.kml+xml", // KML files
      "application/dxf", // DXF files
      "application/dwg", // DWG files
      "application/octet-stream", // Catch-all for binary files like DWG
    ];

    // Additional file extension check for binary formats
    const fileExtension = file.name.split(".").pop()?.toLowerCase();
    const allowedExtensions = [
      "pdf",
      "jpg",
      "jpeg",
      "png",
      "tiff",
      "docx",
      "doc",
      "csv",
      "xls",
      "xlsx",
      "kml",
      "dxf",
      "dwg",
    ];

    if (
      !allowedTypes.includes(file.type) &&
      !allowedExtensions.includes(fileExtension || "")
    ) {
      return NextResponse.json(
        {
          error: `Invalid file type. Supported formats: ${allowedExtensions.join(", ").toUpperCase()}`,
        },
        { status: 400 }
      );
    }

    // Generate unique filename
    const timestamp = Date.now();
    const filename = `${timestamp}-${file.name}`;

    // Upload to Vercel Blob
    const blob = await put(filename, file, {
      access: "public",
    });

    return NextResponse.json({
      url: blob.url,
      filename: filename,
      size: file.size,
      type: file.type,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
