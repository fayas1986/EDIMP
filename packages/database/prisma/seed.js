const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('Start seeding...');

  // 1. Tenant
  const tenant = await prisma.tenant.upsert({
    where: { id: 'default-tenant-id' },
    update: {},
    create: {
      id: 'default-tenant-id',
      name: 'Acme Corp',
    },
  });
  console.log(`Upserted tenant: ${tenant.name}`);

  // 2. Workspace
  const workspace = await prisma.workspace.upsert({
    where: { id: 'default-workspace-id' },
    update: {},
    create: {
      id: 'default-workspace-id',
      tenantId: tenant.id,
      name: 'Data Engineering',
    },
  });
  console.log(`Upserted workspace: ${workspace.name}`);

  // 3. Environment
  const environment = await prisma.environment.upsert({
    where: { id: 'default-environment-id' },
    update: {},
    create: {
      id: 'default-environment-id',
      workspaceId: workspace.id,
      name: 'Development',
      status: 'ACTIVE',
    },
  });
  console.log(`Upserted environment: ${environment.name}`);

  // 4. Connector Types
  const postgresConnector = await prisma.connectorType.upsert({
    where: { name: 'postgres' },
    update: {},
    create: {
      name: 'postgres',
      category: 'DATABASE',
      direction: 'BOTH',
      capabilities: { batch: true, schema_discovery: true },
    },
  });
  console.log(`Upserted connector type: ${postgresConnector.name}`);

  const salesforceConnector = await prisma.connectorType.upsert({
    where: { name: 'salesforce' },
    update: {},
    create: {
      name: 'salesforce',
      category: 'CRM',
      direction: 'BOTH',
      capabilities: { batch: true, schema_discovery: true, bulk_api: true },
    },
  });
  console.log(`Upserted connector type: ${salesforceConnector.name}`);

  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
