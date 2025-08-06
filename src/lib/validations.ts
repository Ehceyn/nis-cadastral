import { z } from "zod";

// Helper to transform empty strings to undefined for optional fields
const optionalString = z
  .string()
  .transform((val) => (val === "" ? undefined : val))
  .optional();

export const surveyJobSchema = z.object({
  clientName: z.string().min(2, "Client name is required"),
  clientEmail: z
    .string()
    .email("Valid email is required")
    .transform((val) => (val === "" ? undefined : val))
    .optional(),
  clientPhone: z.string().min(10, "Valid phone number is required"),
  location: z.string().min(5, "Location is required"),
  description: optionalString,
  coordinates: z
    .object({
      latitude: z.number().min(-90).max(90),
      longitude: z.number().min(-180).max(180),
    })
    .optional(),
  // Enhanced Survey Details Fields
  stampReference: optionalString,
  totalAmount: optionalString,
  planNumber: optionalString,
  depositTellerNumber: optionalString,
  depositAmount: optionalString,
  beaconTellerNumber: optionalString,
  beaconAmount: optionalString,
  titleHolderName: optionalString,
  pillarNumbersRequired: z.number().optional(),
  cumulativePillarsQuarter: z.number().optional(),
  cumulativePillarsYear: z.number().optional(),
  eastingCoordinates: optionalString,
  northingCoordinates: optionalString,
  areaSqm: optionalString,
});

export const surveyorRegistrationSchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Valid email is required"),
  nisMembershipNumber: z.string().min(1, "NIS membership number is required"),
  surconRegistrationNumber: z
    .string()
    .min(1, "SURCON registration number is required"),
  firmName: z.string().optional(),
  phoneNumber: z.string().min(10, "Valid phone number is required"),
  address: z.string().min(10, "Address is required"),
});

export const pillarSearchSchema = z.object({
  pillarNumber: z.string().min(1, "Pillar number is required"),
});
