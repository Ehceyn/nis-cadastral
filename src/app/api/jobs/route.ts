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
        // Enhanced Survey Details Fields
        stampReference: validatedData.stampReference || null,
        totalAmount: validatedData.totalAmount || null,
        planNumber: validatedData.planNumber || null,
        depositTellerNumber: validatedData.depositTellerNumber || null,
        depositAmount: validatedData.depositAmount || null,
        beaconTellerNumber: validatedData.beaconTellerNumber || null,
        beaconAmount: validatedData.beaconAmount || null,
        titleHolderName: validatedData.titleHolderName || null,
        pillarNumbersRequired: validatedData.pillarNumbersRequired || null,
        cumulativePillarsQuarter:
          validatedData.cumulativePillarsQuarter || null,
        cumulativePillarsYear: validatedData.cumulativePillarsYear || null,
        eastingCoordinates: validatedData.eastingCoordinates || null,
        northingCoordinates: validatedData.northingCoordinates || null,
        areaSqm: validatedData.areaSqm || null,
        userId: session.user.id,
        surveyorId: user.surveyor.id,
        documents: {
          create: documents.map((doc: any) => ({
            fileName: doc.fileName,
            filePath: doc.filePath,
            fileSize: doc.fileSize,
            mimeType: doc.mimeType,
            documentType: doc.documentType,
          })),
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
