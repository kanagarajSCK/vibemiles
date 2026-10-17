import { PrismaClient } from '@prisma/client';

async function inspectDb() {
  const prisma = new PrismaClient();
  try {
    const tables = await prisma.$queryRaw<Array<{ table_name: string }>>`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `;
    console.log('EXISTING_PUBLIC_TABLES:', tables.map((t) => t.table_name));

    // Check if _prisma_migrations table exists
    const hasMigrationsTable = tables.some((t) => t.table_name === '_prisma_migrations');
    if (hasMigrationsTable) {
      const migrations = await prisma.$queryRaw<Array<{ migration_name: string; finished_at: string }>>`
        SELECT migration_name, finished_at FROM "_prisma_migrations" ORDER BY finished_at;
      `;
      console.log('EXISTING_MIGRATIONS:', migrations);
    } else {
      console.log('NO_MIGRATIONS_TABLE_FOUND: Database is clean / unmigrated.');
    }
  } catch (error) {
    const raw = error instanceof Error ? error.message : String(error);
    const sanitized = raw.replace(/postgres(?:ql)?:\/\/[^@]+@/gi, 'postgresql://[REDACTED]@');
    console.error('INSPECTION_FAILED:', sanitized);
  } finally {
    await prisma.$disconnect();
  }
}

inspectDb();
