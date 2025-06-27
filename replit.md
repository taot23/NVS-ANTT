# Sistema de Gestão de Vendas

## Overview

This is a comprehensive sales management system built with Node.js, React, and PostgreSQL. The application provides a complete solution for managing customers, sales, payments, operational costs, and financial tracking with role-based access control. The system is designed for a business that handles sales operations with multiple stakeholders including sellers, administrators, and financial personnel.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and optimized builds
- **UI Library**: Radix UI components with Tailwind CSS for styling
- **State Management**: TanStack Query (React Query) for server state management
- **Routing**: Wouter for lightweight client-side routing
- **Form Handling**: React Hook Form with Zod validation
- **Real-time Updates**: WebSocket integration for live data updates

### Backend Architecture
- **Runtime**: Node.js 20 with Express.js framework
- **Database ORM**: Drizzle ORM for type-safe database operations
- **Authentication**: Passport.js with local strategy and express-session
- **Real-time Communication**: WebSocket server for live updates
- **File Handling**: Multer for file uploads and document management

### Data Storage Solutions
- **Primary Database**: PostgreSQL 16 for relational data storage
- **Session Storage**: Express-session with database persistence
- **Cache Management**: Custom in-memory cache manager for performance optimization
- **File Storage**: Local file system with support for payment receipts and documents

## Key Components

### User Management
- Role-based access control (admin, supervisor, operacional, vendedor, financeiro)
- Password hashing with scrypt for security
- Session-based authentication with automatic cleanup

### Sales Management
- Complete sales lifecycle from creation to completion
- Multiple payment methods and installment support
- Service type classification and execution tracking
- Status management (pending, in_progress, completed, returned, corrected)

### Financial Operations
- Installment tracking with payment status
- Operational cost management with receipt uploads
- Financial overview with profit/loss calculations
- Export capabilities for Excel and PDF reports

### Service Provider Integration
- Partner service provider management
- Service type categorization (SINDICATO, DETRAN, etc.)
- Provider assignment to sales for execution tracking

### Reporting System
- Pre-built reports for different user roles
- Custom SQL query execution with parameter support
- Export functionality for data analysis
- Performance metrics and dashboard views

## Data Flow

1. **Sales Creation**: Users create sales with customer information, service types, and payment details
2. **Execution Management**: Sales are assigned service types and optional service providers for execution
3. **Payment Tracking**: Installments are tracked with due dates and payment status updates
4. **Cost Management**: Operational costs are recorded with payment receipts and categorization
5. **Financial Reporting**: Real-time financial overview with profit calculations and performance metrics

## External Dependencies

### Core Dependencies
- **@tanstack/react-query**: Server state management and caching
- **drizzle-orm**: Type-safe ORM for PostgreSQL operations
- **passport**: Authentication middleware
- **express-session**: Session management
- **multer**: File upload handling
- **ws**: WebSocket implementation

### UI/UX Dependencies
- **@radix-ui/***: Accessible UI component primitives
- **tailwindcss**: Utility-first CSS framework
- **lucide-react**: Icon library
- **react-hook-form**: Form state management
- **zod**: Schema validation

### Export/Import Libraries
- **jspdf**: PDF generation for reports
- **xlsx**: Excel file generation and parsing
- **date-fns**: Date manipulation and formatting

## Deployment Strategy

### Development Environment
- Replit-based development with hot reload
- PostgreSQL 16 module for database
- Vite dev server with middleware mode

### Production Deployment
- **Google Cloud Platform**: Configured for App Engine deployment
- **Docker**: Containerized application with Node.js 20 base image
- **Build Process**: Vite build for frontend, esbuild for backend bundling
- **Port Configuration**: Flexible port assignment (5000 dev, 8080 production)

### Configuration Files
- `app.yaml`: Google App Engine configuration
- `Dockerfile`: Container image definition
- `.gcloudignore`: Deployment exclusion rules
- `drizzle.config.ts`: Database migration configuration

## Changelog

- June 27, 2025. Initial setup

## User Preferences

Preferred communication style: Simple, everyday language.