import { z } from "zod";

// Helper to transform empty strings to undefined for optional fields
const optionalString = z
  .string()
  .transform((val) => (val === "" ? undefined : val))
  .optional();

export const coordinateSchema = z.object({
  easting: z.string().min(1, "Easting coordinate is required"),
  northing: z.string().min(1, "Northing coordinate is required"),
});

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
  // Pillar coordinates - array of coordinate pairs
  pillarCoordinates: z
    .array(coordinateSchema)
    .min(1, "At least one coordinate is required"),
  // Enhanced Survey Details Fields
  stampReference: optionalString,
  totalAmount: optionalString,
  // planNumber removed from request form - now assigned by admin
  depositTellerNumber: optionalString,
  depositAmount: optionalString,
  beaconTellerNumber: optionalString,
  beaconAmount: optionalString,
  titleHolderName: optionalString,
  pillarNumbersRequired: z.number().optional(),
  cumulativePillarsQuarter: z.number().optional(),
  cumulativePillarsYear: z.number().optional(),
  areaSqm: optionalString,
});

export const surveyorRegistrationSchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Valid email is required"),
  // NIS format e.g., NIS/FM/2876 (two uppercase letters mid segment, 4 digits)
  nisMembershipNumber: z
    .string()
    .regex(
      /^NIS\/[A-Z]{2}\/\d{4}$/i,
      "Format: NIS/FM/2876 (2 letters, 4 digits)"
    )
    .transform((v) => v.toUpperCase()),
  // SURCON format e.g., R-2846 (R- and 4 digits)
  surconRegistrationNumber: z
    .string()
    .regex(/^R-\d{4}$/i, "Format: R-2846 (4 digits)")
    .transform((v) => v.toUpperCase()),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password is too long"),
  firmName: z.string().optional(),
  phoneNumber: z.string().min(10, "Valid phone number is required"),
  address: z.string().min(10, "Address is required"),
});

export const pillarSearchSchema = z.object({
  pillarNumber: z.string().min(1, "Pillar number is required"),
});
