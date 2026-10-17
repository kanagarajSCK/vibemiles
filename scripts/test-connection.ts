import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

// Helper to safely load .env if not already loaded into process.env
function loadEnvFile() {
  const envPath = path.resolve(process.cwd(), '.env');
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf8');
    for (const line of content.split('\n')) {
      const match = line.match(/^\s*([\w_]+)\s*=\s*(?:["']?)(.*?)(?:["']?)\s*$/);
      if (match) {
        const [, key, val] = match;
        if (!process.env[key]) {
          process.env[key] = val;
        }
      }
    }
  }
}

loadEnvFile();

function sanitizeOutput(text: string): string {
  return text
    .replace(/postgres(?:ql)?:\/\/[^@]+@/gi, 'postgresql://[REDACTED]@')
    .replace(/password=[^&\s]+/gi, 'password=[REDACTED]');
}

async function testConnections() {
  console.log('Testing Supabase PostgreSQL Connection...\n');

  // 1. Test pooled connection (DATABASE_URL)
  const pooledPrisma = new PrismaClient();
  let pooledSuccess = false;
  let dbName = '';
  let currentUser = '';
  let pgVersion = '';

  try {
    const pooledResult = await pooledPrisma.$queryRaw<Array<{ connected: number; database_name: string; current_user: string; version: string }>>`
      SELECT 1 as connected, current_database() as database_name, current_user as current_user, version() as version
    `;
    if (pooledResult && pooledResult.length > 0) {
      pooledSuccess = true;
      dbName = pooledResult[0].database_name;
      currentUser = pooledResult[0].current_user;
      pgVersion = pooledResult[0].version ? pooledResult[0].version.split(',')[0] : '';
    }
    console.log('POOLED_CONNECTION (DATABASE_URL): SUCCESS');
  } catch (error) {
    const raw = error instanceof Error ? error.message : String(error);
    console.error('POOLED_CONNECTION (DATABASE_URL): FAILED ->\n', sanitizeOutput(raw));
  } finally {
    await pooledPrisma.$disconnect();
  }

  // 2. Test direct connection (DIRECT_URL) for migrations
  const directUrl = process.env.DIRECT_URL;
  let directSuccess = false;

  if (directUrl) {
    const directPrisma = new PrismaClient({
      datasources: {
        db: {
          url: directUrl,
        },
      },
    });

    try {
      const directResult = await directPrisma.$queryRaw<Array<{ connected: number }>>`
        SELECT 1 as connected
      `;
      if (directResult && directResult.length > 0) {
        directSuccess = true;
      }
      console.log('DIRECT_CONNECTION (DIRECT_URL): SUCCESS');
    } catch (error) {
      const raw = error instanceof Error ? error.message : String(error);
      console.error('DIRECT_CONNECTION (DIRECT_URL): FAILED ->\n', sanitizeOutput(raw));
    } finally {
      await directPrisma.$disconnect();
    }
  } else {
    console.log('DIRECT_CONNECTION (DIRECT_URL): SKIPPED (DIRECT_URL not set)');
  }

  console.log('\n--- VERIFICATION RESULT ---');
  console.log({
    pooledConnection: pooledSuccess ? 'SUCCESS' : 'FAILED',
    directConnection: directSuccess ? 'SUCCESS' : (directUrl ? 'FAILED' : 'NOT_SET'),
    databaseName: dbName || undefined,
    currentUser: currentUser || undefined,
    postgresVersion: pgVersion || undefined,
  });

  if (!pooledSuccess || !directSuccess) {
    process.exit(1);
  }
}

testConnections();
