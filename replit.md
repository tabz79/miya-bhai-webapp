# Overview

This is a full-stack food delivery/restaurant application called "Miya Bhai" built with a modern tech stack. The application features a React frontend with TypeScript, shadcn/ui components, and Tailwind CSS for styling. The backend uses Express.js with TypeScript, and the database layer is managed with Drizzle ORM configured for PostgreSQL. The app appears to be designed as a mobile-first restaurant ordering interface showcasing signature dishes, best sellers, and a complete menu system.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React 18 with TypeScript using Vite as the build tool
- **Routing**: Wouter for client-side routing with a simple Switch/Route pattern
- **UI Components**: shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS with custom CSS variables for design tokens and theming
- **State Management**: TanStack Query (React Query) for server state management
- **Form Handling**: React Hook Form with Zod validation through @hookform/resolvers

## Backend Architecture
- **Framework**: Express.js with TypeScript
- **Runtime**: Node.js with ES modules
- **Build System**: esbuild for production bundling, tsx for development
- **API Design**: RESTful API structure with /api prefix for all routes
- **Middleware**: Custom logging middleware for API request/response tracking
- **Error Handling**: Centralized error handling middleware

## Data Storage
- **Database**: PostgreSQL (configured but not yet connected)
- **ORM**: Drizzle ORM with schema-first approach
- **Migrations**: Drizzle Kit for database migrations stored in ./migrations
- **Connection**: Neon Database serverless driver for PostgreSQL
- **Fallback Storage**: In-memory storage implementation for development (MemStorage class)

## Development Architecture
- **Monorepo Structure**: Shared schema between client and server in /shared directory
- **Path Aliases**: TypeScript path mapping for clean imports (@/, @shared/, @assets/)
- **Development Server**: Vite dev server with HMR integration with Express backend
- **Type Safety**: Strict TypeScript configuration across all packages

## Design System
- **Component System**: Comprehensive shadcn/ui components with consistent theming
- **Design Tokens**: CSS custom properties for colors, typography, and effects
- **Responsive Design**: Mobile-first approach with Tailwind responsive utilities
- **Typography**: Custom font loading (Nunito, Carattere) with design system integration

## Authentication & Security
- **Session Management**: Prepared for cookie-based sessions with connect-pg-simple
- **CORS**: Express configured for credential handling
- **Input Validation**: Zod schemas for type-safe data validation

# External Dependencies

## Database Services
- **Neon Database**: Serverless PostgreSQL hosting platform
- **PostgreSQL**: Primary database engine for data persistence

## UI & Design Libraries
- **Radix UI**: Headless component primitives for accessibility and functionality
- **Tailwind CSS**: Utility-first CSS framework for styling
- **Lucide React**: Icon library for consistent iconography
- **Embla Carousel**: Carousel/slider functionality

## Development Tools
- **Vite**: Fast build tool and development server
- **TypeScript**: Type safety and enhanced developer experience
- **Drizzle Kit**: Database migration and schema management
- **ESBuild**: Fast JavaScript bundler for production builds

## Data Management
- **TanStack Query**: Server state management and caching
- **React Hook Form**: Form state management and validation
- **Zod**: Runtime type validation and schema definition
- **Date-fns**: Date manipulation and formatting utilities

## Development Environment
- **Replit Integration**: Custom Vite plugins for Replit development environment
- **PostCSS**: CSS processing with Autoprefixer
- **Class Variance Authority**: Type-safe component variant management