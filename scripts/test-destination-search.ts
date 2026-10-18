import { prisma } from '../src/lib/prisma';
import { getPublishedPackages, getPublishedPackagesWithCount } from '../src/server/db/packages';

interface AutocompleteItem {
  id: string;
  name: string;
  slug: string;
  state: string;
  country: string;
  packageCount: number;
}

// Simulate the exact API search logic used in /api/locations/search
async function simulateLocationSearch(query: string, limit = 10): Promise<AutocompleteItem[]> {
  const q = query.trim();
  if (!q) return [];
  const normalizedQ = q.toLowerCase();

  const destinations = await prisma.destination.findMany({
    where: {
      OR: [
        { name: { contains: q, mode: 'insensitive' } },
        { state: { contains: q, mode: 'insensitive' } },
        { country: { contains: q, mode: 'insensitive' } },
        { slug: { contains: q, mode: 'insensitive' } },
        { tags: { has: normalizedQ } },
      ],
    },
    select: {
      id: true,
      slug: true,
      name: true,
      state: true,
      country: true,
      packageCount: true,
    },
    take: 50,
  });

  const scored = destinations.map((d) => {
    const nameLower = d.name.toLowerCase();
    const stateLower = d.state.toLowerCase();
    let score = 0;
    if (nameLower === normalizedQ) score = 1000;
    else if (nameLower.startsWith(normalizedQ)) score = 800;
    else if (nameLower.includes(normalizedQ)) score = 600;
    else if (stateLower.startsWith(normalizedQ)) score = 500;
    else score = 200;
    return { item: d, score, packageCount: d.packageCount };
  });

  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if (b.packageCount !== a.packageCount) return b.packageCount - a.packageCount;
    return a.item.name.localeCompare(b.item.name);
  });

  return scored.slice(0, limit).map((s) => s.item);
}

async function runTests() {
  console.log('====================================================');
  console.log('🔍 VIBEMILES DESTINATION SEARCH AUTOMATED TEST SUITE');
  console.log('====================================================\n');

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition: boolean, testName: string, details?: string) {
    totalTests++;
    if (condition) {
      console.log(`✅ PASS: ${testName}`);
      if (details) console.log(`   ${details}`);
      passedTests++;
    } else {
      console.error(`❌ FAIL: ${testName}`);
      if (details) console.error(`   Details: ${details}`);
    }
  }

  // ── TEST 1: Partial Search "Man" ──
  console.log('--- TEST 1: Autocomplete Partial Search ("Man") ---');
  const manResults = await simulateLocationSearch('Man');
  const manNames = manResults.map((r) => r.name);
  assert(
    manNames.includes('Manali') && manNames.includes('Mangaluru'),
    'Typing "Man" returns both Manali and Mangaluru from real database',
    `Found: ${JSON.stringify(manResults.map((r) => ({ name: r.name, state: r.state, id: r.id })))}`
  );
  assert(
    manNames[0] === 'Manali',
    'Manali ranks before Mangaluru based on packageCount & relevance score',
    `Rank 1: ${manNames[0]}, Rank 2: ${manNames[1]}`
  );

  // ── TEST 2: Case-Insensitive Matching ("mAn", "MANALI", "mangaluru") ──
  console.log('\n--- TEST 2: Case-Insensitive Autocomplete Matching ---');
  const caseResults1 = await simulateLocationSearch('mAn');
  assert(
    caseResults1.some((r) => r.name === 'Manali') && caseResults1.some((r) => r.name === 'Mangaluru'),
    'Mixed-case "mAn" returns matching destinations',
    `Found: ${caseResults1.map((r) => r.name).join(', ')}`
  );

  const caseResults2 = await simulateLocationSearch('MANALI');
  assert(
    caseResults2.length > 0 && caseResults2[0].name === 'Manali',
    'Uppercase "MANALI" returns exact match Manali as rank 1',
    `Found rank 1: ${caseResults2[0]?.name}`
  );

  // ── TEST 3: Invalid / Non-Matching Search ("XYZ999Unknown") ──
  console.log('\n--- TEST 3: Invalid / Non-Matching Query ("XYZ999Unknown") ---');
  const emptyResults = await simulateLocationSearch('XYZ999Unknown');
  assert(
    emptyResults.length === 0,
    'Non-existent query returns empty results array for "No destinations found" UI',
    `Count: ${emptyResults.length}`
  );

  // ── TEST 4: Package Search for Destination with Packages ("Manali") ──
  console.log('\n--- TEST 4: Package Filtering for Destination with Active Packages ("Manali") ---');
  const manaliPackages = await getPublishedPackages({ destination: 'Manali' });
  assert(
    manaliPackages.length > 0,
    'Searching packages for "Manali" returns published packages',
    `Found ${manaliPackages.length} package(s): ${manaliPackages.map((p) => p.name).join(', ')}`
  );
  const pkg1 = manaliPackages[0];
  assert(
    pkg1.destinationName === 'Manali' && pkg1.approvalStatus === 'approved' && pkg1.isActive,
    'Returned package is active, approved, and assigned to Manali',
    `Pkg: "${pkg1.name}" (ID: ${pkg1.id}, Provider: ${pkg1.providerName})`
  );

  // ── TEST 5: Package Search by destinationId ──
  console.log('\n--- TEST 5: Package Filtering by destinationId ---');
  const manaliDest = manResults.find((r) => r.name === 'Manali');
  if (manaliDest) {
    const idPackages = await getPublishedPackages({ destinationId: manaliDest.id });
    assert(
      idPackages.length > 0,
      `Filtering by destinationId (${manaliDest.id}) returns exact matching packages`,
      `Found ${idPackages.length} package(s)`
    );
  }

  // ── TEST 6: Package Search for Destination with NO Packages ("Mangaluru") ──
  console.log('\n--- TEST 6: Zero Packages Matching ("Mangaluru") ---');
  const mangaluruPackages = await getPublishedPackages({ destination: 'Mangaluru' });
  assert(
    mangaluruPackages.length === 0,
    'Searching for "Mangaluru" returns 0 packages triggering proper empty state',
    `Count: ${mangaluruPackages.length}`
  );

  // ── TEST 7: International Destination Search ("Dubai", "Bali") ──
  console.log('\n--- TEST 7: International Destination Support ("Dubai", "Bali") ---');
  const dubaiResults = await simulateLocationSearch('Dubai');
  assert(
    dubaiResults.length > 0 && dubaiResults[0].country === 'United Arab Emirates',
    'Typing "Dubai" finds international destination in UAE',
    `Found: ${dubaiResults[0]?.name}, Country: ${dubaiResults[0]?.country}`
  );

  const dubaiPackages = await getPublishedPackages({ destination: 'Dubai' });
  assert(
    dubaiPackages.length > 0,
    'Searching packages for "Dubai" returns international tour package',
    `Found ${dubaiPackages.length} package(s): ${dubaiPackages.map((p) => p.name).join(', ')}`
  );

  // ── TEST 8: Composite String Destination Filter ("Manali, Himachal Pradesh") ──
  console.log('\n--- TEST 8: Composite Query ("Manali, Himachal Pradesh") ---');
  const compositePackages = await getPublishedPackages({ destination: 'Manali, Himachal Pradesh' });
  assert(
    compositePackages.length > 0,
    'Composite "City, State" query matches packages correctly',
    `Found ${compositePackages.length} package(s)`
  );

  // ── TEST 9: Moderation & Account Status Isolation ──
  console.log('\n--- TEST 9: Marketplace Moderation & Security Status ---');
  const { packages: allPublished, total } = await getPublishedPackagesWithCount({});
  const hasUnapproved = allPublished.some((p) => p.approvalStatus !== 'approved');
  assert(
    !hasUnapproved,
    'Zero unapproved, draft, or pending packages exposed to public search',
    `Total published packages: ${total}, All strictly APPROVED`
  );

  console.log('\n====================================================');
  console.log(`SUMMARY: ${passedTests} of ${totalTests} tests PASSED!`);
  console.log('====================================================');
}

runTests()
  .catch((err) => {
    console.error('Test execution failed:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
