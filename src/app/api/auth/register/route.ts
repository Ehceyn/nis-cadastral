import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { surveyorRegistrationSchema } from "@/lib/validations"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = surveyorRegistrationSchema.parse(body)

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email },
    })

    if (existingUser) {
      return NextResponse.json({ message: "User already exists" }, { status: 400 })
    }

    // Check if license number already exists
    const existingSurveyor = await prisma.surveyor.findUnique({
      where: { licenseNumber: validatedData.licenseNumber },
    })

    if (existingSurveyor) {
      return NextResponse.json({ message: "License number already registered" }, { status: 400 })
    }

    // Create user and surveyor
    const user = await prisma.user.create({
      data: {
        name: validatedData.name,
        email: validatedData.email,
        role: "SURVEYOR",
        surveyor: {
          create: {
            licenseNumber: validatedData.licenseNumber,
            firmName: validatedData.firmName,
            phoneNumber: validatedData.phoneNumber,
            address: validatedData.address,
            status: "PENDING",
          },
        },
      },
      include: {
        surveyor: true,
      },
    })

    return NextResponse.json({
      message: "Registration successful",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    })
  } catch (error) {
    console.error("Registration error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
