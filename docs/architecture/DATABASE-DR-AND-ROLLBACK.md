# Database Disaster Recovery & Rollback Playbook

This playbook outlines recovery procedures, rollback strategies, and disaster recovery actions to handle database migration failures or data corruption.

---

## 1. Pre-Migration Safety Checks

Before applying any migration to staging or production:
1. **Verify Backup Status**: Confirm that a manual database backup has been taken, or verify Neon serverless backup state.
2. **Local Dry-Run**: Apply the migration to a local clone or development database branch and verify that client generation compiles without errors.
3. **Execution Locks**: Pause active migration worker processes to prevent schema mismatch lockups during alter statements.

---

## 2. Rollback Procedures

If a migration fails or causes application regression, follow these rollback steps:

### A. Neon Instant Branching Rollback (Preferred)
Neon databases support instant database branching. If a migration is destructive and fails:
1. Go to the Neon console.
2. Find the database branch where the migration was run.
3. Select **Reset Branch** to reset the database state to the snapshot taken right before the migration.
4. Update the connection string to point to the restored branch if a new branch was created for backup.

### B. SQL Downgrade Rollback
For every schema migration file (`migration.sql`), a corresponding `rollback.sql` script must be generated.
If a migration fails mid-way, run the rollback script manually via SQL editor:
```sql
-- Example PK Rollback
ALTER TABLE "RecordError" ALTER COLUMN "migrationRecordId" TYPE VARCHAR(30);
ALTER TABLE "RecordError" ALTER COLUMN "id" TYPE VARCHAR(30);
ALTER TABLE "MigrationRecord" ALTER COLUMN "id" TYPE VARCHAR(30);
```

### C. Resetting Prisma Migration History
After rolling back the physical database schema, notify Prisma that the migration has been reverted so it doesn't try to apply it again:
```bash
npx prisma migrate resolve --rolled-back <migration_name>
```

---

## 3. Disaster Recovery (DR) Execution Playbook

In the event of database corruption or hardware failover:

```text
Database Incident Detected
       │
       ▼
Isolate the DB (Set API to Read-Only mode / Maintenance)
       │
       ▼
Evaluate Data Loss
  ├── Case A: Failure during migration -> Reset to Pre-Migration Snapshot (Neon Branching)
  └── Case B: Data Corruption -> Point-in-Time Recovery (PITR) to last safe transaction
       │
       ▼
Re-Verify Database Constraints & Schema
       │
       ▼
Warm-Up Application Connection Pools
       │
       ▼
Restore API Services & Resume Migration Workers
```

---

## 4. Post-Migration Verification Checklist

Verify that the system is fully operational:
* [ ] Verify that NestJS API can establish a connection pool.
* [ ] Run `check-tables-prisma.js` to ensure the schema has all expected tables.
* [ ] Verify that the application can query and write to the database.
* [ ] Check that `_prisma_migrations` contains the newly applied migration record in a `success` state.
* [ ] Resume background workers and verify log outputs.
