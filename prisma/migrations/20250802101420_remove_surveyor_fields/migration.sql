/*
  Warnings:

  - You are about to drop the column `referenceNumber` on the `survey_jobs` table. All the data in the column will be lost.
  - You are about to drop the column `surveyorName` on the `survey_jobs` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "survey_jobs" DROP COLUMN "referenceNumber",
DROP COLUMN "surveyorName",
ALTER COLUMN "totalAmount" DROP DEFAULT,
ALTER COLUMN "depositTellerNumber" DROP DEFAULT,
ALTER COLUMN "depositAmount" DROP DEFAULT,
ALTER COLUMN "beaconTellerNumber" DROP DEFAULT,
ALTER COLUMN "beaconAmount" DROP DEFAULT;
