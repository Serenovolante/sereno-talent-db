# Sereno Internal Talent Database - System Flowchart and Architecture

This document provides a comprehensive overview of the Sereno Internal Talent Database system, including its architecture, components, and user flows.

## System Flowchart

```mermaid
graph TD
    A[User Interface - Next.js Application] --> B{User Action}
    B --> C[Tab 1: Add Candidate]
    B --> D[Tab 2: Find Talent]
    
    C --> E[Upload Resume File (PDF/DOCX)]
    E --> F[Frontend sends file to API endpoint: POST /api/candidates/upload]
    F --> G[Backend receives file]
    G --> H[Parse raw text from resume using pdf-parse/mammoth.js]
    H --> I[Send text to Google Gemini API]
    I --> J[Gemini returns structured JSON matching Mongoose schema]
    J --> K[Save candidate to MongoDB using Mongoose]
    K --> L[Success message to frontend]
    
    D --> M[Fill search form with keywords, filters]
    M --> N[Frontend sends search data to API endpoint: POST /api/candidates/search]
    N --> O[Backend receives search parameters]
    O --> P[MongoDB Aggregation Pipeline: Filter by criteria]
    P --> Q[MongoDB Aggregation Pipeline: Calculate relevance score based on keyword matches]
    Q --> R[MongoDB Aggregation Pipeline: Sort by relevance score]
    R --> S[Return top results from MongoDB]
    S --> T{Has Job Description?}
    T -->|Yes| U[Send to OpenAI for AI analysis]
    T -->|No| V[Return DB results directly]
    U --> W[AI analyzes candidate fit and assigns scores]
    W --> X[Return AI-enriched results to frontend]
    V --> X
    X --> Y[Render candidate cards with DB and AI scores]
    Y --> A
    
    style A fill:#e1f5fe
    style C fill:#f3e5f5
    style D fill:#f3e5f5
    L --> A
    Y --> A
```

## System Architecture

The Sereno Internal Talent Database follows a clean, modular architecture with the following components:

### 1. Frontend Components (React/Next.js)
- **Main Page** (`/app/page.tsx`): The single-page application that controls tab navigation
- **AddCandidateForm** (`/components/candidate/AddCandidateForm.tsx`): Handles drag-and-drop resume uploads
- **FindTalentForm** (`/components/candidate/FindTalentSection.tsx`): Provides search functionality with filters
- **CandidateCard** (`/components/candidate/CandidateCard.tsx`): Displays search results in an attractive card format

### 2. Backend API Endpoints (Next.js API Routes)
- **Upload Endpoint** (`/app/api/candidates/upload/route.ts`): Processes uploaded resume files through text extraction and AI parsing
- **Search Endpoint** (`/app/api/candidates/search/route.ts`): Executes MongoDB aggregation for efficient searching with optional AI analysis

### 3. Database Layer
- **Mongoose Models** (`/models/candidate.ts`): Defines the schema for candidate data with appropriate indexes
- **Database Connection** (`/lib/mongodb.ts`): Provides a connection singleton for MongoDB

### 4. External Services
- **Google Gemini API**: Used for parsing unstructured resume data into structured JSON format
- **OpenAI API**: Used for advanced candidate analysis when a job description is provided
- **File Parsing Libraries**: `pdf-parse` and `mammoth.js` for extracting text from PDF and DOCX files

## User Workflows

### Workflow 1: Resume Ingestion (Add Candidate)
1. User uploads a resume file (PDF/DOCX) via the drag-and-drop interface
2. Frontend sends the file as `multipart/form-data` to the `/api/candidates/upload` endpoint
3. Backend extracts raw text from the file using appropriate parsing libraries
4. Raw text is sent to Google Gemini API with a structured prompt
5. Gemini returns a JSON object matching the predefined Mongoose schema
6. Backend saves the structured data to MongoDB as a new candidate document
7. Success message is returned to the frontend

### Workflow 2: Talent Discovery (Find Talent)
1. User fills the search form with keywords, job description, and filters
2. Frontend sends search parameters as JSON to the `/api/candidates/search` endpoint
3. Backend executes a MongoDB aggregation pipeline:
   - Filter candidates based on location, experience, and work preference
   - Calculate relevance scores based on keyword matches in skills and descriptions
   - Sort results by relevance score
   - Limit to top results for performance
4. If a job description is provided, send results to OpenAI for advanced analysis
5. AI assigns AI scores and reasons for hiring based on job requirements
6. Backend returns results to frontend with both database and AI scores
7. Frontend renders candidate cards with all relevant information

## Technology Stack

| Component | Technology | Purpose |
|-----------|------------|---------|
| **Framework** | Next.js with TypeScript | Integrated full-stack experience (Frontend, Backend API) |
| **Styling** | Tailwind CSS | Utility-first CSS for rapid, clean UI development |
| **Database** | MongoDB | Flexible NoSQL database to store candidate profiles |
| **ORM/ODM** | Mongoose | Schema definition and interaction with MongoDB |
| **Resume Parsing** | Google Gemini API | AI-powered extraction of structured JSON from resume text |
| **File Handling** | pdf-parse, mammoth.js | Extract raw text from PDF and DOCX files on the server |
| **Advanced Analysis** | OpenAI API | AI-powered candidate scoring when job description is provided |

## Key Features

- **Efficient Search**: Uses MongoDB aggregation pipeline for fast, cost-effective searching without per-search AI calls
- **Dual Scoring**: Combines database-driven relevance scores with AI-powered analysis for comprehensive results
- **File Format Support**: Handles both PDF and DOCX resume formats
- **Intuitive UI**: Clean single-page application with tab-based navigation
- **Scalable Architecture**: Modular design with clear separation of concerns