# FixMyRoad — System Architecture Document

## Overview

FixMyRoad is an AI-powered road damage reporting and municipal routing platform. It empowers citizens to report road defects (potholes, cracks, surface degradation) which are automatically validated by AI models, geolocated, routed to responsible municipal authorities, and tracked until resolution.

## User Flow Overview

```text
Citizen
   ↓
Upload road image
   ↓
AI detects road damage
   ↓
GPS identifies location
   ↓
System identifies responsible municipality
   ↓
Complaint is created
   ↓
Municipality is notified
   ↓
Municipality processes complaint
   ↓
Citizen tracks status
```

## System Topology Diagram

```text
                 FixMyRoad
                     │
          ┌──────────┴──────────┐
          │                     │
       React                Node.js
       Client               Express
          │                     │
          │                     ├── MongoDB
          │                     │
          │                     └── Python AI
          │                            │
          │                         FastAPI
          │                            │
          │                           YOLO
          │
       GPS / Maps
```

## Component Breakdown

1. **Frontend (`client/`)**
   - Framework: React.js (Vite)
   - Styling: Tailwind CSS
   - Routing: React Router DOM
   - API Client: Axios
   - Capabilities: Image capture/upload, geolocation tracking, complaint submission, status tracking.

2. **Backend (`server/`)**
   - Runtime: Node.js + Express.js
   - Database: MongoDB via Mongoose ORM
   - Middlewares: Cors, Helmet, Rate Limiting, Error Handler
   - Endpoints: Health check (`/api/health`), Complaint CRUD, Municipality management (future phases).

3. **AI Service (`ai-service/`)**
   - Framework: Python FastAPI + Uvicorn
   - Computer Vision: YOLO (You Only Look Once) model integration (planned for AI detection phase)
   - Capabilities: Road damage object detection, classification, confidence score assessment.

4. **Database (`MongoDB`)**
   - Stores users, municipal jurisdiction boundaries, complaints, AI detection metadata, audit history.
