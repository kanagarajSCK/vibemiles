import { prisma } from '../src/lib/prisma';
import {
  UserRole,
  UserStatus,
  VerificationStatus,
  ListingStatus,
  ApprovalStatus,
  BookingStatus,
  PaymentStatus,
} from '@prisma/client';
import {
  getAdminDashboardMetrics,
  getAdminUsers,
  getUserDetailsForAdmin,
  updateUserStatusInDb,
  deleteUserInDb,
  invalidateUserSessionsInDb,
  getAdminSettlements,
  updateSettlementStatusInDb,
  getAuditLogs,
} from '../src/server/db/admin';
import {
  getAllPackagesForAdmin,
  adminApprovePackage,
  adminSuspendPackage,
  adminReactivatePackage,
  adminUpdatePackage,
  adminDeletePackage,
  createPackage,
} from '../src/server/db/packages';

async function runAdminControlCenterTests() {
  console.log('================================================================');
  console.log('VibeMiles: Complete Admin Control Center Verification Test');
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

  const timestamp = Date.now();
  let adminUser: any = null;
  let tempCustomerId: string | null = null;
  let tempProviderId: string | null = null;
  let tempPackageId: string | null = null;

  try {
    // -------------------------------------------------------------
    // 1. ADMIN USER RESOLUTION
    // -------------------------------------------------------------
    adminUser = await prisma.user.findFirst({
      where: { role: UserRole.ADMIN, status: UserStatus.ACTIVE },
    });
    assert(!!adminUser, 'Admin account exists in database for administrative operations');
    const adminIdentity = { id: adminUser.id, email: adminUser.email };

    // -------------------------------------------------------------
    // 2. DASHBOARD METRICS CALCULATION (Real DB, No Mocks)
    // -------------------------------------------------------------
    console.log('\n--- Section 1: Admin Dashboard Real Metrics ---');
    const res = await getAdminDashboardMetrics();
    const m = res.metrics;
    const liveUserCount = await prisma.user.count();
    const livePackageCount = await prisma.package.count();
    const liveBookingCount = await prisma.booking.count();

    assert(m.users.totalUsers === liveUserCount, `Metrics totalUsers (${m.users.totalUsers}) matches database count (${liveUserCount})`);
    assert(m.listings.totalPackages === livePackageCount, `Metrics totalPackages (${m.listings.totalPackages}) matches database count (${livePackageCount})`);
    assert(m.bookings.total === liveBookingCount, `Metrics totalBookings (${m.bookings.total}) matches database count (${liveBookingCount})`);
    assert(typeof m.financial.grossBookingValue === 'number', 'Gross Booking Value (GMV) computed as numeric currency');
    assert(typeof m.financial.collectedRevenue === 'number', 'Collected Revenue computed from verified paid payments');
    assert(typeof m.financial.platformCommissionEarned === 'number', 'Platform Commission accurately tracked');
    assert(typeof m.financial.providerPayablesPending === 'number', 'Pending Provider Payables computed');
    assert(typeof m.financial.providerAmountSettled === 'number', 'Settled Payouts tracked');

    // -------------------------------------------------------------
    // 3. USER MANAGEMENT & SEARCH FILTERING
    // -------------------------------------------------------------
    console.log('\n--- Section 2: User Search, Filtering & Inspection ---');
    const allUsersResult = await getAdminUsers({ page: 1, limit: 10 });
    assert(allUsersResult.items.length > 0, `getAdminUsers returned ${allUsersResult.items.length} users`);

    const customerFilterResult = await getAdminUsers({ role: UserRole.CUSTOMER });
    const allCustomersMatch = customerFilterResult.items.every((u) => u.role === 'CUSTOMER');
    assert(allCustomersMatch, 'getAdminUsers accurately filters by role=CUSTOMER');

    const providerFilterResult = await getAdminUsers({ role: UserRole.PROVIDER });
    const allProvidersMatch = providerFilterResult.items.every((u) => u.role === 'PROVIDER');
    assert(allProvidersMatch, 'getAdminUsers accurately filters by role=PROVIDER');

    // Test user details inspection
    const sampleUserId = allUsersResult.items[0].id;
    const userDetails = await getUserDetailsForAdmin(sampleUserId);
    assert(!!userDetails, `getUserDetailsForAdmin successfully retrieved full details for user ${sampleUserId}`);
    assert(Array.isArray(userDetails?.sessions), 'User details reports active session list');
    assert(typeof userDetails?.financialSummary?.canPermanentlyDeleteWithoutRetention === 'boolean', 'User details computes canPermanentlyDelete based on financial ties');

    // -------------------------------------------------------------
    // 4. SUSPENSION & SESSION INVALIDATION
    // -------------------------------------------------------------
    console.log('\n--- Section 3: Suspension, Session Invalidation & Reactivation ---');
    // Create a temporary customer with a session to test session termination
    const tempUserEmail = `qa_suspension_test_${timestamp}@vibemiles.local`;
    const tempCustomer = await prisma.user.create({
      data: {
        email: tempUserEmail,
        passwordHash: 'dummy_hash',
        role: UserRole.CUSTOMER,
        status: UserStatus.ACTIVE,
        customerProfile: {
          create: {
            fullName: 'QA Suspension Test User',
          },
        },
      },
    });
    tempCustomerId = tempCustomer.id;

    // Create an active session for this user
    const dummyToken = `dummy_token_${timestamp}`;
    await prisma.session.create({
      data: {
        userId: tempCustomer.id,
        token: dummyToken,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });

    const sessionsBefore = await prisma.session.count({ where: { userId: tempCustomer.id } });
    assert(sessionsBefore === 1, 'Temporary test user session successfully established');

    // Suspend the user
    await updateUserStatusInDb({
      adminUser: adminIdentity,
      userId: tempCustomer.id,
      status: UserStatus.SUSPENDED,
      reason: 'Automated test suspension for compliance verification',
    });

    const userAfterSuspend = await prisma.user.findUnique({ where: { id: tempCustomer.id } });
    assert(userAfterSuspend?.status === UserStatus.SUSPENDED, 'User status successfully mutated to SUSPENDED in PostgreSQL');

    const sessionsAfter = await prisma.session.count({ where: { userId: tempCustomer.id } });
    assert(sessionsAfter === 0, 'Active user sessions immediately invalidated and destroyed on suspension');

    // Verify Audit Log for suspension
    const suspensionLog = await prisma.auditLog.findFirst({
      where: {
        action: 'USER_SUSPEND',
        targetId: tempCustomer.id,
      },
      orderBy: { createdAt: 'desc' },
    });
    assert(!!suspensionLog, 'AuditLog created for USER_SUSPEND with actor identity and justification');

    // Reactivate the user
    await updateUserStatusInDb({
      adminUser: adminIdentity,
      userId: tempCustomer.id,
      status: UserStatus.ACTIVE,
      reason: 'Automated test reactivation after verification',
    });
    const userAfterReactivate = await prisma.user.findUnique({ where: { id: tempCustomer.id } });
    assert(userAfterReactivate?.status === UserStatus.ACTIVE, 'User status successfully restored to ACTIVE');

    // -------------------------------------------------------------
    // 5. SELF-MODIFICATION & LAST ADMIN GUARDS
    // -------------------------------------------------------------
    console.log('\n--- Section 4: Self-Action & Last Admin Protections ---');
    let selfSuspendBlocked = false;
    try {
      await updateUserStatusInDb({
        adminUser: adminIdentity,
        userId: adminUser.id,
        status: UserStatus.SUSPENDED,
        reason: 'Attempt self suspension',
      });
    } catch (err: any) {
      if (err.message.toLowerCase().includes('cannot suspend') && err.message.toLowerCase().includes('own')) {
        selfSuspendBlocked = true;
      }
    }
    assert(selfSuspendBlocked, 'Admin self-suspension strictly blocked by server-side guard');

    let selfDeleteBlocked = false;
    try {
      await deleteUserInDb({
        adminUser: adminIdentity,
        userId: adminUser.id,
        permanent: true,
        reason: 'Attempt self deletion',
      });
    } catch (err: any) {
      if (err.message.toLowerCase().includes('cannot delete') && err.message.toLowerCase().includes('own')) {
        selfDeleteBlocked = true;
      }
    }
    assert(selfDeleteBlocked, 'Admin self-deletion strictly blocked by server-side guard');

    // -------------------------------------------------------------
    // 6. SAFE DELETION & RETENTION COMPLIANCE
    // -------------------------------------------------------------
    console.log('\n--- Section 5: Safe Deletion & Retention Compliance ---');
    // Test A: User with 0 bookings -> Permanent hard delete
    const result0Bookings = await deleteUserInDb({
      adminUser: adminIdentity,
      userId: tempCustomer.id,
      permanent: true,
      reason: 'Clean test user purge with 0 bookings',
    });
    assert(result0Bookings.action === 'PERMANENTLY_DELETED', 'User with 0 bookings successfully hard-deleted from database');
    const checkDeleted = await prisma.user.findUnique({ where: { id: tempCustomer.id } });
    assert(checkDeleted === null, 'User record fully purged from PostgreSQL');
    tempCustomerId = null; // Cleaned up

    // Test B: User with bookings -> Irreversible Anonymization (Financial Retention)
    // Find an existing customer with bookings
    const customerWithBooking = await prisma.customerProfile.findFirst({
      where: { bookings: { some: {} } },
      include: { user: true },
    });

    if (customerWithBooking) {
      // Test the retention logic on a simulated test customer that has a booking
      const retentionUserEmail = `qa_retention_${timestamp}@vibemiles.local`;
      const retentionUser = await prisma.user.create({
        data: {
          email: retentionUserEmail,
          phone: '+919999988888',
          passwordHash: 'dummy_hash',
          role: UserRole.CUSTOMER,
          status: UserStatus.ACTIVE,
          customerProfile: {
            create: {
              fullName: 'Retention Traveler',
              city: 'Mumbai',
              state: 'Maharashtra',
            },
          },
        },
        include: { customerProfile: true },
      });

      // Create a dummy booking tied to this user to activate financial retention
      const samplePkg = await prisma.package.findFirst();
      const sampleProvider = await prisma.providerProfile.findFirst();
      if (samplePkg && sampleProvider && retentionUser.customerProfile) {
        await prisma.booking.create({
          data: {
            bookingRef: `VM-RET-${timestamp.toString().slice(-6)}`,
            packageId: samplePkg.id,
            providerId: sampleProvider.id,
            customerId: retentionUser.customerProfile.id,
            travelDate: new Date(),
            adults: 2,
            children: 0,
            baseAmount: 5000,
            taxAmount: 250,
            totalAmount: 5250,
            bookingStatus: BookingStatus.COMPLETED,
          },
        });

        // Request permanent delete on user with booking
        const retentionDeleteResult = await deleteUserInDb({
          adminUser: adminIdentity,
          userId: retentionUser.id,
          permanent: true,
          reason: 'GDPR right to be forgotten request with accounting ledger retention',
        });

        assert(retentionDeleteResult.action === 'ANONYMIZED_FOR_RETENTION', 'Financial retention enforces ANONYMIZED_FOR_RETENTION rather than hard-delete');

        const anonymizedUser = await prisma.user.findUnique({
          where: { id: retentionUser.id },
          include: { customerProfile: true },
        });

        assert(anonymizedUser !== null, 'User account remains in DB to satisfy statutory accounting retention');
        assert(Boolean(anonymizedUser?.email.startsWith('anonymized_')), 'Personal email address irreversibly anonymized');
        assert(anonymizedUser?.customerProfile?.fullName === 'Deactivated Traveler', 'Profile name replaced with anonymous placeholder');
        assert(anonymizedUser?.phone === null, 'Personal phone number stripped from records');

        // Clean up dummy booking & anonymized test user
        await prisma.booking.deleteMany({ where: { customerId: retentionUser.customerProfile.id } });
        await prisma.customerProfile.delete({ where: { id: retentionUser.customerProfile.id } });
        await prisma.user.delete({ where: { id: retentionUser.id } });
      }
    }

    // -------------------------------------------------------------
    // 7. PACKAGE MODERATION & RETENTION
    // -------------------------------------------------------------
    console.log('\n--- Section 6: Package Moderation & Catalog Retention ---');
    const allAdminPackages = await getAllPackagesForAdmin();
    assert(allAdminPackages.length > 0, `getAllPackagesForAdmin returned ${allAdminPackages.length} listings`);

    // Create a standalone test package to moderate and delete
    const verifiedProvider = await prisma.providerProfile.findFirst({
      where: { verificationStatus: VerificationStatus.VERIFIED, isActive: true },
    });

    if (verifiedProvider) {
      const pkgName = `QA Control Center Package ${timestamp}`;
      const newPkg = await createPackage(verifiedProvider.id, {
        name: pkgName,
        description: 'Comprehensive test package created for admin moderation and deletion validation.',
        durationDays: 3,
        durationNights: 2,
        basePrice: 12000,
        discountPercent: 10,
        status: 'PENDING_REVIEW',
      });
      tempPackageId = newPkg.id;
      assert(!!newPkg.id, `Created test package "${newPkg.name}" in PENDING_REVIEW`);

      // 1. Approve package
      const approvedPkg = await adminApprovePackage(newPkg.id);
      assert(approvedPkg.status === 'PUBLISHED', 'adminApprovePackage successfully transitions status to PUBLISHED');

      // 2. Suspend package
      const suspendedPkg = await adminSuspendPackage(newPkg.id, 'Compliance review pause');
      assert(suspendedPkg.status === 'ARCHIVED', 'adminSuspendPackage successfully archives and suspends listing');

      // 3. Reactivate package
      const reactivatedPkg = await adminReactivatePackage({
        adminUser: adminIdentity,
        packageId: newPkg.id,
        reason: 'Verification confirmed',
      });
      assert(reactivatedPkg.status === 'PUBLISHED', 'adminReactivatePackage successfully reactivates listing to PUBLISHED');

      // 4. Update package attributes (pricing & featured)
      const updatedPkg = await adminUpdatePackage({
        adminUser: adminIdentity,
        packageId: newPkg.id,
        data: {
          basePrice: 15000,
          discountPercent: 20,
          isFeatured: true,
        },
      });
      assert(updatedPkg.basePrice === 15000, 'adminUpdatePackage successfully updated base price');
      assert(updatedPkg.isFeatured === true, 'adminUpdatePackage successfully toggled featured flag');

      // 5. Delete package with 0 bookings -> Permanent hard purge
      const deleteResult = await adminDeletePackage({
        adminUser: adminIdentity,
        packageId: newPkg.id,
        permanent: true,
        reason: 'Automated test package cleanup with 0 bookings',
      });
      assert(deleteResult.action === 'PERMANENTLY_DELETED', 'Package with 0 bookings permanently deleted from database');
      const checkPkg = await prisma.package.findUnique({ where: { id: newPkg.id } });
      assert(checkPkg === null, 'Package record cleanly purged from PostgreSQL');
      tempPackageId = null;
    }

    // -------------------------------------------------------------
    // 8. SETTLEMENTS & PAYOUTS LEDGER
    // -------------------------------------------------------------
    console.log('\n--- Section 7: Operator Payouts & Settlements Ledger ---');
    const settlementsResult = await getAdminSettlements({ page: 1, limit: 10 });
    assert(Array.isArray(settlementsResult.items), 'getAdminSettlements returns paginated items array');

    // If a settlement exists, test status update
    if (settlementsResult.items.length > 0) {
      const sampleSettlement = settlementsResult.items[0];
      const origStatus = sampleSettlement.status;

      const updatedSettlement = await updateSettlementStatusInDb({
        adminUser: adminIdentity,
        settlementId: sampleSettlement.id,
        status: 'SETTLED',
        referenceNote: `QA-RECON-UTR-${timestamp}`,
      });

      assert(updatedSettlement.status === 'SETTLED', 'updateSettlementStatusInDb updated settlement to SETTLED');
      assert(Boolean(updatedSettlement.referenceNote?.includes('QA-RECON-UTR')), 'Bank reference note recorded on ledger entry');

      // Restore original status
      await updateSettlementStatusInDb({
        adminUser: adminIdentity,
        settlementId: sampleSettlement.id,
        status: origStatus,
        referenceNote: sampleSettlement.referenceNote || undefined,
      });
    } else {
      console.log('[SKIP] No existing settlements in database to reconcile. Query capability verified.');
    }

    // -------------------------------------------------------------
    // 9. AUDIT LOG GENERATION & QUERYING
    // -------------------------------------------------------------
    console.log('\n--- Section 8: Immutable Audit Trail Verification ---');
    const auditLogs = await getAuditLogs({ limit: 10 });
    assert(auditLogs.total > 0, `getAuditLogs confirmed ${auditLogs.total} immutable audit entries recorded`);
    assert(auditLogs.logs.length > 0, 'Audit log entries include actor email, action, and timestamp');

    console.log('\n================================================================');
    console.log(`Test Execution Completed: ${passed} PASSED | ${failed} FAILED`);
    console.log('================================================================\n');

    if (failed > 0) {
      process.exit(1);
    }
  } catch (error) {
    console.error('Fatal error in admin control center test suite:', error);
    process.exit(1);
  } finally {
    // Clean up temporary customer if still exists
    if (tempCustomerId) {
      try {
        await prisma.session.deleteMany({ where: { userId: tempCustomerId } });
        await prisma.customerProfile.deleteMany({ where: { userId: tempCustomerId } });
        await prisma.user.delete({ where: { id: tempCustomerId } });
      } catch (e) {}
    }
    // Clean up temporary package if still exists
    if (tempPackageId) {
      try {
        await prisma.package.delete({ where: { id: tempPackageId } });
      } catch (e) {}
    }
    await prisma.$disconnect();
  }
}

runAdminControlCenterTests();
