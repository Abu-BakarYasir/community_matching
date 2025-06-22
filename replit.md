# DAA Monthly Matching - Professional Networking Platform

## Overview

DAA Monthly Matching is a professional networking platform that connects professionals based on compatibility scores derived from their profiles, goals, and preferences. The application facilitates monthly automated matching, meeting scheduling, and ongoing relationship management through a comprehensive web interface.

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

## Brand Guidelines - Matches.Community

### Primary Colors:
- **Community Blue**: #2563eb - Main brand color for trust and professionalism (60% of design)
- **Connection Orange**: #f97316 - Energy/action color for warmth and connection (20% of design)

### Supporting Colors:
- **Deep Navy**: #1e293b - Connecting lines, secondary text, professional accents (15% of design)
- **Soft Gray**: #6b7280 - Supporting text, subtle backgrounds, secondary information
- **Warm White**: #fefefe - Clean backgrounds, card surfaces
- **Teal Accent**: #0891b2 - Additional variety in network visualizations (5% of design)

### Usage Guidelines:
- Blue for primary UI elements, headers, main text
- Orange for CTAs, highlights, and connection moments
- Navy/Gray for structure and text
- Teal for accents and visual interest (use sparingly)
- The blue + orange combination provides both trust and warmth - perfect for a professional but approachable community platform

## Recent Changes

### June 22, 2025 - Multi-Tenant SaaS Architecture & Community Signup System
- Restructured application for multi-tenant SaaS architecture
- Added organizations table to support multiple communities
- Created super admin role separate from community admin role
- Built comprehensive Super Admin dashboard for platform management
- Added organization management, user role control, and platform statistics
- Updated authentication system to support super admin privileges
- Separated community admin (manages one community) from super admin (manages entire platform)
- Added super admin routes and navigation in header dropdown menu
- Enhanced user schema with organizationId and isSuperAdmin fields
- Fixed branding to show "Matches.Community" instead of "DAA Matches" throughout application
- Added proper super admin authentication protection to all super admin API endpoints
- Updated authentication endpoints to return isSuperAdmin status for proper access control
- Made Settings tab the first tab and default open in admin dashboard (most useful for community managers)
- Created unique signup pages for each organization (/signup/[orgslug])
- Implemented organization-specific user signup with Replit Auth integration
- Added unique signup link display in community admin dashboard with copy functionality
- Community members sign up as regular users (non-admin) and are scoped to their organization
- Admin users can only see/manage users, matches, and meetings within their organization
- Created DAA organization and assigned averyjs@gmail.com as community manager

### June 22, 2025 - Replit Auth Integration & Availability System Fixed
- Implemented complete Replit Auth integration with session-based authentication
- Fixed availability time slot adding functionality with proper API endpoints
- Resolved database schema issues and SQL alias conflicts
- Added missing API routes for user profiles, matches, meetings, and settings
- Made averyjs@gmail.com an admin user for testing admin dashboard features
- Authentication system fully working with login/logout/profile routes

### June 20, 2025 - Profile System Unified & Database Cleanup Completed
- Made login page the default route instead of registration for better user flow
- Unified profile editing to use same modal on both dashboard and profile page
- Removed experience level field completely and added LinkedIn URL field to user profiles
- Enhanced profile modal with LinkedIn icon and better field organization
- Profile page now shows LinkedIn as clickable link and uses modal for editing
- Completed database migration: added linkedin_url column and removed experience_level column
- Fixed database persistence issues for profile and availability data
- Added prominent opt-in/opt-out toggle in dashboard top right with visual feedback
- Users can control participation in monthly matching rounds with large toggle switch
- Implemented PATCH /api/user/opt-status endpoint for managing opt-in status with database persistence
- Enhanced Next Matching Round card to show appropriate status based on opt-in state and profile completion
- Removed KPI score cards from dashboard top section per user preference (total matches, scheduled meetings, etc.)
- Implemented full database persistence for profile and availability data with session fallback
- Enhanced user profile API to create/update users in database automatically on login
- Added database persistence for profile questions with proper user association
- Availability system now saves to database with proper user relationships and fallback handling
- Reorganized dashboard layout: Next Matching Round at top, Upcoming Meetings second, combined Profile & Availability section
- Fixed profile completion calculation to properly show 100% when all fields completed (removed availability from calculation)
- Updated profile questions to focus on monthly goals: learning technical skills, building data projects, job hunting, networking
- Removed years of experience and typical availability questions per user preference
- Combined Profile and Availability into single streamlined section with dual action buttons
- Added prominent Next Matching Round card with countdown and completion prompts
- Fixed availability saving system completely - now working perfectly with proper API integration
- Implemented complete profile update system with session-based storage for development mode
- Fixed ProfileModal component with proper DialogDescription import and streamlined form
- Added PATCH /api/user/profile and POST /api/user/profile-questions endpoints for development
- Profile data now persists in user sessions and displays correctly in dashboard
- Updated application name to "DAA Monthly Matching" throughout the interface
- Integrated default Google Meet link (https://meet.google.com/wnf-cjab-twp) for all video meetings
- Enhanced scheduling system with comprehensive meeting management features
- Improved development mode authentication for reliable testing

### June 20, 2025 - Admin Dashboard Implementation
- Created comprehensive admin page with full user management capabilities
- Added admin navigation link and route integration
- Implemented admin dashboard with overview cards showing key metrics
- Built tabbed interface for Users, Matches, Meetings, and Settings management
- Added user table with profile information, status, and join dates
- Implemented match history view with scoring and status tracking
- Created meeting schedule overview with participant details and links
- Added admin settings panel for controlling monthly matching day
- Implemented manual matching trigger functionality
- Added admin API endpoints for users, matches, meetings, and settings
- Integrated with existing scheduler service for administrative control

### June 20, 2025 - Enhanced Matching Algorithm & Admin Controls
- Rebuilt matching algorithm to work with current user schema (removed experienceLevel dependency)
- Added configurable algorithm weights in admin dashboard with sliders
- Implemented two-phase matching: high-quality matches (60%+) + random backup matching
- Added company compatibility scoring and job title matching logic
- Enhanced networking goals overlap calculation with union-based scoring
- Implemented random backup matching to ensure all opted-in users get paired
- Added real-time weight adjustment in admin interface
- Updated algorithm to use industry (35%), company (20%), networking goals (30%), job title (15%) weights
- Random matches get 35-60% scores to distinguish from high-quality matches
- Added comprehensive error handling for email and notification failures

### June 20, 2025 - One Match Per User & Admin User Management
- Fixed matching algorithm to ensure each user gets exactly one match per period
- Added user deletion functionality with trash icon in admin dashboard
- Added user profile editing modal with inline editing capabilities
- Enhanced admin user table with action buttons for edit and delete operations
- Added confirmation dialog for user deletion to prevent accidental deletions
- Implemented cascading delete to clean up user matches and meetings
- Updated admin interface to show one match per user in cleaner format
- Enhanced algorithm to handle odd numbers of users with proper notifications for unmatched users
- Implemented strict one-match-per-user-per-period enforcement with double-checking
- Added prominent opt-in/opt-out toggle in dashboard top right with visual feedback
- Users can control participation in monthly matching rounds with large toggle switch
- Implemented PATCH /api/user/opt-status endpoint for managing opt-in status with database persistence
- Enhanced Next Matching Round card to show appropriate status based on opt-in state and profile completion
- Removed KPI score cards from dashboard top section per user preference (total matches, scheduled meetings, etc.)
- Implemented full database persistence for profile and availability data with session fallback
- Enhanced user profile API to create/update users in database automatically on login
- Added database persistence for profile questions with proper user association
- Availability system now saves to database with proper user relationships and fallback handling
- Reorganized dashboard layout: Next Matching Round at top, Upcoming Meetings second, combined Profile & Availability section
- Fixed profile completion calculation to properly show 100% when all fields completed (removed availability from calculation)
- Updated profile questions to focus on monthly goals: learning technical skills, building data projects, job hunting, networking
- Removed years of experience and typical availability questions per user preference
- Combined Profile and Availability into single streamlined section with dual action buttons
- Added prominent Next Matching Round card with countdown and completion prompts
- Fixed availability saving system completely - now working perfectly with proper API integration
- Implemented complete profile update system with session-based storage for development mode
- Fixed ProfileModal component with proper DialogDescription import and streamlined form
- Added PATCH /api/user/profile and POST /api/user/profile-questions endpoints for development
- Profile data now persists in user sessions and displays correctly in dashboard
- Updated application name to "DAA Monthly Matching" throughout the interface
- Integrated default Google Meet link (https://meet.google.com/wnf-cjab-twp) for all video meetings
- Enhanced scheduling system with comprehensive meeting management features
- Improved development mode authentication for reliable testing

### June 20, 2025 - SendGrid Email System Implementation
- Migrated from SMTP to SendGrid for reliable email delivery
- Enhanced email service with professional HTML templates for match notifications
- Added comprehensive match notification emails with user details, match scores, and visual progress bars
- Implemented graceful fallback for missing SendGrid API key (development mode with simulation)
- Created responsive email templates with gradient designs and clear call-to-action buttons
- Added automatic email sending when new matches are created via SendGrid API
- Enhanced error handling to prevent email failures from blocking the matching process
- Integrated SendGrid for better deliverability and analytics tracking
- Configured fallback sender email to use verified Gmail address while domain verification is pending
- Added detailed error logging for SendGrid API troubleshooting and 403 Forbidden responses
- Successfully configured verified DataAnalystRoadmap.com domain for email sending
- Email notifications now working with 202 status responses from SendGrid API

### June 20, 2025 - Enhanced Admin Meeting Management
- Built comprehensive meeting management interface with detailed participant information
- Added table view showing scheduled dates, match scores, status indicators, and meeting links
- Implemented admin delete functionality for meetings with proper confirmation
- Added meeting sorting by scheduled date (newest first)
- Created sample meeting data for testing and demonstration
- Enhanced API endpoints with admin-specific meeting operations

### June 21, 2025 - Unified Dashboard & Enhanced Meeting Display
- Combined matches and meetings into single unified "Your Matches & Meetings" section for cleaner UX
- Enhanced visual hierarchy with color-coded meeting states (today=blue, scheduled=green, pending=gray)
- Improved scheduled meeting display with detailed information: date, time, duration, type, and direct meeting links
- Added prominent meeting details showing "Meeting Scheduled" status with clickable meeting links
- Enhanced action buttons: Join/Join Now for scheduled meetings, Edit button for rescheduling
- Updated scheduling modal to show current meeting details prominently when editing
- Email templates include meeting links and scheduled times with one-click join buttons
- Complete meeting management workflow: schedule → join → reschedule with email notifications

### June 21, 2025 - JWT Authentication System & Opt-In Toggle Fixed
- Replaced session-based authentication with robust JWT token system
- Created JWT authentication module with secure token generation and verification
- Updated all API endpoints to use Bearer token authentication
- Added token storage in localStorage with automatic header inclusion
- Implemented both cookie and Authorization header token support for reliability
- Authentication now works consistently: login → JWT token → secure API access
- Fixed opt-in toggle to properly update database instead of using session storage
- Opt-in toggle now provides real-time visual feedback and persists state correctly
- Enhanced toggle UI with smooth animations and clear ON/OFF indicators
- Database persistence working: users can control participation in monthly matching rounds

### June 21, 2025 - Admin Authentication System Implementation
- Added isAdmin field to users table with proper database migration
- Implemented requireAdmin middleware to protect all admin API endpoints
- Created secure JWT token system that includes admin status in tokens
- Protected all admin routes: users, settings, matches, meetings, email templates, trigger matching
- Added frontend admin access control - admin menu only shows for admin users
- Created AdminRoute component to prevent non-admin access to admin dashboard
- Made yourmama@gmail.com an admin user for testing and management
- Admin access now properly restricted with 403 errors for non-admin users
- Full admin authentication system working with database persistence

### June 21, 2025 - Dashboard Layout Reorganization & Profile Completion
- Repositioned "Profile & Availability" section to bottom of dashboard per user preference
- Enhanced profile completion calculation to include schedule/availability setup as 4th requirement
- Added "Schedule availability set" indicator to profile completion checklist
- Updated completion percentage to reflect all 4 requirements: basic info, professional details, monthly focus, and availability
- Maintained "Next Round's Matches" card positioned below current matches
- Improved dashboard flow with logical information hierarchy from current matches to future planning to profile management

### June 21, 2025 - Next Round Matching Card & Admin Integration
- Added comprehensive "Next Round's Matches" card positioned below current matches per user preference
- Implemented automatic calculation of next matching date with admin settings integration
- Created dynamic status indicators based on user opt-in toggle and profile completion
- Added visual countdown display showing days, hours, minutes, and seconds until next matching
- Integrated status badges showing "Participating", "Opted Out", or "Profile Needed"
- Fixed profile picture upload to immediately refresh UI cache for instant visual updates
- Enhanced dashboard layout with prominent next round information and clear participation status
- Added public settings endpoint to fetch matching schedule from admin configuration

### June 21, 2025 - Admin Authentication System & UI Improvements  
- Fixed critical login issue with response.json() error by properly handling fetch responses
- Implemented complete admin authentication system with JWT tokens and database-backed admin roles
- Protected all admin API endpoints with requireAdmin middleware for security
- Added frontend access control - admin menu only shows for authorized admin users
- Created secure JWT token system that includes admin status in token payload
- Made yourmama@gmail.com an admin user with full dashboard access privileges
- Added admin debug panel for testing authentication and token refresh functionality
- Fixed apiRequest function to properly handle JSON responses and prevent authentication errors

### June 21, 2025 - Configurable App Name & Profile Picture Infrastructure
- Made app name configurable through admin settings panel (changed to "DAA Matches")
- Added app name field to admin settings with real-time updates
- Implemented complete profile picture upload infrastructure with real file handling
- Enhanced profile modal with image upload section, camera icons, and file input handling
- Added profile picture display in dashboard welcome section and header avatar
- Created backend endpoint using multer for actual image file uploads with base64 storage
- Profile pictures now properly upload and display real user images with 5MB file size limits
- Fixed profile picture saving system to handle actual image files instead of placeholder avatars
- Removed notifications functionality per user request to simplify interface

### June 21, 2025 - Admin-Configurable Default Names for New Users
- Added Default First Name and Default Last Name fields to admin settings panel
- Replaced email-based name extraction with configurable admin defaults
- Updated user creation logic in both magic link and JWT login to use admin settings
- New users now get names from admin configuration instead of parsing email addresses
- Backend stores defaultFirstName and defaultLastName in app settings with API endpoints
- Admin interface includes input fields with helpful descriptions for name configuration

### June 21, 2025 - Admin "Delete All" Functionality Implementation
- Added comprehensive "Delete All" functionality for admin tables (users, matches, meetings)
- Implemented backend API endpoints: DELETE /api/admin/users, /api/admin/matches, /api/admin/meetings
- Added getAllMatches() and getAllMeetings() methods to storage interface for bulk operations
- Frontend includes "Delete All" buttons in each admin tab with proper confirmation dialogs
- Admin user protection: Delete All Users preserves admin accounts to prevent lockout
- All delete operations include loading states and success/error toast notifications
- Bulk deletion endpoints return count of deleted items for user feedback

### June 21, 2025 - Admin Panel as Default for Admin Users
- Modified application routing to redirect admin users to admin panel by default
- Updated login flow to send admin users to /admin instead of /dashboard
- Admin users now land on admin panel immediately after login for better workflow
- Regular users continue to be redirected to dashboard as before

### June 21, 2025 - Add to Calendar Feature Implementation
- Added "Add to Calendar" button to dashboard for scheduled meetings
- Switched from ICS file downloads to Google Calendar links for better reliability
- Enhanced email notifications with Google Calendar links alongside meeting join buttons
- Calendar events include meeting details, participant information, match scores, and meeting links
- One-click calendar integration opens Google Calendar in new tab with pre-filled meeting details
- Improved user experience with direct browser-based calendar integration

### June 21, 2025 - Meeting Overlap Prevention & Configurable Settings
- Added admin toggle for "Prevent Meeting Overlaps" to control scheduling algorithm
- Implemented meeting conflict detection to ensure only one meeting at a time per user
- Enhanced meeting creation API to check for time conflicts before scheduling
- Admin dashboard now includes overlap prevention setting with clear description
- System validates proposed meeting times against existing scheduled meetings
- Returns user-friendly error message when meeting conflicts are detected
- Made Google Meet link configurable through admin settings instead of hardcoded
- Added Google Meet Link field to admin settings panel for easy customization
- Meeting creation now uses configurable Google Meet link from admin settings

### June 21, 2025 - First-Time User Onboarding & Profile Completion Flow
- Implemented automatic redirect to profile completion for first-time users
- Users with incomplete profiles (missing name, job title, company, or industry) are redirected to profile page
- Profile modal automatically opens for new users with mandatory field validation
- Enhanced profile modal with first-time setup messaging and required field indicators
- Modal cannot be closed until required fields are completed for new users
- Improved onboarding experience with welcome messaging and clear completion prompts
- Added visual indicators for required fields with red asterisks during setup
- Submit button shows different text and validation for first-time vs. existing users

### June 21, 2025 - Dashboard Layout Reorganization & Configurable Monthly Goals
- Reorganized dashboard layout to prioritize current matches and meetings first
- Changed "Your Matches & Meetings" to "This Round's Matches & Meetings" for clarity
- Moved "Next Matching Round" section below current matches per user preference
- Improved information hierarchy with current round activities displayed prominently
- Enhanced user experience by showing active content before future planning information
- Restored detailed next round information including status, profile completion, and matching timeline
- Removed weekly schedule preview section from dashboard per user request
- Added configurable "Monthly Focus Goals" setting in admin panel
- Admins can now customize the networking goal options that users select from
- Profile modal dynamically loads goal options from admin settings
- Added ability to add, edit, and remove monthly goal options in real-time

### June 20, 2025 - Authentication System Completed
- Implemented simplified email-based authentication without database dependencies
- Fixed session management with email storage for reliable login functionality
- Removed complex authentication flows in favor of development-friendly approach
- All features now accessible: dashboard, availability management, profile system
- Successfully resolved Neon database connectivity issues with session-based fallback

### Architecture Updates
- Session-based authentication stores user email instead of complex user IDs
- User profiles generated dynamically from email addresses for development testing
- Availability management system fully functional with visual scheduling interface
- Meeting scheduling system integrated with user availability data

## Changelog

Changelog:
- June 20, 2025. Initial setup
- June 20, 2025. Authentication system completed and tested