import { PrismaClient } from '@prisma/client';
import { PACKAGE_CARD_INCLUDES } from '../src/server/db/packages';

const url6543 = 'postgresql://postgres.yoaiiojfytefdmbdwiiv:hd6f3L31LlxrplPb@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres?pgbouncer=true';
const url5432 = 'postgresql://postgres.yoaiiojfytefdmbdwiiv:hd6f3L31LlxrplPb@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres';

async function test() {
  console.log('=== TEST 1: Port 6543 (Transaction Pooler) findMany ===');
  const prisma6543 = new PrismaClient({
    datasources: { db: { url: url6543 } },
    log: ['query'],
  });
  await prisma6543.$queryRaw`SELECT 1`; // warm up
  const t1 = performance.now();
  await prisma6543.package.findMany({
    where: { status: 'PUBLISHED', approvalStatus: 'APPROVED', isActive: true },
    take: 6,
    include: PACKAGE_CARD_INCLUDES,
  });
  console.log(`Port 6543 findMany: ${(performance.now() - t1).toFixed(2)} ms`);
  await prisma6543.$disconnect();

  console.log('\n=== TEST 2: Port 5432 (Session Mode) findMany ===');
  const prisma5432 = new PrismaClient({
    datasources: { db: { url: url5432 } },
    log: ['query'],
  });
  await prisma5432.$queryRaw`SELECT 1`; // warm up
  const t2 = performance.now();
  await prisma5432.package.findMany({
    where: { status: 'PUBLISHED', approvalStatus: 'APPROVED', isActive: true },
    take: 6,
    include: PACKAGE_CARD_INCLUDES,
  });
  console.log(`Port 5432 findMany: ${(performance.now() - t2).toFixed(2)} ms`);
  await prisma5432.$disconnect();
}

test().catch(console.error);
