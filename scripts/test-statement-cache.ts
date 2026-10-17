import { PrismaClient } from '@prisma/client';

const urlWithStatementCache0 = 'postgresql://postgres.yoaiiojfytefdmbdwiiv:hd6f3L31LlxrplPb@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres?pgbouncer=true&statement_cache_size=0';

async function test() {
  console.log('Testing port 6543 with statement_cache_size=0...');
  const prisma = new PrismaClient({
    datasources: { db: { url: urlWithStatementCache0 } },
    log: ['query'],
  });

  const t1 = performance.now();
  await prisma.$queryRaw`SELECT 1`;
  console.log(`Query time: ${(performance.now() - t1).toFixed(2)} ms`);
  await prisma.$disconnect();
}

test().catch(console.error);
