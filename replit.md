# DAA Monthly Matching - Professional Networking Platform

## Overview

DAA Monthly Matching is a professional networking platform designed to connect professionals based on compatible profiles, goals, and preferences. It automates monthly matching, facilitates meeting scheduling, and supports ongoing relationship management through a comprehensive web interface. The platform aims to provide a streamlined, efficient way for professionals to expand their networks and achieve their career objectives.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

The application employs a full-stack architecture with distinct frontend and backend components.

### Frontend Architecture
- **React 18** with TypeScript
- **Vite** for development and optimized builds
- **Tailwind CSS** with `shadcn/ui` for consistent UI and accessibility
- **TanStack Query** for server state management
- **Wouter** for client-side routing
- **React Hook Form** with Zod for form validation

### Backend Architecture
- **Express.js** server with TypeScript
- **Node.js 20** runtime
- **Session-based authentication** (Replit Auth integrated)
- **Drizzle ORM** with PostgreSQL
- **Neon Database** for serverless PostgreSQL

### Key Features & Design Decisions
- **Database Schema**: PostgreSQL with Drizzle ORM managing Users, Profile Questions, Matches, Meetings, Availability, and Notifications.
- **Matching Algorithm**: Automated monthly process using cron jobs. Compatibility scoring (minimum 60% threshold) is based on professional background, goals, and preferences, with duplicate prevention. Configurable weights for industry, company, networking goals, and job title are applied, ensuring one match per user per period. Random backup matching ensures all opted-in users are paired.
- **Communication Services**: Automated email notifications via SMTP (Nodemailer, configurable) for matches and reminders. Integrates SendGrid for reliable delivery and professional HTML templates. Admin notifications provide detailed summaries.
- **UI/UX**: Modular component library based on Radix UI primitives. Responsive design with a mobile-first approach and accessibility-compliant controls. Features toast notifications for user feedback.
  - **Color Scheme**: Uses Community Blue (#2563eb) as primary, Connection Orange (#f97316) for action, supported by Deep Navy, Soft Gray, Warm White, and Teal Accent.
  - **Dashboard**: Features "Next Round's Matches" card with countdown, profile completion prompts, and a prominent opt-in/opt-out toggle. KPI score cards have been removed for a cleaner look.
  - **Profile Management**: Unified profile editing with LinkedIn URL integration, focusing on monthly goals rather than experience levels. First-time users are redirected to complete mandatory profile fields.
  - **Meeting Management**: Unified display of matches and meetings. Includes "Add to Calendar" (Google Calendar links) and meeting overlap prevention. Meeting links are configurable through admin settings.
- **Multi-tenancy**: Supports a multi-tenant SaaS architecture with `Organizations` (now `Communities`) and distinct `Super Admin` and `Community Admin` roles. Each community has a unique signup link and is self-contained.
- **Timezone Handling**: Comprehensive Eastern Time (ET) implementation using `date-fns-tz` for all platform date displays and notifications.
- **Admin Features**: Comprehensive admin dashboard for user, match, meeting, and settings management. Includes manual matching trigger, configurable monthly matching day, and default naming for new users. "Delete All" functionality for admin tables is implemented with safeguards for admin accounts.
- **Onboarding**: Automated redirection for first-time users to complete their profile, ensuring all required information is captured before full platform access.
- **Authentication**: Utilizes Replit Auth with a robust JWT token system for secure, session-based authentication.

## External Dependencies

- **Database**: PostgreSQL (via Neon serverless database)
- **ORM**: Drizzle ORM
- **Email Service**: Nodemailer (SMTP), SendGrid
- **UI Frameworks**: Radix UI, Tailwind CSS, shadcn/ui
- **Iconography**: Lucide Icons
- **Build Tool**: Vite
- **Language**: TypeScript
- **Timezone Management**: date-fns-tz
```