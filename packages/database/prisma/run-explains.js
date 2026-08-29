const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || process.env.x
    }
  }
});

async function runExplains() {
  console.log('--- RUNNING EXPLAIN STATEMENTS ON LIVE SCHEMA ---');
  
  try {
    const connPlan = await prisma.$queryRawUnsafe(`EXPLAIN ANALYZE SELECT * FROM "Connection" WHERE "environmentId" = 'env_cuid_1'`);
    console.log('\n1. Connection.environmentId EXPLAIN:');
    console.log(connPlan.map(l => l['QUERY PLAN']).join('\n'));

    const dmPlan = await prisma.$queryRawUnsafe(`EXPLAIN ANALYZE SELECT * FROM "DataModel" WHERE "connectionId" = 'conn_cuid_1'`);
    console.log('\n2. DataModel.connectionId EXPLAIN:');
    console.log(dmPlan.map(l => l['QUERY PLAN']).join('\n'));

    const mvPlan = await prisma.$queryRawUnsafe(`EXPLAIN ANALYZE SELECT * FROM "MappingVersion" WHERE "canonicalModelVersionId" = 'cm_cuid_1'`);
    console.log('\n3. MappingVersion.canonicalModelVersionId EXPLAIN:');
    console.log(mvPlan.map(l => l['QUERY PLAN']).join('\n'));

    const mcvPlan = await prisma.$queryRawUnsafe(`EXPLAIN ANALYZE SELECT * FROM "MigrationConfigurationVersion" WHERE "sourceConnectionId" = 'conn_cuid_1'`);
    console.log('\n4. MigrationConfigurationVersion.sourceConnectionId EXPLAIN:');
    console.log(mcvPlan.map(l => l['QUERY PLAN']).join('\n'));

    const rdPlan = await prisma.$queryRawUnsafe(`EXPLAIN ANALYZE SELECT * FROM "ReconciliationDiscrepancy" WHERE "sourceRecordId" = 'rec_1'`);
    console.log('\n5. ReconciliationDiscrepancy.sourceRecordId EXPLAIN:');
    console.log(rdPlan.map(l => l['QUERY PLAN']).join('\n'));

  } catch (err) {
    console.error('Error during explain queries:', err);
  } finally {
    await prisma.$disconnect();
  }
}

runExplains();
