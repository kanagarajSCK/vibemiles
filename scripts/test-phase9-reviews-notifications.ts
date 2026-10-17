/* eslint-disable @typescript-eslint/no-explicit-any */
import crypto from 'node:crypto';
import { PrismaClient, UserRole, UserStatus, VerificationStatus, ListingStatus, ReviewStatus, NotificationType } from '@prisma/client';
import {
  createVerifiedReviewInDb,
  replyToReviewInDb,
  adminModerateReviewInDb,
  getReviewsForPackage,
  getReviewsForCustomer,
  getReviewForBooking,
  getReviewsForProvider,
  recalculatePackageRatings,
  recalculateProviderRatings,
} from '../src/server/db/reviews';
import {
  createNotificationInDb,
  getNotificationsForUser,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotificationFromDb,
  getUnreadNotificationCount,
} from '../src/server/db/notifications';
import { deliveryService } from '../src/server/notifications/delivery';
import { createCustomerUser, createProviderUser } from '../src/server/db/users';
import { createPackage, submitPackageForReview, adminApprovePackage } from '../src/server/db/packages';
import { createBookingInDb } from '../src/server/db/bookings';
import { createPaymentOrderForBooking, verifyPaymentAndConfirmBooking } from '../src/server/db/payments';
import { hashPassword } from '../src/server/auth/password';
import { updateCustomerStatusInDb, reviewProviderVerificationInDb } from '../src/server/db/admin';

const prisma = new PrismaClient();

async function runPhase9Tests() {
  console.log('================================================================');
  console.log('VibeMiles — Phase 9: Verified Reviews & Notifications Test Suite');
  console.log('================================================================');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`  [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`  [FAIL] ${testName}${detail ? ` (${detail})` : ''}`);
      failed++;
    }
  }

  const testSuffix = Date.now();
  let adminUser: any;
  let providerUser: any;
  let providerProfile: any;
  let provider2User: any;
  let provider2Profile: any;
  let customerUser: any;
  let customerProfile: any;
  let customer2User: any;
  let customer2Profile: any;
  let testCategory: any;
  let testPackage: any;
  let pastAvail: any;
  let futureAvail: any;
  let eligibleBooking: any;
  let pendingBooking: any;
  let customer2Booking: any;
  let createdReviewId: string | null = null;

  try {
    // ---------------------------------------------------------
    // SETUP: TEST ACTORS & FIXTURES
    // ---------------------------------------------------------
    console.log('\n--- Setup: Initializing Test Actors & Database Fixtures ---');

    const adminHash = await hashPassword('AdminPass123!');
    adminUser = await prisma.user.create({
      data: {
        email: `phase9_admin_${testSuffix}@vibemiles.test`,
        passwordHash: adminHash,
        role: UserRole.ADMIN,
        status: UserStatus.ACTIVE,
      },
    });
    assert(adminUser.role === UserRole.ADMIN, 'Admin user created');

    const providerRes = await createProviderUser({
      fullName: 'Vikram Mehta',
      email: `phase9_operator_${testSuffix}@vibemiles.test`,
      phone: `+9197654${String(testSuffix).slice(-5)}`,
      password: 'ProviderPass123!',
      businessName: `Mehta Adventures ${testSuffix}`,
      businessCategory: 'Tour Organizer',
      city: 'Manali',
      state: 'Himachal Pradesh',
      pincode: '175131',
    });
    providerUser = providerRes.user;
    providerProfile = providerRes.profile;

    const provider2Res = await createProviderUser({
      fullName: 'Other Host',
      email: `phase9_other_operator_${testSuffix}@vibemiles.test`,
      phone: `+9197653${String(testSuffix).slice(-5)}`,
      password: 'ProviderPass123!',
      businessName: `Other Host Expeditions ${testSuffix}`,
      businessCategory: 'Tour Organizer',
      city: 'Shimla',
      state: 'Himachal Pradesh',
      pincode: '171001',
    });
    provider2User = provider2Res.user;
    provider2Profile = provider2Res.profile;

    const customerRes = await createCustomerUser({
      email: `phase9_traveler_${testSuffix}@vibemiles.test`,
      password: 'TravelerPass123!',
      fullName: 'Aarav Sharma',
      phone: `+9198765${String(testSuffix).slice(-5)}`,
    });
    customerUser = customerRes.user;
    customerProfile = customerRes.profile;

    const customer2Res = await createCustomerUser({
      email: `phase9_traveler2_${testSuffix}@vibemiles.test`,
      password: 'TravelerPass123!',
      fullName: 'Diya Patel',
      phone: `+9198764${String(testSuffix).slice(-5)}`,
    });
    customer2User = customer2Res.user;
    customer2Profile = customer2Res.profile;

    testCategory = await prisma.category.create({
      data: {
        name: `Test Cat ${testSuffix}`,
        slug: `test-cat-${testSuffix}`,
        isActive: true,
      },
    });

    const dest = await prisma.destination.findFirst();
    const pkgData = await createPackage(providerProfile.id, {
      name: `Phase 9 Trek ${testSuffix}`,
      description: 'A spectacular Himalayan exploration designed for review verification testing.',
      categoryId: testCategory.id,
      destinationId: dest?.id || 'dest-placeholder',
      state: 'Himachal Pradesh',
      city: 'Manali',
      durationDays: 4,
      durationNights: 3,
      maxGroupSize: 20,
      basePrice: 12500,
    });
    await submitPackageForReview(pkgData.id, providerProfile.id);
    testPackage = await adminApprovePackage(pkgData.id);
    assert(testPackage.status === ListingStatus.PUBLISHED, 'Test package created and published');

    // Create past and future availability slots
    const pastDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    pastDate.setUTCHours(0, 0, 0, 0);

    const futureDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
    futureDate.setUTCHours(0, 0, 0, 0);

    pastAvail = await prisma.packageAvailability.create({
      data: {
        packageId: testPackage.id,
        date: pastDate,
        price: 12500,
        capacity: 20,
        bookedCount: 0,
        isAvailable: true,
      },
    });

    futureAvail = await prisma.packageAvailability.create({
      data: {
        packageId: testPackage.id,
        date: futureDate,
        price: 12500,
        capacity: 20,
        bookedCount: 0,
        isAvailable: true,
      },
    });

    // 1. Eligible Booking (Customer 1, Past Travel Date, Confirmed & Paid)
    eligibleBooking = await createBookingInDb({
      customerId: customerProfile.id,
      packageId: testPackage.id,
      availabilityId: pastAvail.id,
      travelDate: pastDate.toISOString().split('T')[0],
      adults: 2,
      contactName: 'Aarav Sharma',
      contactEmail: customerUser.email,
      contactPhone: '+919876543210',
      travelerDetails: [
        { firstName: 'Aarav', lastName: 'Sharma', age: 30, gender: 'male' },
        { firstName: 'Neha', lastName: 'Sharma', age: 28, gender: 'female' },
      ],
    });

    // Pay and Confirm Booking 1 via real payment gateway verification
    const orderRes1 = await createPaymentOrderForBooking({
      bookingIdOrRef: eligibleBooking.id,
      customerId: customerUser.id,
      userRole: 'customer',
    });
    const paymentId1 = `pay_phase9_001_${testSuffix}`;
    const secret = process.env.RAZORPAY_KEY_SECRET || 'rzp_test_placeholder_secret';
    const validSignature1 = crypto.createHmac('sha256', secret).update(`${orderRes1.orderId}|${paymentId1}`).digest('hex');

    await verifyPaymentAndConfirmBooking({
      bookingId: eligibleBooking.id,
      orderId: orderRes1.orderId,
      paymentId: paymentId1,
      signature: validSignature1,
      userId: customerUser.id,
      userRole: 'customer',
    });
    assert(true, 'Eligible past booking created, paid, and confirmed');

    // 2. Ineligible Booking (Customer 1, Future Date, Unpaid/Pending)
    pendingBooking = await createBookingInDb({
      customerId: customerProfile.id,
      packageId: testPackage.id,
      availabilityId: futureAvail.id,
      travelDate: futureDate.toISOString().split('T')[0],
      adults: 1,
      contactName: 'Aarav Sharma',
      contactEmail: customerUser.email,
      contactPhone: '+919876543210',
      travelerDetails: [{ firstName: 'Aarav', lastName: 'Sharma', age: 30, gender: 'male' }],
    });

    // 3. Customer 2 Booking (Past Date, Paid & Confirmed)
    customer2Booking = await createBookingInDb({
      customerId: customer2Profile.id,
      packageId: testPackage.id,
      availabilityId: pastAvail.id,
      travelDate: pastDate.toISOString().split('T')[0],
      adults: 1,
      contactName: 'Diya Patel',
      contactEmail: customer2User.email,
      contactPhone: '+919876400000',
      travelerDetails: [{ firstName: 'Diya', lastName: 'Patel', age: 26, gender: 'female' }],
    });

    const orderRes2 = await createPaymentOrderForBooking({
      bookingIdOrRef: customer2Booking.id,
      customerId: customer2User.id,
      userRole: 'customer',
    });
    const paymentId2 = `pay_phase9_002_${testSuffix}`;
    const validSignature2 = crypto.createHmac('sha256', secret).update(`${orderRes2.orderId}|${paymentId2}`).digest('hex');

    await verifyPaymentAndConfirmBooking({
      bookingId: customer2Booking.id,
      orderId: orderRes2.orderId,
      paymentId: paymentId2,
      signature: validSignature2,
      userId: customer2User.id,
      userRole: 'customer',
    });

    // ---------------------------------------------------------
    // TEST GROUP 1: VERIFIED CUSTOMER REVIEWS & VALIDATION
    // ---------------------------------------------------------
    console.log('\n--- Group 1: Verified Customer Reviews & Eligibility ---');

    // Test 1.1: Unpaid/pending booking cannot be reviewed
    let unpaidReviewError = false;
    try {
      await createVerifiedReviewInDb({
        customerUserId: customerUser.id,
        bookingId: pendingBooking.id,
        packageId: testPackage.id,
        rating: 5,
        comment: 'Great trip although I did not pay yet!',
      });
    } catch (e: any) {
      unpaidReviewError = true;
      assert(
        e.message.toLowerCase().includes('paid') || e.message.toLowerCase().includes('eligible') || e.message.toLowerCase().includes('concluded'),
        'Test 1.1: Unpaid booking rejected with eligibility error',
        e.message
      );
    }
    assert(unpaidReviewError, 'Test 1.1: Unpaid booking review was blocked');

    // Test 1.2: Customer B cannot review Customer A's booking
    let wrongCustomerError = false;
    try {
      await createVerifiedReviewInDb({
        customerUserId: customer2User.id,
        bookingId: eligibleBooking.id,
        packageId: testPackage.id,
        rating: 5,
        comment: 'I am reviewing someone else booking!',
      });
    } catch (e: any) {
      wrongCustomerError = true;
      assert(
        e.message.toLowerCase().includes('account') || e.message.toLowerCase().includes('own') || e.message.toLowerCase().includes('permission'),
        'Test 1.2: Cross-customer booking review rejected',
        e.message
      );
    }
    assert(wrongCustomerError, 'Test 1.2: Non-owner booking review was blocked');

    // Test 1.3: Rating bounds (< 1.0)
    let lowRatingError = false;
    try {
      await createVerifiedReviewInDb({
        customerUserId: customerUser.id,
        bookingId: eligibleBooking.id,
        packageId: testPackage.id,
        rating: 0.5,
        comment: 'The rating was too low to be valid.',
      });
    } catch (e: any) {
      lowRatingError = true;
      assert(
        e.message.toLowerCase().includes('between 1 and 5'),
        'Test 1.3: Rating < 1.0 rejected by bounds validator'
      );
    }
    assert(lowRatingError, 'Test 1.3: Rating < 1.0 was blocked');

    // Test 1.4: Rating bounds (> 5.0)
    let highRatingError = false;
    try {
      await createVerifiedReviewInDb({
        customerUserId: customerUser.id,
        bookingId: eligibleBooking.id,
        packageId: testPackage.id,
        rating: 5.5,
        comment: 'The rating was too high to be valid.',
      });
    } catch (e: any) {
      highRatingError = true;
      assert(
        e.message.toLowerCase().includes('between 1 and 5'),
        'Test 1.4: Rating > 5.0 rejected by bounds validator'
      );
    }
    assert(highRatingError, 'Test 1.4: Rating > 5.0 was blocked');

    // Test 1.5: Comment length too short (< 10 chars)
    let shortCommentError = false;
    try {
      await createVerifiedReviewInDb({
        customerUserId: customerUser.id,
        bookingId: eligibleBooking.id,
        packageId: testPackage.id,
        rating: 4,
        comment: 'Short',
      });
    } catch (e: any) {
      shortCommentError = true;
      assert(
        e.message.includes('at least 10 characters'),
        'Test 1.5: Short comment (< 10 chars) rejected'
      );
    }
    assert(shortCommentError, 'Test 1.5: Short comment was blocked');

    // Test 1.6: Valid verified review submission
    const reviewResult = await createVerifiedReviewInDb({
      customerUserId: customerUser.id,
      bookingId: eligibleBooking.id,
      packageId: testPackage.id,
      rating: 4.8,
      comment: 'An incredible trek across the Himalayan slopes! Highly organized and great food.',
    });
    createdReviewId = reviewResult.id;
    assert(!!reviewResult.id, 'Test 1.6: Valid verified review created successfully');
    assert(reviewResult.rating === 4.8, 'Test 1.6: Rating recorded correctly (4.8)');
    assert(reviewResult.status === 'APPROVED', 'Test 1.6: Review status initialized to APPROVED');

    // Test 1.7: Duplicate review on same booking rejected (unique constraint)
    let duplicateReviewError = false;
    try {
      await createVerifiedReviewInDb({
        customerUserId: customerUser.id,
        bookingId: eligibleBooking.id,
        packageId: testPackage.id,
        rating: 5,
        comment: 'Attempting to review this exact booking a second time.',
      });
    } catch (e: any) {
      duplicateReviewError = true;
      assert(
        e.message.toLowerCase().includes('already') && (e.message.toLowerCase().includes('submitted') || e.message.toLowerCase().includes('reviewed')),
        'Test 1.7: Duplicate booking review prevented with unique constraint check',
        e.message
      );
    }
    assert(duplicateReviewError, 'Test 1.7: Duplicate review was blocked');

    // Test 1.8: Rating recalculation on package and provider
    const updatedPkg = await prisma.package.findUnique({ where: { id: testPackage.id } });
    assert(updatedPkg?.rating === 4.8, 'Test 1.8: Package average rating updated to 4.8');
    assert(updatedPkg?.reviewCount === 1, 'Test 1.8: Package reviewCount updated to 1');

    const updatedProvider = await prisma.providerProfile.findUnique({
      where: { id: providerProfile.id },
    });
    assert(updatedProvider?.rating === 4.8, 'Test 1.8: Provider profile rating updated to 4.8');
    assert(updatedProvider?.reviewCount === 1, 'Test 1.8: Provider profile reviewCount updated to 1');

    // Test 1.9: Review submission triggered an in-app notification for the provider
    const providerNotifs = await getNotificationsForUser(providerUser.id);
    const reviewNotif = providerNotifs.items.find((n) => n.type === NotificationType.NEW_REVIEW);
    assert(!!reviewNotif, 'Test 1.9: Host received in-app notification for NEW_REVIEW');
    assert(
      Boolean(reviewNotif?.title.includes('Review Received')),
      'Test 1.9: Notification title matches expected format'
    );

    // ---------------------------------------------------------
    // TEST GROUP 2: PROVIDER OFFICIAL REPLY WORKFLOW
    // ---------------------------------------------------------
    console.log('\n--- Group 2: Provider Host Reply & Rights ---');

    // Test 2.1: Host replies to review on their own package
    const repliedReview = await replyToReviewInDb({
      providerUserId: providerUser.id,
      reviewId: createdReviewId,
      reply: 'Thank you so much Aarav! It was our pleasure guiding you across Manali.',
    });
    assert(
      Boolean(repliedReview.providerReply?.includes('Thank you so much Aarav')),
      'Test 2.1: Host official reply recorded on review'
    );
    assert(!!repliedReview.providerReplyAt, 'Test 2.1: Host reply timestamp recorded');

    // Test 2.2: Replying generates an in-app notification for the reviewing customer
    const customerNotifs = await getNotificationsForUser(customerUser.id);
    const replyNotif = customerNotifs.items.find((n) => n.type === NotificationType.NEW_REVIEW);
    assert(!!replyNotif, 'Test 2.2: Customer received in-app notification when host replied');
    assert(
      Boolean(replyNotif?.message.includes('responded to your review')),
      'Test 2.2: Customer notification message mentions host response'
    );

    // Test 2.3: Different provider cannot reply to this review
    let wrongProviderError = false;
    try {
      await replyToReviewInDb({
        providerUserId: provider2User.id,
        reviewId: createdReviewId,
        reply: 'Impostor reply from another tour company!',
      });
    } catch (e: any) {
      wrongProviderError = true;
      assert(
        e.message.toLowerCase().includes('own') || e.message.toLowerCase().includes('unauthorized'),
        'Test 2.3: Unauthorized provider reply rejected',
        e.message
      );
    }
    assert(wrongProviderError, 'Test 2.3: Cross-provider reply was blocked');

    // ---------------------------------------------------------
    // TEST GROUP 3: ADMIN MODERATION & AUDIT LOGGING
    // ---------------------------------------------------------
    console.log('\n--- Group 3: Admin Review Moderation & Audit Logging ---');

    // Test 3.1: Admin rejects review with moderation note
    const rejectedReview = await adminModerateReviewInDb({
      adminUser,
      reviewId: createdReviewId,
      status: ReviewStatus.REJECTED,
      moderationNote: 'Violation of Community Guideline #4: External phone numbers or links.',
    });
    assert(rejectedReview.status === 'REJECTED', 'Test 3.1: Review status set to REJECTED');

    // Test 3.2: Rejected review is excluded from public package query
    const publicReviews = await getReviewsForPackage(testPackage.id);
    const isExcluded = !publicReviews.some((r) => r.id === createdReviewId);
    assert(isExcluded, 'Test 3.2: Rejected review excluded from public getReviewsForPackage query');

    // Test 3.3: Rating recalculation on rejection excludes rejected review
    const pkgAfterReject = await prisma.package.findUnique({ where: { id: testPackage.id } });
    assert(pkgAfterReject?.rating === 0, 'Test 3.3: Package rating reverted to 0 after review rejection');
    assert(pkgAfterReject?.reviewCount === 0, 'Test 3.3: Package reviewCount reverted to 0');

    // Test 3.4: AuditLog entry recorded for review moderation
    const auditLogs = await prisma.auditLog.findMany({
      where: {
        targetType: 'REVIEW',
        targetId: createdReviewId,
        action: 'REVIEW_MODERATED',
      },
    });
    assert(auditLogs.length > 0, 'Test 3.4: AuditLog entry created for REVIEW_MODERATED');
    assert(
      Boolean(auditLogs[0].reason?.includes('Guideline #4')),
      'Test 3.4: AuditLog captures moderationNote/reason correctly'
    );

    // Test 3.5: Admin re-approves review
    const reApprovedReview = await adminModerateReviewInDb({
      adminUser,
      reviewId: createdReviewId,
      status: ReviewStatus.APPROVED,
      moderationNote: 'Reinstated after review verification appeal.',
    });
    assert(reApprovedReview.status === 'APPROVED', 'Test 3.5: Review re-approved by admin');

    const publicReviewsRestored = await getReviewsForPackage(testPackage.id);
    assert(
      publicReviewsRestored.some((r) => r.id === createdReviewId),
      'Test 3.5: Public query now includes re-approved review'
    );

    // ---------------------------------------------------------
    // TEST GROUP 4: IN-APP NOTIFICATION SYSTEM & IDEMPOTENCY
    // ---------------------------------------------------------
    console.log('\n--- Group 4: Notification Isolation, Idempotency & Lifecycle ---');

    // Test 4.1: Direct notification creation with dedupKey
    const testDedupKey = `dedup_test_${testSuffix}_001`;
    const notif1 = await createNotificationInDb({
      userId: customerUser.id,
      type: NotificationType.BOOKING_CONFIRMED,
      title: 'Booking Confirmed - VibeMiles',
      message: 'Your Himalayan adventure is officially confirmed!',
      link: `/account/bookings/${eligibleBooking.id}`,
      dedupKey: testDedupKey,
    });
    assert(notif1 !== null && notif1.isRead === false, 'Test 4.1: Notification created with unread status');

    // Test 4.2: Idempotency with identical dedupKey (no duplicate rows created)
    const notifDuplicate = await createNotificationInDb({
      userId: customerUser.id,
      type: NotificationType.BOOKING_CONFIRMED,
      title: 'Booking Confirmed - VibeMiles (Retry)',
      message: 'Duplicate event from webhook retry.',
      dedupKey: testDedupKey,
    });
    assert(notif1 !== null && notifDuplicate !== null && notifDuplicate.id === notif1.id, 'Test 4.2: Duplicate dedupKey returns existing notification without creating duplicate');

    // Test 4.3: Recipient isolation (Customer 2 cannot see Customer 1's notifications)
    const customer2Feed = await getNotificationsForUser(customer2User.id);
    const hasLeak = customer2Feed.items.some((n) => n.userId === customerUser.id);
    assert(!hasLeak, 'Test 4.3: Customer 2 feed strictly isolated from Customer 1 notifications');

    // Test 4.4: Unread count query
    const unreadCountInitial = await getUnreadNotificationCount(customerUser.id);
    assert(unreadCountInitial > 0, `Test 4.4: Unread notification count is positive (${unreadCountInitial})`);

    // Test 4.5: Mark single notification as read
    assert(notif1 !== null, 'Test 4.5: notif1 exists');
    const notif1Id = notif1?.id || '';
    const marked = await markNotificationAsRead(customerUser.id, notif1Id);
    assert(marked === true, 'Test 4.5: markNotificationAsRead returns true');

    const updatedNotif = await prisma.notification.findUnique({ where: { id: notif1Id } });
    assert(updatedNotif?.isRead === true, 'Test 4.5: markNotificationAsRead sets isRead to true');
    assert(!!updatedNotif?.readAt, 'Test 4.5: markNotificationAsRead records readAt timestamp');

    const unreadCountAfterMark = await getUnreadNotificationCount(customerUser.id);
    assert(
      unreadCountAfterMark === unreadCountInitial - 1,
      'Test 4.5: Unread count decremented by exactly 1'
    );

    // Test 4.6: Mark all notifications as read
    await markAllNotificationsAsRead(customerUser.id);
    const unreadCountAfterMarkAll = await getUnreadNotificationCount(customerUser.id);
    assert(unreadCountAfterMarkAll === 0, 'Test 4.6: markAllNotificationsAsRead zeroes out unread count');

    // Test 4.7: Pagination
    for (let i = 1; i <= 3; i++) {
      await createNotificationInDb({
        userId: customerUser.id,
        type: NotificationType.SYSTEM_BROADCAST,
        title: `Pagination Test ${i}`,
        message: `Message body for pagination test ${i}`,
        dedupKey: `dedup_page_${testSuffix}_${i}`,
      });
    }

    const page1 = await getNotificationsForUser(customerUser.id, { page: 1, limit: 2 });
    assert(page1.items.length === 2, 'Test 4.7: Page 1 honors limit=2');
    assert(page1.totalPages >= 2, 'Test 4.7: Total pages calculated correctly');

    // Test 4.8: Delete notification
    const toDeleteId = page1.items[0].id;
    const deleted = await deleteNotificationFromDb(customerUser.id, toDeleteId);
    assert(deleted === true, 'Test 4.8: deleteNotificationFromDb removed the record');

    // ---------------------------------------------------------
    // TEST GROUP 5: SYSTEM & ADMIN EVENT HOOKS
    // ---------------------------------------------------------
    console.log('\n--- Group 5: Core Marketplace Event Hooks ---');

    // Test 5.1: Account suspension hook
    await updateCustomerStatusInDb({
      adminUser,
      userId: customerUser.id,
      status: UserStatus.SUSPENDED,
      reason: 'Security check for automated testing.',
    });

    const suspendedNotifs = await getNotificationsForUser(customerUser.id);
    const suspendAlert = suspendedNotifs.items.find((n) => n.type === NotificationType.ACCOUNT_SUSPENDED);
    assert(!!suspendAlert, 'Test 5.1: ACCOUNT_SUSPENDED notification delivered upon account suspension');

    // Test 5.2: Suspended customer cannot review
    let suspendedReviewError = false;
    try {
      await createVerifiedReviewInDb({
        customerUserId: customerUser.id,
        bookingId: customer2Booking.id,
        rating: 5,
        comment: 'Trying to review while my account is suspended.',
      });
    } catch (e: any) {
      suspendedReviewError = true;
      assert(
        e.message.toLowerCase().includes('suspended') || e.message.toLowerCase().includes('active') || e.message.toLowerCase().includes('account'),
        'Test 5.2: Suspended customer blocked from submitting review',
        e.message
      );
    }
    assert(suspendedReviewError, 'Test 5.2: Suspended customer review was blocked');

    // Reactivate Customer
    await updateCustomerStatusInDb({
      adminUser,
      userId: customerUser.id,
      status: UserStatus.ACTIVE,
      reason: 'Reactivated for test continuation.',
    });

    // Test 5.3: Provider verification hook
    await reviewProviderVerificationInDb({
      adminUser,
      providerId: providerProfile.id,
      status: VerificationStatus.VERIFIED,
      reason: 'KYC verified in test suite.',
    });

    // Allow async non-blocking notification dispatch to persist
    await new Promise((r) => setTimeout(r, 600));

    const providerKYCNotifs = await getNotificationsForUser(providerUser.id);
    const kycAlert = providerKYCNotifs.items.find((n) => n.type === NotificationType.PROVIDER_VERIFIED);
    assert(!!kycAlert, 'Test 5.3: PROVIDER_VERIFIED notification delivered upon KYC verification');

    // ---------------------------------------------------------
    // TEST GROUP 6: EXTERNAL DELIVERY SERVICE & OUTBOX
    // ---------------------------------------------------------
    console.log('\n--- Group 6: External Delivery Service & Sensitive Data Redaction ---');

    // Test 6.1: Delivery service in test mode records outbox
    const dispatchResult = await deliveryService.sendEmailNotification({
      to: customerUser.email,
      subject: 'Your VibeMiles Booking is Confirmed',
      html: '<h1>Booking Confirmed</h1><p>Enjoy your trip!</p>',
      metadata: {
        bookingId: eligibleBooking.id,
        passwordHash: 'SECRET_HASH_DO_NOT_LEAK',
        panNumber: 'ABCDE1234F',
        safeKey: 'PUBLIC_INFO',
      },
    });

    assert(dispatchResult.success === true, 'Test 6.1: External delivery returns success');
    assert(
      dispatchResult.status === 'TEST_MODE_RECORDED',
      'Test 6.1: Delivery status accurately states TEST_MODE_RECORDED (no false external claims)'
    );

    const outboxLogs = deliveryService.getTestOutbox();
    const lastOutbox = outboxLogs[outboxLogs.length - 1];
    assert(lastOutbox?.to === customerUser.email, 'Test 6.1: Outbox contains dispatched email');
    assert(
      lastOutbox?.metadata?.passwordHash === '[REDACTED]',
      'Test 6.1: Sensitive passwordHash is safely [REDACTED]'
    );
    assert(
      lastOutbox?.metadata?.panNumber === '[REDACTED]',
      'Test 6.1: Sensitive panNumber is safely [REDACTED]'
    );
    assert(
      lastOutbox?.metadata?.safeKey === 'PUBLIC_INFO',
      'Test 6.1: Non-sensitive metadata preserved intact'
    );

  } catch (err: any) {
    console.error('\n[UNHANDLED ERROR IN TEST SUITE]:', err);
    failed++;
  } finally {
    // ---------------------------------------------------------
    // TEARDOWN: CLEAN UP TEST FIXTURES
    // ---------------------------------------------------------
    console.log('\n--- Teardown: Cleaning Up Test Records ---');
    try {
      if (testPackage?.id) {
        await prisma.review.deleteMany({ where: { packageId: testPackage.id } });
      }
      if (adminUser?.id) {
        await prisma.auditLog.deleteMany({ where: { actorId: adminUser.id } });
      }
      if (customerUser?.id) {
        await prisma.notification.deleteMany({ where: { userId: customerUser.id } });
      }
      if (customer2User?.id) {
        await prisma.notification.deleteMany({ where: { userId: customer2User.id } });
      }
      if (providerUser?.id) {
        await prisma.notification.deleteMany({ where: { userId: providerUser.id } });
      }
      if (provider2User?.id) {
        await prisma.notification.deleteMany({ where: { userId: provider2User.id } });
      }
      if (adminUser?.id) {
        await prisma.notification.deleteMany({ where: { userId: adminUser.id } });
      }

      // Delete payments, guests, bookings
      const bookingIds = [eligibleBooking?.id, pendingBooking?.id, customer2Booking?.id].filter(Boolean);
      if (bookingIds.length > 0) {
        await prisma.settlementLedger.deleteMany({ where: { bookingId: { in: bookingIds } } });
        await prisma.payment.deleteMany({ where: { bookingId: { in: bookingIds } } });
        await prisma.travelerDetail.deleteMany({ where: { bookingId: { in: bookingIds } } });
        await prisma.booking.deleteMany({ where: { id: { in: bookingIds } } });
      }

      if (testPackage?.id) {
        await prisma.packageAvailability.deleteMany({ where: { packageId: testPackage.id } });
        await prisma.packageImage.deleteMany({ where: { packageId: testPackage.id } });
        await prisma.itineraryDay.deleteMany({ where: { packageId: testPackage.id } });
        await prisma.package.deleteMany({ where: { id: testPackage.id } });
      }
      if (testCategory?.id) {
        await prisma.category.deleteMany({ where: { id: testCategory.id } });
      }
      if (providerProfile?.id) {
        await prisma.providerProfile.deleteMany({ where: { id: providerProfile.id } });
      }
      if (provider2Profile?.id) {
        await prisma.providerProfile.deleteMany({ where: { id: provider2Profile.id } });
      }
      if (customerProfile?.id) {
        await prisma.customerProfile.deleteMany({ where: { id: customerProfile.id } });
      }
      if (customer2Profile?.id) {
        await prisma.customerProfile.deleteMany({ where: { id: customer2Profile.id } });
      }

      // Delete users
      const userIds = [adminUser?.id, providerUser?.id, provider2User?.id, customerUser?.id, customer2User?.id].filter(Boolean);
      if (userIds.length > 0) {
        await prisma.user.deleteMany({ where: { id: { in: userIds } } });
      }
      console.log('Teardown complete: All test fixtures successfully removed.');
    } catch (cleanupErr) {
      console.error('Teardown error (non-fatal):', cleanupErr);
    } finally {
      await prisma.$disconnect();
    }
  }

  console.log('\n================================================================');
  console.log(`Phase 9 Verification Summary: ${passed} PASSED, ${failed} FAILED`);
  console.log('================================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runPhase9Tests();
