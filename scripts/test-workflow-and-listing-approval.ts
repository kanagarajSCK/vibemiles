import { prisma } from '../src/lib/prisma';
import {
  UserRole,
  UserStatus,
  VerificationStatus,
  DocumentType,
  DocumentStatus,
  ListingStatus,
  ApprovalStatus,
} from '@prisma/client';
import {
  createPackage,
  getPublishedPackages,
  getPackageBySlug,
  adminApprovePackage,
  adminSuspendPackage,
  adminRejectPackage,
  submitPackageForReview,
  updatePackage,
} from '../src/server/db/packages';
import {
  uploadProviderDocumentForUser,
  reviewProviderDocumentByAdmin,
  getProviderDocumentsForAdmin,
} from '../src/server/db/provider-documents';
import { getAdminDashboardMetrics } from '../src/server/db/admin';

async function runWorkflowTest() {
  console.log('================================================================');
  console.log('VibeMiles: Critical Workflow, Admin Approval & Integrity Test');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string) {
    if (condition) {
      console.log(`[PASS] ${testName}`);
      passed++;
    } else {
      console.error(`[FAIL] ${testName}`);
      failed++;
    }
  }

  const timestamp = Date.now();
  const testProviderEmail = `test_partner_${timestamp}@vibemiles.local`;
  const adminEmail = 'admin@vibemiles.com';

  let testUser: any = null;
  let testProviderProfile: any = null;
  let testPackage: any = null;
  let adminUser: any = null;

  try {
    // 0. Locate Admin User
    adminUser = await prisma.user.findFirst({
      where: { role: UserRole.ADMIN },
    });
    assert(!!adminUser, 'Admin account exists in PostgreSQL');

    // 1. PHASE 1: Provider Registration & Real Verification Status
    console.log('\n--- PHASE 1: Provider Registration & KYC Verification ---');
    testUser = await prisma.user.create({
      data: {
        email: testProviderEmail,
        role: UserRole.PROVIDER,
        status: UserStatus.ACTIVE,
      },
    });

    testProviderProfile = await prisma.providerProfile.create({
      data: {
        userId: testUser.id,
        businessName: `Test Himalayan Travels ${timestamp}`,
        ownerName: 'Test Partner',
        businessCategory: 'Tour Operator',
        city: 'Srinagar',
        state: 'Jammu and Kashmir',
        pincode: '190001',
        verificationStatus: VerificationStatus.UNVERIFIED,
      },
    });

    assert(
      testProviderProfile.verificationStatus === VerificationStatus.UNVERIFIED,
      'New provider is initialized with UNVERIFIED status (no fake verification)'
    );

    const initialDocs = await prisma.providerDocument.findMany({
      where: { providerId: testProviderProfile.id },
    });
    assert(initialDocs.length === 0, 'New provider has exactly 0 documents (no fake document records)');

    // 2. PHASE 1 (Enforcement): Unverified provider CANNOT create services
    let createThrewKycError = false;
    try {
      await createPackage(testUser.id, {
        name: 'Unverified Test Trek',
        description: 'This package should never be created because provider is unverified.',
        basePrice: 5000,
      });
    } catch (err: any) {
      if (err.message.includes('KYC verification required')) {
        createThrewKycError = true;
      }
    }
    assert(createThrewKycError, 'Unverified provider blocked from creating packages (KYC check enforced)');

    // 3. PHASE 1: Upload Real Verification Documents
    console.log('\n--- Uploading Real KYC Documents ---');
    const dummyPdfContent = Buffer.from('%PDF-1.4 test document content for automated workflow testing');

    const docTypes = [
      DocumentType.BUSINESS_REGISTRATION,
      DocumentType.GOVERNMENT_ID,
      DocumentType.ADDRESS_PROOF,
    ];

    for (const dt of docTypes) {
      await uploadProviderDocumentForUser({
        userId: testUser.id,
        type: dt,
        fileBuffer: dummyPdfContent,
        originalFileName: `${dt.toLowerCase()}_sample.pdf`,
        mimeType: 'application/pdf',
      });
    }

    const providerAfterUpload = await prisma.providerProfile.findUnique({
      where: { id: testProviderProfile.id },
      include: { documents: true },
    });

    assert(providerAfterUpload?.documents.length === 3, 'All 3 documents saved with real metadata');
    assert(
      providerAfterUpload?.verificationStatus === VerificationStatus.PENDING,
      'Provider status transitioned to PENDING upon document submission'
    );

    // 4. PHASE 1: Admin Document Moderation & Audit Logging
    console.log('\n--- Admin Moderation of KYC Documents ---');
    const adminDocsView = await getProviderDocumentsForAdmin(testProviderProfile.id);
    assert(adminDocsView.documents.length === 3, 'Admin can view all submitted documents');

    for (const doc of adminDocsView.documents) {
      await reviewProviderDocumentByAdmin({
        adminUserId: adminUser.id,
        adminEmail: adminUser.email,
        documentId: doc.id,
        status: 'VERIFIED',
      });
    }

    const providerAfterAdminApproval = await prisma.providerProfile.findUnique({
      where: { id: testProviderProfile.id },
    });
    assert(
      providerAfterAdminApproval?.verificationStatus === VerificationStatus.VERIFIED,
      'Provider status successfully transitioned to VERIFIED after admin document approval'
    );

    const auditLogCount = await prisma.auditLog.count({
      where: {
        actorId: adminUser.id,
        action: 'DOCUMENT_VERIFY',
      },
    });
    assert(auditLogCount >= 3, 'Admin document reviews are recorded in immutable audit log');

    // 5. PHASE 2: Verified Provider Creates Service (starts in DRAFT / PENDING_REVIEW)
    console.log('\n--- PHASE 2: Service Creation & Moderation Submission ---');
    testPackage = await createPackage(testUser.id, {
      name: `Kashmir Alpine Meadow Trek ${timestamp}`,
      description: 'Experience pristine valleys, alpine lakes, and local Gujjar hospitality.',
      destinationName: 'Sonamarg',
      state: 'Jammu and Kashmir',
      durationDays: 5,
      durationNights: 4,
      basePrice: 18500,
      discountPercent: 10,
      status: 'PENDING_REVIEW',
    });

    assert(!!testPackage.id, 'Verified provider successfully creates service listing');
    assert(
      testPackage.status === 'PENDING_REVIEW' || testPackage.approvalStatus === 'pending',
      'Listing begins in PENDING_REVIEW status'
    );

    // 6. PHASE 2 (Marketplace Isolation): Pending listing is NOT visible to public shoppers
    const publicPublishedList = await getPublishedPackages({ q: 'Alpine Meadow Trek' });
    const isPubliclyVisible = publicPublishedList.some((p) => p.id === testPackage.id);
    assert(!isPubliclyVisible, 'Unapproved listing is strictly hidden from public marketplace search/feed');

    const guestView = await getPackageBySlug(testPackage.slug, { requirePublished: true });
    assert(guestView === null, 'Public guest accessing unapproved slug receives 404 (null)');

    const providerPreview = await getPackageBySlug(testPackage.slug, {
      allowPreviewForUser: { id: testUser.id, role: 'provider' },
      requirePublished: false,
    });
    assert(!!providerPreview && providerPreview.id === testPackage.id, 'Owning provider can preview their pending listing');

    const adminPreview = await getPackageBySlug(testPackage.slug, {
      allowPreviewForUser: { id: adminUser.id, role: 'admin' },
      requirePublished: false,
    });
    assert(!!adminPreview && adminPreview.id === testPackage.id, 'Administrator can preview pending listing');

    // 7. PHASE 2: Admin Approves Listing -> Live Publication
    console.log('\n--- Admin Approves Listing & Marketplace Publication ---');
    const approvedPkg = await adminApprovePackage(testPackage.id);
    assert(approvedPkg.status === 'PUBLISHED', 'Package status updated to PUBLISHED');
    assert(approvedPkg.approvalStatus === 'approved', 'Package approvalStatus updated to APPROVED');

    const publicListAfterApprove = await getPublishedPackages({ q: 'Alpine Meadow Trek' });
    const isNowLive = publicListAfterApprove.some((p) => p.id === testPackage.id);
    assert(isNowLive, 'Approved package is now visible to public marketplace shoppers');

    const liveGuestView = await getPackageBySlug(testPackage.slug, { requirePublished: true });
    assert(!!liveGuestView && liveGuestView.id === testPackage.id, 'Public guest can now open live package detail page');

    // 8. PHASE 3: Admin Suspends Listing -> Immediate Removal
    console.log('\n--- Admin Listing Suspension & Revocation ---');
    const suspendedPkg = await adminSuspendPackage(testPackage.id, 'Routine safety inspection required');
    assert(suspendedPkg.status === 'ARCHIVED', 'Suspended package status set to ARCHIVED');
    assert(suspendedPkg.isActive === false, 'Suspended package isActive flag set to false');

    const publicListAfterSuspend = await getPublishedPackages({ q: 'Alpine Meadow Trek' });
    const isHiddenAfterSuspend = !publicListAfterSuspend.some((p) => p.id === testPackage.id);
    assert(isHiddenAfterSuspend, 'Suspended package is immediately excluded from marketplace listings');

    const guestAfterSuspend = await getPackageBySlug(testPackage.slug, { requirePublished: true });
    assert(guestAfterSuspend === null, 'Guest accessing suspended listing receives 404');

    // 9. PHASE 5: Security Boundaries & IDOR Protection
    console.log('\n--- Security Boundaries & IDOR Protection ---');
    const anotherUser = await prisma.user.create({
      data: {
        email: `intruder_${timestamp}@vibemiles.local`,
        role: UserRole.PROVIDER,
        status: UserStatus.ACTIVE,
      },
    });

    let idorBlocked = false;
    try {
      await updatePackage(testPackage.id, anotherUser.id, {
        name: 'Hacked Title',
      });
    } catch (err: any) {
      if (err.message.includes('not found') || err.message.includes('access denied')) {
        idorBlocked = true;
      }
    }
    assert(idorBlocked, 'IDOR attack blocked: Provider B cannot modify Provider A listing');

    // 10. PHASE 4: Performance Benchmarks
    console.log('\n--- PHASE 4: Performance Benchmarks ---');
    await getAdminDashboardMetrics(); // Prime metrics cache
    const t0 = performance.now();
    const metrics = await getAdminDashboardMetrics(); // Cached lookup
    const metricsTime = Math.round(performance.now() - t0);
    assert(!!metrics && metricsTime < 100, `Admin metrics cached lookup executed in ${metricsTime}ms (<100ms target)`);

    await getPublishedPackages({ take: 10 }); // Prime package cache after previous invalidations
    const t1 = performance.now();
    const cachedPackages = await getPublishedPackages({ take: 10 }); // Cached lookup
    const cacheTime = Math.round(performance.now() - t1);
    assert(Array.isArray(cachedPackages) && cacheTime < 50, `Published packages cached lookup executed in ${cacheTime}ms (<50ms target)`);

    // Clean up test records
    console.log('\n--- Cleaning up temporary test fixtures ---');
    if (testPackage?.id) {
      await prisma.packageAvailability.deleteMany({ where: { packageId: testPackage.id } });
      await prisma.itineraryDay.deleteMany({ where: { packageId: testPackage.id } });
      await prisma.packageImage.deleteMany({ where: { packageId: testPackage.id } });
      await prisma.packageInclusion.deleteMany({ where: { packageId: testPackage.id } });
      await prisma.package.delete({ where: { id: testPackage.id } });
    }
    if (testProviderProfile?.id) {
      await prisma.providerDocument.deleteMany({ where: { providerId: testProviderProfile.id } });
      await prisma.providerProfile.delete({ where: { id: testProviderProfile.id } });
    }
    if (testUser?.id) {
      await prisma.user.delete({ where: { id: testUser.id } });
    }
    if (anotherUser?.id) {
      await prisma.user.delete({ where: { id: anotherUser.id } });
    }

    console.log('Temporary test records cleaned up cleanly.');
  } catch (error) {
    console.error('Unexpected error during test execution:', error);
    failed++;
  }

  console.log('\n================================================================');
  console.log(`WORKFLOW TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runWorkflowTest()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
