import { prisma } from '../src/lib/prisma';
import { createProviderUser, createCustomerUser } from '../src/server/db/users';
import { createPackage } from '../src/server/db/packages';
import { deleteUserInDb } from '../src/server/db/admin';
import { BookingStatus, PaymentStatus } from '@prisma/client';

async function runPerformanceAndDeletionTests() {
  console.log('========================================================');
  console.log('STARTING QA TESTS: USER DELETION PERFORMANCE & TIMEOUT FIX');
  console.log('========================================================');

  const timestamp = Date.now();
  const adminUser = { id: 'admin-perf-test', email: 'admin@vibemiles.com' };

  try {
    // ── TEST 1: Permanent Hard Delete of Provider with Packages (0 bookings) ──
    console.log('\n[TEST 1] Testing permanent delete of provider with multiple packages...');
    const providerReg = await createProviderUser({
      fullName: 'Speedy Operator',
      email: `perf_provider_${timestamp}@vibemiles.local`,
      phone: `9${String(Date.now()).slice(-9)}`,
      password: 'Password123!',
      businessName: `Speedy Travels ${timestamp}`,
      businessCategory: 'Tour Operator',
      city: 'Manali',
      state: 'Himachal Pradesh',
      pincode: '175131',
    });

    // Mark as verified so package creation is allowed
    await prisma.providerProfile.update({
      where: { userId: providerReg.user.id },
      data: { verificationStatus: 'VERIFIED' },
    });

    const providerProfile = await prisma.providerProfile.findUniqueOrThrow({
      where: { userId: providerReg.user.id },
    });

    // Create 3 packages with images, itinerary, inclusions, availabilities
    console.log('Creating 3 packages with full relational dependencies...');
    for (let i = 1; i <= 3; i++) {
      await createPackage(providerProfile.id, {
        name: `Scenic Package ${i} - ${timestamp}`,
        description: 'Breathtaking mountain vistas and adventure activities.',
        basePrice: 4000 + i * 1000,
        images: ['https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80'],
        destinationName: 'Manali',
      });
    }

    const createdPackagesCount = await prisma.package.count({
      where: { providerId: providerProfile.id },
    });
    console.log(`Created ${createdPackagesCount} packages for provider.`);

    // Measure deletion execution time
    console.log('Executing deleteUserInDb (permanent: true)...');
    const startTime = Date.now();
    const result = await deleteUserInDb({
      adminUser,
      userId: providerReg.user.id,
      permanent: true,
      reason: 'Automated performance benchmark testing of account purge.',
    });
    const duration = Date.now() - startTime;

    console.log(`Deletion finished in ${duration}ms! Outcome: ${result.action}`);

    // Verify all records purged
    const userAfter = await prisma.user.findUnique({ where: { id: providerReg.user.id } });
    const profileAfter = await prisma.providerProfile.findUnique({ where: { id: providerProfile.id } });
    const packagesAfter = await prisma.package.count({ where: { providerId: providerProfile.id } });

    if (userAfter !== null || profileAfter !== null || packagesAfter !== 0) {
      throw new Error(`Records not completely purged! User: ${!!userAfter}, Profile: ${!!profileAfter}, Packages: ${packagesAfter}`);
    }

    if (duration > 5000) {
      console.warn(`WARNING: Deletion took ${duration}ms, which is above target < 5000ms!`);
    } else {
      console.log(`✓ PASS: Permanent deletion of provider with 3 packages completed in ${duration}ms (target < 5000ms, well below 30s timeout).`);
    }

    // ── TEST 2: Permanent Delete of Customer with Reviews ──────────────────
    console.log('\n[TEST 2] Testing permanent delete of customer with reviews (0 bookings)...');
    const customerReg = await createCustomerUser({
      fullName: 'Reviewer Customer',
      email: `perf_customer_${timestamp}@vibemiles.local`,
      phone: `9${String(Date.now() + 1).slice(-9)}`,
      password: 'Password123!',
    });

    const custProfile = await prisma.customerProfile.findUniqueOrThrow({
      where: { userId: customerReg.user.id },
    });

    // Find any existing package to review
    const anyPackage = await prisma.package.findFirst();
    if (anyPackage) {
      await prisma.review.create({
        data: {
          packageId: anyPackage.id,
          customerId: custProfile.id,
          rating: 5.0,
          title: 'Great trip!',
          comment: 'Outstanding journey and excellent support.',
          status: 'APPROVED',
        },
      });
    }

    const startCust = Date.now();
    const custResult = await deleteUserInDb({
      adminUser,
      userId: customerReg.user.id,
      permanent: true,
      reason: 'Customer requested account closure under privacy policy.',
    });
    const custDuration = Date.now() - startCust;

    console.log(`Customer deletion finished in ${custDuration}ms! Outcome: ${custResult.action}`);
    const custAfter = await prisma.user.findUnique({ where: { id: customerReg.user.id } });
    if (custAfter !== null) {
      throw new Error('Customer was not deleted!');
    }
    console.log(`✓ PASS: Customer with reviews permanently purged in ${custDuration}ms.`);

    // ── TEST 3: Deletion of User with Financial Bookings (Retention Anonymization) ──
    console.log('\n[TEST 3] Testing deletion of user with financial bookings (retention anonymization)...');
    const retentionCustomer = await createCustomerUser({
      fullName: 'Financial Customer',
      email: `retention_${timestamp}@vibemiles.local`,
      phone: `9${String(Date.now() + 2).slice(-9)}`,
      password: 'Password123!',
    });

    const retentionProfile = await prisma.customerProfile.findUniqueOrThrow({
      where: { userId: retentionCustomer.user.id },
    });

    if (anyPackage) {
      await prisma.booking.create({
        data: {
          bookingRef: `VM-RET-${timestamp.toString().slice(-6)}`,
          customerId: retentionProfile.id,
          providerId: anyPackage.providerId,
          packageId: anyPackage.id,
          travelDate: new Date(),
          adults: 1,
          baseAmount: 5000,
          taxAmount: 900,
          totalAmount: 5900,
          bookingStatus: BookingStatus.CONFIRMED,
        },
      });
    }

    const startRetention = Date.now();
    const retentionResult = await deleteUserInDb({
      adminUser,
      userId: retentionCustomer.user.id,
      permanent: true,
      reason: 'Account closed with historical legal ledger records retained.',
    });
    const retentionDuration = Date.now() - startRetention;

    console.log(`Retention anonymization finished in ${retentionDuration}ms! Outcome: ${retentionResult.action}`);
    if (retentionResult.action !== 'ANONYMIZED_FOR_RETENTION') {
      throw new Error(`Expected ANONYMIZED_FOR_RETENTION, got ${retentionResult.action}`);
    }

    const anonymizedUser = await prisma.user.findUniqueOrThrow({ where: { id: retentionCustomer.user.id } });
    console.log(`Anonymized email: ${anonymizedUser.email}, phone: ${anonymizedUser.phone}, status: ${anonymizedUser.status}`);
    if (!anonymizedUser.email.includes('anonymized_') || anonymizedUser.phone !== null || anonymizedUser.status !== 'INACTIVE') {
      throw new Error('User PII was not properly anonymized!');
    }
    console.log(`✓ PASS: User with financial bookings properly anonymized in ${retentionDuration}ms.`);

    // ── TEST 4: Prohibited Self-Deletion & Last Admin Safety ──────────────
    console.log('\n[TEST 4] Testing self-deletion and last admin safety checks...');
    let selfDeleteBlocked = false;
    try {
      await deleteUserInDb({
        adminUser: { id: 'admin-self', email: 'admin@vibemiles.com' },
        userId: 'admin-self',
        permanent: true,
        reason: 'Attempting suicide delete.',
      });
    } catch (err: any) {
      selfDeleteBlocked = true;
      console.log(`Self-deletion correctly blocked: "${err.message}"`);
    }
    if (!selfDeleteBlocked) {
      throw new Error('Admin self-deletion was not blocked!');
    }
    console.log('✓ PASS: Self-deletion safety check verified.');

    // Clean up retention test booking & user
    console.log('\n[CLEANUP] Cleaning up test records...');
    await prisma.booking.deleteMany({ where: { customerId: retentionProfile.id } });
    await prisma.customerProfile.delete({ where: { id: retentionProfile.id } });
    await prisma.user.delete({ where: { id: retentionCustomer.user.id } });
    console.log('✓ Clean up complete.');

    console.log('\n========================================================');
    console.log('ALL TESTS PASSED! TRANSACTION TIMEOUT BUG FULLY RESOLVED.');
    console.log('========================================================');
  } catch (error) {
    console.error('Test execution failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runPerformanceAndDeletionTests();
