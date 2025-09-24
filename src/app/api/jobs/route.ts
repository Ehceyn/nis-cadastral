import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { surveyJobSchema } from "@/lib/validations";
import { Prisma } from "@prisma/client";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Extract query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";
    const dateFrom = searchParams.get("dateFrom") || "";
    const dateTo = searchParams.get("dateTo") || "";
    const sortBy = searchParams.get("sortBy") || "submittedAt";
    const sortOrder = searchParams.get("sortOrder") || "desc";

    // Build where clause
    const where: Prisma.SurveyJobWhereInput = {
      userId: session.user.id,
    };

    // Add search filter
    if (search) {
      where.OR = [
        { jobNumber: { contains: search, mode: "insensitive" } },
        { clientName: { contains: search, mode: "insensitive" } },
        { location: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { planNumber: { contains: search, mode: "insensitive" } },
        { titleHolderName: { contains: search, mode: "insensitive" } },
      ];
    }

    // Add status filter
    if (status) {
      where.status = status as any;
    }

    // Add date range filter
    if (dateFrom || dateTo) {
      where.submittedAt = {};
      if (dateFrom) {
        where.submittedAt.gte = new Date(dateFrom);
      }
      if (dateTo) {
        const endDate = new Date(dateTo);
        endDate.setHours(23, 59, 59, 999);
        where.submittedAt.lte = endDate;
      }
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Get total count for pagination
    const totalCount = await prisma.surveyJob.count({ where });

    // Get jobs with filters and pagination
    const jobs = await prisma.surveyJob.findMany({
      where,
      include: {
        surveyor: {
          include: {
            user: true,
          },
        },
        documents: true,
        workflowSteps: true,
        pillarNumbers: true,
      },
      orderBy: {
        [sortBy]: sortOrder as any,
      },
      skip,
      take: limit,
    });

    // Calculate pagination metadata
    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return NextResponse.json({
      jobs,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        hasNextPage,
        hasPrevPage,
        limit,
      },
      filters: {
        search,
        status,
        dateFrom,
        dateTo,
        sortBy,
        sortOrder,
      },
    });
  } catch (error) {
    console.error("Jobs fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch jobs" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { documents, ...jobData } = body;

    // Validate job data
    const validatedData = surveyJobSchema.parse(jobData);

    // Get surveyor info
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { surveyor: true },
    });

    if (!user?.surveyor) {
      return NextResponse.json(
        { error: "Surveyor profile not found" },
        { status: 400 }
      );
    }

    if (user.surveyor.status !== "VERIFIED") {
      return NextResponse.json(
        { error: "Surveyor not verified" },
        { status: 400 }
      );
    }

    // Generate job number
    const jobCount = await prisma.surveyJob.count();
    const jobNumber = `JOB-${new Date().getFullYear()}-${String(jobCount + 1).padStart(3, "0")}`;

    // Normalize incoming documents: support both array of objects and array of URL strings
    const incomingDocs = Array.isArray(documents) ? documents : [];

    // Map filename extensions to Prisma DocumentType and mime types.
    // Return Prisma enum name strings that match the `DocumentType` enum in schema.prisma
    const guessDocumentType = (filename: string | null): string => {
      if (!filename) return "OTHER";
      const ext = filename.split(".").pop()?.toLowerCase();
      switch (ext) {
        case "kml":
          return "KML_FILE";
        case "dxf":
          return "DXF_FILE";
        case "dwg":
          return "DWG_FILE";
        case "pdf":
          return "SURVEY_PLAN";
        case "jpg":
        case "jpeg":
        case "png":
          return "OTHER";
        default:
          return "OTHER";
      }
    };

    const guessMimeType = (filename: string | null) => {
      if (!filename) return "application/octet-stream";
      const ext = filename.split(".").pop()?.toLowerCase();
      switch (ext) {
        case "pdf":
          return "application/pdf";
        case "kml":
          return "application/vnd.google-earth.kml+xml";
        case "dxf":
          return "application/dxf";
        case "dwg":
          return "application/dwg";
        case "jpg":
        case "jpeg":
          return "image/jpeg";
        case "png":
          return "image/png";
        default:
          return "application/octet-stream";
      }
    };

    const documentsToCreate = incomingDocs.map((doc: any) => {
      // If the client already sent a full document object, use its values (with safe fallbacks)
      if (
        doc &&
        typeof doc === "object" &&
        (doc.filePath || doc.fileName || doc.url)
      ) {
        const filePath = (doc.filePath || doc.url || "").toString();
        const fileName = (
          doc.fileName ||
          (filePath ? filePath.split("/").pop() : null) ||
          "unknown"
        ).toString();
        const fileSize =
          typeof doc.fileSize === "number" ? Math.floor(doc.fileSize) : 0;
        const mimeType = (doc.mimeType || guessMimeType(fileName)).toString();

        return {
          fileName,
          filePath,
          fileSize,
          mimeType,
          documentType: doc.documentType || guessDocumentType(fileName),
        };
      }

      // If the client sent a string (URL), convert it into the expected shape
      if (typeof doc === "string") {
        let filePath = doc;
        let fileName: string | null = null;
        try {
          const parsed = new URL(doc);
          filePath = parsed.href;
          fileName = parsed.pathname.split("/").pop() || null;
        } catch (e) {
          // Not a valid URL — treat string as a path
          fileName = doc.split("/").pop() || doc;
        }

        const finalFileName = (fileName || "unknown").toString();
        const mimeType = guessMimeType(finalFileName);

        return {
          fileName: finalFileName,
          filePath: filePath.toString(),
          fileSize: 0,
          mimeType,
          documentType: guessDocumentType(finalFileName),
        };
      }

      // Fallback for unexpected shapes - provide safe defaults so Prisma won't error
      return {
        fileName: "unknown",
        filePath: "",
        fileSize: 0,
        mimeType: "application/octet-stream",
        documentType: "OTHER",
      };
    });

    // Create survey job with documents
    const surveyJob = await prisma.surveyJob.create({
      data: {
        jobNumber,
        clientName: validatedData.clientName,
        clientEmail: validatedData.clientEmail || null,
        clientPhone: validatedData.clientPhone,
        location: validatedData.location,
        description: validatedData.description || null,
        coordinates: validatedData.coordinates
          ? (validatedData.coordinates as Prisma.InputJsonValue)
          : Prisma.JsonNull,
        // Store requested coordinates from the form
        requestedCoordinates:
          validatedData.pillarCoordinates as Prisma.InputJsonValue,
        // Enhanced Survey Details Fields
        stampReference: validatedData.stampReference || null,
        totalAmount: validatedData.totalAmount || null,
        // planNumber now assigned by admin during pillar issuance - not from form
        depositTellerNumber: validatedData.depositTellerNumber || null,
        depositAmount: validatedData.depositAmount || null,
        beaconTellerNumber: validatedData.beaconTellerNumber || null,
        beaconAmount: validatedData.beaconAmount || null,
        titleHolderName: validatedData.titleHolderName || null,
        pillarNumbersRequired: validatedData.pillarCoordinates.length, // Use coordinate count
        cumulativePillarsQuarter:
          validatedData.cumulativePillarsQuarter || null,
        cumulativePillarsYear: validatedData.cumulativePillarsYear || null,
        areaSqm: validatedData.areaSqm || null,
        status: "NIS_REVIEW", // Start with NIS review
        userId: session.user.id,
        surveyorId: user.surveyor.id,
        documents: {
          create: documentsToCreate,
        },
        workflowSteps: {
          create: [
            {
              stepName: "Submitted",
              status: "COMPLETED",
              completedAt: new Date(),
              notes: "Job submitted by surveyor",
            },
            {
              stepName: "NIS Review",
              status: "PENDING",
            },
            {
              stepName: "Admin Review",
              status: "PENDING",
            },
            {
              stepName: "Pillar Number Assignment",
              status: "PENDING",
            },
            {
              stepName: "Blue Copy Upload",
              status: "PENDING",
            },
            {
              stepName: "R of O Document Upload",
              status: "PENDING",
            },
            {
              stepName: "Completed",
              status: "PENDING",
            },
          ],
        },
      },
      include: {
        documents: true,
        workflowSteps: true,
      },
    });

    return NextResponse.json({
      message: "Job submitted successfully",
      jobNumber: surveyJob.jobNumber,
      jobId: surveyJob.id,
    });
  } catch (error) {
    console.error("Job submission error:", error);
    return NextResponse.json(
      { error: "Failed to submit job" },
      { status: 500 }
    );
  }
}
