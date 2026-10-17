import { PrismaClient, ListingStatus, ApprovalStatus } from '@prisma/client';
import {
  getPublishedPackages,
  getPublishedPackagesWithCount,
  countPublishedPackages,
  getPackageBySlug,
  getFeaturedPackages,
  getPackagesByDestination,
  getPackagesByCategory,
  searchPackages,
} from '../src/server/db/packages';
import {
  getDestinations,
  getDestinationBySlug,
  getPopularDestinations,
  getTrendingDestinations,
} from '../src/server/db/destinations';
import {
  getCategories,
  getCategoryBySlug,
} from '../src/server/db/categories';
import { packageService } from '../src/services/package.service';

const prisma = new PrismaClient();

let passedTests = 0;
let totalTests = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✅ [PASS] ${testName}`);
  } else {
    console.error(`  ❌ [FAIL] ${testName}${detail ? ` — ${detail}` : ''}`);
  }
}

async function runPhase5TestSuite() {
  console.log('====================================================');
  console.log('   VIBEMILES — PHASE 5 MARKETPLACE & SEARCH SUITE   ');
  console.log('====================================================\n');

  const testSuffix = Date.now();
  let testProviderId = '';
  let testCategoryId = '';
  let testDestinationId = '';
  let testPackageId = '';
  const testPackageSlug = `test-draft-package-${testSuffix}`;

  try {
    // -------------------------------------------------------------
    // SECTION 1: PUBLIC MARKETPLACE BROWSING & DATA INTEGRITY
    // -------------------------------------------------------------
    console.log('1. Public Marketplace Browsing:');

    const published = await getPublishedPackages();
    assert(Array.isArray(published), 'getPublishedPackages returns an array');
    assert(published.length >= 3, `Expected at least 3 published packages, found ${published.length}`);

    const featured = await getFeaturedPackages(2);
    assert(Array.isArray(featured) && featured.length > 0, 'getFeaturedPackages returns featured packages');

    // Verify all returned packages are approved, published, and active
    const allValid = published.every(
      (p) => p.approvalStatus === 'approved'
    );
    assert(allValid, 'All returned packages have approvalStatus: approved');

    // Verify relations and fields populated on first package
    const sample = published[0];
    assert(Boolean(sample.id && sample.slug && sample.name), 'Package has core identification fields (id, slug, name)');
    assert(typeof sample.finalPrice === 'number' && sample.finalPrice > 0, 'Package has valid positive finalPrice');
    assert(Array.isArray(sample.images) && sample.images.length > 0, 'Package contains images array');
    assert(Array.isArray(sample.itinerary), 'Package contains itinerary days array');
    assert(Array.isArray(sample.inclusions), 'Package contains inclusions array');
    assert(Array.isArray(sample.exclusions), 'Package contains exclusions array');
    assert(Array.isArray(sample.availableDates), 'Package contains availableDates array');
    assert(Boolean(sample.destinationName), 'Package has populated destinationName');
    assert(Boolean(sample.providerName), 'Package has populated providerName');
    assert(Boolean(sample.cancellationPolicy), 'Package has parsed cancellationPolicy');

    // -------------------------------------------------------------
    // SECTION 2: UNAPPROVED LISTING ISOLATION (SECURITY & MODERATION)
    // -------------------------------------------------------------
    console.log('\n2. Unapproved Listing Isolation (Moderation Rules):');

    // Get an existing provider, category, and destination to create test listings
    const existingProv = await prisma.providerProfile.findFirst();
    const existingCat = await prisma.category.findFirst();
    const existingDest = await prisma.destination.findFirst();

    if (!existingProv || !existingCat || !existingDest) {
      throw new Error('Seed data missing provider, category, or destination required for moderation test');
    }
    testProviderId = existingProv.id;
    testCategoryId = existingCat.id;
    testDestinationId = existingDest.id;

    // Create a DRAFT listing
    const draftPkg = await prisma.package.create({
      data: {
        slug: testPackageSlug,
        name: `Secret Draft Trip ${testSuffix}`,
        description: 'This is a draft listing that MUST remain invisible to travellers.',
        providerId: testProviderId,
        categoryId: testCategoryId,
        destinationId: testDestinationId,
        state: 'TestState',
        city: 'SecretCity',
        durationDays: 4,
        durationNights: 3,
        maxGroupSize: 6,
        basePrice: 10000,
        discountPercent: 0,
        finalPrice: 10000,
        currency: 'INR',
        status: ListingStatus.DRAFT,
        approvalStatus: ApprovalStatus.PENDING,
        isActive: true,
        tags: ['secrettag', 'draft'],
      },
    });
    testPackageId = draftPkg.id;

    // Test: DRAFT listing is invisible in public queries
    let publicList = await getPublishedPackages();
    assert(
      !publicList.some((p) => p.id === testPackageId || p.slug === testPackageSlug),
      'DRAFT package is NOT returned in getPublishedPackages'
    );

    const searchResult = await searchPackages('SecretCity');
    assert(
      !searchResult.some((p) => p.id === testPackageId),
      'DRAFT package is NOT found in searchPackages'
    );

    let singleLookup = await getPackageBySlug(testPackageSlug);
    assert(singleLookup === null, 'getPackageBySlug returns null for DRAFT package');

    // Test: PENDING_REVIEW listing is invisible
    await prisma.package.update({
      where: { id: testPackageId },
      data: { status: ListingStatus.PENDING_REVIEW, approvalStatus: ApprovalStatus.PENDING },
    });

    publicList = await getPublishedPackages();
    assert(
      !publicList.some((p) => p.id === testPackageId),
      'PENDING_REVIEW package is NOT returned in getPublishedPackages'
    );
    singleLookup = await getPackageBySlug(testPackageSlug);
    assert(singleLookup === null, 'getPackageBySlug returns null for PENDING_REVIEW package');

    // Test: REJECTED listing is invisible
    await prisma.package.update({
      where: { id: testPackageId },
      data: { status: ListingStatus.REJECTED, approvalStatus: ApprovalStatus.REJECTED },
    });

    publicList = await getPublishedPackages();
    assert(
      !publicList.some((p) => p.id === testPackageId),
      'REJECTED package is NOT returned in getPublishedPackages'
    );
    singleLookup = await getPackageBySlug(testPackageSlug);
    assert(singleLookup === null, 'getPackageBySlug returns null for REJECTED package');

    // Test: ARCHIVED listing is invisible
    await prisma.package.update({
      where: { id: testPackageId },
      data: { status: ListingStatus.ARCHIVED, approvalStatus: ApprovalStatus.APPROVED },
    });

    publicList = await getPublishedPackages();
    assert(
      !publicList.some((p) => p.id === testPackageId),
      'ARCHIVED package is NOT returned in getPublishedPackages'
    );
    singleLookup = await getPackageBySlug(testPackageSlug);
    assert(singleLookup === null, 'getPackageBySlug returns null for ARCHIVED package');

    // Test: Inactive (isActive: false) listing is invisible even if PUBLISHED and APPROVED
    await prisma.package.update({
      where: { id: testPackageId },
      data: { status: ListingStatus.PUBLISHED, approvalStatus: ApprovalStatus.APPROVED, isActive: false },
    });

    publicList = await getPublishedPackages();
    assert(
      !publicList.some((p) => p.id === testPackageId),
      'Inactive package (isActive: false) is NOT returned even if status=PUBLISHED and approvalStatus=APPROVED'
    );
    singleLookup = await getPackageBySlug(testPackageSlug);
    assert(singleLookup === null, 'getPackageBySlug returns null for inactive (isActive: false) package');

    // -------------------------------------------------------------
    // SECTION 3: PACKAGE DETAIL RESOLUTION
    // -------------------------------------------------------------
    console.log('\n3. Package Detail Resolution:');

    // Lookup known published package
    const manaliSlug = '5-day-scenic-manali-solang-expedition';
    const detailBySlug = await getPackageBySlug(manaliSlug);
    assert(detailBySlug !== null, `getPackageBySlug resolves "${manaliSlug}"`);
    assert(detailBySlug?.slug === manaliSlug, 'Resolved package has matching slug');
    assert(detailBySlug?.durationDays === 5, 'Resolved package durationDays matches DB (5)');
    assert(detailBySlug?.images.length === 3, `Expected 3 images, found ${detailBySlug?.images.length}`);
    assert(detailBySlug?.itinerary.length === 5, `Expected 5 itinerary days, found ${detailBySlug?.itinerary.length}`);
    assert(detailBySlug?.inclusions.length === 5, `Expected 5 inclusions, found ${detailBySlug?.inclusions.length}`);
    assert(detailBySlug?.exclusions.length === 4, `Expected 4 exclusions, found ${detailBySlug?.exclusions.length}`);
    assert(detailBySlug?.availableDates.length === 3, `Expected 3 active availability dates, found ${detailBySlug?.availableDates.length}`);

    // Lookup by ID
    const detailById = await getPackageBySlug(detailBySlug!.id);
    assert(detailById !== null && detailById.id === detailBySlug!.id, 'getPackageBySlug also resolves by package ID');

    // Lookup non-existent slug
    const nonExistent = await getPackageBySlug('completely-non-existent-package-slug');
    assert(nonExistent === null, 'getPackageBySlug returns null for non-existent slug');

    // -------------------------------------------------------------
    // SECTION 4: DESTINATIONS & CATEGORIES BROWSING
    // -------------------------------------------------------------
    console.log('\n4. Destinations & Categories Browsing:');

    const dests = await getDestinations();
    assert(Array.isArray(dests) && dests.length >= 4, `getDestinations returns ${dests.length} destinations`);

    const popularDests = await getPopularDestinations();
    assert(popularDests.every((d) => d.isPopular), 'getPopularDestinations returns only popular destinations');

    const trendingDests = await getTrendingDestinations();
    assert(trendingDests.every((d) => d.isTrending), 'getTrendingDestinations returns only trending destinations');

    const singleDest = await getDestinationBySlug('manali-himachal-pradesh');
    assert(singleDest !== null && singleDest.name === 'Manali', 'getDestinationBySlug resolves "manali-himachal-pradesh"');
    assert(singleDest?.topActivities.length === 4, 'Destination topActivities populated');

    const destPackages = await getPackagesByDestination('manali-himachal-pradesh');
    assert(destPackages.length >= 1, `getPackagesByDestination returned ${destPackages.length} package(s) for Manali`);

    const nonExistentDest = await getDestinationBySlug('non-existent-destination');
    assert(nonExistentDest === null, 'getDestinationBySlug returns null for non-existent destination');

    const categories = await getCategories();
    assert(Array.isArray(categories) && categories.length > 0, `getCategories returns ${categories.length} active categories`);

    const tourCat = await getCategoryBySlug('tour');
    assert(tourCat !== null && tourCat.slug === 'tour', 'getCategoryBySlug resolves "tour"');

    const catPackages = await getPackagesByCategory('tour');
    assert(catPackages.length >= 1, `getPackagesByCategory returned ${catPackages.length} package(s) for "tour"`);

    // -------------------------------------------------------------
    // SECTION 5: KEYWORD SEARCH (Q)
    // -------------------------------------------------------------
    console.log('\n5. Keyword Search:');

    // Keyword matching title
    const searchHouseboat = await getPublishedPackages({ q: 'houseboat' });
    assert(searchHouseboat.length === 1, `Search "houseboat" returned 1 package (found ${searchHouseboat.length})`);
    assert(searchHouseboat[0].slug.includes('kerala'), 'Search "houseboat" matched Kerala houseboat retreat');

    // Keyword matching description
    const searchSolang = await getPublishedPackages({ q: 'Solang' });
    assert(searchSolang.length === 1, `Search "Solang" (in description/name) returned 1 package`);
    assert(searchSolang[0].slug.includes('manali'), 'Search "Solang" matched Manali expedition');

    // Keyword matching city / state
    const searchRajasthan = await getPublishedPackages({ q: 'Rajasthan' });
    assert(searchRajasthan.length === 1, `Search "Rajasthan" returned 1 package`);
    assert(searchRajasthan[0].slug.includes('jaipur'), 'Search "Rajasthan" matched Jaipur heritage tour');

    // Keyword matching destination name
    const searchAlleppey = await getPublishedPackages({ q: 'Alleppey' });
    assert(searchAlleppey.length === 1, `Search "Alleppey" returned 1 package`);

    // Keyword matching tags
    const searchPalace = await getPublishedPackages({ q: 'palace' });
    assert(searchPalace.length === 1, `Search "palace" returned 1 package`);

    // Case-insensitivity
    const searchCase = await getPublishedPackages({ q: 'mAnAlI' });
    assert(searchCase.length === 1, 'Search is case-insensitive ("mAnAlI" matched Manali)');

    // Search empty string returns all published
    const searchEmpty = await getPublishedPackages({ q: '   ' });
    assert(searchEmpty.length === published.length, 'Whitespace-only search returns all published packages');

    // Non-matching keyword returns empty array
    const searchNotFound = await getPublishedPackages({ q: 'xyznonexistentword987' });
    assert(searchNotFound.length === 0, 'Non-existent keyword search returns 0 results');

    // -------------------------------------------------------------
    // SECTION 6: MULTI-FILTER COMBINATIONS
    // -------------------------------------------------------------
    console.log('\n6. Multi-Filter Combinations:');

    // Filter by destination
    const filterDest = await getPublishedPackages({ destination: 'Manali' });
    assert(filterDest.length === 1 && filterDest[0].slug.includes('manali'), 'Destination filter "Manali" returns 1 package');

    // Filter by category
    const filterCat = await getPublishedPackages({ category: 'tour' });
    assert(filterCat.length >= 1, `Category filter "tour" returns ${filterCat.length} package(s)`);

    // Filter by price range
    const filterPriceLow = await getPublishedPackages({ maxPrice: 15000 });
    assert(
      filterPriceLow.length === 1 && filterPriceLow[0].finalPrice <= 15000,
      `maxPrice: 15000 returned ${filterPriceLow.length} package (price: ${filterPriceLow[0]?.finalPrice})`
    );

    const filterPriceHigh = await getPublishedPackages({ minPrice: 20000 });
    assert(
      filterPriceHigh.length === 1 && filterPriceHigh[0].finalPrice >= 20000,
      `minPrice: 20000 returned ${filterPriceHigh.length} package (price: ${filterPriceHigh[0]?.finalPrice})`
    );

    const filterPriceRange = await getPublishedPackages({ minPrice: 14000, maxPrice: 18000 });
    assert(
      filterPriceRange.length === 1 && filterPriceRange[0].finalPrice === 16149,
      `minPrice: 14000 & maxPrice: 18000 returned Manali (16149)`
    );

    // Filter by duration
    const filterDuration = await getPublishedPackages({ duration: 5 });
    assert(filterDuration.length === 1 && filterDuration[0].durationDays === 5, 'Exact duration: 5 returns Manali');

    const filterDurationRange = await getPublishedPackages({ minDuration: 2, maxDuration: 4 });
    assert(
      filterDurationRange.every((p) => p.durationDays >= 2 && p.durationDays <= 4),
      `Duration range 2-4 days returned ${filterDurationRange.length} packages, all within range`
    );

    // Combined multi-filters: destination + category + maxPrice
    const combined1 = await getPublishedPackages({
      destination: 'Rajasthan',
      category: 'tour',
      maxPrice: 15000,
    });
    assert(combined1.length === 1 && combined1[0].slug.includes('jaipur'), 'Combined destination + category + maxPrice matched Jaipur');

    // Unmatched combined filter returns 0 (not mock data)
    const combinedZero = await getPublishedPackages({
      destination: 'Manali',
      minPrice: 50000, // impossible price for Manali package
    });
    assert(combinedZero.length === 0, 'Unmatched combined filter returns empty array (no mock data fallback)');

    // -------------------------------------------------------------
    // SECTION 7: SORTING CAPABILITIES
    // -------------------------------------------------------------
    console.log('\n7. Sorting Capabilities:');

    // price_asc
    const sortPriceAsc = await getPublishedPackages({ sort: 'price_asc' });
    let isAsc = true;
    for (let i = 0; i < sortPriceAsc.length - 1; i++) {
      if (sortPriceAsc[i].finalPrice > sortPriceAsc[i + 1].finalPrice) isAsc = false;
    }
    assert(isAsc, `sort: price_asc ordered correctly (${sortPriceAsc.map((p) => p.finalPrice).join(' <= ')})`);

    // price_desc
    const sortPriceDesc = await getPublishedPackages({ sort: 'price_desc' });
    let isDesc = true;
    for (let i = 0; i < sortPriceDesc.length - 1; i++) {
      if (sortPriceDesc[i].finalPrice < sortPriceDesc[i + 1].finalPrice) isDesc = false;
    }
    assert(isDesc, `sort: price_desc ordered correctly (${sortPriceDesc.map((p) => p.finalPrice).join(' >= ')})`);

    // rating
    const sortRating = await getPublishedPackages({ sort: 'rating' });
    let isRatingDesc = true;
    for (let i = 0; i < sortRating.length - 1; i++) {
      if (sortRating[i].rating < sortRating[i + 1].rating) isRatingDesc = false;
    }
    assert(isRatingDesc, `sort: rating ordered correctly (${sortRating.map((p) => p.rating).join(' >= ')})`);

    // -------------------------------------------------------------
    // SECTION 8: PAGINATION AND TOTAL COUNTS
    // -------------------------------------------------------------
    console.log('\n8. Pagination and Total Counts:');

    const totalCount = await countPublishedPackages();
    assert(totalCount === published.length, `countPublishedPackages (${totalCount}) matches total published packages`);

    const page1 = await getPublishedPackagesWithCount({ skip: 0, take: 2 });
    assert(page1.packages.length === 2, `Page 1 take: 2 returns 2 items`);
    assert(page1.total === totalCount, `Page 1 total count reflects complete dataset (${page1.total})`);

    const page2 = await getPublishedPackagesWithCount({ skip: 2, take: 2 });
    assert(page2.packages.length === 1, `Page 2 skip: 2 returns remaining 1 item`);
    assert(page2.packages[0].id !== page1.packages[0].id, 'Page 2 items are distinct from Page 1 items');

    const pageOutOfBounds = await getPublishedPackagesWithCount({ skip: 100, take: 10 });
    assert(pageOutOfBounds.packages.length === 0, 'Out-of-bounds skip returns empty array');
    assert(pageOutOfBounds.total === totalCount, 'Out-of-bounds total count is still accurate');

    // -------------------------------------------------------------
    // SECTION 9: UNIVERSAL PACKAGE SERVICE PARITY
    // -------------------------------------------------------------
    console.log('\n9. Universal PackageService Parity:');

    const svcPackages = await packageService.getPackages();
    assert(svcPackages.length === published.length, 'packageService.getPackages returns same count as getPublishedPackages');

    const svcDetail = await packageService.getPackageBySlug(manaliSlug);
    assert(svcDetail !== null && svcDetail.slug === manaliSlug, 'packageService.getPackageBySlug resolves successfully');

    const svcFeatured = await packageService.getFeaturedPackages();
    assert(Array.isArray(svcFeatured) && svcFeatured.length > 0, `packageService.getFeaturedPackages returns ${svcFeatured.length} items`);

    const svcDests = await packageService.getDestinations();
    assert(svcDests.length === dests.length, 'packageService.getDestinations returns same count as db');

    const svcCat = await packageService.getCategories();
    assert(svcCat.length === categories.length, 'packageService.getCategories returns same count as db');

    // Test no mock substitution on failed query
    const svcNotFound = await packageService.getPackages({ minPrice: 99999999 });
    assert(svcNotFound.length === 0, 'packageService returns empty array for unmatched query, NOT mock packages');

  } finally {
    // Clean up test package if created
    if (testPackageId) {
      await prisma.package.deleteMany({ where: { id: testPackageId } });
      console.log('\nCleaned up test package.');
    }
    await prisma.$disconnect();
  }

  console.log('\n====================================================');
  console.log(`PHASE 5 TEST RESULTS: ${passedTests} / ${totalTests} PASSED`);
  console.log('====================================================\n');

  if (passedTests < totalTests) {
    process.exit(1);
  }
}

runPhase5TestSuite().catch((err) => {
  console.error('Fatal error in Phase 5 test suite:', err);
  process.exit(1);
});
