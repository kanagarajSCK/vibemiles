import { prisma } from '../src/lib/prisma';

async function main() {
  const providers = await prisma.providerProfile.findMany({
    include: { documents: true, user: true },
  });
  console.log('Providers in DB:');
  for (const p of providers) {
    console.log(`- Provider ID: ${p.id}, User: ${p.user?.email}, Business: ${p.businessName}, Status: ${p.verificationStatus}, Docs: ${p.documents.length}`);
    for (const d of p.documents) {
      console.log(`   * Doc: [${d.type}] ${d.fileName} -> Status: ${d.status}, FilePath: ${d.filePath}`);
    }
  }
}

main()
  .catch((e) => console.error(e))
  .finally(() => prisma.$disconnect());
