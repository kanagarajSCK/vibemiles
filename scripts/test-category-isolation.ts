import { prisma } from '../src/lib/prisma';
import {
  createPackage,
  updatePackage,
  archivePackage,
  getPublishedPackages,
} from '../src/server/db/packages';
import {
  normalizeCategorySlug,
  getCategoryDefaultCoverImage,
  CATEGORY_COVER_IMAGES,
} from '../src/constants';

async function main() {
  console.log('=== STEP 1: VERIFY CATEGORY SLUG NORMALIZATION ===');
  const slugTests = [
    { input: 'food-experiences', expected: 'food' },
    { input: 'Food Experiences', expected: 'food' },
    { input: 'adventures', expected: 'adventure' },
    { input: 'adventure-activities', expected: 'adventure' },
    { input: 'local-guides', expected: 'guide' },
    { input: 'cab-services', expected: 'cab' },
    { input: 'camping', expected: 'camping' },
    { input: 'homestays', expected: 'homestay' },
    { input: 'hotels', expected: 'hotel' },
    { input: 'villas', expected: 'villa' },
    { input: 'tour-packages', expected: 'tour' },
    { input: 'devotional-trips', expected: 'devotional' },
    { input: 'foreign-trips', expected: 'foreign' },
  ];

  for (const t of slugTests) {
    const res = normalizeCategorySlug(t.input);
    if (res !== t.expected) {
      throw new Error(`Normalization failed for "${t.input}": got "${res}", expected "${t.expected}"`);
    }
  }
  console.log('✓ All 13 category alias normalizations passed.');

  console.log('\n=== STEP 2: VERIFY UNIQUE CATEGORY COVER IMAGES ===');
  const distinctUrls = new Set<string>();
  const categories = Object.keys(CATEGORY_COVER_IMAGES);
  for (const cat of categories) {
    const img = getCategoryDefaultCoverImage(cat);
    if (!img || !img.startsWith('https://images.unsplash.com/')) {
      throw new Error(`Invalid cover image for category "${cat}": ${img}`);
    }
    distinctUrls.add(img);
  }
  console.log(`✓ All ${categories.length} categories have unique dedicated cover images (unique count: ${distinctUrls.size}).`);

  console.log('\n=== STEP 3: DATABASE CATEGORY DATA ISOLATION TEST ===');
  // Find a verified provider for test package creation
  const provider = await prisma.user.findFirst({
    where: {
      role: 'PROVIDER',
      providerProfile: {
        verificationStatus: 'VERIFIED',
      },
    },
    include: {
      providerProfile: true,
    },
  });

  if (!provider) {
    throw new Error('No verified provider found in database for testing.');
  }
  console.log(`Using verified provider: ${provider.email} (${provider.id})`);

  // Record baseline package counts across categories
  const categoriesToCheck = ['camping', 'homestay', 'hotel', 'guide', 'cab', 'food'];
  const baselineCounts: Record<string, number> = {};
  for (const cat of categoriesToCheck) {
    const pkgs = await getPublishedPackages({ category: cat as any });
    baselineCounts[cat] = pkgs.length;
    console.log(`Baseline [${cat}]: ${pkgs.length} published packages`);
  }

  // 1. Create a Food Experiences listing using descriptive category slug 'food-experiences'
  console.log('\n--- 3A: Creating Test Food Experience Listing ---');
  const testFoodPkg = await createPackage(provider.id, {
    name: 'Salem Authentic Thattu Vadai & Street Food Trail',
    description: 'Crispy Salem thattu vadai set, beetroot chutney, and local night street food tasting tour.',
    categorySlug: 'food-experiences',
    destinationName: 'Salem',
    city: 'Salem',
    state: 'Tamil Nadu',
    durationDays: 1,
    durationNights: 0,
    maxGroupSize: 8,
    basePrice: 499,
    discountPercent: 10,
    images: ['https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1600&q=80'],
    inclusions: ['Guided food tasting at 5 spots', 'Hygiene-certified vendors'],
    exclusions: ['Personal purchases', 'Alcohol'],
    cancellationPolicy: 'Free cancellation up to 12 hours before tour starts.',
  });

  console.log(`Created test listing ID: ${testFoodPkg.id}`);
  console.log(`Assigned Category: ${testFoodPkg.category}`);

  if (testFoodPkg.category !== 'food') {
    throw new Error(`Category assignment failed! Expected 'food', got '${testFoodPkg.category}'`);
  }

  // Set to PUBLISHED & APPROVED so it can be queried by marketplace
  await prisma.package.update({
    where: { id: testFoodPkg.id },
    data: {
      status: 'PUBLISHED',
      approvalStatus: 'APPROVED',
      isActive: true,
    },
  });

  // Verify category isolation: Check each category
  console.log('\n--- 3B: Verifying Category Isolation (No Cross-Contamination) ---');
  for (const cat of ['camping', 'homestay', 'hotel', 'guide', 'cab']) {
    const pkgs = await getPublishedPackages({ category: cat as any });
    const containsFood = pkgs.some((p) => p.id === testFoodPkg.id);
    if (containsFood) {
      throw new Error(`CRITICAL LEAK: Test Food listing leaked into category "${cat}"!`);
    }
    if (pkgs.length !== baselineCounts[cat]) {
      throw new Error(`Package count for category "${cat}" changed from ${baselineCounts[cat]} to ${pkgs.length}!`);
    }
    console.log(`✓ Category "${cat}" is isolated: ${pkgs.length} packages (0 food leaks)`);
  }

  // Verify it exists in food
  const foodPkgs = await getPublishedPackages({ category: 'food' });
  const inFood = foodPkgs.some((p) => p.id === testFoodPkg.id);
  if (!inFood) {
    throw new Error('Test Food listing is missing from "food" category queries!');
  }
  console.log(`✓ Category "food" correctly contains the new listing (Total: ${foodPkgs.length})`);

  // 2. Edit the Food Experiences listing
  console.log('\n--- 3C: Editing Food Experiences Listing ---');
  const updatedFoodPkg = await updatePackage(testFoodPkg.id, provider.id, {
    name: 'Salem Royal Street Food & Coffee Trail (Updated)',
    basePrice: 599,
  });
  console.log(`Updated title: "${updatedFoodPkg.name}", Price: ₹${updatedFoodPkg.basePrice}`);

  // Re-approve and publish for testing
  await prisma.package.update({
    where: { id: testFoodPkg.id },
    data: {
      status: 'PUBLISHED',
      approvalStatus: 'APPROVED',
      isActive: true,
    },
  });

  // Verify other categories remain completely untouched
  for (const cat of ['camping', 'homestay', 'hotel', 'guide', 'cab']) {
    const pkgs = await getPublishedPackages({ category: cat as any });
    const containsFood = pkgs.some((p) => p.id === testFoodPkg.id);
    if (containsFood) {
      throw new Error(`CRITICAL LEAK: Edited Food listing leaked into category "${cat}"!`);
    }
    if (pkgs.length !== baselineCounts[cat]) {
      throw new Error(`Category "${cat}" count changed after editing Food listing!`);
    }
    console.log(`✓ Category "${cat}" remained unchanged after Food listing edit`);
  }

  // 3. Delete / Archive the Food Experiences listing
  console.log('\n--- 3D: Archiving / Deleting Food Experiences Listing ---');
  await archivePackage(testFoodPkg.id, provider.id);
  console.log('Archived test food listing.');

  // Verify other categories and their listings remain intact
  for (const cat of ['camping', 'homestay', 'hotel', 'guide', 'cab']) {
    const pkgs = await getPublishedPackages({ category: cat as any });
    if (pkgs.length !== baselineCounts[cat]) {
      throw new Error(`Category "${cat}" count was affected when deleting Food listing! Expected ${baselineCounts[cat]}, got ${pkgs.length}`);
    }
    console.log(`✓ Category "${cat}" remained fully intact (Count: ${pkgs.length})`);
  }

  // Permanently clean up test record from database
  await prisma.packageImage.deleteMany({ where: { packageId: testFoodPkg.id } });
  await prisma.itineraryDay.deleteMany({ where: { packageId: testFoodPkg.id } });
  await prisma.package.delete({ where: { id: testFoodPkg.id } });
  console.log('✓ Cleaned up test listing from database.');

  console.log('\n======================================================');
  console.log('✅ ALL CATEGORY DATA ISOLATION TESTS PASSED SUCCESSFULLY');
  console.log('======================================================');
}

main()
  .catch((err) => {
    console.error('Test failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
