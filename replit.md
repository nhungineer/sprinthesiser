# ThemeSync - AI-Powered User Research Analysis Tool

## Overview

ThemeSync is a web-based prototype that helps product managers extract and organize themes from user interview transcripts using AI analysis. The application provides an intuitive interface for uploading research materials, analyzing them with AI, and presenting findings in a visual, interactive format similar to Miro-style post-it notes.

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
- **AI Integration**: OpenAI GPT-4o for theme extraction and analysis

### Key Components

#### Data Models
- **Projects**: Container for research sessions
- **Transcripts**: Uploaded files with parsed content
- **Themes**: AI-extracted themes with supporting quotes
- **Analysis Settings**: User preferences for theme extraction

#### Core Services
- **FileParserService**: Handles multiple file formats (TXT, MD, PDF, DOC, DOCX)
- **OpenAIService**: Manages AI theme extraction with semantic clustering
- **ExportService**: Provides data export in multiple formats (CSV, JSON)
- **MemStorage**: In-memory data persistence (no database persistence by design)

#### UI Components
- **FileUpload**: Drag-and-drop interface with file validation
- **TextInput**: Direct text paste functionality
- **AnalysisControls**: Configurable AI analysis settings
- **ThemeGrid**: Post-it note style theme visualization
- **ThemeCard**: Interactive theme cards with editing capabilities
- **ExportSection**: Multiple export format options

## Data Flow

1. **Input Phase**: Users either paste text directly or upload files through drag-and-drop
2. **Processing Phase**: Files are parsed and validated, content is cleaned for AI analysis
3. **Analysis Phase**: OpenAI processes combined transcript content using semantic clustering
4. **Presentation Phase**: AI-extracted themes are displayed as interactive post-it note cards
5. **Refinement Phase**: Users can edit, merge, split, and reorder themes
6. **Export Phase**: Final results can be exported in multiple formats

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

### Key Architectural Decisions

1. **In-Memory Storage**: Chosen for prototype speed and simplicity, with easy migration path to persistent storage
2. **Monolithic Structure**: Single repository with shared types between frontend and backend for rapid development
3. **AI-First Approach**: Core functionality relies on OpenAI for intelligent theme extraction rather than simple keyword matching
4. **Component-Based UI**: Modular React components with consistent design system for maintainability
5. **Type Safety**: Full TypeScript coverage with shared schemas between client and server
6. **File Processing**: Supports multiple formats with extensible parser architecture
7. **Export Flexibility**: Multiple output formats to integrate with existing product management workflows