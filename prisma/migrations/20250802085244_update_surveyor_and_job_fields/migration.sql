-- CreateEnum
CREATE TYPE "Role" AS ENUM ('SURVEYOR', 'NIS_OFFICER', 'ADMIN', 'PUBLIC');

-- CreateEnum
CREATE TYPE "SurveyorStatus" AS ENUM ('PENDING', 'VERIFIED', 'SUSPENDED', 'REJECTED');

-- CreateEnum
CREATE TYPE "JobStatus" AS ENUM ('SUBMITTED', 'NIS_REVIEW', 'NIS_APPROVED', 'NIS_REJECTED', 'ADMIN_REVIEW', 'ADMIN_APPROVED', 'ADMIN_REJECTED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "DocumentType" AS ENUM ('SURVEY_PLAN', 'SURVEY_REPORT', 'COORDINATES', 'LEGAL_DOCS', 'KML_FILE', 'DXF_FILE', 'DWG_FILE', 'OTHER');

-- CreateEnum
CREATE TYPE "StepStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'REJECTED');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'SURVEYOR',
    "emailVerified" TIMESTAMP(3),
    "image" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "surveyors" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "nisMembershipNumber" TEXT NOT NULL,
    "surconRegistrationNumber" TEXT NOT NULL,
    "firmName" TEXT,
    "phoneNumber" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "status" "SurveyorStatus" NOT NULL DEFAULT 'PENDING',
    "verifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "surveyors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "survey_jobs" (
    "id" TEXT NOT NULL,
    "jobNumber" TEXT NOT NULL,
    "clientName" TEXT NOT NULL,
    "clientEmail" TEXT,
    "clientPhone" TEXT,
    "location" TEXT NOT NULL,
    "coordinates" JSONB,
    "description" TEXT,
    "status" "JobStatus" NOT NULL DEFAULT 'SUBMITTED',
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "stampReference" TEXT,
    "totalAmount" TEXT DEFAULT '₦301,400',
    "planNumber" TEXT,
    "depositTellerNumber" TEXT DEFAULT 'e-payment',
    "depositAmount" TEXT DEFAULT '₦300,000',
    "beaconTellerNumber" TEXT DEFAULT 'e-payment',
    "beaconAmount" TEXT DEFAULT '₦1,400',
    "titleHolderName" TEXT,
    "pillarNumbersRequired" INTEGER,
    "cumulativePillarsQuarter" INTEGER,
    "cumulativePillarsYear" INTEGER,
    "eastingCoordinates" TEXT,
    "northingCoordinates" TEXT,
    "areaSqm" TEXT,
    "surveyorName" TEXT,
    "referenceNumber" TEXT,
    "dateApproved" TIMESTAMP(3),
    "surveyorId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "survey_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pillar_numbers" (
    "id" TEXT NOT NULL,
    "pillarNumber" TEXT NOT NULL,
    "coordinates" JSONB NOT NULL,
    "issuedDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "surveyJobId" TEXT NOT NULL,
    "surveyorId" TEXT NOT NULL,

    CONSTRAINT "pillar_numbers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "documents" (
    "id" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "mimeType" TEXT NOT NULL,
    "documentType" "DocumentType" NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "surveyJobId" TEXT NOT NULL,

    CONSTRAINT "documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workflow_steps" (
    "id" TEXT NOT NULL,
    "stepName" TEXT NOT NULL,
    "status" "StepStatus" NOT NULL DEFAULT 'PENDING',
    "completedAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "surveyJobId" TEXT NOT NULL,

    CONSTRAINT "workflow_steps_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "surveyors_userId_key" ON "surveyors"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "surveyors_nisMembershipNumber_key" ON "surveyors"("nisMembershipNumber");

-- CreateIndex
CREATE UNIQUE INDEX "surveyors_surconRegistrationNumber_key" ON "surveyors"("surconRegistrationNumber");

-- CreateIndex
CREATE UNIQUE INDEX "survey_jobs_jobNumber_key" ON "survey_jobs"("jobNumber");

-- CreateIndex
CREATE UNIQUE INDEX "pillar_numbers_pillarNumber_key" ON "pillar_numbers"("pillarNumber");

-- AddForeignKey
ALTER TABLE "surveyors" ADD CONSTRAINT "surveyors_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "survey_jobs" ADD CONSTRAINT "survey_jobs_surveyorId_fkey" FOREIGN KEY ("surveyorId") REFERENCES "surveyors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "survey_jobs" ADD CONSTRAINT "survey_jobs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pillar_numbers" ADD CONSTRAINT "pillar_numbers_surveyJobId_fkey" FOREIGN KEY ("surveyJobId") REFERENCES "survey_jobs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pillar_numbers" ADD CONSTRAINT "pillar_numbers_surveyorId_fkey" FOREIGN KEY ("surveyorId") REFERENCES "surveyors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_surveyJobId_fkey" FOREIGN KEY ("surveyJobId") REFERENCES "survey_jobs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow_steps" ADD CONSTRAINT "workflow_steps_surveyJobId_fkey" FOREIGN KEY ("surveyJobId") REFERENCES "survey_jobs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
