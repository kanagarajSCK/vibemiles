import { PrismaClient, BookingStatus } from '@prisma/client';
import {
  createBookingInDb,
  getBookingByIdOrRef,
  getBookingsForProvider,
  getAllBookingsForAdmin,
  cancelBookingInDb,
  updateBookingStatusInDb,
} from '../src/server/db/bookings';
import { createProviderUser, createCustomerUser } from '../src/server/db/users';
import { createPackage, submitPackageForReview, adminApprovePackage } from '../src/server/db/packages';

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

async function runPhase6TestSuite() {
  console.log('====================================================');
  console.log('    VIBEMILES — PHASE 6 BOOKING ENGINE TEST SUITE   ');
  console.log('====================================================\n');

  const testSuffix = Date.now();
  const testPassword = 'SecurePassword123!';

  // Users
  const customer1Email = `cust1.${testSuffix}@example.com`;
  const customer2Email = `cust2.${testSuffix}@example.com`;
  const provider1Email = `prov1.${testSuffix}@example.com`;
  const provider2Email = `prov2.${testSuffix}@example.com`;

  let cust1UserId = '';
  let cust2UserId = '';
  let prov1UserId = '';
  let prov1ProfileId = '';
  let prov2UserId = '';
  let prov2ProfileId = '';

  let pkgId = '';
  let draftPkgId = '';
  let availId = '';
  let limitedAvailId = '';

  const createdBookingIds: string[] = [];

  try {
    // -------------------------------------------------------------
    // SETUP: USERS, PROFILES, PACKAGES, AND AVAILABILITIES
    // -------------------------------------------------------------
    console.log('1. Setting up Test Users and Providers:');
    const cust1 = await createCustomerUser({
      email: customer1Email,
      password: testPassword,
      fullName: 'Alice Traveller',
      phone: `911${String(testSuffix).slice(-7)}`,
    });
    cust1UserId = cust1.user.id;

    const cust2 = await createCustomerUser({
      email: customer2Email,
      password: testPassword,
      fullName: 'Bob Explorer',
      phone: `912${String(testSuffix).slice(-7)}`,
    });
    cust2UserId = cust2.user.id;

    const prov1 = await createProviderUser({
      email: provider1Email,
      password: testPassword,
      businessName: `Highland Treks ${testSuffix}`,
      ownerName: 'Tenzing Provider',
      phone: `913${String(testSuffix).slice(-7)}`,
      businessCategory: 'Tour Operator',
      city: 'Manali',
      state: 'Himachal Pradesh',
      pincode: '175131',
    });
    prov1UserId = prov1.user.id;
    prov1ProfileId = prov1.profile.id;

    const prov2 = await createProviderUser({
      email: provider2Email,
      password: testPassword,
      businessName: `Coastal Voyages ${testSuffix}`,
      ownerName: 'Columbus Provider',
      phone: `914${String(testSuffix).slice(-7)}`,
      businessCategory: 'Cruises',
      city: 'Panaji',
      state: 'Goa',
      pincode: '403001',
    });
    prov2UserId = prov2.user.id;
    prov2ProfileId = prov2.profile.id;

    assert(Boolean(cust1UserId && cust2UserId && prov1ProfileId && prov2ProfileId), 'Test users and providers initialized');

    console.log('\n2. Setting up Approved and Draft Packages:');
    const departureDate1 = new Date();
    departureDate1.setDate(departureDate1.getDate() + 30);
    const returnDate1 = new Date(departureDate1);
    returnDate1.setDate(returnDate1.getDate() + 5);

    const departureDate2 = new Date();
    departureDate2.setDate(departureDate2.getDate() + 45);
    const returnDate2 = new Date(departureDate2);
    returnDate2.setDate(returnDate2.getDate() + 5);

    // Approved package with normal capacity and limited capacity date
    const pkg = await createPackage(prov1ProfileId, {
      name: `Manali Alpine Trek ${testSuffix}`,
      description: 'An exciting trek in the Himalayas with high altitude passes.',
      categorySlug: 'tour',
      destinationName: 'Manali',
      state: 'Himachal Pradesh',
      city: 'Manali',
      durationDays: 6,
      durationNights: 5,
      maxGroupSize: 8,
      basePrice: 15000,
      discountPercent: 20, // 20% discount = 12,000 base
      images: [
        'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80',
      ],
      itinerary: [
        { day: 1, title: 'Arrival', description: 'Basecamp', activities: ['Orientation'] },
        { day: 2, title: 'Trek', description: 'High pass', activities: ['Climbing'] },
      ],
      inclusions: ['Guide', 'Tents'],
      exclusions: ['Personal'],
      highlights: ['Scenic views'],
      tags: ['trek', 'adventure'],
    });
    pkgId = pkg.id;

    const avail1 = await prisma.packageAvailability.create({
      data: {
        packageId: pkgId,
        date: departureDate1,
        price: 11000, // Departure-specific pricing
        capacity: 20,
        bookedCount: 0,
        isAvailable: true,
      },
    });
    availId = avail1.id;

    const avail2 = await prisma.packageAvailability.create({
      data: {
        packageId: pkgId,
        date: departureDate2,
        price: 12000,
        capacity: 2, // Strictly 2 spots
        bookedCount: 0,
        isAvailable: true,
      },
    });
    limitedAvailId = avail2.id;

    // Approve package
    await submitPackageForReview(pkgId, prov1ProfileId);
    await adminApprovePackage(pkgId);

    // Draft package (never approved)
    const draftPkg = await createPackage(prov1ProfileId, {
      name: `Draft Unapproved Tour ${testSuffix}`,
      description: 'Draft tour should never accept bookings.',
      categorySlug: 'tour',
      destinationName: 'Manali',
      state: 'Himachal Pradesh',
      city: 'Manali',
      durationDays: 2,
      durationNights: 1,
      maxGroupSize: 10,
      basePrice: 5000,
      discountPercent: 0,
      images: ['https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80'],
      itinerary: [{ day: 1, title: 'Day 1', description: 'Walk', activities: ['Walk'] }],
      inclusions: ['Water'],
      exclusions: ['Food'],
      highlights: ['Walk'],
      tags: ['walk'],
    });
    draftPkgId = draftPkg.id;

    await prisma.packageAvailability.create({
      data: {
        packageId: draftPkgId,
        date: departureDate1,
        price: 5000,
        capacity: 10,
        bookedCount: 0,
        isAvailable: true,
      },
    });

    assert(Boolean(pkgId && availId && limitedAvailId && draftPkgId), 'Packages and availabilities seeded successfully');

    // -------------------------------------------------------------
    // TEST SUITE: CORE BOOKING ENGINE
    // -------------------------------------------------------------
    console.log('\n3. Execution of Booking Test Scenarios:');

    // Scenario 1: Rejection of booking on unapproved / draft package
    try {
      await createBookingInDb({
        customerId: cust1UserId,
        packageId: draftPkgId,
        travelDate: departureDate1.toISOString().split('T')[0],
        adults: 2,
        travelerDetails: [
          { firstName: 'Alice', lastName: 'Traveller', age: 28, gender: 'female' },
          { firstName: 'Friend', lastName: 'Traveller', age: 29, gender: 'male' },
        ],
        contactName: 'Alice',
        contactEmail: customer1Email,
        contactPhone: '9999999999',
      });
      assert(false, 'Scenario 1: Should reject booking on draft/unapproved package', 'Draft package accepted booking');
    } catch (err: unknown) {
      assert(
        (err as Error).message.includes('published') || (err as Error).message.includes('available for booking'),
        'Scenario 1: Rejected booking on unapproved / draft package',
        (err as Error).message
      );
    }

    // Scenario 2: Rejection of invalid traveler counts (< minGroupSize or > maxGroupSize)
    try {
      await createBookingInDb({
        customerId: cust1UserId,
        packageId: pkgId,
        travelDate: departureDate1.toISOString().split('T')[0],
        adults: 15, // maxGroupSize is 8
        travelerDetails: Array.from({ length: 15 }, (_, i) => ({
          firstName: `Traveler${i}`,
          lastName: 'Guest',
          age: 25,
          gender: 'other',
        })),
        contactName: 'Alice',
        contactEmail: customer1Email,
        contactPhone: '9999999999',
      });
      assert(false, 'Scenario 2: Should reject traveler count exceeding max group size');
    } catch (err: unknown) {
      assert(
        (err as Error).message.includes('exceeds the maximum group size'),
        'Scenario 2: Rejected traveler count exceeding max group size (8)',
        (err as Error).message
      );
    }

    // Scenario 3: Successful creation of authenticated customer booking with server price calculation
    const idempotencyKey1 = `test-idem-${testSuffix}-1`;
    const booking1 = await createBookingInDb({
      customerId: cust1UserId,
      packageId: pkgId,
      availabilityId: availId,
      travelDate: departureDate1.toISOString().split('T')[0],
      adults: 2,
      children: 0,
      travelerDetails: [
        { firstName: 'Alice', lastName: 'Traveller', age: 28, gender: 'female' },
        { firstName: 'Friend', lastName: 'Traveller', age: 30, gender: 'male' },
      ],
      optionalServices: [{ name: 'Sleeping Bag Rental', price: 500 }],
      pickup: 'Manali Bus Stand',
      contactName: 'Alice Traveller',
      contactEmail: customer1Email,
      contactPhone: '9876543210',
      idempotencyKey: idempotencyKey1,
    });
    createdBookingIds.push(booking1.id);

    // Expected price: priceOverride is 11,000 * 2 = 22,000 + 500 addon = 22,500
    // Tax 5% = 1,125. Total = 23,625
    assert(
      booking1.bookingStatus === 'pending',
      'Scenario 3.1: Created booking has pending status'
    );
    assert(
      booking1.paymentStatus === 'pending',
      'Scenario 3.2: Payment record created with pending status'
    );
    assert(
      booking1.bookingRef.startsWith('VM-'),
      `Scenario 3.3: Generated non-guessable booking reference: ${booking1.bookingRef}`
    );
    const subtotal = booking1.baseAmount + booking1.optionalServicesAmount - booking1.discountAmount;
    assert(
      subtotal === 22500 && booking1.totalAmount === 23625,
      `Scenario 3.4: Server-calculated pricing exact: subtotal ${subtotal} (expected 22500), total ${booking1.totalAmount} (expected 23625)`
    );

    // Check availability bookedCount was incremented
    const availCheck1 = await prisma.packageAvailability.findUnique({ where: { id: availId } });
    assert(
      availCheck1?.bookedCount === 2,
      `Scenario 3.5: Availability bookedCount atomically incremented to ${availCheck1?.bookedCount} (expected 2)`
    );

    // Scenario 4: Idempotency check (duplicate submission with same idempotencyKey returns existing booking without double charging or double reserving)
    const idempotentBooking = await createBookingInDb({
      customerId: cust1UserId,
      packageId: pkgId,
      availabilityId: availId,
      travelDate: departureDate1.toISOString().split('T')[0],
      adults: 2,
      travelerDetails: [
        { firstName: 'Alice', lastName: 'Traveller', age: 28, gender: 'female' },
        { firstName: 'Friend', lastName: 'Traveller', age: 30, gender: 'male' },
      ],
      contactName: 'Alice Traveller',
      contactEmail: customer1Email,
      contactPhone: '9876543210',
      idempotencyKey: idempotencyKey1,
    });
    assert(
      idempotentBooking.id === booking1.id,
      'Scenario 4.1: Idempotency returns existing booking ID'
    );
    const availCheckPostIdem = await prisma.packageAvailability.findUnique({ where: { id: availId } });
    assert(
      availCheckPostIdem?.bookedCount === 2,
      `Scenario 4.2: Capacity not double-counted on idempotent resubmission (${availCheckPostIdem?.bookedCount})`
    );

    // Scenario 5: Capacity limit & exhaustion test
    // limitedAvailId has totalCapacity: 2
    // Booking 2 spots:
    const booking2 = await createBookingInDb({
      customerId: cust2UserId,
      packageId: pkgId,
      availabilityId: limitedAvailId,
      travelDate: departureDate2.toISOString().split('T')[0],
      adults: 2, // fills the 2 spots
      travelerDetails: [
        { firstName: 'Bob', lastName: 'Explorer', age: 32, gender: 'male' },
        { firstName: 'Partner', lastName: 'Explorer', age: 31, gender: 'female' },
      ],
      contactName: 'Bob Explorer',
      contactEmail: customer2Email,
      contactPhone: '9123456789',
    });
    createdBookingIds.push(booking2.id);
    assert(Boolean(booking2.id), 'Scenario 5.1: Successfully booked remaining 2 spots');

    // Attempting to book when capacity is 0 remaining:
    try {
      await createBookingInDb({
        customerId: cust1UserId,
        packageId: pkgId,
        availabilityId: limitedAvailId,
        travelDate: departureDate2.toISOString().split('T')[0],
        adults: 1,
        travelerDetails: [
          { firstName: 'Alice', lastName: 'Traveller', age: 28, gender: 'female' },
        ],
        contactName: 'Alice',
        contactEmail: customer1Email,
        contactPhone: '9876543210',
      });
      assert(false, 'Scenario 5.2: Should reject booking when departure capacity is exhausted');
    } catch (err: unknown) {
      assert(
        (err as Error).message.includes('capacity') ||
          (err as Error).message.includes('remain') ||
          (err as Error).message.includes('unavailable'),
        'Scenario 5.2: Capacity exhaustion detected and rejected gracefully',
        (err as Error).message
      );
    }

    // Scenario 6: Customer IDOR & Ownership Enforcement
    // Customer 2 attempts to read Customer 1's booking
    const crossBooking = await getBookingByIdOrRef(booking1.id, cust2UserId, 'customer');
    assert(
      crossBooking === null,
      'Scenario 6.1: Customer cross-access rejected with null (IDOR protected)'
    );

    // Customer 1 can read their own booking
    const ownBooking = await getBookingByIdOrRef(booking1.id, cust1UserId, 'customer');
    assert(ownBooking?.id === booking1.id, 'Scenario 6.2: Customer can read own booking');

    // Scenario 7: Provider Ownership Enforcement
    // Provider 1 (the owner of pkgId) can see booking1
    const p1Bookings = await getBookingsForProvider(prov1ProfileId);
    assert(
      p1Bookings.some((b) => b.id === booking1.id),
      'Scenario 7.1: Host provider can view customer bookings for their package'
    );

    // Provider 2 (unrelated provider) cannot see booking1
    const p2Bookings = await getBookingsForProvider(prov2ProfileId);
    assert(
      !p2Bookings.some((b) => b.id === booking1.id),
      'Scenario 7.2: Unrelated provider cannot see other provider bookings'
    );

    // Scenario 8: Admin Global Ledger Access
    const allBookings = await getAllBookingsForAdmin();
    assert(
      allBookings.some((b) => b.id === booking1.id) && allBookings.some((b) => b.id === booking2.id),
      'Scenario 8: Admin can view all platform bookings in master audit ledger'
    );

    // Scenario 9: Cancellation and Capacity Restoration
    // Cancel booking2 on limitedAvailId (which had 2 travelers and 0 spots left)
    const cancelledBooking2 = await cancelBookingInDb(
      booking2.id,
      cust2UserId,
      'customer',
      'Change of travel plans'
    );
    assert(
      cancelledBooking2.bookingStatus === 'cancelled',
      'Scenario 9.1: Booking status transitioned to CANCELLED'
    );
    assert(
      cancelledBooking2.cancellationReason === 'Change of travel plans',
      'Scenario 9.2: Cancellation reason recorded'
    );

    // Verify capacity restored
    const availCheckRestored = await prisma.packageAvailability.findUnique({ where: { id: limitedAvailId } });
    assert(
      availCheckRestored?.bookedCount === 0,
      `Scenario 9.3: Capacity atomically restored from 2 to ${availCheckRestored?.bookedCount} (expected 0)`
    );

    // Now booking into limitedAvailId succeeds again
    const rebooked = await createBookingInDb({
      customerId: cust1UserId,
      packageId: pkgId,
      availabilityId: limitedAvailId,
      travelDate: departureDate2.toISOString().split('T')[0],
      adults: 1,
      travelerDetails: [
        { firstName: 'Alice', lastName: 'Traveller', age: 28, gender: 'female' },
      ],
      contactName: 'Alice',
      contactEmail: customer1Email,
      contactPhone: '9876543210',
    });
    createdBookingIds.push(rebooked.id);
    assert(Boolean(rebooked.id), 'Scenario 9.4: Re-booking into restored capacity succeeds');

    // Scenario 10: State Transition Rules (cannot cancel already cancelled booking)
    try {
      await cancelBookingInDb(
        booking2.id,
        cust2UserId,
        'customer',
        'Try cancelling again'
      );
      assert(false, 'Scenario 10.1: Re-cancelling already cancelled booking should fail');
    } catch (err: unknown) {
      assert(
        (err as Error).message.includes('already cancelled'),
        'Scenario 10.1: Prevented double cancellation of already cancelled booking',
        (err as Error).message
      );
    }

    // Scenario 11: Valid Lifecycle Transitions
    // Transition rebooked booking to CONFIRMED
    const confirmedBooking = await updateBookingStatusInDb(
      rebooked.id,
      BookingStatus.CONFIRMED,
      'admin-audit',
      'admin'
    );
    assert(
      confirmedBooking.bookingStatus === 'confirmed',
      'Scenario 11.1: Transition to CONFIRMED status succeeds'
    );

    // Transition confirmed booking to COMPLETED
    const completedBooking = await updateBookingStatusInDb(
      rebooked.id,
      BookingStatus.COMPLETED,
      'admin-audit',
      'admin'
    );
    assert(
      completedBooking.bookingStatus === 'completed',
      'Scenario 11.2: Transition to COMPLETED status succeeds'
    );

    // Cannot cancel COMPLETED booking
    try {
      await cancelBookingInDb(
        rebooked.id,
        cust1UserId,
        'customer',
        'Cancel after completed'
      );
      assert(false, 'Scenario 11.3: Completed booking cannot be cancelled');
    } catch (err: unknown) {
      assert(
        (err as Error).message.toLowerCase().includes('completed'),
        'Scenario 11.3: Cancellation of completed booking rejected',
        (err as Error).message
      );
    }
  } catch (error) {
    console.error('Fatal test error:', error);
  } finally {
    // -------------------------------------------------------------
    // TEARDOWN / CLEANUP
    // -------------------------------------------------------------
    console.log('\n4. Cleaning up test data:');
    try {
      // Delete created bookings and related records
      if (createdBookingIds.length > 0) {
        await prisma.travelerDetail.deleteMany({ where: { bookingId: { in: createdBookingIds } } });
        await prisma.bookingAddon.deleteMany({ where: { bookingId: { in: createdBookingIds } } });
        await prisma.payment.deleteMany({ where: { bookingId: { in: createdBookingIds } } });
        await prisma.booking.deleteMany({ where: { id: { in: createdBookingIds } } });
        console.log(`  Cleaned up ${createdBookingIds.length} test bookings`);
      }

      // Delete packages
      if (pkgId) {
        await prisma.packageAvailability.deleteMany({ where: { packageId: pkgId } });
        await prisma.packageImage.deleteMany({ where: { packageId: pkgId } });
        await prisma.itineraryDay.deleteMany({ where: { packageId: pkgId } });
        await prisma.packageInclusion.deleteMany({ where: { packageId: pkgId } });
        await prisma.package.delete({ where: { id: pkgId } });
      }
      if (draftPkgId) {
        await prisma.packageAvailability.deleteMany({ where: { packageId: draftPkgId } });
        await prisma.packageImage.deleteMany({ where: { packageId: draftPkgId } });
        await prisma.itineraryDay.deleteMany({ where: { packageId: draftPkgId } });
        await prisma.packageInclusion.deleteMany({ where: { packageId: draftPkgId } });
        await prisma.package.delete({ where: { id: draftPkgId } });
      }

      // Delete users & profiles
      const userIds = [cust1UserId, cust2UserId, prov1UserId, prov2UserId].filter(Boolean);
      if (userIds.length > 0) {
        await prisma.customerProfile.deleteMany({ where: { userId: { in: userIds } } });
        await prisma.providerProfile.deleteMany({ where: { userId: { in: userIds } } });
        await prisma.user.deleteMany({ where: { id: { in: userIds } } });
        console.log(`  Cleaned up ${userIds.length} test users`);
      }
      console.log('  Teardown completed cleanly.');
    } catch (cleanupErr) {
      console.error('  Warning during teardown:', cleanupErr);
    } finally {
      await prisma.$disconnect();
    }
  }

  console.log('\n====================================================');
  console.log(`TEST RESULTS: ${passedTests} / ${totalTests} PASSED`);
  console.log('====================================================');

  if (passedTests !== totalTests || totalTests === 0) {
    process.exit(1);
  }
}

runPhase6TestSuite().catch((err) => {
  console.error('Unexpected failure in test suite:', err);
  process.exit(1);
});
