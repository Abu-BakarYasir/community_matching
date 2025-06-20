# NetworkMatch - Professional Networking Platform

## Overview

NetworkMatch is a professional networking platform that connects professionals based on compatibility scores derived from their profiles, goals, and preferences. The application facilitates monthly automated matching, meeting scheduling, and ongoing relationship management through a comprehensive web interface.

## System Architecture

The application follows a full-stack architecture with clear separation between frontend and backend concerns:

### Frontend Architecture
- **React 18** with TypeScript for type safety and modern component patterns
- **Vite** for fast development and optimized production builds
- **Tailwind CSS** with shadcn/ui component library for consistent, accessible UI
- **TanStack Query** for efficient server state management and caching
- **Wouter** for lightweight client-side routing
- **React Hook Form** with Zod validation for form handling

### Backend Architecture
- **Express.js** server with TypeScript for API endpoints
- **Node.js 20** runtime environment
- **Session-based authentication** for user management
- **Drizzle ORM** with PostgreSQL for database operations
- **Neon Database** as the serverless PostgreSQL provider

## Key Components

### Database Schema
The application uses PostgreSQL with Drizzle ORM and five main entities:
- **Users**: Core user profiles with professional information
- **Profile Questions**: Extended user preferences and networking goals
- **Matches**: Compatibility-based user pairings with scoring
- **Meetings**: Scheduled interactions between matched users
- **Availability**: User scheduling preferences
- **Notifications**: System-generated user notifications

### Matching Algorithm
- Automated monthly matching process via cron jobs
- Compatibility scoring based on professional background, goals, and preferences
- Minimum 60% compatibility threshold for match creation
- Duplicate prevention within monthly cycles

### Communication Services
- **Email Service**: Automated notifications for matches and meeting reminders
- **Scheduler Service**: Cron-based task management for monthly matching and daily reminders
- **SMTP Integration**: Configurable email delivery via environment variables

### UI Components
- Modular component library based on Radix UI primitives
- Responsive design with mobile-first approach
- Accessibility-compliant form controls and navigation
- Toast notifications for user feedback

## Data Flow

1. **User Registration**: Users create accounts with professional information
2. **Profile Completion**: Extended questionnaire captures networking preferences
3. **Monthly Matching**: Automated algorithm generates compatibility-based matches
4. **Notification Delivery**: Email notifications inform users of new matches
5. **Meeting Scheduling**: Users can schedule meetings through the platform
6. **Relationship Management**: Ongoing tracking of meeting outcomes and networking progress

## External Dependencies

### Database
- **PostgreSQL**: Primary data store via Neon serverless database
- **Drizzle ORM**: Type-safe database operations with migration support

### Email Infrastructure
- **Nodemailer**: SMTP email delivery
- **Configurable SMTP**: Support for various email providers via environment variables

### UI Framework
- **Radix UI**: Accessible, unstyled component primitives
- **Tailwind CSS**: Utility-first styling framework
- **Lucide Icons**: Consistent iconography

### Development Tools
- **Vite**: Fast build tooling with HMR
- **TypeScript**: Static type checking across the stack
- **ESLint/Prettier**: Code quality and formatting (implied by modern setup)

## Deployment Strategy

### Development Environment
- **Replit-optimized**: Configured for seamless Replit development
- **Hot Module Replacement**: Instant feedback during development
- **PostgreSQL 16**: Local database for development

### Production Deployment
- **Autoscale Deployment**: Configured for Replit's autoscale deployment target
- **Build Process**: Vite frontend build + esbuild backend compilation
- **Environment Variables**: Secure configuration management for database and email credentials

### Build Configuration
- **Frontend**: Vite builds React application to `dist/public`
- **Backend**: esbuild compiles TypeScript server to `dist/index.js`
- **Static Assets**: Served from compiled frontend build

## User Preferences

Preferred communication style: Simple, everyday language.

## Changelog

Changelog:
- June 20, 2025. Initial setup