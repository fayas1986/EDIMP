import { PrdChapter } from '../types';

export const PRD_CHAPTERS: PrdChapter[] = [
  {
    id: 'prd-ch1',
    chapterNumber: 1,
    title: '1. Executive Summary & Platform Objectives',
    category: 'Overview & Vision',
    summary: 'Executive overview, business rationale, ROI analysis, scope boundaries, and strategic platform vision for EDIMP.',
    contentMarkdown: `
# Chapter 1: Executive Summary & Platform Objectives

## 1.1 Business Rationale
Enterprise software projects—particularly ERP (Enterprise Resource Planning) and CRM (Customer Relationship Management) implementations—incur between **40% and 60% of total implementation timelines and budgets** on data migration, data profiling, cleansing, field mapping, and ETL integration. Traditional migration tools rely on hardcoded scripts, static spreadsheet importers, or rigid single-vendor connectors (e.g., separate isolated utilities for Business Central, SAP, Salesforce, or Oracle).

The **Enterprise Data Integration & Migration Platform (EDIMP)**—also known as the Universal Data Migration Platform (UDMP)—is built to eliminate hardcoded migration overhead. EDIMP provides a single, AI-powered, metadata-driven, multi-tenant enterprise solution that extracts, profiles, transforms, validates, simulates, migrates, and continuously synchronizes data between any source system and any destination system.

## 1.2 Core System Capabilities
1. **Universal Connector Framework:** Plug-and-play connectors for Files (Excel, CSV, Parquet, XML, Access), Relational Databases (SQL Server, PostgreSQL, MySQL, Oracle, MariaDB), NoSQL Databases (MongoDB, Cassandra), Cloud Storage (S3, Azure Blob, OneDrive, SharePoint, Google Drive), ERPs (Dynamics 365 Business Central, Dynamics 365 F&O, SAP S/4HANA, NetSuite, Oracle Fusion, Odoo, ERPNext, Zoho, Sage, Acumatica), CRMs (Salesforce, HubSpot, Dynamics CRM), and Custom APIs (REST, GraphQL, SOAP, OData, SFTP, Webhooks, gRPC).
2. **AI-Powered Schema Detection & Mapping:** AI field mapping powered by LLMs (Gemini API), auto-detecting target ERP/CRM schemas, confidence scoring, and automated transformation suggestion rules.
3. **Data Profiling & Governance Engine:** Automated pre-flight data quality scoring (0–100%), null frequency analysis, cardinality analysis, format anomaly detection, and automated data cleansing.
4. **Pre-Flight Simulation & Dry-Run Mode:** Risk-free simulation execution that evaluates all mapping, business validation, foreign key constraints, and business rules without persisting records into production destination systems.
5. **Batch & Real-Time Orchestration:** High-performance parallel chunking engine with automatic retry, job pausing, resume-from-failure, delta/incremental change-data-capture (CDC), and real-time streaming webhooks.

## 1.3 Targeted Metrics & Business Impact
| Metric Area | Industry Benchmark | EDIMP Target Standard | Improvement |
| :--- | :--- | :--- | :--- |
| **Migration Prep Time** | 6–8 Weeks | < 3 Days | **90% Reduction** |
| **Field Mapping Overhead** | Manual Spreadsheet Matching | AI Auto-Mapping (95%+ accuracy) | **85% Faster** |
| **Data Error Rate at Import** | 15% – 25% First-Pass Failures | < 0.5% First-Pass Failures | **98% Fewer Errors** |
| **Engine Throughput** | 50 records/sec | > 5,000 records/sec (Parallel Workers) | **100x Speedup** |
| **Implementation Partner Cost** | $150,000 – $400,000 per ERP project | Included in Platform Subscription | **70% Cost Savings** |
`,
    mermaidDiagram: `
graph TD
    subgraph Sources [Supported Source Systems]
        S1[Files: Excel, CSV, XML, Parquet]
        S2[Databases: SQL Server, Postgres, Oracle, Mongo]
        S3[Cloud: S3, Azure Blob, SharePoint, GDrive]
        S4[ERPs: SAP, Dynamics, NetSuite, Odoo]
        S5[CRMs: Salesforce, HubSpot, Dynamics CRM]
    end

    subgraph Core [EDIMP Processing Core]
        C1[1. Connector Framework & OAuth Engine]
        C2[2. Data Discovery & Profiling Engine]
        C3[3. AI Schema Detection & Mapping Studio]
        C4[4. Transformation & Cleansing Pipeline]
        C5[5. Validation & Simulation Dry-Run]
        C6[6. Batch Orchestrator & CDC Sync]
    end

    subgraph Destinations [Supported Destination Systems]
        D1[ERPs: Business Central, SAP S/4HANA, D365 F&O]
        D2[CRMs: Salesforce, HubSpot, Dynamics CRM]
        D3[Data Warehouses: Snowflake, Synapse, BigQuery]
        D4[Custom APIs & Relational Databases]
    end

    Sources --> C1
    C1 --> C2
    C2 --> C3
    C3 --> C4
    C4 --> C5
    C5 --> C6
    C6 --> Destinations
`,
  },
  {
    id: 'prd-ch2',
    chapterNumber: 2,
    title: '2. Architecture & High-Level System Design',
    category: 'Architecture',
    summary: 'Microservice container layout, API Gateway, event bus, job queue architecture, and integration layers.',
    contentMarkdown: `
# Chapter 2: Architecture & High-Level System Design

## 2.1 Multi-Layer Architecture
EDIMP employs a cloud-native, microservice-oriented, event-driven architecture designed for extreme horizontal scalability, multi-tenant isolation, and high fault tolerance.

### Key Architectural Layers:
1. **Presentation & Application Layer (Frontend):** Built using React 19, TypeScript, Material UI / Tailwind, AG Grid for high-density record editing, and React Flow for visual schema mapping node graphs.
2. **API Gateway & Routing Layer:** NGINX / Express Gateway handling JWT authentication, rate limiting, CORS controls, SSL termination, and tenant tenant-id header context injection.
3. **Core Microservices Layer:**
   - **Connector Microservice:** Manages connection pools, secret encryption (AES-256), OAuth 2.0 token refreshes, and driver execution.
   - **Discovery & Profiling Service:** Connects to source metadata engines, inspects schemas, generates statistical data quality reports.
   - **AI Mapping & Co-Pilot Engine:** Integrates with server-side Gemini API (\`gemini-3.6-flash\`) to perform semantic field mapping, transformation logic generation, and natural language query interpretation.
   - **Validation & Transformation Service:** Runs high-throughput JavaScript expression engine, regex validators, foreign key lookup caches, and cleansing routines.
   - **Migration Job Orchestrator:** Powered by Redis + BullMQ, managing parallel thread allocation, chunk queuing (1,000 records/chunk), retries, pause/resume state, and progress streaming via WebSockets / Socket.IO.
4. **Data & Storage Layer:**
   - **Metadata Database (PostgreSQL + Prisma ORM):** Stores tenants, users, connection profiles, job metadata, mapping definitions, and audit logs.
   - **Vector Store (pgvector):** Stores semantic schema embeddings for similarity matching across historical ERP field mappings.
   - **Cache & Queue (Redis + BullMQ):** High-speed job state storage, token caching, distributed locks, and real-time event streaming.
   - **Object Storage (S3 / Azure Blob Storage):** Temporary encrypted staging for staging files, error reports (.xlsx), and dry-run dump snapshots.

## 2.2 System Architecture Diagram
`,
    mermaidDiagram: `
architecture-beta
    group client(internet) [Client & Browser Layer]
    service web(browser) [React 19 Frontend Web Studio] in client

    group gateway(cloud) [Edge Gateway Layer]
    service ngw(server) [NGINX API Gateway / Auth Router] in gateway

    group app(cloud) [Core Microservices Runtime]
    service conn(server) [Connector Engine Service] in app
    service ai(server) [Gemini AI Co-Pilot Service] in app
    service job(server) [Migration Job Orchestrator] in app
    service val(server) [Validation & Cleansing Engine] in app

    group data(cloud) [Persistence & Queue Layer]
    service db(database) [PostgreSQL Metadata & Vector Store] in data
    service redis(disk) [Redis & BullMQ Job Queue] in data
    service blob(disk) [Encrypted S3 / Azure Blob Storage] in data

    web:L -- R:ngw
    ngw:B -- T:conn
    ngw:B -- T:ai
    ngw:B -- T:job
    conn:B -- T:db
    ai:B -- T:db
    job:B -- T:redis
    val:B -- T:blob
`,
  },
  {
    id: 'prd-ch3',
    chapterNumber: 3,
    title: '3. Data Architecture & Entity Relationship Diagram (ERD)',
    category: 'Database & Schema',
    summary: 'Full relational PostgreSQL database schema definitions, tables, foreign keys, indexes, and Mermaid ERD.',
    contentMarkdown: `
# Chapter 3: Data Architecture & Entity Relationship Diagram (ERD)

## 3.1 Database Schema Specifications
All platform metadata is persisted in a multi-tenant PostgreSQL database. All tables include a mandatory \`tenant_id\` foreign key for strict tenant data isolation, along with audit tracking timestamps (\`created_at\`, \`updated_at\`).

### Primary Database Tables:
1. **tenants:** Tenant account profile, tier, status, maximum parallel workers allowance.
2. **users:** User credentials, assigned roles, tenant link, MFA status.
3. **connectors:** Connector configurations, credentials (encrypted with AES-256-GCM), auth type, endpoints.
4. **data_objects:** Discovered tables/views/sheets associated with connectors.
5. **field_schemas:** Detailed field metadata (data type, nullability, PK/FK flags, sample values).
6. **mapping_projects:** Container for migration field mappings between source and destination objects.
7. **mapping_rules:** Individual field-level mapping rules, transformations, and confidence metrics.
8. **validation_rules:** Field validation logic, severity, error messages, and parameters.
9. **cleansing_rules:** Data cleansing actions (trim, default values, normalize country).
10. **migration_jobs:** Execution specifications, status, counts, throughput, schedules.
11. **job_execution_logs:** Fine-grained execution metrics per chunk/batch.
12. **error_records:** Granular record-level failures, raw JSON payload, error code, and AI remediation advice.
13. **audit_logs:** Security and compliance events trail.

## 3.2 Mermaid Entity Relationship Diagram (ERD)
`,
    mermaidDiagram: `
erDiagram
    TENANTS ||--o{ USERS : "contains"
    TENANTS ||--o{ CONNECTORS : "owns"
    TENANTS ||--o{ MIGRATION_JOBS : "executes"
    
    CONNECTORS ||--o{ DATA_OBJECTS : "discovers"
    DATA_OBJECTS ||--o{ FIELD_SCHEMAS : "defines"
    
    TENANTS ||--o{ MAPPING_PROJECTS : "creates"
    MAPPING_PROJECTS ||--o{ MAPPING_RULES : "specifies"
    MAPPING_PROJECTS ||--o{ VALIDATION_RULES : "enforces"
    MAPPING_PROJECTS ||--o{ CLEANSING_RULES : "applies"
    
    MAPPING_PROJECTS ||--o{ MIGRATION_JOBS : "configures"
    MIGRATION_JOBS ||--o{ JOB_EXECUTION_LOGS : "generates"
    MIGRATION_JOBS ||--o{ ERROR_RECORDS : "logs_errors"
    USERS ||--o{ AUDIT_LOGS : "triggers"

    TENANTS {
        uuid id PK
        string name
        string tier
        boolean is_active
        datetime created_at
    }

    USERS {
        uuid id PK
        uuid tenant_id FK
        string email
        string password_hash
        string role
        boolean mfa_enabled
    }

    CONNECTORS {
        uuid id PK
        uuid tenant_id FK
        string name
        string category
        string provider
        string encrypted_credentials
        string status
    }

    DATA_OBJECTS {
        uuid id PK
        uuid connector_id FK
        string object_name
        string object_type
        int record_count
    }

    FIELD_SCHEMAS {
        uuid id PK
        uuid data_object_id FK
        string field_name
        string data_type
        boolean is_nullable
        boolean is_primary_key
    }

    MIGRATION_JOBS {
        uuid id PK
        uuid tenant_id FK
        string job_name
        string mode
        string status
        int total_records
        int processed_records
        int error_count
    }

    ERROR_RECORDS {
        uuid id PK
        uuid job_id FK
        int record_row_number
        string field_name
        string error_code
        string error_message
        jsonb raw_data
        jsonb ai_explanation
    }
`,
  },
  {
    id: 'prd-ch4',
    chapterNumber: 4,
    title: '4. Module Specifications (All 30 Functional Modules)',
    category: 'Functional Specifications',
    summary: 'Exhaustive functional specifications for all 30 platform modules including features, business rules, permissions, and sequence flows.',
    contentMarkdown: `
# Chapter 4: Module Specifications (All 30 Functional Modules)

The platform provides 30 dedicated functional modules engineered to cover every phase of the enterprise data migration lifecycle.

### Summary of Core Modules:
1. **Authentication:** Secure JWT, OAuth 2.0, SAML 2.0 SSO, Entra ID integration, MFA, and session revocation.
2. **User Management:** User provisioning, email invites, password policies, activity status.
3. **Tenant Management:** Multi-tenant isolation, usage quotas, parallel thread allocations.
4. **Organization Management:** Multi-subsidiary enterprise hierarchies, regional grouping.
5. **Role-Based Access Control (RBAC):** Fine-grained permissions (Admin, Architect, Operator, Auditor, Viewer).
6. **Dashboard:** Real-time KPI summaries, throughput charts, active jobs, health alerts.
7. **Source Connector Management:** Configure & test connection parameters for all source systems.
8. **Destination Connector Management:** Configure & test connection parameters for destination ERP/CRM systems.
9. **API Connector Builder:** No-code interface for building API integrations from OpenAPI/Swagger/GraphQL endpoints.
10. **Custom Connector SDK:** Extensible TypeScript/Node.js SDK for developer-written custom connectors.
11. **Data Discovery Engine:** Auto-inspects source systems to list available tables, views, sheets, and APIs.
12. **Metadata Management:** Central metadata repository storing entity descriptions, primary keys, relationships.
13. **AI Schema Detection:** AI-driven semantic identification of business entity fields (Customer Name, Tax ID, Address).
14. **Data Profiling:** Statistical column profiling (null %, cardinality, uniqueness %, anomaly flags, data quality score).
15. **Data Mapping Studio:** Interactive visual canvas linking source fields to target fields with confidence metrics.
16. **Transformation Engine:** 20+ built-in functions (Trim, Uppercase, Currency, Regex, Custom JS expressions).
17. **Validation Engine:** Multi-level rule validation (Mandatory, Data Type, Email, Phone, Foreign Key lookup, Regex).
18. **Data Cleansing:** Automated data repair rules (strip special chars, normalize phone/country codes, default values).
19. **Duplicate Detection:** AI and fuzzy logic matching (Levenshtein, Jaro-Winkler) identifying duplicate entity records.
20. **Migration Wizard:** Step-by-step 10-phase guided workflow from connection setup to final import verification.
21. **Batch Migration Engine:** High-performance chunk-based parallel processing pipeline with fault isolation.
22. **Real-Time Synchronization:** Change-Data-Capture (CDC) engine streaming live updates via webhooks or log-scraping.
23. **Scheduler:** Flexible cron-based job scheduler for automated batch and delta execution.
24. **Notification Center:** Real-time alerts via Email, Slack, Teams, and Webhooks for job completions or errors.
25. **Audit Logs:** Immutable audit trail recording user actions, IP addresses, system events, and configuration changes.
26. **Reports:** Downloadable executive summaries, pre-flight data quality reports, and detailed error workbooks (.xlsx).
27. **Monitoring Dashboard:** Live telemetry monitoring memory, CPU, queue throughput, active threads, latency.
28. **AI Assistant:** Conversational AI co-pilot supporting natural language job creation, query assistance, error analysis.
29. **Settings:** Platform configurations, rate limits, encryption key rotation, backup policies.
30. **System Administration:** Global system maintenance, license management, service health controls.
`,
    mermaidDiagram: `
sequenceDiagram
    autonumber
    actor User as Migration Architect
    participant FE as React Frontend Studio
    participant GW as API Gateway
    participant AI as Gemini AI Engine
    participant Job as Migration Orchestrator
    participant Dest as Destination ERP (e.g. Business Central)

    User->>FE: 1. Launch Migration Wizard & Select Connectors
    FE->>GW: 2. Request Data Discovery & Schema Inspection
    GW-->>FE: 3. Return Source & Target Entity Schemas
    User->>FE: 4. Click "AI Auto-Map Fields"
    FE->>AI: 5. POST /api/ai/suggest-mapping (Schemas)
    AI-->>FE: 6. Return Mappings with Confidence & Transformations
    User->>FE: 7. Click "Run Dry-Run Simulation"
    FE->>Job: 8. Execute Pre-Flight Simulation
    Job->>Job: 9. Run Validations & Cleansing
    Job-->>FE: 10. Return Simulation Report (14,236 Valid, 14 Errors)
    User->>FE: 11. Confirm & Click "Execute Live Migration"
    FE->>Job: 12. Enqueue Parallel Workers (BullMQ)
    Job->>Dest: 13. Stream Batches to Target ERP API
    Dest-->>Job: 14. Acknowledge Success Records
    Job-->>FE: 15. Real-Time Socket.IO Progress Update (100% Complete)
`,
  },
  {
    id: 'prd-ch5',
    chapterNumber: 5,
    title: '5. Connector Framework & Supported Integration Matrix',
    category: 'Connectors & Integrations',
    summary: 'Comprehensive list of all 50+ supported source and destination connectors with auth protocols and driver requirements.',
    contentMarkdown: `
# Chapter 5: Connector Framework & Supported Integration Matrix

## 5.1 Connector Support Matrix
EDIMP supports a comprehensive library of native connectors grouped into distinct categories:

| Category | Supported System / Provider | System Role | Auth Mechanism | Driver / Protocol |
| :--- | :--- | :--- | :--- | :--- |
| **Files** | Microsoft Excel (.xlsx, .xls) | Source | None / Password | OpenPyXL / SheetJS |
| **Files** | CSV / TSV / Delimited Text | Source | None | Streaming Parser |
| **Files** | JSON / XML / Parquet | Source | None | Native JSON / Fast-XML / DuckDB |
| **Files** | Microsoft Access Database (.accdb) | Source | Database Password | ODBC / Node-ADODB |
| **Databases** | Microsoft SQL Server | Both | SQL Auth / Windows / Azure Entra | Tedious / msnodesqlv8 |
| **Databases** | PostgreSQL / CockroachDB | Both | Password / SSL Certificates | pg-node / Prisma |
| **Databases** | MySQL / MariaDB | Both | Password / TLS | mysql2 |
| **Databases** | Oracle Database (11g–19c, 21c) | Both | Database Auth / Wallet | node-oracledb |
| **Databases** | MongoDB / MongoDB Atlas | Both | SCRAM-SHA-256 / Connection String | MongoDB Native Driver |
| **Cloud Storage**| Amazon S3 / S3-Compatible | Source | AWS Access Keys / IAM Role | AWS SDK v3 |
| **Cloud Storage**| Azure Blob Storage | Source | Storage Key / SAS Token | Azure Storage SDK |
| **Cloud Storage**| SharePoint / OneDrive / Google Drive | Source | OAuth 2.0 / Service Account | Microsoft Graph / Google APIs |
| **ERP** | D365 Business Central | Both | OAuth 2.0 / Web Service Key | OData v4 / REST API |
| **ERP** | D365 Finance & Operations | Both | OAuth 2.0 / Azure App Registration | OData / Data Management Framework |
| **ERP** | SAP S/4HANA / SAP ECC | Both | Basic / OAuth 2.0 / Client Cert | OData Services / BAPI via RFC |
| **ERP** | Oracle ERP Cloud / Fusion | Both | OAuth 2.0 / Basic | REST APIs / SOAP Services |
| **ERP** | NetSuite | Both | Token-Based Auth (TBA) | SuiteTalk REST / RESTlets |
| **ERP** | Odoo / ERPNext | Both | API Key / User Token | XML-RPC / REST API |
| **CRM** | Salesforce CRM | Both | OAuth 2.0 Web Server Flow | Salesforce Bulk API 2.0 / REST |
| **CRM** | HubSpot / Dynamics CRM | Both | OAuth 2.0 / API Key | REST API v3 |
| **Custom APIs** | REST / GraphQL / SOAP / OData | Both | API Key / Bearer / Basic / OAuth | Axios / GraphQL Client / Soap-Node |
`,
    mermaidDiagram: `
graph LR
    subgraph Framework [No-Code Connector Framework Engine]
        Wizard[1. Connection Wizard]
        Auth[2. Auth Manager - OAuth/Key/SAML]
        Driver[3. Driver Execution Layer]
        Parser[4. Schema Parser - Swagger/WSDL/OData]
    end

    subgraph Inputs [Connector Types]
        F[File Driver]
        D[Database Driver]
        E[ERP Driver]
        A[API / Webhook Driver]
    end

    Wizard --> Auth
    Auth --> Driver
    Driver --> Parser
    Parser --> F
    Parser --> D
    Parser --> E
    Parser --> A
`,
  },
  {
    id: 'prd-ch6',
    chapterNumber: 6,
    title: '6. AI Schema Detection, Mapping Studio & Data Quality',
    category: 'AI Features & Mapping',
    summary: 'AI auto-mapping specifications, confidence scoring algorithms, data quality scoring formula, and AI error explanation engine.',
    contentMarkdown: `
# Chapter 6: AI Schema Detection, Mapping Studio & Data Quality

## 6.1 AI Field Mapping Engine
The platform uses server-side Gemini AI (\`gemini-3.6-flash\`) combined with vector similarity embeddings (\`pgvector\`) to perform intelligent field mapping between source schemas and target ERP/CRM schemas.

### Mapping Algorithm Steps:
1. **Schema Extraction:** Extract field name, data type, nullability, character limits, and sample data values for both source and target entities.
2. **Exact & Synonym Matching:** Evaluate exact case-insensitive matches and common ERP domain synonym pairs (e.g., \`Cust_No\` $\\rightarrow$ \`No.\`, \`Tax_ID\` $\\rightarrow$ \`VAT Registration No.\`, \`Tel\` $\\rightarrow$ \`Phone No.\`).
3. **Gemini Semantic Prompting:** Pass unmapped residual fields to Gemini with prompt context specifying target ERP business entity requirements.
4. **Confidence Score Calculation:**
   $$\\text{Confidence Score} = (0.5 \\times \\text{Semantic Similarity}) + (0.3 \\times \\text{Data Type Compatibility}) + (0.2 \\times \\text{Historical Mapping Frequency})$$
5. **Transformation Code Suggestion:** For fields requiring formatting changes (e.g., converting dates from \`MM/DD/YYYY\` to ISO \`YYYY-MM-DD\`, or stripping non-numeric characters from telephone strings), Gemini automatically constructs the transformation expression.

## 6.2 Data Quality Scoring Formula
Pre-flight data quality is measured on a scale of **0 to 100** using a weighted multi-factor composite index:

$$\\text{Quality Score} = (0.35 \\times \\text{Completeness}) + (0.25 \\times \\text{Validity}) + (0.20 \\times \\text{Uniqueness}) + (0.20 \\times \\text{Consistency})$$

- **Completeness:** Percentage of non-null values in mandatory fields.
- **Validity:** Percentage of values matching strict format validation rules (Regex, Email, Phone, Tax ID).
- **Uniqueness:** Percentage of non-duplicate records on unique key constraints.
- **Consistency:** Foreign key lookup validity against target ERP reference tables.
`,
    mermaidDiagram: `
flowchart TD
    A[Source Entity Schema] --> C{Exact Matcher}
    B[Target ERP Entity Schema] --> C
    C -- Matched (>0.98) --> D[Direct Mapping]
    C -- Unmatched --> E[pgvector Semantic Similarity Search]
    E -- Similarity >0.85 --> F[High-Confidence Mapping]
    E -- Similarity <0.85 --> G[Gemini 3.6 Flash Contextual Prompt]
    G --> H[AI Suggested Mapping + Transformation]
    H --> I[Human-in-the-Loop Mapping Studio Canvas]
    D --> I
    F --> I
`,
  },
  {
    id: 'prd-ch7',
    chapterNumber: 7,
    title: '7. REST API & Microservice Specifications',
    category: 'API Specifications',
    summary: 'Detailed REST API endpoints, request/response JSON schemas, headers, authentication, and error codes.',
    contentMarkdown: `
# Chapter 7: REST API & Microservice Specifications

## 7.1 Core API Endpoints
All API requests require \`Authorization: Bearer <JWT_TOKEN>\` and optional \`X-Tenant-ID\` header.

### 1. Connector Management API
- \`GET /api/v1/connectors\` - List all configured connectors for tenant.
- \`POST /api/v1/connectors\` - Register new source or destination connector.
- \`POST /api/v1/connectors/:id/test\` - Execute connection health check and ping test.

### 2. Data Discovery & Profiling API
- \`GET /api/v1/connectors/:id/objects\` - Discover tables/views/sheets/APIs.
- \`POST /api/v1/discovery/profile\` - Generate column statistics and data quality score.

### 3. AI Mapping & Co-Pilot API
- \`POST /api/v1/ai/suggest-mapping\` - AI auto-mapping endpoint using Gemini.
- \`POST /api/v1/ai/explain-error\` - AI root-cause error analysis and remediation steps.
- \`POST /api/v1/ai/natural-query\` - Generates complete job configurations from natural language prompts.

### 4. Migration Execution API
- \`POST /api/v1/jobs\` - Create migration job specification.
- \`POST /api/v1/jobs/:id/simulate\` - Run dry-run pre-flight simulation mode.
- \`POST /api/v1/jobs/:id/start\` - Launch live batch execution job.
- \`GET /api/v1/jobs/:id/progress\` - Real-time progress metrics endpoint (or WebSocket \`wss://.../ws/jobs/:id\`).

## 7.2 Sample Request & Response JSON (AI Mapping Endpoint)
\`\`\`json
// POST /api/v1/ai/suggest-mapping
{
  "sourceName": "Legacy_Customer_Excel.xlsx",
  "destinationName": "Dynamics 365 Business Central Customer",
  "sourceSchema": [
    { "fieldName": "Cust_No", "dataType": "String", "sampleValue": "CUS-10029" },
    { "fieldName": "Tax_Registration_Number", "dataType": "String", "sampleValue": "US-883921049" }
  ],
  "destinationSchema": [
    { "fieldName": "No.", "dataType": "String", "isPrimaryKey": true },
    { "fieldName": "VAT Registration No.", "dataType": "String" }
  ]
}

// 200 OK Response
{
  "success": true,
  "overallConfidence": 0.94,
  "mappings": [
    {
      "sourceField": "Cust_No",
      "targetField": "No.",
      "confidence": 0.98,
      "transformation": "Trim",
      "reasoning": "Primary key customer code match"
    },
    {
      "sourceField": "Tax_Registration_Number",
      "targetField": "VAT Registration No.",
      "confidence": 0.91,
      "transformation": "None",
      "reasoning": "Tax identification number equivalent"
    }
  ]
}
\`\`\`
`,
    mermaidDiagram: `
sequenceDiagram
    participant Client as Frontend Client
    participant GW as API Gateway
    participant Auth as Auth Microservice
    participant Job as Job Engine

    Client->>GW: POST /api/v1/jobs/job-101/start (Bearer JWT)
    GW->>Auth: Validate JWT & Tenant Permissions
    Auth-->>GW: Token Valid (Role: Migration Architect)
    GW->>Job: Dispatch Start Signal (BullMQ Job ID: job-101)
    Job-->>GW: 202 Accepted { jobId: "job-101", status: "Running" }
    GW-->>Client: 202 Accepted Response
`,
  },
  {
    id: 'prd-ch8',
    chapterNumber: 8,
    title: '8. Non-Functional Requirements (NFR) & Security Standards',
    category: 'Security & Compliance',
    summary: 'Availability, SLAs, latency targets, security, encryption, RBAC permissions matrix, and compliance standards.',
    contentMarkdown: `
# Chapter 8: Non-Functional Requirements (NFR) & Security Standards

## 8.1 Performance & Latency SLAs
- **System Availability:** 99.95% uptime SLA for multi-region cloud deployment.
- **API Response Latency:** < 120ms for UI metadata API requests; < 500ms for AI mapping responses.
- **Migration Throughput:** > 5,000 records/second per worker pod for batch file/database imports.
- **Concurrent Users:** Supports 1,000+ concurrent enterprise architects across multi-tenant workspaces.

## 8.2 Security & Encryption Standards
1. **Data Encryption in Transit:** TLS 1.3 enforced across all API endpoints, database client connections, and WebSocket channels.
2. **Data Encryption at Rest:** AES-256-GCM encryption for all database volumes, blob storage buckets, and connector credentials vault.
3. **Secrets Management:** Credentials and OAuth tokens encrypted via HashiCorp Vault / Azure Key Vault integration.
4. **Tenant Isolation:** Logical tenant isolation enforced at database layer (Row-Level Security / mandatory tenant query parameters) and memory cache namespaces.

## 8.3 Role-Based Access Control (RBAC) Matrix
| Module / Permission | Tenant Admin | Migration Architect | Data Operator | Auditor |
| :--- | :---: | :---: | :---: | :---: |
| **Manage Connectors & Credentials** | Full Access | Full Access | View Only | Read Only |
| **Configure Field Mappings** | Full Access | Full Access | Read Only | Read Only |
| **Run Dry-Run Simulations** | Full Access | Full Access | Full Access | Read Only |
| **Execute Live Production Jobs** | Full Access | Full Access | Execute Only | No Access |
| **View Audit & Security Logs** | Full Access | Read Only | No Access | Full Access |
| **Manage Users & Tenant Settings**| Full Access | No Access | No Access | No Access |
`,
    mermaidDiagram: `
graph TD
    subgraph Security [Enterprise Security & Encryption Infrastructure]
        TLS[TLS 1.3 Encryption in Transit]
        AES[AES-256-GCM Encryption at Rest]
        Vault[HashiCorp / Azure Key Vault Secrets Manager]
        RLS[PostgreSQL Row-Level Security Tenant Isolation]
        Audit[Immutable Audit Logging Service]
    end

    TLS --> AES
    AES --> Vault
    Vault --> RLS
    RLS --> Audit
`,
  },
  {
    id: 'prd-ch9',
    chapterNumber: 9,
    title: '9. Deployment Architecture, Docker & CI/CD Pipeline',
    category: 'DevOps & Deployment',
    summary: 'Kubernetes deployment topology, ingress routing, Dockerfile setup, and GitHub Actions / Azure DevOps CI/CD pipeline.',
    contentMarkdown: `
# Chapter 9: Deployment Architecture, Docker & CI/CD Pipeline

## 9.1 Containerization & Deployment Topology
The platform is packaged into minimal Docker container images and deployed on Managed Kubernetes (Azure AKS / Google GKE / AWS EKS) behind an NGINX Ingress Controller.

### Docker File Structure:
- \`Dockerfile.frontend\`: Multi-stage build compiling React 19 SPA static assets served via NGINX.
- \`Dockerfile.backend\`: Node.js 22 LTS container running bundled Express + esbuild server (\`dist/server.cjs\`).

## 9.2 CI/CD Pipeline Specifications
The automated CI/CD pipeline executes on every GitHub PR / Azure DevOps commit:
1. **Lint & Static Analysis:** Runs \`tsc --noEmit\` and ESLint rules.
2. **Automated Testing:** Unit tests (Jest), Integration tests, and API contract verification.
3. **Container Build & Security Scan:** Builds Docker images and runs Trivy / Snyk vulnerability vulnerability scanner.
4. **Staging Auto-Deploy:** Deploys images to Staging Kubernetes namespace for automated pre-flight testing.
5. **Production Blue/Green Deployment:** Zero-downtime deployment to production Kubernetes cluster following manual approval gate.
`,
    mermaidDiagram: `
gitGraph
    commit id: "v1.0.0-init"
    branch feature/ai-mapping
    checkout feature/ai-mapping
    commit id: "add-gemini-mapping-endpoint"
    commit id: "add-unit-tests"
    checkout main
    merge feature/ai-mapping id: "PR-Approved"
    commit id: "Build-Docker-Images"
    commit id: "Deploy-Staging-AKS"
    commit id: "Run-Integration-Tests"
    commit id: "Promote-Production-Blue-Green"
`,
  },
  {
    id: 'prd-ch10',
    chapterNumber: 10,
    title: '10. Development Standards & Folder Structure',
    category: 'Development Standards',
    summary: 'Code formatting rules, TypeScript conventions, component modularity, and workspace folder layout.',
    contentMarkdown: `
# Chapter 10: Development Standards & Folder Structure

## 10.1 Code Quality Standards
- **Strict TypeScript:** \`noImplicitAny: true\`, explicit return types for public functions, mandatory interfaces for component props.
- **Styling Guidelines:** Pure Tailwind CSS v4 utility classes. No inline styles or custom ad-hoc CSS files.
- **Component Modularity:** Strict separation of UI components, data structures, and API service handlers. Files must not exceed 500 lines.
- **Iconography:** Pure \`lucide-react\` standard icons.

## 10.2 Workspace Folder Structure
\`\`\`
/ (Root)
├── server.ts                       # Express backend server with Gemini API routes
├── package.json                    # Dependencies & full-stack scripts
├── vite.config.ts                  # Vite + Tailwind plugin config
├── metadata.json                   # App name, capabilities, and permissions
├── src/
│   ├── main.tsx                    # React application entry point
│   ├── App.tsx                     # Main layout & module router
│   ├── index.css                   # Tailwind CSS global styles
│   ├── types/
│   │   └── index.ts                # Shared TypeScript interfaces & types
│   ├── data/
│   │   ├── prdContent.ts           # Comprehensive PRD chapters content
│   │   └── mockData.ts             # Pre-configured connectors, schemas, jobs
│   ├── services/
│   │   └── aiService.ts            # Client API caller for AI endpoints
│   └── components/
│       ├── Header.tsx              # Top navigation header & mode switcher
│       ├── PrdViewer.tsx           # Chapter-by-chapter PRD document reader
│       ├── MermaidDiagram.tsx      # Live Mermaid diagram renderer
│       ├── DashboardView.tsx       # Executive KPI dashboard
│       ├── ConnectorsView.tsx      # Connector management console
│       ├── DiscoveryView.tsx       # Schema discovery & 100-row profiler
│       ├── MappingStudioView.tsx   # Visual field mapping studio
│       ├── ValidationCleansingView.tsx # Rules builder
│       ├── MigrationWizardView.tsx # 10-step wizard & simulation engine
│       ├── ErrorCenterView.tsx     # Record error diagnostic center
│       ├── AiAssistantView.tsx     # Natural language query assistant
│       ├── AuditSchedulerView.tsx  # Audit logs & job scheduler
│       └── SettingsView.tsx        # RBAC & system admin settings
\`\`\`
`,
  },
  {
    id: 'prd-ch11',
    chapterNumber: 11,
    title: '11. Sprint Plan, Milestones & Implementation Roadmap',
    category: 'Project Management',
    summary: '4-phase 16-week sprint execution roadmap, deliverables per sprint, and team resource allocation.',
    contentMarkdown: `
# Chapter 11: Sprint Plan, Milestones & Implementation Roadmap

## 11.1 Phase Execution Roadmap (16-Week Schedule)

### Phase 1: Core Foundation & Connector Framework (Sprints 1–4, Weeks 1–8)
- **Sprint 1:** Architecture setup, PostgreSQL schema setup, Auth service, UI Shell.
- **Sprint 2:** File Connectors (Excel, CSV, Parquet) & Relational DB Connectors (SQL Server, Postgres).
- **Sprint 3:** ERP Connectors (Business Central, Dynamics 365 F&O, SAP S/4HANA).
- **Sprint 4:** Discovery engine, schema inspection, 100-row sample data profiler.

### Phase 2: AI Engine, Mapping Studio & Validation (Sprints 5–6, Weeks 9–12)
- **Sprint 5:** Gemini API server integration, AI Field Mapping Engine, pgvector similarity store.
- **Sprint 6:** Visual Mapping Studio UI, transformation engine, validation rules builder, cleansing engine.

### Phase 3: Migration Orchestrator & Simulation Engine (Sprint 7, Weeks 13–14)
- **Sprint 7:** BullMQ batch worker engine, Dry-Run Simulation mode, real-time WebSocket progress ticker, error log center.

### Phase 4: Production Hardening, Security & Launch (Sprint 8, Weeks 15–16)
- **Sprint 8:** Audit logging, RBAC enforcement, load testing (100k records/min), security audit, documentation sign-off.
`,
  },
  {
    id: 'prd-ch12',
    chapterNumber: 12,
    title: '12. Risk Matrix, Mitigations & Enterprise Glossary',
    category: 'Risk & Governance',
    summary: 'Comprehensive risk assessment matrix, failover contingencies, assumptions, and enterprise glossary.',
    contentMarkdown: `
# Chapter 12: Risk Matrix, Mitigations & Enterprise Glossary

## 12.1 Risk Assessment & Mitigation Matrix
| Risk Description | Severity | Probability | Mitigation Strategy |
| :--- | :---: | :---: | :--- |
| **Target ERP API Rate Limiting** | High | High | Dynamic backoff rate limiter & adaptive chunk sizing in BullMQ worker. |
| **Complex Custom ERP Extensions** | Medium | High | Metadata auto-inspection & OpenAPI schema auto-parser for custom fields. |
| **Large Dataset Memory Exhaustion** | High | Medium | Streaming chunk-based processing (1,000 records/chunk) without loading full files into RAM. |
| **Inaccurate AI Field Mappings** | Medium | Medium | Human-in-the-loop verification canvas in Mapping Studio with explicit approval step. |

## 12.2 Enterprise Glossary
- **CDC (Change Data Capture):** System monitoring delta changes in source database logs for real-time synchronization.
- **Dry-Run Simulation:** Pre-flight migration execution validating all rules without committing records to production destination.
- **Metadata:** Structural definition of data entities (field names, data types, nullability, primary key constraints).
- **OData:** Open Data Protocol used extensively by Microsoft Dynamics 365 Business Central and F&O.
- **pgvector:** PostgreSQL vector extension used for storing semantic schema embeddings.
`,
  },
];
