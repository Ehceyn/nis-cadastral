import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get the document from database
    const document = await prisma.document.findUnique({
      where: { id: params.id },
      include: {
        surveyJob: true,
      },
    });

    if (!document) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 }
      );
    }

    // Check if user has access to this document
    // Users can access documents if they own the job or are NIS/ADMIN
    const hasAccess =
      document.surveyJob.userId === session.user.id ||
      session.user.role === "NIS_OFFICER" ||
      session.user.role === "ADMIN";

    if (!hasAccess) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // If filePath is a Vercel Blob URL, redirect to it
    if (document.filePath.startsWith("https://")) {
      return NextResponse.redirect(document.filePath);
    }

    // If it's a relative path or other format, handle appropriately
    return NextResponse.json({ error: "File not accessible" }, { status: 404 });
  } catch (error) {
    console.error("Download error:", error);
    return NextResponse.json({ error: "Download failed" }, { status: 500 });
  }
}
