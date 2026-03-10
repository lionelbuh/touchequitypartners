# Touch Equity Partners Website

## Overview
A professional website for Touch Equity Partners, a private investment firm based in San Diego, California. The site features a single-page landing page, customer authentication, a customer dashboard, and an admin panel for managing posts.

## Tech Stack
- **Frontend:** React + Vite + TypeScript + Tailwind CSS + shadcn/ui
- **Backend:** Express.js + TypeScript
- **Database:** PostgreSQL with Drizzle ORM
- **Auth:** Passport.js with local strategy (session-based)
- **Routing:** wouter (frontend), Express (backend)

## Pages
1. **Home** (`/`) - Single scrolling landing page with Hero, What We Do, Mission, Portfolio, Footer
2. **Login** (`/login`) - Customer login/registration page
3. **Dashboard** (`/dashboard`) - Protected customer dashboard showing posts assigned to that customer
4. **Admin** (`/admin`) - Admin panel for creating/editing/deleting/publishing posts with per-customer assignment

## Database Schema
- `users` - id (uuid), username (email), password (hashed), role (customer/admin)
- `dashboard_posts` - id (serial), title, content, link, attachments (jsonb array of {filename, originalName, mimetype, size, url}), published, created_at, created_by
- `post_assignments` - post_id (fk), user_id (fk) - junction table linking posts to specific customers
- `session` - Auto-created by connect-pg-simple for session storage

## File Upload System
- Uses multer for file upload handling
- Files stored in `/uploads/` directory (served via Express static route with auth check)
- Supports images (JPG, PNG, GIF, WebP), PDFs, and Word documents (.doc, .docx)
- Max file size: 10 MB per file, up to 5 files per upload
- Attachments stored as JSONB array on `dashboard_posts` table
- Upload endpoint: POST `/api/admin/upload` (admin-only, multipart/form-data)

## Key Files
- `shared/schema.ts` - Drizzle schema & Zod validation
- `server/routes.ts` - API endpoints
- `server/auth.ts` - Authentication setup
- `server/storage.ts` - Database CRUD operations
- `server/seed.ts` - Initial seed data
- `client/src/pages/` - React page components
- `client/src/hooks/use-auth.ts` - Auth hook

## Default Accounts (Seed Data)
- Admin: hello@touchequitypartners.com / Admin!55
- Customer: buhler.lionel@gmail.com / user1!55

## Password Reset
- Admin-only feature: admin can reset any customer's password from the admin panel
- "Customer Accounts" section at bottom of admin page lists all customers with "Reset Password" button
- Opens a modal to set new password (min 6 characters)
- Endpoint: POST `/api/admin/reset-password/:userId` (admin-only, customer role enforced)

## Post Assignment System
Posts are assigned to specific customers via the `post_assignments` junction table. When an admin creates or edits a post, they select which customers should see it. Each customer's dashboard only shows posts that are both published AND assigned to them.

## Brand Colors
- Primary: Navy blue (hsl 220, 56%, 18%)
- Font: Inter
