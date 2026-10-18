import { prisma } from '../src/lib/prisma';

async function main() {
  const users = await prisma.user.findMany({
    where: {
      email: { in: ['vembarsan00@gmail.com', 'kanagarajsck@gmail.com', 'kanagarajdemo2@gmail.com', '2kanagaraj@gmail.com'] }
    },
    include: {
      providerProfile: {
        include: { documents: true }
      }
    }
  });
  console.log(JSON.stringify(users, null, 2));

  const auditLogs = await prisma.auditLog.findMany({
    where: {
      targetType: { in: ['PROVIDER', 'ProviderDocument', 'USER'] }
    },
    orderBy: { createdAt: 'desc' },
    take: 10
  });
  console.log('Recent Audit Logs:', JSON.stringify(auditLogs, null, 2));
}

main().finally(() => prisma.$disconnect());
