import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get("q")

    if (!query) {
      return NextResponse.json({ message: "Search query is required" }, { status: 400 })
    }

    const pillar = await prisma.pillarNumber.findUnique({
      where: { pillarNumber: query },
      include: {
        surveyor: {
          include: {
            user: true,
          },
        },
        surveyJob: true,
      },
    })

    if (!pillar) {
      return NextResponse.json(null)
    }

    const result = {
      pillarNumber: pillar.pillarNumber,
      coordinates: pillar.coordinates,
      issuedDate: pillar.issuedDate,
      surveyor: {
        name: pillar.surveyor.user.name,
        firmName: pillar.surveyor.firmName,
        licenseNumber: pillar.surveyor.licenseNumber,
      },
      surveyJob: {
        location: pillar.surveyJob.location,
        clientName: pillar.surveyJob.clientName,
        status: pillar.surveyJob.status,
      },
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error("Search error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
