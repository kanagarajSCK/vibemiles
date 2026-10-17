import { PrismaClient, ListingStatus, ApprovalStatus } from '@prisma/client';
import { getPublishedPackages, getPackageBySlug } from '../src/server/db/packages';
import { getDestinations, getDestinationBySlug } from '../src/server/db/destinations';
import { getCategories } from '../src/server/db/categories';

async function verifyLiveDb() {
  const prisma = new PrismaClient();
  console.log('=== VERIFYING LIVE SUPABASE DATABASE DATA ACCESS ===\n');

  try {
    // 1. Query live categories
    const categories = await getCategories();
    console.log('1. Categories returned from DB:', categories.length);
    console.log('   Sample category:', categories[0]?.name, `(${categories[0]?.slug})`);

    // 2. Query live destinations
    const destinations = await getDestinations();
    console.log('\n2. Destinations returned from DB:', destinations.length);
    console.log('   Sample destination:', destinations[0]?.name, `in ${destinations[0]?.state}`);

    // 3. Query live published packages
    const published = await getPublishedPackages();
    console.log('\n3. Published Packages returned from DB:', published.length);
    for (const pkg of published) {
      console.log(`   - [${pkg.id}] "${pkg.name}" (${pkg.category}) in ${pkg.destinationName}, Price: ₹${pkg.finalPrice}`);
    }

    // 4. Test detail by slug
    const sampleSlug = published[0]?.slug;
    if (sampleSlug) {
      const detail = await getPackageBySlug(sampleSlug);
      console.log(`\n4. Package detail for slug "${sampleSlug}":`);
      console.log(`   Name: ${detail?.name}`);
      console.log(`   Itinerary days: ${detail?.itinerary?.length}`);
      console.log(`   Inclusions count: ${detail?.inclusions?.length}`);
      console.log(`   Availability dates count: ${detail?.availableDates?.length}`);
      console.log(`   Images count: ${detail?.images?.length}`);
      console.log(`   Provider: ${detail?.providerName}`);
    }

    // 5. Moderation Verification Test:
    // Create a temporary DRAFT package directly via Prisma, verify it is NEVER returned by getPublishedPackages, then remove it.
    console.log('\n5. Testing Moderation Rules (DRAFT / PENDING_REVIEW exclusion):');
    const firstProvider = await prisma.providerProfile.findFirst();
    const firstCategory = await prisma.category.findFirst();
    const firstDest = await prisma.destination.findFirst();

    if (firstProvider && firstCategory && firstDest) {
      const testDraftSlug = 'test-draft-hidden-package-' + Date.now();
      const draftPkg = await prisma.package.create({
        data: {
          slug: testDraftSlug,
          name: 'Secret Draft Test Tour',
          description: 'This is a hidden draft that must never be publicly visible.',
          providerId: firstProvider.id,
          categoryId: firstCategory.id,
          destinationId: firstDest.id,
          state: 'Himachal Pradesh',
          durationDays: 3,
          durationNights: 2,
          maxGroupSize: 10,
          basePrice: 5000,
          finalPrice: 5000,
          status: ListingStatus.DRAFT, // DRAFT
          approvalStatus: ApprovalStatus.PENDING, // PENDING
          isActive: true,
        },
      });

      // Verify that getPublishedPackages does NOT return it
      const publicList = await getPublishedPackages();
      const leakedInList = publicList.some((p) => p.slug === testDraftSlug);

      // Verify that public getPackageBySlug does NOT return it
      const publicDetail = await getPackageBySlug(testDraftSlug, { requirePublished: true });

      // Clean up the test draft package
      await prisma.package.delete({ where: { id: draftPkg.id } });

      console.log(`   Draft package created with slug: ${testDraftSlug}`);
      console.log(`   Leaked into getPublishedPackages(): ${leakedInList} (EXPECTED: false)`);
      console.log(`   Accessible via public getPackageBySlug(): ${publicDetail !== null} (EXPECTED: false)`);

      if (!leakedInList && publicDetail === null) {
        console.log('   ✅ Moderation filter check PASSED: DRAFT packages are strictly hidden.');
      } else {
        console.error('   ❌ Moderation filter check FAILED: DRAFT package leaked!');
        process.exit(1);
      }
    }

    console.log('\n=== ALL LIVE DATABASE VERIFICATIONS PASSED ===');
  } catch (error) {
    console.error('Verification failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

verifyLiveDb();
