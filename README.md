# Enterprise Data Integration & Migration Platform (EDIMP)

[![CI/CD Pipeline](https://github.com/fayas1986/EDIMP/actions/workflows/ci.yml/badge.svg)](https://github.com/fayas1986/EDIMP/actions/workflows/ci.yml)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D20.0.0-brightgreen.svg)](https://nodejs.org)
[![NestJS](https://img.shields.io/badge/NestJS-11.x-red.svg)](https://nestjs.com)
[![React](https://img.shields.io/badge/React-19.x-blue.svg)](https://react.dev)
[![Prisma](https://img.shields.io/badge/Prisma-6.x-indigo.svg)](https://www.prisma.io)

EDIMP is an enterprise-grade, multi-tenant Data Integration and Migration Platform engineered to automate complex data discovery, schema mapping, transformation, migration execution, discrepancy reconciliation, and real-time observability across heterogeneous systems.

---

## 🌟 Key Capabilities & Module Overview

- **🏢 Multi-Tenant Architecture (Phase 1)**  
  Strict 3-tier organizational hierarchy (`Tenant` → `Workspace` → `Environment`) with cryptographic JWT authentication, role-based access control (RBAC), and isolated database queries.

- **🔌 Connector Management & Data Profiling (Phase 2)**  
  Supports REST, SQL databases, files, and streaming sources with automated structural discovery, statistical profiling (null counts, cardinality, type inference), and connector health diagnostics.

- **🗺️ Mapping Studio & Canonical Data Models (Phase 3)**  
  Design canonical target schemas and build mapping sets with source-to-target field relationships, lookup tables, and dual-mapping preview capabilities.

- **⚙️ Safe Expression Engine & Transformation Pipeline (Phase 4)**  
  Execute deterministic transformations (concatenation, formatting, string sanitization, math functions) via an isolated AST expression evaluator with zero `eval()` vulnerabilities.

- **🚀 Autonomous Worker Cluster & Migration Engine (Phase 5)**  
  Batch migration execution driven by worker node lease polling (`WHERE status = 'QUEUED' OR leaseExpiresAt < NOW()`), stateful retry policies, and Dead-Letter Queue (DLQ) park/replay.

- **🔍 Automated Reconciliation & Discrepancy Engine (Phase 6)**  
  Compare source and target dataset hashes post-migration, flag record discrepancies, generate delta patches, and enforce immutable configuration publishing (`DRAFT` → `PUBLISHED`).

- **🤖 AI-Powered Auto-Mapping & Predictive Intelligence (Phase 7)**  
  Leverage Google Gemini LLMs for intelligent schema matching, anomaly detection, and migration risk forecasting, backed by deterministic rule-based engine fallbacks on rate limit (`HTTP 429`).

- **📊 Enterprise Observability & Operational Hardening (Phase 8)**  
  W3C `traceparent` correlation ID propagation across async queues, Prometheus metrics exposition (`/api/v1/metrics`) with strict low-cardinality label enforcement, append-only audit logging, and token-bucket rate limiting.

---

## 🏗️ Architecture & Monorepo Structure

Built as an enterprise **Turborepo** monorepo:

```text
EDIMP/
├── apps/
│   ├── api/                  # NestJS 11 Backend API Service (Port 3001)
│   │   ├── src/
│   │   │   ├── tenants/      # Multi-Tenancy & RBAC Management
│   │   │   ├── connections/  # Connectors & Data Profiler
│   │   │   ├── data-models/  # Canonical Schemas & Discovery
│   │   │   ├── mapping-sets/ # Mapping Studio Engine
│   │   │   ├── transformations/ # AST Safe Expression Engine
│   │   │   ├── pipeline-jobs/   # Worker Batch Engine & DLQ
│   │   │   ├── reconciliation/  # Discrepancy & Replay Engine
│   │   │   ├── ai-agents/       # Gemini AI & Fallback Engine
│   │   │   └── observability/   # OpenTelemetry, Metrics & Audit Logs
│   │   └── test/             # E2E Integration Test Suite (Phase 1–8)
│   └── web/                  # Vite 6 + React 19 Web Application (Port 3000)
│       └── src/
│           ├── components/   # Dashboard & Data Quality Audit Light Theme UI
│           └── lib/api/      # Axios & Fetch Client Contracts
├── packages/
│   ├── contracts/            # Zod Validation Schemas & Shared DTO Interfaces
│   └── database/             # Prisma 6 Schema (42 Models) & SQL Migrations
├── .github/
│   └── workflows/
│       └── ci.yml            # GitHub Actions CI/CD Pipeline
├── docker-compose.yml        # Docker Multi-Container Compose Configuration
├── turbo.json                # Turborepo Task Pipeline Definition
└── package.json              # Monorepo Workspace Configuration
```

---

## 🛠️ Tech Stack

- **Backend**: NestJS 11, TypeScript 5.7, Prisma 6 ORM, PostgreSQL / SQLite, Zod, RxJS, Jest, OpenTelemetry.
- **Frontend**: Vite 6, React 19, TailwindCSS, D3.js Data Visualizations, Lucide React Icons.
- **Infrastructure & CI**: Turborepo, GitHub Actions, Docker Compose.

---

## 🚀 Getting Started

### Prerequisites

- **Node.js**: `v20.0.0` or higher (Node v22 recommended)
- **NPM**: `v10.0.0` or higher
- **Database**: PostgreSQL `v16+` or local SQLite (default dev fallback)

### 1. Installation

Clone the repository and install dependencies:

```bash
git clone https://github.com/fayas1986/EDIMP.git
cd EDIMP
npm install
```

### 2. Environment Configuration

Create `.env` file in the root directory (or copy from `.env.example`):

```env
NODE_ENV=development
PORT=3001
DATABASE_URL="file:./dev.db"
JWT_SECRET="edimp_super_secret_enterprise_jwt_key_32_chars"
METRICS_AUTH_TOKEN="edimp_metrics_auth_token_secret_16_chars"
GEMINI_API_KEY="your_gemini_api_key_here"
```

### 3. Database Migration & Client Generation

Generate the Prisma Client and apply database migrations:

```bash
# Generate Prisma Client
npx prisma generate --schema=packages/database/prisma/schema.prisma

# Push schema to database
npx prisma db push --schema=packages/database/prisma/schema.prisma
```

### 4. Running the Application

Start both the API Backend and Web Frontend concurrently via Turborepo:

```bash
npm run dev
```

Or start services individually:

```bash
# Start NestJS API Server (http://localhost:3001)
npm run --prefix apps/api start:dev

# Start React Web App (http://localhost:3000)
npm run --prefix apps/web dev
```

---

## 📚 API Endpoints & Documentation

Interactive API documentation and health endpoints are provided out of the box:

- **Swagger API Explorer**: `http://localhost:3001/api/docs`
- **Liveness Probe**: `GET http://localhost:3001/api/v1/health/liveness`
- **Readiness Probe**: `GET http://localhost:3001/api/v1/health/readiness`
- **Prometheus Metrics**: `GET http://localhost:3001/api/v1/metrics` (Requires `x-metrics-token` header)

---

## 🧪 Testing & Quality Assurance

EDIMP includes a full automated test suite covering end-to-end integration scenarios across all 8 development phases:

```bash
# Run complete Phase 1–8 E2E Test Suite (99 tests)
npm run test:e2e

# Run unit tests
npm run test

# Run frontend type check
npm run typecheck
```

### Test Suite Verification Results
```text
PASS test/phase8.e2e-spec.ts
PASS test/phase7.e2e-spec.ts
PASS test/phase6.e2e-spec.ts
...
Test Suites: 10 passed, 10 total
Tests:       99 passed, 99 total
Snapshots:   0 total
Time:        4.82 s
```

---

## 🐳 Docker Deployment

To spin up EDIMP using Docker Compose:

```bash
docker-compose up --build -d
```

Services exposed:
- **Web Dashboard**: `http://localhost:3000`
- **API Engine**: `http://localhost:3001`
- **PostgreSQL Database**: `localhost:5432`

---

## 📄 License

UNLICENSED - Proprietary Enterprise Platform.
