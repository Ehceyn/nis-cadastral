import { type NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { surveyorRegistrationSchema } from "@/lib/validations";
import bcrypt from "bcryptjs";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = surveyorRegistrationSchema.parse(body);

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email },
    });

    if (existingUser) {
      return NextResponse.json(
        { message: "User already exists" },
        { status: 400 }
      );
    }

    // Check if NIS membership number already exists
    const existingNIS = await prisma.surveyor.findUnique({
      where: { nisMembershipNumber: validatedData.nisMembershipNumber },
    });

    if (existingNIS) {
      return NextResponse.json(
        { message: "NIS membership number already registered" },
        { status: 400 }
      );
    }

    // Check if SURCON registration number already exists
    const existingSURCON = await prisma.surveyor.findUnique({
      where: {
        surconRegistrationNumber: validatedData.surconRegistrationNumber,
      },
    });

    if (existingSURCON) {
      return NextResponse.json(
        { message: "SURCON registration number already registered" },
        { status: 400 }
      );
    }

    // Create user and surveyor
    const passwordHash = await bcrypt.hash(validatedData.password, 10);

    const user = await prisma.user.create({
      data: {
        name: validatedData.name,
        email: validatedData.email,
        passwordHash,
        role: "SURVEYOR",
        surveyor: {
          create: {
            nisMembershipNumber: validatedData.nisMembershipNumber,
            surconRegistrationNumber: validatedData.surconRegistrationNumber,
            firmName: validatedData.firmName,
            phoneNumber: validatedData.phoneNumber,
            address: validatedData.address,
            status: "PENDING_NIS_REVIEW",
          },
        },
      },
      include: {
        surveyor: true,
      },
    });

    return NextResponse.json({
      message: "Registration successful",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error: any) {
    console.error("Registration error:", error);

    // Check if it's a validation error
    if (error?.name === "ZodError") {
      return NextResponse.json(
        {
          message: "Validation error",
          errors: error.errors.map((err: any) => ({
            field: err.path.join("."),
            message: err.message,
          })),
        },
        { status: 400 }
      );
    }

    // Check if it's a database constraint error
    if (error?.code === "P2002") {
      return NextResponse.json(
        { message: "A record with this information already exists" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
