# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

NIS Cadastral is a survey management platform for the Nigerian Institution of Surveyors (NIS). It manages the complete workflow from surveyor registration through pillar number assignment to final document approval.

## Core Architecture

### Multi-Role Authentication System
- **NextAuth.js** with JWT strategy and credential-based authentication
- **Role hierarchy**: PUBLIC → SURVEYOR → NIS_OFFICER → ADMIN
- **Surveyor verification workflow**: PENDING → PENDING_NIS_REVIEW → NIS_APPROVED → ADMIN_APPROVED → VERIFIED
- Authentication enforced at API route level with role-based access control

### Database Schema & Workflow
- **PostgreSQL** with **Prisma ORM** 
- **Core entities**: User, Surveyor, SurveyJob, PillarNumber, Document, WorkflowStep
- **Job status progression**: SUBMITTED → NIS_REVIEW → NIS_APPROVED → ADMIN_REVIEW → ADMIN_APPROVED → COMPLETED
- **Pillar number system**: Auto-generated with configurable series prefix (SC/CN, SC/BN, etc.)
- **Document workflow**: Survey documents → Blue Copy → R of O Document

### Survey Job Lifecycle
1. **Surveyor** submits job with coordinates and client details
2. **NIS Officer** reviews technical accuracy → status: NIS_APPROVED
3. **Admin** assigns pillar numbers and plan number → status: ADMIN_APPROVED  
4. **Surveyor** uploads Blue Copy document (triggered after pillar assignment)
5. **Admin** uploads R of O document → status: COMPLETED

### Key Components Architecture
- **Dashboard system** with role-specific views and job filtering
- **Google Maps integration** for coordinate visualization (UTM Zone 32N conversion)
- **File upload system** using Vercel Blob storage
- **Workflow tracking** with WorkflowStep entities for audit trail
- **Search system** for pillar numbers with geospatial nearby pillar detection

## Development Commands

### Database Operations
```bash
npm run db:generate    # Generate Prisma client
npm run db:push        # Push schema changes to database
npm run db:migrate     # Create and run migrations
npm run db:studio      # Open Prisma Studio database GUI
npm run db:seed        # Seed with basic data
npm run db:seed-realistic  # Seed with realistic sample data
npm run db:reset       # Clear database and reseed
```

### Development Workflow
```bash
npm run dev           # Start development server
npm run build         # Production build (includes Prisma generation)
npm run lint          # ESLint checking
```

## Critical Environment Variables
- `DATABASE_URL` - PostgreSQL connection string
- `NEXTAUTH_SECRET` - JWT signing secret
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` - For coordinate mapping

## Code Patterns & Conventions

### API Route Structure
- All routes use `getServerSession()` for authentication
- Role-based authorization with early returns for unauthorized access
- Database operations wrapped in Prisma transactions for complex workflows
- Consistent error handling with proper HTTP status codes

### Component Architecture
- Server components for data fetching (dashboard pages, job details)
- Client components for interactivity (forms, maps, file uploads)
- Shared UI components in `/src/components/ui/` using Radix UI + Tailwind
- Form validation using React Hook Form + Zod schemas

### Database Patterns
- All models include `createdAt`/`updatedAt` timestamps
- Status enums for workflow state management
- JSON fields for flexible coordinate data storage
- Prisma relations with proper foreign key constraints

### State Management
- Server-side state via database queries
- Client-side forms use React Hook Form
- Toast notifications via Sonner library
- No global client state management (uses server state pattern)

## Important Implementation Details

### Coordinate System Handling
- Input coordinates are UTM Zone 32N (easting/northing)
- Converted to WGS84 (lat/lng) for Google Maps display
- Custom UTM conversion functions in `coordinate-map.tsx`

### File Upload Flow
- Documents uploaded via API routes to Vercel Blob
- Document metadata stored in database with file paths
- File type validation and size limits enforced
- Different document types (SURVEY_PLAN, BLUE_COPY, RO_DOCUMENT, etc.)

### Pillar Number Generation
- Automated sequential numbering with configurable prefixes
- Thread-safe generation using database transactions
- Pillar numbers tied to specific survey jobs and coordinates
- Historical tracking of issued pillars with timestamps

### Dashboard Filtering Logic
- Role-specific job filtering based on workflow status
- Admin dashboard shows jobs needing review AND jobs with assigned pillar numbers (ADMIN_APPROVED status)
- Status color coding system for visual workflow tracking
- Separate review queues for NIS Officers vs Admins

### Google Maps Integration
- Dual map components: `coordinate-map.tsx` (UTM conversion) and `pillar-map.tsx` (pillar search)
- Proper API key validation before map initialization
- Custom markers and info windows for different pillar types
- Geospatial search for nearby pillars within configurable radius

## Security Considerations
- All authenticated routes check session and role permissions
- Database queries filtered by user ownership where applicable
- File uploads validated for type and size
- No password hashing implemented (development placeholder)
- API routes protected against unauthorized access

## Testing & Seeding
- Comprehensive seed scripts for different data scenarios
- Database clearing and reset capabilities
- Realistic test data generation with proper relationships
- Sample pillar numbers and coordinates for testing workflows