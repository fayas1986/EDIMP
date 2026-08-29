# Database Performance Benchmark Report

This report presents empirical benchmark measurements comparing the primary key data types—**CUID (String)**, **UUID (Native)**, and **BIGINT (Identity)**—for EDIMP's execution layer. It also projects storage, memory, and latency metrics for 1 Million and 10 Million row workloads.

---

## 1. Empirical Benchmark Results (10,000 Rows)

Tested on target PostgreSQL database (AWS Neon ap-southeast-1):

| Metric | CUID (String) | UUID (Native) | BIGINT (Identity) |
|---|---|---|---|
| **Master Table Size** | 1,343,488 B (1.34 MB) | 1,343,488 B (1.34 MB) | **933,888 B (0.93 MB)** |
| **Primary Key Index Size** | 655,360 B (655 KB) | 458,752 B (458 KB) | **245,760 B (245 KB)** |
| **Detail Table Size** | 851,968 B (851 KB) | 688,128 B (688 KB) | **524,288 B (524 KB)** |
| **Detail FK Index Size** | 647,168 B (647 KB) | 417,792 B (417 KB) | **245,760 B (245 KB)** |
| **Insert Throughput Time** | 1,240 ms | 1,226 ms | **1,001 ms** |
| **Avg JOIN Server Time** | 0.676 ms | 0.564 ms | **0.558 ms** |
| **Shared Buffer Hits (JOIN)**| 108 pages | 88 pages | **68 pages** |

---

## 2. Scale Projections (1 Million & 10 Million Workloads)

Using the empirical bytes-per-row from our live benchmarks, we project table and index size requirements at enterprise-scale workloads:

### A. 1 Million Rows Extrapolation

| Metric Component | CUID (String) | UUID (Native) | BIGINT (Identity) |
|---|---|---|---|
| **Master Table Size** | 134.3 MB | 134.3 MB | **93.3 MB** |
| **Master PK Index Size** | 65.5 MB | 45.8 MB | **24.5 MB** |
| **Detail Table Size** | 85.2 MB | 68.8 MB | **52.4 MB** |
| **Detail FK Index Size** | 64.7 MB | 41.8 MB | **24.5 MB** |
| **Total Database Footprint** | **349.7 MB** | **290.7 MB** | **194.7 MB** |

### B. 10 Million Rows Extrapolation

| Metric Component | CUID (String) | UUID (Native) | BIGINT (Identity) |
|---|---|---|---|
| **Master Table Size** | 1,343.4 MB (1.34 GB) | 1,343.4 MB (1.34 GB) | **933.8 MB** |
| **Master PK Index Size** | 655.3 MB | 458.7 MB | **245.7 MB** |
| **Detail Table Size** | 851.9 MB | 688.1 MB | **524.2 MB** |
| **Detail FK Index Size** | 647.1 MB | 417.7 MB | **245.7 MB** |
| **Total Database Footprint** | **3.49 GB** | **2.90 GB** | **1.94 GB** |

---

## 3. High-Scale Execution Implications

1. **Shared Buffer RAM Thrashing**: 
   In PostgreSQL, indices must reside in memory (`shared_buffers`) to achieve sub-millisecond lookups. At 10 Million rows, the CUID PK and FK index sizes total **1.30 GB**. Under memory-constrained cloud databases (e.g. Neon scale-to-zero or small RDS instances), this index size will trigger buffer eviction, causing slow random disk reads. Under BIGINT, index size is only **491 MB**, allowing it to fit entirely in memory.
2. **Page Buffer IO (Shared Hits)**:
   BIGINT query execution accessed **37% fewer shared buffer hits** than CUID. Since fewer database pages need to be loaded into memory per query, BIGINT dramatically scales read/write concurrent capacity.
3. **Insert Throughput**:
   Generating and indexing 30-character random CUID strings consumes more CPU cycles during inserts compared to sequential BIGINT allocations. At 10M rows, BIGINT inserts will scale linearly, whereas CUID insert speeds will degrade as the B-tree height increases.

---

## 4. Recommendation & Strategy

* **Control Plane Models**: Retain CUID (`String`) IDs. Control plane tables (e.g., `Tenant`, `Workspace`, `User`, `ConnectorType`) are bound by active configuration records and rarely exceed 10,000 rows. CUID offers excellent global uniqueness across distributed control nodes without performance risks.
* **Data Plane Execution Models**: We recommend migrating high-volume tables (`MigrationRecord`, `RecordError`, `ReconciliationObservation`) to **BIGINT (Identity)** to save ~45% storage and maintain high query performance.
* **UUID Option**: UUID is a viable intermediate if distributed client-side key generation is required. However, for internal execution logs where keys are generated database-side, BIGINT is the optimal choice.
