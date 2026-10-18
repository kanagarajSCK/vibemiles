import { prisma } from '../src/lib/prisma';
import { recomputeProviderVerificationStatus } from '../src/server/db/provider-documents';

async function main() {
  console.log('--- RECOMPUTING ALL PROVIDER VERIFICATION STATUSES ---');
  const providers = await prisma.providerProfile.findMany({
    include: { documents: true, user: true },
  });

  for (const p of providers) {
    const prevStatus = p.verificationStatus;
    const newStatus = await recomputeProviderVerificationStatus(p.id);
    console.log(
      `Provider [${p.id}] (${p.user?.email || p.businessName}): docsCount=${p.documents.length} | Old: ${prevStatus} -> New: ${newStatus}`
    );
  }

  console.log('--- DONE RECOMPUTING ALL PROVIDERS ---');
}

main()
  .catch((err) => {
    console.error('Migration error:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
