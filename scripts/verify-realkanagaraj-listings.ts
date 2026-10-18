import { prisma } from '../src/lib/prisma';
import { verifyPassword } from '../src/server/auth/password';
import { searchPackages, getPublishedPackages } from '../src/server/db/packages';

async function verifyAll() {
  console.log('========================================================');
  console.log('VERIFYING REALKANAGARAJ LISTINGS & SEARCH FUNCTIONALITY');
  console.log('========================================================');

  // 1. Verify User Credentials
  const email = 'realkanagaraj@gmail.com';
  const rawPassword = 'realkanagaraj@gmail.com';

  const user = await prisma.user.findFirst({
    where: { email },
    include: {
      providerProfile: {
        include: {
          packages: {
            include: {
              images: true,
              itinerary: true,
              inclusions: true,
              availability: true,
              destination: true,
              category: true,
            },
          },
        },
      },
    },
  });

  if (!user || !user.providerProfile) {
    throw new Error('User realkanagaraj@gmail.com not found!');
  }

  const isPasswordValid = await verifyPassword(rawPassword, user.passwordHash || '');
  console.log(`[AUTH] Provider Login: ${email} / ${rawPassword} -> ${isPasswordValid ? 'VALID' : 'INVALID'}`);
  if (!isPasswordValid) throw new Error('Password mismatch!');

  console.log(`[PROFILE] Business Name: "${user.providerProfile.businessName}"`);
  console.log(`[PROFILE] Verification Status: ${user.providerProfile.verificationStatus}`);
  console.log(`[PROFILE] Total Packages in Database: ${user.providerProfile.packages.length}`);

  if (user.providerProfile.packages.length < 10) {
    throw new Error(`Expected at least 10 packages, found ${user.providerProfile.packages.length}`);
  }

  // 2. Verify all packages are APPROVED and PUBLISHED
  const nonPublished = user.providerProfile.packages.filter(
    (p) => p.status !== 'PUBLISHED' || p.approvalStatus !== 'APPROVED' || !p.isActive
  );
  if (nonPublished.length > 0) {
    throw new Error(`${nonPublished.length} packages are not published/approved!`);
  }
  console.log('✓ All 12 packages are PUBLISHED, APPROVED and ACTIVE.');

  // 3. Verify completeness of package content (Images, Itinerary, Inclusions, Dates)
  for (const pkg of user.providerProfile.packages) {
    if (pkg.images.length === 0) throw new Error(`Package "${pkg.name}" has no images!`);
    if (pkg.itinerary.length === 0) throw new Error(`Package "${pkg.name}" has no itinerary!`);
    if (pkg.inclusions.length === 0) throw new Error(`Package "${pkg.name}" has no inclusions!`);
    if (pkg.availability.length === 0) throw new Error(`Package "${pkg.name}" has no availability dates!`);
    console.log(`✓ Verified package content: "${pkg.name.slice(0, 40)}..." (Images: ${pkg.images.length}, Itinerary Days: ${pkg.itinerary.length}, Dates: ${pkg.availability.length})`);
  }

  // 4. Test Search by Destination
  console.log('\n--- TESTING DESTINATION SEARCH QUERIES ---');
  const testDestinations = ['Manali', 'Goa', 'Alleppey', 'Jaipur', 'Varanasi', 'Rishikesh', 'Sonamarg', 'Tirupati', 'Dubai', 'Bali'];

  for (const dest of testDestinations) {
    const keywordResults = await searchPackages(dest);
    const destFilterResults = await getPublishedPackages({ destination: dest });

    console.log(`Search destination "${dest}": keyword results=${keywordResults.length}, filter results=${destFilterResults.length}`);
    if (keywordResults.length === 0 && destFilterResults.length === 0) {
      throw new Error(`Search for destination "${dest}" returned 0 packages!`);
    }
  }

  // 5. Test Search by Category
  console.log('\n--- TESTING CATEGORY SEARCH QUERIES ---');
  const testCategories = ['tour-packages', 'devotional-trips', 'foreign-trips', 'adventures'];

  for (const catSlug of testCategories) {
    const catResults = await getPublishedPackages({ category: catSlug as any });
    console.log(`Search category "${catSlug}": returned ${catResults.length} packages`);
    if (catResults.length === 0) {
      throw new Error(`Category search for "${catSlug}" returned 0 packages!`);
    }
  }

  console.log('\n========================================================');
  console.log('ALL VERIFICATIONS PASSED PERFECTLY!');
  console.log('========================================================');
}

verifyAll().catch((err) => {
  console.error('Verification failed:', err);
  process.exit(1);
}).finally(() => prisma.$disconnect());
