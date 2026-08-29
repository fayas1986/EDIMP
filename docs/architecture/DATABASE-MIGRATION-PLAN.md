# Database Migration Plan

This plan outlines the zero-downtime execution roadmap for applying database index tuning and timestamp standardization to the EDIMP platform without data loss or downtime.

---

## 1. Migration Steps & Guidelines

To enforce safety, all changes must follow a controlled migration lifecycle:
1. **Never use `prisma db push` on staging/production.** It bypasses migration history tracking and can result in silent data loss.
2. **Generate Reviewed Migration**: Run migration generation locally:
   ```bash
   npx prisma migrate dev --create-only --name db_hardening
   ```
3. **Inspect the SQL**: Review the generated `.sql` file in `packages/database/prisma/migrations/` to verify it conforms to the target PostgreSQL changes.
4. **Apply Migration**:
   * Staging/Prod: `npx prisma migrate deploy`
   * Local: `npx prisma migrate dev`

---

## 2. TIMESTAMPTZ(6) UTC Standardization

To prevent timezone synchronization issues across the globally distributed control plane, NestJS workers, and databases:

1. **Prisma Type Mapping**: Add `@db.Timestamptz(6)` to all DateTime properties in `schema.prisma`.
2. **UTC Conversion Procedure**:
   * When modifying existing column types to `TIMESTAMPTZ`, PostgreSQL automatically converts the current `TIMESTAMP` values using the database server session's timezone.
   * To guarantee timezone consistency, the migration script will set the timezone context to UTC explicitly before executing the column alter statements:
     ```sql
     SET TIME ZONE 'UTC';
     ALTER TABLE "Connection" ALTER COLUMN "createdAt" TYPE TIMESTAMPTZ(6);
     ```
3. **Application Standardization**:
   * **API Handlers**: Serialize all outgoing date strings in ISO 8601 UTC format (`YYYY-MM-DDTHH:mm:ss.sssZ`).
   * **Database Connection**: Set connection session timezone to UTC.
   * **Workers**: Run in UTC node environments (`process.env.TZ = 'UTC'`).
   * **MCP / Audit**: Format log output exclusively in UTC.

---

## 3. BIGINT Serialization Specification

If BIGINT primary keys are approved for data plane execution tables:
* **JS Number Overflow**: JavaScript's `Number` type represents double-precision floats, limiting safe integers to $2^{53} - 1$ (`Number.MAX_SAFE_INTEGER` = `9,007,199,254,740,991`). High-volume database sequences can easily exceed this limit.
* **REST & MCP Rule**: All BIGINT values returned in REST API payloads or MCP tool responses must be serialized as **Strings** (e.g. `"id": "9007199254740992"`).
* **NestJS Implementation**:
  We will configure a global serializer interceptor or configure JSON stringify options:
  ```typescript
  // BigInt Serializer Interceptor
  (BigInt.prototype as any).toJSON = function () {
    return this.toString();
  };
  ```

---

## 4. Regression Verification Checklist

After any schema migrations are applied, the following regression verification commands must be run sequentially. If any step fails, the migration must be rolled back.

```bash
# 1. Validate Prisma schema file integrity
npx prisma validate

# 2. Generate updated Prisma Client types
npx prisma generate

# 3. Verify TypeScript code compilation and formatting
npm run lint

# 4. Compile the NestJS application
npm run build

# 5. Run unit and integration tests
npm run test

# 6. Run end-to-end (E2E) database-connected tests
npm run test:e2e
```
No database change will be promoted to production without all checks passing.

---

## 5. Migration Execution Log

* **Migration**: `20260821000000_phase6_7_sync`
  * **Date Applied**: August 22, 2026
  * **Purpose**: Synchronize local migrations history with Phase 6 and Phase 7 tables pushed previously via `db push`.
  * **Method**: Applied to Neon schema using `npx prisma migrate resolve --applied`.
* **Migration**: `20260822192700_db_hardening`
  * **Date Applied**: August 22, 2026
  * **Purpose**: Standardize `TIMESTAMPTZ(6)` under UTC, add target FK indexes, drop redundant index.
  * **Method**: Run via `npx prisma migrate deploy` on Neon PostgreSQL database.
* **Regression Testing**: All verification checks passed, including ESLint, type-checking, build compilation, and E2E NestJS suites.

