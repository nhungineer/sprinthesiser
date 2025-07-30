# Sprinthesiser - AI-Powered Design Sprint Synthesis Assistant

## Overview

Sprinthesiser is a web-based AI synthesis assistant specifically designed for Google Venture Design Sprint context. The application helps time-poor sprint facilitators (PMs, designers, engineers) analyze raw transcripts from Day 2 expert interviews and Day 4 user tests, outputting structured insights, HMW questions, and recommendations with direct traceability back to source quotes.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and optimized builds
- **UI Framework**: Shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with custom CSS variables for theming
- **State Management**: TanStack Query (React Query) for server state management
- **Routing**: Wouter for lightweight client-side routing

### Backend Architecture
- **Runtime**: Node.js with Express.js server
- **Language**: TypeScript with ES modules
- **Database**: PostgreSQL with Drizzle ORM for type-safe database operations
- **Database Provider**: Neon Database (serverless PostgreSQL)
- **File Processing**: Multer for file uploads with in-memory storage
- **AI Integration**: Claude Haiku (Anthropic) for cost-effective theme extraction and Sprint insight analysis

### Key Components

#### Data Models
- **Projects**: Sprint containers with goals and context
- **Transcripts**: Uploaded files with transcript type detection (Expert Interviews vs User Testing)
- **Themes**: AI-extracted insights categorized as Opportunities, Pain Points, or Ideas/HMWs
- **HMW Questions**: Auto-generated "How Might We" questions for each insight

#### Core Services
- **SprintAIService**: Specialized AI service for Design Sprint insight extraction
- **FileParserService**: Handles multiple file formats (TXT, MD, PDF, DOC, DOCX)
- **ExportService**: Provides data export for sprint documentation
- **MemStorage**: In-memory data persistence for rapid prototyping

#### UI Components
- **Sprint Context Panel**: Sprint goals input with dynamic context fields
- **Transcript Input**: Enhanced textarea with file upload and type selection
- **Insight Categories**: Three-column layout (Opportunities, Pain Points, Ideas/HMWs)
- **HMW Display**: Shows generated "How Might We" questions for each insight
- **Responsive Layout**: Mobile-first design with adaptive grid system

## Data Flow

1. **Sprint Context**: Users input sprint goals and optional context information
2. **Transcript Input**: Content uploaded via file or pasted directly with type selection
3. **AI Analysis**: Specialized Sprint AI categorizes insights into three Design Sprint categories
4. **HMW Generation**: Automatic "How Might We" question generation for each insight
5. **Insight Display**: Results shown in categorized columns with traceability to source quotes
6. **Collaboration**: Built-in voting and export functionality for team collaboration

## External Dependencies

### Core Dependencies
- **OpenAI API**: For theme extraction and semantic analysis
- **Neon Database**: Serverless PostgreSQL hosting
- **Radix UI**: Accessible component primitives
- **TanStack Query**: Server state management
- **Drizzle ORM**: Type-safe database operations

### Development Tools
- **Vite**: Build tool and development server
- **TypeScript**: Type safety across the stack
- **Tailwind CSS**: Utility-first styling
- **ESBuild**: Fast TypeScript compilation for production

## Deployment Strategy

### Development Environment
- Vite development server with HMR (Hot Module Replacement)
- Express server running in development mode with automatic restarts
- In-memory storage for rapid prototyping and testing

### Production Build
- Vite builds optimized static assets
- ESBuild compiles server code into a single bundle
- Express serves both API routes and static frontend assets
- Environment variables manage database connections and API keys

### Environment Configuration
- `NODE_ENV`: Controls development vs production behavior
- `DATABASE_URL`: PostgreSQL connection string for Drizzle
- `OPENAI_API_KEY`: Required for AI theme extraction functionality

## Recent Changes

### Latest Updates (January 2025)
- **Complete Design Sprint Pivot**: Transformed from general research tool to Design Sprint-specific synthesis assistant
- **Sprint-Focused Branding**: Rebranded to "Sprinthesiser" with Sprint-appropriate UI and messaging
- **Three-Category System**: Implemented Opportunities (green), Pain Points (red), Ideas/HMWs (yellow) categorization
- **Responsive Mobile Design**: Mobile-first responsive layout with adaptive grid system and touch-friendly controls
- **Enhanced Context Input**: Expandable sprint goals textarea and dynamic context field management
- **Transcript Type Selection**: Radio button selection for Expert Interviews vs Testing Notes
- **HMW Question Generation**: Automatic "How Might We" question creation for each insight
- **File Upload Integration**: Working file upload functionality with hidden input and upload button
- **Real AI Integration**: Replaced sample data with Claude Haiku for cost-effective authentic analysis
- **Customizable AI Prompts**: Multiple prompt templates optimized for expert interviews vs user testing
- **Complete Voting System**: Full voting workflow with persistent results and export integration

### Key Architectural Decisions

1. **In-Memory Storage**: Chosen for prototype speed and simplicity, with easy migration path to persistent storage
2. **Monolithic Structure**: Single repository with shared types between frontend and backend for rapid development
3. **AI-First Approach**: Core functionality relies on OpenAI for intelligent theme extraction rather than simple keyword matching
4. **Component-Based UI**: Modular React components with consistent design system for maintainability
5. **Type Safety**: Full TypeScript coverage with shared schemas between client and server
6. **File Processing**: Supports multiple formats with extensible parser architecture
7. **Export Flexibility**: Multiple output formats to integrate with existing product management workflows