import { prisma } from '../src/lib/prisma';
import { PUBLIC_NAV, ROUTES, PACKAGE_CATEGORIES, EXPLORE_CATEGORIES, PACKAGE_PAGE_CATEGORIES } from '../src/constants';
import { getPublishedPackages } from '../src/server/db/packages';

async function runNavigationAndCategoryVerification() {
  console.log('\n================================================================');
  console.log('   VIBEMILES NAVIGATION & CATEGORY VERIFICATION TEST SUITE');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`[PASS] ${testName}`);
      passed++;
    } else {
      console.error(`[FAIL] ${testName}${detail ? ` - ${detail}` : ''}`);
      failed++;
    }
  }

  try {
    // -------------------------------------------------------------
    // TEST 1: NAVBAR CONFIGURATION & ORDER
    // -------------------------------------------------------------
    console.log('\n--- 1. NAVBAR CONFIGURATION & ORDER ---');
    assert(PUBLIC_NAV.length === 6, 'Navbar contains exactly 6 items', `Found ${PUBLIC_NAV.length}`);
    
    const expectedLabels = ['Home', 'Packages', 'Explore', 'Stays', 'Foreign Trips', 'Deals'];
    const actualLabels = PUBLIC_NAV.map((item) => item.label);
    assert(
      JSON.stringify(actualLabels) === JSON.stringify(expectedLabels),
      'Navbar labels match exact required order: Home, Packages, Explore, Stays, Foreign Trips, Deals',
      `Got: ${JSON.stringify(actualLabels)}`
    );

    const expectedHrefs = [
      ROUTES.HOME,
      ROUTES.PACKAGES,
      ROUTES.EXPLORE,
      ROUTES.STAYS,
      ROUTES.FOREIGN_TRIPS,
      ROUTES.DEALS,
    ];
    const actualHrefs = PUBLIC_NAV.map((item) => item.href);
    assert(
      JSON.stringify(actualHrefs) === JSON.stringify(expectedHrefs),
      'Navbar routes match exact destinations (/ , /packages, /explore, /stays, /foreign-trips, /deals)',
      `Got: ${JSON.stringify(actualHrefs)}`
    );

    // Ensure no duplicate entries
    const uniqueHrefs = new Set(actualHrefs);
    assert(uniqueHrefs.size === PUBLIC_NAV.length, 'No duplicate navbar destinations');

    // -------------------------------------------------------------
    // TEST 2: EXPLORE CATEGORY DROPDOWN SPECIFICATION
    // -------------------------------------------------------------
    console.log('\n--- 2. EXPLORE CATEGORY DROPDOWN SPECIFICATION ---');
    const exploreSlugs = EXPLORE_CATEGORIES.map((c) => c.value);
    
    assert(!exploreSlugs.includes('tour' as any), 'Explore dropdown excludes "Tour Packages"');
    assert(!exploreSlugs.includes('devotional' as any), 'Explore dropdown excludes "Devotional Trips"');
    assert(!exploreSlugs.includes('foreign' as any), 'Explore dropdown excludes "Foreign Trips"');

    const expectedExploreSlugs = [
      'villa',
      'homestay',
      'hotel',
      'hostel',
      'camping',
      'food',
      'adventure',
      'guide',
      'cab',
    ];
    assert(
      JSON.stringify(exploreSlugs) === JSON.stringify(expectedExploreSlugs),
      'Explore dropdown retains exactly the 9 required categories (Villas, Homestays, Hotels, Hostels, Camping, Food Experiences, Adventures, Local Guides, Cab Services)',
      `Got: ${JSON.stringify(exploreSlugs)}`
    );

    // -------------------------------------------------------------
    // TEST 3: PACKAGES PAGE CATEGORY SPECIFICATION
    // -------------------------------------------------------------
    console.log('\n--- 3. PACKAGES PAGE CATEGORIES ---');
    const packagePageSlugs = PACKAGE_PAGE_CATEGORIES.map((c) => c.value);
    assert(
      packagePageSlugs.includes('tour' as any) && packagePageSlugs.includes('devotional' as any),
      'Packages page covers both "Tour Packages" and "Devotional Trips"'
    );
    assert(packagePageSlugs.length === 2, 'Packages page categories restricted to Tour Packages and Devotional Trips');

    // -------------------------------------------------------------
    // TEST 4: DATABASE CATEGORIES INTEGRITY (ZERO DATA LOSS)
    // -------------------------------------------------------------
    console.log('\n--- 4. DATABASE INTEGRITY ---');
    const dbCategories = await prisma.category.findMany();
    assert(dbCategories.length >= 12, 'All 12 category records preserved in database', `Found ${dbCategories.length}`);

    const dbSlugs = dbCategories.map((c) => c.slug);
    assert(dbSlugs.includes('tour'), 'DB retains "tour" category');
    assert(dbSlugs.includes('devotional'), 'DB retains "devotional" category');
    assert(dbSlugs.includes('foreign'), 'DB retains "foreign" category');
    assert(dbSlugs.includes('villa'), 'DB retains "villa" category');
    assert(dbSlugs.includes('adventure'), 'DB retains "adventure" category');

    // -------------------------------------------------------------
    // TEST 5: REAL PUBLISHED LISTINGS QUERIES
    // -------------------------------------------------------------
    console.log('\n--- 5. REAL PUBLISHED LISTINGS QUERIES ---');

    // Query packages page listings (tour + devotional)
    const packageListings = await getPublishedPackages({
      categories: ['tour', 'devotional'],
      take: 20,
    });
    assert(packageListings.length > 0, `Packages page returns published listings (${packageListings.length} found)`);

    const devotionalCount = packageListings.filter((p) => p.category === 'devotional').length;
    const tourCount = packageListings.filter((p) => p.category === 'tour').length;
    assert(devotionalCount > 0, `Packages page returns real Devotional Trips (${devotionalCount} found)`);
    assert(tourCount > 0, `Packages page returns real Tour Packages (${tourCount} found)`);

    // Query explore page listings (adventure has verified provider)
    const adventureListings = await getPublishedPackages({
      category: 'adventure',
      take: 10,
    });
    assert(adventureListings.length > 0, `Explore query for "adventure" returns verified listings (${adventureListings.length} found)`);

    // Verify unverified provider isolation (villa has UNVERIFIED provider in DB)
    const villaListings = await getPublishedPackages({
      category: 'villa',
      take: 10,
    });
    assert(
      villaListings.length === 0,
      'Explore query correctly excludes listings from UNVERIFIED providers (villa listing is hidden until provider is verified)'
    );

    // Query foreign trips (preserved on dedicated page)
    const foreignListings = await getPublishedPackages({
      category: 'foreign',
      take: 10,
    });
    assert(foreignListings.length > 0, `Foreign trips query returns listings (${foreignListings.length} found)`);

    // Moderation test: ensure draft / pending packages are never returned
    const allPublished = await getPublishedPackages({ take: 50 });
    const invalidStatus = allPublished.filter((p) => p.status !== 'PUBLISHED' || !p.isActive);
    assert(invalidStatus.length === 0, 'Public queries strictly return APPROVED and PUBLISHED listings only');

    // -------------------------------------------------------------
    // TEST 6: DEDICATED ROUTES COMPATIBILITY
    // -------------------------------------------------------------
    console.log('\n--- 6. DEDICATED ROUTES COMPATIBILITY ---');
    assert(ROUTES.DEVOTIONAL_TRIPS === '/devotional-trips', 'ROUTES.DEVOTIONAL_TRIPS preserved as /devotional-trips');
    assert(ROUTES.FOREIGN_TRIPS === '/foreign-trips', 'ROUTES.FOREIGN_TRIPS preserved as /foreign-trips');
    assert(ROUTES.STAYS === '/stays', 'ROUTES.STAYS preserved as /stays');
    assert(ROUTES.DEALS === '/deals', 'ROUTES.DEALS preserved as /deals');
    assert(ROUTES.PACKAGES === '/packages', 'ROUTES.PACKAGES preserved as /packages');
    assert(ROUTES.EXPLORE === '/explore', 'ROUTES.EXPLORE configured as /explore');

  } catch (error) {
    console.error('Unexpected error in test execution:', error);
    failed++;
  } finally {
    await prisma.$disconnect();
  }

  console.log('\n================================================================');
  console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runNavigationAndCategoryVerification();
