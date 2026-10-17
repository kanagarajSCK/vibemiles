import { PrismaClient, ListingStatus, ApprovalStatus } from '@prisma/client';
import {
  createPackage,
  updatePackage,
  submitPackageForReview,
  archivePackage,
  adminApprovePackage,
  adminRejectPackage,
  getPackagesForProvider,
  getPackageByIdForProvider,
  getPublishedPackages,
  getPackageBySlug,
  getAllPackagesForAdmin,
} from '../src/server/db/packages';
import { createProviderUser } from '../src/server/db/users';

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

async function runPhase4TestSuite() {
  console.log('====================================================');
  console.log('   VIBEMILES — PHASE 4 PACKAGES & MODERATION SUITE  ');
  console.log('====================================================\n');

  const testSuffix = Date.now();
  const provider1Email = `prov1.${testSuffix}@example.com`;
  const provider2Email = `prov2.${testSuffix}@example.com`;
  const testPassword = 'SecurePassword123!';

  let p1UserId = '';
  let p1ProfileId = '';
  let p2UserId = '';
  let p2ProfileId = '';
  let pkgId = '';
  let pkgSlug = '';

  try {
    // -------------------------------------------------------------
    // SETUP: CREATE TWO SEPARATE TEST PROVIDERS
    // -------------------------------------------------------------
    console.log('1. Provider Accounts Setup:');
    const p1 = await createProviderUser({
      email: provider1Email,
      password: testPassword,
      phone: `987${String(testSuffix).slice(-7)}`,
      businessName: `Himalayan Adventures ${testSuffix}`,
      ownerName: 'Tenzing Norgay',
      businessCategory: 'Tour Organizer',
      city: 'Manali',
      state: 'Himachal Pradesh',
      pincode: '175131',
    });
    p1UserId = p1.user.id;
    p1ProfileId = p1.profile.id;
    assert(Boolean(p1ProfileId), 'Provider 1 registered with ProviderProfile');

    const p2 = await createProviderUser({
      email: provider2Email,
      password: testPassword,
      phone: `988${String(testSuffix).slice(-7)}`,
      businessName: `Coastal Stays ${testSuffix}`,
      ownerName: 'Mario Fernandez',
      businessCategory: 'Villa',
      city: 'Panaji',
      state: 'Goa',
      pincode: '403001',
    });
    p2UserId = p2.user.id;
    p2ProfileId = p2.profile.id;
    assert(Boolean(p2ProfileId), 'Provider 2 registered with ProviderProfile');

    // -------------------------------------------------------------
    // TEST GROUP 1: PROVIDER CREATES A PACKAGE LISTING
    // -------------------------------------------------------------
    console.log('\n2. Package Listing Creation & Status Defaults:');
    const created = await createPackage(p1ProfileId, {
      name: `Solang Valley Ski & Trek ${testSuffix}`,
      description: 'An exhilarating winter adventure in the heart of Solang Valley with certified mountain guides.',
      categorySlug: 'tour',
      destinationName: 'Manali',
      state: 'Himachal Pradesh',
      city: 'Manali',
      durationDays: 4,
      durationNights: 3,
      maxGroupSize: 8,
      basePrice: 15000,
      discountPercent: 10,
      images: [
        'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=1200&q=80',
      ],
      itinerary: [
        {
          day: 1,
          title: 'Arrival in Manali',
          description: 'Check in to alpine basecamp and gear fitting.',
          activities: ['Orientation', 'Gear check'],
        },
        {
          day: 2,
          title: 'Solang Valley Skiing',
          description: 'Basic ski training on beginner slopes.',
          activities: ['Ski lessons', 'Snowboarding'],
        },
      ],
      inclusions: ['All meals', 'Ski gear', 'Certified instructor'],
      exclusions: ['Personal drinks', 'Tips'],
      highlights: ['Certified instructors', 'Heated basecamp'],
      tags: ['ski', 'adventure', 'winter'],
    });

    pkgId = created.id;
    pkgSlug = created.slug;

    assert(Boolean(created.id), 'Package created with unique ID');
    assert(created.status === 'DRAFT', 'Default package status is DRAFT');
    assert(created.approvalStatus === 'pending', 'Default approval status is pending');
    assert(created.rejectionReason === undefined, 'Default rejection reason is empty');
    assert(created.finalPrice === 13500, 'Calculated final price matches 10% discount from 15,000');
    assert(created.images.length === 2, 'Two valid hosted image URLs attached');
    assert(created.itinerary.length === 2, 'Itinerary days created properly');
    assert(created.inclusions.length === 3, 'Inclusions stored correctly');
    assert(created.exclusions.length === 2, 'Exclusions stored correctly');

    // -------------------------------------------------------------
    // TEST GROUP 2: PROVIDER PACKAGE RETRIEVAL
    // -------------------------------------------------------------
    console.log('\n3. Provider Listing Retrieval:');
    const p1Packages = await getPackagesForProvider(p1ProfileId);
    assert(p1Packages.some((p) => p.id === pkgId), 'Provider 1 can retrieve their created package');

    const pkgDetails = await getPackageByIdForProvider(pkgId, p1ProfileId);
    assert(pkgDetails?.id === pkgId, 'Provider 1 can fetch full package details by ID');

    // -------------------------------------------------------------
    // TEST GROUP 3: IDOR PROTECTION (CROSS-PROVIDER TAMPERING PREVENTED)
    // -------------------------------------------------------------
    console.log('\n4. Strict IDOR Access Control:');
    const p2AttemptView = await getPackageByIdForProvider(pkgId, p2ProfileId);
    assert(p2AttemptView === null, 'Provider 2 cannot view Provider 1 package via getPackageByIdForProvider');

    let p2AttemptUpdateError = '';
    try {
      await updatePackage(pkgId, p2ProfileId, { name: 'Hacked Title' });
    } catch (err) {
      p2AttemptUpdateError = (err as Error).message;
    }
    assert(
      p2AttemptUpdateError.includes('not found') || p2AttemptUpdateError.includes('access denied'),
      'Provider 2 cannot edit Provider 1 package (IDOR rejected)'
    );

    let p2AttemptSubmitError = '';
    try {
      await submitPackageForReview(pkgId, p2ProfileId);
    } catch (err) {
      p2AttemptSubmitError = (err as Error).message;
    }
    assert(
      p2AttemptSubmitError.includes('not found') || p2AttemptSubmitError.includes('access denied'),
      'Provider 2 cannot submit Provider 1 package (IDOR rejected)'
    );

    let p2AttemptArchiveError = '';
    try {
      await archivePackage(pkgId, p2ProfileId);
    } catch (err) {
      p2AttemptArchiveError = (err as Error).message;
    }
    assert(
      p2AttemptArchiveError.includes('not found') || p2AttemptArchiveError.includes('access denied'),
      'Provider 2 cannot archive Provider 1 package (IDOR rejected)'
    );

    // -------------------------------------------------------------
    // TEST GROUP 4: PUBLIC MARKETPLACE ISOLATION (DRAFT/PENDING HIDDEN)
    // -------------------------------------------------------------
    console.log('\n5. Public Marketplace Isolation:');
    const initialPublicListings = await getPublishedPackages();
    assert(
      !initialPublicListings.some((p) => p.id === pkgId),
      'Draft package is NOT visible in public getPublishedPackages'
    );

    const publicSlugAttempt = await getPackageBySlug(pkgSlug);
    assert(publicSlugAttempt === null, 'Draft package is NOT accessible via public getPackageBySlug');

    // -------------------------------------------------------------
    // TEST GROUP 5: PROVIDER SUBMISSION FOR REVIEW
    // -------------------------------------------------------------
    console.log('\n6. Provider Submission for Moderation:');
    const submitted = await submitPackageForReview(pkgId, p1ProfileId);
    assert(submitted.status === 'PENDING_REVIEW', 'Status transitioned to PENDING_REVIEW');
    assert(submitted.approvalStatus === 'pending', 'Approval status is pending');

    const stillHiddenPublicings = await getPublishedPackages();
    assert(
      !stillHiddenPublicings.some((p) => p.id === pkgId),
      'Pending review package remains strictly hidden from public getPublishedPackages'
    );

    // -------------------------------------------------------------
    // TEST GROUP 6: ADMIN REJECTION FLOW WITH FEEDBACK
    // -------------------------------------------------------------
    console.log('\n7. Admin Package Rejection with Feedback:');
    let shortReasonError = '';
    try {
      await adminRejectPackage(pkgId, 'bad');
    } catch (err) {
      shortReasonError = (err as Error).message;
    }
    assert(
      shortReasonError.includes('at least 5 characters'),
      'Admin reject rejects too-short reason string'
    );

    const feedbackMsg = 'Please add more detailed activity notes for Day 2 and clarify winter gear safety specs.';
    const rejected = await adminRejectPackage(pkgId, feedbackMsg);
    assert(rejected.status === 'REJECTED', 'Status transitioned to REJECTED');
    assert(rejected.approvalStatus === 'rejected', 'Approval status is rejected');
    assert(rejected.rejectionReason === feedbackMsg, 'Rejection feedback is recorded in package');

    // Provider views feedback in dashboard
    const p1PackageAfterReject = await getPackageByIdForProvider(pkgId, p1ProfileId);
    assert(
      p1PackageAfterReject?.rejectionReason === feedbackMsg,
      'Provider can read the admin rejection feedback'
    );

    // -------------------------------------------------------------
    // TEST GROUP 7: PROVIDER RESUBMISSION AFTER CORRECTION
    // -------------------------------------------------------------
    console.log('\n8. Provider Correction & Resubmission:');
    const corrected = await updatePackage(pkgId, p1ProfileId, {
      description: 'An exhilarating winter adventure in Solang Valley with certified UIAA mountain guides and complete safety equipment.',
      submitForReview: true,
    });
    assert(corrected.status === 'PENDING_REVIEW', 'Package resubmitted with PENDING_REVIEW status');
    assert(corrected.approvalStatus === 'pending', 'Approval status is pending again');
    assert(corrected.rejectionReason === undefined, 'Rejection reason cleared upon resubmission');

    // -------------------------------------------------------------
    // TEST GROUP 8: ADMIN APPROVAL FLOW
    // -------------------------------------------------------------
    console.log('\n9. Admin Approval & Public Marketplace Publishing:');
    const approved = await adminApprovePackage(pkgId);
    assert(approved.status === 'PUBLISHED', 'Status transitioned to PUBLISHED');
    assert(approved.approvalStatus === 'approved', 'Approval status is approved');
    assert(approved.isActive === true, 'Package is active');

    // Now verified to appear in public marketplace
    const publicListingsAfterApproval = await getPublishedPackages();
    assert(
      publicListingsAfterApproval.some((p) => p.id === pkgId),
      'Approved & published package is immediately visible in getPublishedPackages'
    );

    const publicSlugFound = await getPackageBySlug(pkgSlug);
    assert(publicSlugFound?.id === pkgId, 'Approved package is accessible via public getPackageBySlug');

    // -------------------------------------------------------------
    // TEST GROUP 9: MODERATION INTEGRITY ON APPROVED LISTING EDITS
    // -------------------------------------------------------------
    console.log('\n10. Moderation Integrity on Post-Approval Edits:');
    // Provider edits an already approved listing
    const editedPostApproval = await updatePackage(pkgId, p1ProfileId, {
      name: `Solang Valley Ski & Trek (Updated Edition) ${testSuffix}`,
      basePrice: 16000,
    });
    assert(
      editedPostApproval.status === 'PENDING_REVIEW',
      'CRITICAL: Editing an approved listing automatically resets status to PENDING_REVIEW'
    );
    assert(
      editedPostApproval.approvalStatus === 'pending',
      'CRITICAL: Editing an approved listing automatically resets approvalStatus to pending'
    );

    // Package MUST NOT be visible publicly while under re-review
    const publicAfterEdit = await getPublishedPackages();
    assert(
      !publicAfterEdit.some((p) => p.id === pkgId),
      'Listing is immediately withdrawn from public marketplace during re-moderation'
    );

    // Re-approve for next test
    await adminApprovePackage(pkgId);

    // -------------------------------------------------------------
    // TEST GROUP 10: ARCHIVE WORKFLOW
    // -------------------------------------------------------------
    console.log('\n11. Archival Workflow:');
    const archived = await archivePackage(pkgId, p1ProfileId);
    assert(archived.status === 'ARCHIVED', 'Status transitioned to ARCHIVED');
    assert(archived.isActive === false, 'Archived package has isActive set to false');

    const publicAfterArchive = await getPublishedPackages();
    assert(
      !publicAfterArchive.some((p) => p.id === pkgId),
      'Archived package is NOT visible in public getPublishedPackages'
    );

    // -------------------------------------------------------------
    // TEST GROUP 11: ADMIN MODERATION QUEUE QUERY
    // -------------------------------------------------------------
    console.log('\n12. Admin Moderation Queue Query:');
    const adminAll = await getAllPackagesForAdmin();
    assert(adminAll.some((p) => p.id === pkgId), 'Admin query returns packages across providers');

    const adminFilteredArchived = await getAllPackagesForAdmin({ status: 'ARCHIVED' });
    assert(
      adminFilteredArchived.some((p) => p.id === pkgId),
      'Admin query filters correctly by status ARCHIVED'
    );
  } catch (error) {
    console.error('\n❌ Unexpected error in test suite:', error);
  } finally {
    // -------------------------------------------------------------
    // CLEANUP TEST DATA
    // -------------------------------------------------------------
    console.log('\n13. Test Data Cleanup:');
    try {
      if (pkgId) {
        await prisma.package.deleteMany({ where: { id: pkgId } });
        console.log('  Cleaned up test package');
      }
      if (p1UserId) {
        await prisma.user.deleteMany({ where: { id: p1UserId } });
        console.log('  Cleaned up test provider 1');
      }
      if (p2UserId) {
        await prisma.user.deleteMany({ where: { id: p2UserId } });
        console.log('  Cleaned up test provider 2');
      }
    } catch (cleanupErr) {
      console.warn('  Cleanup warning:', cleanupErr);
    }

    await prisma.$disconnect();

    console.log('\n====================================================');
    console.log(`   TEST RESULTS: ${passedTests} / ${totalTests} PASSED`);
    console.log('====================================================\n');

    if (passedTests !== totalTests) {
      process.exit(1);
    }
  }
}

runPhase4TestSuite();
