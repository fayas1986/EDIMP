const path = require('path');
const dotenv = require('dotenv');

// Locate the .env file in the workspace root
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || process.env.x
    }
  }
});

// Helper to generate a dummy CUID-like string
function generateCuidLike() {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = 'c';
  for (let i = 0; i < 24; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Helper to generate a random UUID
function generateUuid() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

async function runBenchmark() {
  console.log('--- STARTING POSTGRESQL PRIMARY KEY BENCHMARK ---');
  console.log('Connecting to database...');

  try {
    // 1. CLEANUP OLD BENCHMARK TABLES IF THEY EXIST
    console.log('Cleaning up old test tables...');
    await prisma.$executeRawUnsafe(`DROP TABLE IF EXISTS benchmark_cuid_detail CASCADE;`);
    await prisma.$executeRawUnsafe(`DROP TABLE IF EXISTS benchmark_uuid_detail CASCADE;`);
    await prisma.$executeRawUnsafe(`DROP TABLE IF EXISTS benchmark_bigint_detail CASCADE;`);
    await prisma.$executeRawUnsafe(`DROP TABLE IF EXISTS benchmark_cuid CASCADE;`);
    await prisma.$executeRawUnsafe(`DROP TABLE IF EXISTS benchmark_uuid CASCADE;`);
    await prisma.$executeRawUnsafe(`DROP TABLE IF EXISTS benchmark_bigint CASCADE;`);

    // 2. CREATE BENCHMARK TABLES
    console.log('Creating benchmark tables...');
    await prisma.$executeRawUnsafe(`
      CREATE TABLE benchmark_cuid (
        id VARCHAR(30) PRIMARY KEY,
        data TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    await prisma.$executeRawUnsafe(`
      CREATE TABLE benchmark_uuid (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        data TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    await prisma.$executeRawUnsafe(`
      CREATE TABLE benchmark_bigint (
        id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        data TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // Create detail tables for JOIN benchmarks
    await prisma.$executeRawUnsafe(`
      CREATE TABLE benchmark_cuid_detail (
        id VARCHAR(30) PRIMARY KEY,
        master_id VARCHAR(30) REFERENCES benchmark_cuid(id),
        val INT NOT NULL
      );
    `);
    await prisma.$executeRawUnsafe(`
      CREATE TABLE benchmark_uuid_detail (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        master_id UUID REFERENCES benchmark_uuid(id),
        val INT NOT NULL
      );
    `);
    await prisma.$executeRawUnsafe(`
      CREATE TABLE benchmark_bigint_detail (
        id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        master_id BIGINT REFERENCES benchmark_bigint(id),
        val INT NOT NULL
      );
    `);

    console.log('Tables created. Generating test data...');

    const ROW_COUNT = 10000;
    const cuids = [];
    const uuids = [];
    const bigintIds = []; // We will get these after inserts

    // Prepare arrays
    for (let i = 0; i < ROW_COUNT; i++) {
      cuids.push(generateCuidLike());
      uuids.push(generateUuid());
    }

    // 3. BENCHMARK INSERTS
    console.log(`Inserting ${ROW_COUNT} rows into each table...`);

    // A. CUID Inserts
    const startCuidInsert = Date.now();
    // Batch in chunks of 1000 to prevent parameterized limit issues
    const chunkSize = 1000;
    for (let i = 0; i < ROW_COUNT; i += chunkSize) {
      const chunk = cuids.slice(i, i + chunkSize);
      const valuesSql = chunk.map(id => `('${id}', 'Benchmark test data string payload here ${id}')`).join(',');
      await prisma.$executeRawUnsafe(`INSERT INTO benchmark_cuid (id, data) VALUES ${valuesSql}`);
    }
    const cuidInsertTime = Date.now() - startCuidInsert;
    console.log(`- CUID: ${cuidInsertTime}ms`);

    // B. UUID Inserts
    const startUuidInsert = Date.now();
    for (let i = 0; i < ROW_COUNT; i += chunkSize) {
      const chunk = uuids.slice(i, i + chunkSize);
      const valuesSql = chunk.map(id => `('${id}', 'Benchmark test data string payload here ${id}')`).join(',');
      await prisma.$executeRawUnsafe(`INSERT INTO benchmark_uuid (id, data) VALUES ${valuesSql}`);
    }
    const uuidInsertTime = Date.now() - startUuidInsert;
    console.log(`- UUID: ${uuidInsertTime}ms`);

    // C. BIGINT Inserts
    const startBigintInsert = Date.now();
    for (let i = 0; i < ROW_COUNT; i += chunkSize) {
      const valuesArr = [];
      for (let j = 0; j < chunkSize; j++) {
        valuesArr.push(`('Benchmark test data string payload here ${i+j}')`);
      }
      await prisma.$executeRawUnsafe(`INSERT INTO benchmark_bigint (data) VALUES ${valuesArr.join(',')}`);
    }
    const bigintInsertTime = Date.now() - startBigintInsert;
    console.log(`- BIGINT: ${bigintInsertTime}ms`);

    // Populate detail tables to test JOIN performance
    console.log('Populating detail tables for JOIN benchmarks...');
    // We need to fetch BIGINT IDs first
    const bigintRows = await prisma.$queryRawUnsafe(`SELECT id FROM benchmark_bigint LIMIT ${ROW_COUNT}`);
    bigintRows.forEach(r => bigintIds.push(r.id.toString()));

    for (let i = 0; i < ROW_COUNT; i += chunkSize) {
      // CUID details
      const cuidChunk = cuids.slice(i, i + chunkSize);
      const cuidDetailSql = cuidChunk.map(masterId => `('${generateCuidLike()}', '${masterId}', ${Math.floor(Math.random() * 1000)})`).join(',');
      await prisma.$executeRawUnsafe(`INSERT INTO benchmark_cuid_detail (id, master_id, val) VALUES ${cuidDetailSql}`);

      // UUID details
      const uuidChunk = uuids.slice(i, i + chunkSize);
      const uuidDetailSql = uuidChunk.map(masterId => `('${generateUuid()}', '${masterId}', ${Math.floor(Math.random() * 1000)})`).join(',');
      await prisma.$executeRawUnsafe(`INSERT INTO benchmark_uuid_detail (id, master_id, val) VALUES ${uuidDetailSql}`);

      // BIGINT details
      const bigintChunk = bigintIds.slice(i, i + chunkSize);
      const bigintDetailSql = bigintChunk.map(masterId => `(${masterId}, ${Math.floor(Math.random() * 1000)})`).join(',');
      await prisma.$executeRawUnsafe(`INSERT INTO benchmark_bigint_detail (master_id, val) VALUES ${bigintDetailSql}`);
    }

    // 4. STORAGE MEASUREMENT
    console.log('Measuring database storage sizes...');
    const sizes = await prisma.$queryRawUnsafe(`
      SELECT 
        (SELECT pg_relation_size('benchmark_cuid')) as cuid_tbl,
        (SELECT pg_indexes_size('benchmark_cuid')) as cuid_idx,
        (SELECT pg_relation_size('benchmark_cuid_detail')) as cuid_det_tbl,
        (SELECT pg_indexes_size('benchmark_cuid_detail')) as cuid_det_idx,

        (SELECT pg_relation_size('benchmark_uuid')) as uuid_tbl,
        (SELECT pg_indexes_size('benchmark_uuid')) as uuid_idx,
        (SELECT pg_relation_size('benchmark_uuid_detail')) as uuid_det_tbl,
        (SELECT pg_indexes_size('benchmark_uuid_detail')) as uuid_det_idx,

        (SELECT pg_relation_size('benchmark_bigint')) as bigint_tbl,
        (SELECT pg_indexes_size('benchmark_bigint')) as bigint_idx,
        (SELECT pg_relation_size('benchmark_bigint_detail')) as bigint_det_tbl,
        (SELECT pg_indexes_size('benchmark_bigint_detail')) as bigint_det_idx
    `);

    const s = sizes[0];
    const cuidTotal = Number(s.cuid_tbl) + Number(s.cuid_idx) + Number(s.cuid_det_tbl) + Number(s.cuid_det_idx);
    const uuidTotal = Number(s.uuid_tbl) + Number(s.uuid_idx) + Number(s.uuid_det_tbl) + Number(s.uuid_det_idx);
    const bigintTotal = Number(s.bigint_tbl) + Number(s.bigint_idx) + Number(s.bigint_det_tbl) + Number(s.bigint_det_idx);

    console.log(`Storage results (bytes):`);
    console.log(`- CUID: Master Table = ${s.cuid_tbl}, Master Index = ${s.cuid_idx}, Total Master+Detail+Indexes = ${cuidTotal}`);
    console.log(`- UUID: Master Table = ${s.uuid_tbl}, Master Index = ${s.uuid_idx}, Total Master+Detail+Indexes = ${uuidTotal}`);
    console.log(`- BIGINT: Master Table = ${s.bigint_tbl}, Master Index = ${s.bigint_idx}, Total Master+Detail+Indexes = ${bigintTotal}`);

    // 5. QUERY LATENCY MEASUREMENTS (Point lookups)
    console.log('Measuring lookup latencies (10 repetitions)...');
    const REPS = 10;
    
    // CUID point lookup
    const cuidToQuery = cuids.slice(0, REPS);
    const startCuidLookup = Date.now();
    for (let i = 0; i < REPS; i++) {
      await prisma.$queryRawUnsafe(`SELECT * FROM benchmark_cuid WHERE id = '${cuidToQuery[i]}'`);
    }
    const cuidLookupTime = (Date.now() - startCuidLookup) / REPS;

    // UUID point lookup
    const uuidToQuery = uuids.slice(0, REPS);
    const startUuidLookup = Date.now();
    for (let i = 0; i < REPS; i++) {
      await prisma.$queryRawUnsafe(`SELECT * FROM benchmark_uuid WHERE id = '${uuidToQuery[i]}'`);
    }
    const uuidLookupTime = (Date.now() - startUuidLookup) / REPS;

    // BIGINT point lookup
    const bigintToQuery = bigintIds.slice(0, REPS);
    const startBigintLookup = Date.now();
    for (let i = 0; i < REPS; i++) {
      await prisma.$queryRawUnsafe(`SELECT * FROM benchmark_bigint WHERE id = ${bigintToQuery[i]}`);
    }
    const bigintLookupTime = (Date.now() - startBigintLookup) / REPS;

    console.log(`Average Lookup Latency:`);
    console.log(`- CUID: ${cuidLookupTime.toFixed(4)} ms`);
    console.log(`- UUID: ${uuidLookupTime.toFixed(4)} ms`);
    console.log(`- BIGINT: ${bigintLookupTime.toFixed(4)} ms`);

    // 6. JOIN PERFORMANCE
    console.log('Measuring JOIN performance (10 repetitions)...');
    
    // CUID JOIN
    const startCuidJoin = Date.now();
    for (let i = 0; i < REPS; i++) {
      await prisma.$queryRawUnsafe(`
        SELECT m.id, m.created_at, d.val 
        FROM benchmark_cuid m 
        JOIN benchmark_cuid_detail d ON m.id = d.master_id 
        WHERE m.id = '${cuidToQuery[i]}'
      `);
    }
    const cuidJoinTime = (Date.now() - startCuidJoin) / REPS;

    // UUID JOIN
    const startUuidJoin = Date.now();
    for (let i = 0; i < REPS; i++) {
      await prisma.$queryRawUnsafe(`
        SELECT m.id, m.created_at, d.val 
        FROM benchmark_uuid m 
        JOIN benchmark_uuid_detail d ON m.id = d.master_id 
        WHERE m.id = '${uuidToQuery[i]}'
      `);
    }
    const uuidJoinTime = (Date.now() - startUuidJoin) / REPS;

    // BIGINT JOIN
    const startBigintJoin = Date.now();
    for (let i = 0; i < REPS; i++) {
      await prisma.$queryRawUnsafe(`
        SELECT m.id, m.created_at, d.val 
        FROM benchmark_bigint m 
        JOIN benchmark_bigint_detail d ON m.id = d.master_id 
        WHERE m.id = ${bigintToQuery[i]}
      `);
    }
    const bigintJoinTime = (Date.now() - startBigintJoin) / REPS;

    console.log(`Average JOIN Latency:`);
    console.log(`- CUID: ${cuidJoinTime.toFixed(4)} ms`);
    console.log(`- UUID: ${uuidJoinTime.toFixed(4)} ms`);
    console.log(`- BIGINT: ${bigintJoinTime.toFixed(4)} ms`);

    // 7. EXPLAIN ANALYZE CAPTURE
    console.log('Capturing EXPLAIN ANALYZE output...');
    const cuidExplain = await prisma.$queryRawUnsafe(`EXPLAIN ANALYZE SELECT m.id FROM benchmark_cuid m JOIN benchmark_cuid_detail d ON m.id = d.master_id WHERE m.id = '${cuidToQuery[0]}'`);
    const uuidExplain = await prisma.$queryRawUnsafe(`EXPLAIN ANALYZE SELECT m.id FROM benchmark_uuid m JOIN benchmark_uuid_detail d ON m.id = d.master_id WHERE m.id = '${uuidToQuery[0]}'`);
    const bigintExplain = await prisma.$queryRawUnsafe(`EXPLAIN ANALYZE SELECT m.id FROM benchmark_bigint m JOIN benchmark_bigint_detail d ON m.id = d.master_id WHERE m.id = ${bigintToQuery[0]}`);

    console.log('\n--- CUID EXPLAIN ANALYZE ---');
    console.log(cuidExplain.map(l => l['QUERY PLAN']).join('\n'));

    console.log('\n--- UUID EXPLAIN ANALYZE ---');
    console.log(uuidExplain.map(l => l['QUERY PLAN']).join('\n'));

    console.log('\n--- BIGINT EXPLAIN ANALYZE ---');
    console.log(bigintExplain.map(l => l['QUERY PLAN']).join('\n'));

    // Print summary tables in markdown
    console.log('\n--- SUMMARY REPORT DATA ---');
    console.log(`
| Metric | CUID (String) | UUID (Native) | BIGINT (Identity) |
|---|---|---|---|
| Row Storage (10k rows) | ${s.cuid_tbl} B | ${s.uuid_tbl} B | ${s.bigint_tbl} B |
| Primary Key Index Size | ${s.cuid_idx} B | ${s.uuid_idx} B | ${s.bigint_idx} B |
| Detail Table size | ${s.cuid_det_tbl} B | ${s.uuid_det_tbl} B | ${s.bigint_det_tbl} B |
| Detail FK Index Size | ${s.cuid_det_idx} B | ${s.uuid_det_idx} B | ${s.bigint_det_idx} B |
| Insert Time (10k rows) | ${cuidInsertTime} ms | ${uuidInsertTime} ms | ${bigintInsertTime} ms |
| Avg Point Lookup Latency | ${cuidLookupTime.toFixed(4)} ms | ${uuidLookupTime.toFixed(4)} ms | ${bigintLookupTime.toFixed(4)} ms |
| Avg JOIN Latency | ${cuidJoinTime.toFixed(4)} ms | ${uuidJoinTime.toFixed(4)} ms | ${bigintJoinTime.toFixed(4)} ms |
    `);

    // 8. CLEANUP
    console.log('Dropping benchmark tables...');
    await prisma.$executeRawUnsafe(`DROP TABLE benchmark_cuid_detail;`);
    await prisma.$executeRawUnsafe(`DROP TABLE benchmark_uuid_detail;`);
    await prisma.$executeRawUnsafe(`DROP TABLE benchmark_bigint_detail;`);
    await prisma.$executeRawUnsafe(`DROP TABLE benchmark_cuid;`);
    await prisma.$executeRawUnsafe(`DROP TABLE benchmark_uuid;`);
    await prisma.$executeRawUnsafe(`DROP TABLE benchmark_bigint;`);
    console.log('Cleanup completed.');

  } catch (err) {
    console.error('Error during benchmark execution:', err);
  } finally {
    await prisma.$disconnect();
    console.log('Disconnected.');
  }
}

runBenchmark();
