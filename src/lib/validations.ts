import { z } from "zod"

export const surveyJobSchema = z.object({
  clientName: z.string().min(2, "Client name is required"),
  clientEmail: z.string().email("Valid email is required").optional().or(z.literal("")),
  clientPhone: z.string().min(10, "Valid phone number is required"),
  location: z.string().min(5, "Location is required"),
  description: z.string().optional(),
  coordinates: z
    .object({
      latitude: z.number().min(-90).max(90),
      longitude: z.number().min(-180).max(180),
    })
    .optional(),
})

export const surveyorRegistrationSchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Valid email is required"),
  licenseNumber: z.string().min(5, "License number is required"),
  firmName: z.string().min(2, "Firm name is required"),
  phoneNumber: z.string().min(10, "Valid phone number is required"),
  address: z.string().min(10, "Address is required"),
})

export const pillarSearchSchema = z.object({
  pillarNumber: z.string().min(1, "Pillar number is required"),
})
