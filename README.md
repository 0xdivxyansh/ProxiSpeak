# ProxiSpeak Backend — Geospatial Proximity Audio Ecosystem

[![Node.js](https://img.shields.io/badge/Node.js-v22.x-green.svg)](https://nodejs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](https://www.typescriptlang.org/)
[![Firebase](https://img.shields.io/badge/Firebase-Admin%20SDK-orange.svg)](https://firebase.google.com)
[![Vitest](https://img.shields.io/badge/Vitest-53%20passed-brightgreen.svg)](https://vitest.dev)
[![OpenAPI 3.0](https://img.shields.io/badge/OpenAPI-3.0.3-brightgreen.svg)](http://localhost:5000/api-docs)

ProxiSpeak is a high-performance, geospatial audio platform that enables users to record, upload, geo-anchor, and discover soundscapes based on physical proximity.

This repository contains the complete production-grade Express/TypeScript backend, implementing Firebase Authentication, Cloud Firestore geospatial indexing via `geofire-common`, Google Cloud Storage signed upload/playback pipelines, rate limiting, and interactive OpenAPI (Swagger UI) documentation.

---

## Architecture Overview

```
src/
├── app.ts                            # Express application assembly & security middleware
├── server.ts                         # HTTP server bootstrap & graceful termination
├── config/
│   ├── env.ts                        # Zod-validated environment configuration
│   ├── firebase.ts                   # Firebase Admin SDK modular initialization
│   └── swagger.ts                    # OpenAPI 3.0.3 specification & Swagger UI
├── common/
│   ├── errors/                       # AppError hierarchy & standard error codes
│   ├── middleware/                   # Auth, validation, rate limiting, request tracking
│   ├── utils/                        # Structured logger, response envelope
│   └── types/                        # TypeScript ambient & domain definitions
├── infrastructure/
│   ├── firestore/                    # Firestore collections & setup
│   └── storage/                      # Cloud Storage signed URL service & test doubles
├── modules/
│   ├── health/                       # /api/v1/health operational check
│   ├── users/                        # /api/v1/users/me profile management
│   ├── audio/                        # /api/v1/audio upload lifecycle, playback & CRUD
│   └── geospatial/                   # Geohash bounds & Haversine distance engine
├── routes/                           # API v1 router aggregator
└── tests/
    ├── mocks/                        # Test harness with in-memory persistence doubles
    ├── unit/                         # Geospatial & validation unit tests
    └── integration/                  # Health, Auth, User, Audio & Geo integration tests
```

---

## Core Features & Workflow

### 1. Geospatial Discovery Engine (`GET /api/v1/audio/nearby`)
- Uses `geofire-common` to convert center coordinates (`lat`, `lng`) and `radius` (in meters) into 1 to 9 geohash range bounding boxes.
- Queries Cloud Firestore using indexed geohash ranges (`startAt` / `endAt`).
- Deduplicates candidates across overlapping spatial cells.
- Calculates exact great-circle distance using the **Haversine formula**.
- Filters candidates strictly to `distance <= radius`.
- Sorts ascending by proximity with secondary deterministic ordering.
- Implements bounded cursor pagination.

### 2. Audio Upload & Verification Lifecycle
- **Step A: Session Creation (`POST /api/v1/audio`)**:
  - Authenticated user submits audio metadata (title, coords, declared size, MIME type).
  - Server validates data, calculates geohash, and generates a server-controlled Cloud Storage object path (`audio/{uid}/{audioId}.ext`).
  - Generates a single-use, pre-signed Cloud Storage `PUT` upload URL (V4 signed URL, 15-minute expiry).
  - Creates a Firestore document in `pending_upload` status.
- **Step B: Direct Binary Upload**:
  - Client uploads the raw audio binary directly to Google Cloud Storage using `PUT` with the required `Content-Type`.
- **Step C: Upload Finalization (`POST /api/v1/audio/:id/complete`)**:
  - Server verifies that the uploaded object exists in Cloud Storage using `file.getMetadata()`.
  - Validates actual file size against the 10MB limit and verifies audio MIME type.
  - Updates status to `published`. Operation is **idempotent**.

### 3. Secure Playback (`GET /api/v1/audio/:id/playback`)
- Checks visibility rules (public vs. private).
- Generates a short-lived V4 signed download URL (`action: 'read'`, 15-minute expiry).
- Never exposes internal storage bucket credentials.

---

## Getting Started

### Prerequisites
- Node.js 20+ LTS (Tested on Node.js v22.17.1)
- npm 10+
- Optional: Firebase CLI (`npm install -g firebase-tools`) for local emulators

### Installation

```bash
# Clone the repository and navigate to root
cd proxispeakanti

# Install all runtime and developer dependencies
npm install
```

### Environment Configuration

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Review and adjust variables in `.env`:
- `FIREBASE_PROJECT_ID`: Your Firebase project ID (default: `proxispeak-dev`)
- `FIREBASE_STORAGE_BUCKET`: Storage bucket name (default: `proxispeak-dev.appspot.com`)
- `FIREBASE_SERVICE_ACCOUNT_KEY` or `FIREBASE_SERVICE_ACCOUNT_PATH`: Credentials for production / live cloud access.

### Running the Full-Stack Application

You can start the backend and frontend in separate terminals:

```bash
# Terminal 1: Start Backend (Express API on port 5000)
npm run dev

# Terminal 2: Start Frontend (Vite + React on port 5173)
npm run dev:frontend
```

Once running, access:
- **ProxiSpeak Web App**: [http://localhost:5173](http://localhost:5173)
- **Interactive Swagger UI**: [http://localhost:5000/api-docs](http://localhost:5000/api-docs)
- **OpenAPI 3.0 JSON**: [http://localhost:5000/api-docs.json](http://localhost:5000/api-docs.json)
- **Health Check**: [http://localhost:5000/api/v1/health](http://localhost:5000/api/v1/health)

### Building Both Frontend & Backend

```bash
npm run build:all
```

---

## Running Automated Tests

The backend includes a comprehensive Vitest suite covering unit and integration testing:

```bash
# Run all automated tests
npm test

# Run tests with code coverage report
npm run test:coverage

# Run ESLint check
npm run lint

# Format code with Prettier
npm run format
```

---

## REST API Summary

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/v1/health` | Public | System status, uptime & dependency state |
| `GET` | `/api/v1/users/me` | Bearer | Retrieve or auto-provision user profile |
| `PATCH` | `/api/v1/users/me` | Bearer | Update user profile (`displayName`) |
| `GET` | `/api/v1/audio/nearby` | Public | Discover audio recordings within radius |
| `POST` | `/api/v1/audio` | Bearer | Initiate audio upload session & signed URL |
| `POST` | `/api/v1/audio/:id/complete` | Bearer | Verify storage asset & publish recording |
| `GET` | `/api/v1/audio/:id` | Public / Owner | Retrieve audio metadata |
| `GET` | `/api/v1/audio/:id/playback` | Public / Owner | Generate secure signed playback URL |
| `PATCH` | `/api/v1/audio/:id` | Bearer (Owner) | Update mutable audio metadata |
| `DELETE` | `/api/v1/audio/:id` | Bearer (Owner) | Delete audio metadata & storage asset |

---

## Documentation Guides

- [FIREBASE_SETUP.md](file:///d:/proxispeakanti/FIREBASE_SETUP.md) — Step-by-step Firebase project provisioning, credentials, Firestore indexes, and Emulator suite setup.
- [SWAGGER_TESTING_GUIDE.md](file:///d:/proxispeakanti/SWAGGER_TESTING_GUIDE.md) — Guide to obtaining Firebase ID tokens and testing endpoints via Swagger UI.
- [DEPLOYMENT_GUIDE.md](file:///d:/proxispeakanti/DEPLOYMENT_GUIDE.md) — Production containerization, Cloud Run / App Engine deployment, and security hardening.
