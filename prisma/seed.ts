import { PrismaClient, UserRole, VerificationStatus, ListingStatus, ApprovalStatus, BookingStatus, PaymentStatus, DiscountType } from '@prisma/client';
import {
  MOCK_CUSTOMERS,
  MOCK_PROVIDERS,
  MOCK_DESTINATIONS,
  MOCK_PACKAGES,
  MOCK_BOOKINGS,
  MOCK_REVIEWS,
  MOCK_COUPONS,
} from '../src/lib/mock-data';
import { PACKAGE_CATEGORIES } from '../src/constants';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Pre-compute bcrypt hashes for demo accounts
const DEMO_USER_HASH = bcrypt.hashSync('password123', 10);
const DEMO_ADMIN_HASH = bcrypt.hashSync('admin@8667', 12);

async function main() {
  console.log('🌱 Starting VibeMiles database seed...');

  // ─── 1. Seed Categories ──────────────────────────────────────
  console.log('📦 Seeding categories...');
  const categoryMap = new Map<string, string>(); // slug -> id
  for (const cat of PACKAGE_CATEGORIES) {
    const record = await prisma.category.upsert({
      where: { slug: cat.value },
      update: { name: cat.label, icon: cat.icon },
      create: {
        slug: cat.value,
        name: cat.label,
        icon: cat.icon,
        description: `Authentic ${cat.label.toLowerCase()} across extraordinary Indian destinations.`,
        isActive: true,
      },
    });
    categoryMap.set(cat.value, record.id);
  }

  // ─── 2. Seed Admin User ──────────────────────────────────────
  console.log('👑 Seeding admin user...');
  await prisma.user.upsert({
    where: { email: 'admin@vibemiles.com' },
    update: { role: UserRole.ADMIN, passwordHash: DEMO_ADMIN_HASH },
    create: {
      email: 'admin@vibemiles.com',
      phone: '9000000000',
      passwordHash: DEMO_ADMIN_HASH,
      role: UserRole.ADMIN,
    },
  });

  // ─── 3. Seed Customers ───────────────────────────────────────
  console.log('👤 Seeding customers...');
  const customerProfileMap = new Map<string, string>(); // cust.id -> profile.id
  for (const cust of MOCK_CUSTOMERS) {
    const user = await prisma.user.upsert({
      where: { email: cust.email },
      update: { phone: cust.phone, role: UserRole.CUSTOMER, passwordHash: DEMO_USER_HASH },
      create: {
        email: cust.email,
        phone: cust.phone,
        passwordHash: DEMO_USER_HASH,
        role: UserRole.CUSTOMER,
      },
    });

    const profile = await prisma.customerProfile.upsert({
      where: { userId: user.id },
      update: {
        fullName: cust.fullName,
        avatar: cust.avatar,
        city: cust.city,
        state: cust.state,
        rewardPoints: cust.rewardPoints,
        isVerified: cust.isVerified,
      },
      create: {
        userId: user.id,
        fullName: cust.fullName,
        avatar: cust.avatar,
        city: cust.city,
        state: cust.state,
        country: cust.country || 'India',
        emergencyContact: cust.emergencyContact,
        preferredLanguage: cust.preferredLanguage || 'English',
        rewardPoints: cust.rewardPoints,
        isVerified: cust.isVerified,
      },
    });
    customerProfileMap.set(cust.id, profile.id);
  }

  // ─── 4. Seed Providers ───────────────────────────────────────
  console.log('🏢 Seeding providers...');
  const providerProfileMap = new Map<string, string>(); // prov.id -> profile.id
  for (const prov of MOCK_PROVIDERS) {
    const user = await prisma.user.upsert({
      where: { email: prov.email },
      update: { phone: prov.phone, role: UserRole.PROVIDER, passwordHash: DEMO_USER_HASH },
      create: {
        email: prov.email,
        phone: prov.phone,
        passwordHash: DEMO_USER_HASH,
        role: UserRole.PROVIDER,
      },
    });

    const vStatus =
      prov.verificationStatus === 'verified'
        ? VerificationStatus.VERIFIED
        : prov.verificationStatus === 'rejected'
        ? VerificationStatus.REJECTED
        : VerificationStatus.PENDING;

    const profile = await prisma.providerProfile.upsert({
      where: { userId: user.id },
      update: {
        businessName: prov.businessName,
        ownerName: prov.ownerName,
        businessCategory: prov.businessCategory,
        description: prov.description,
        rating: prov.rating,
        reviewCount: prov.reviewCount,
        totalPackages: prov.totalPackages,
        verificationStatus: vStatus,
      },
      create: {
        userId: user.id,
        businessName: prov.businessName,
        ownerName: prov.ownerName,
        businessCategory: prov.businessCategory,
        description: prov.description,
        logo: prov.logo,
        gallery: prov.gallery || [],
        addressLine1: prov.address.line1,
        city: prov.address.city,
        state: prov.address.state,
        pincode: prov.address.pincode,
        country: prov.address.country || 'India',
        panNumber: prov.panNumber,
        gstNumber: prov.gstNumber,
        bankAccountHolder: prov.bankDetails?.accountHolderName,
        bankAccountNumber: prov.bankDetails?.accountNumber,
        bankIfsc: prov.bankDetails?.ifscCode,
        bankName: prov.bankDetails?.bankName,
        bankBranch: prov.bankDetails?.branchName,
        verificationStatus: vStatus,
        rating: prov.rating,
        reviewCount: prov.reviewCount,
        totalPackages: prov.totalPackages,
      },
    });
    providerProfileMap.set(prov.id, profile.id);
  }

  // ─── 5. Seed Destinations ────────────────────────────────────
  console.log('📍 Seeding destinations...');
  const destinationMap = new Map<string, string>(); // slug -> id
  for (const dest of MOCK_DESTINATIONS) {
    const record = await prisma.destination.upsert({
      where: { slug: dest.slug },
      update: {
        name: dest.name,
        state: dest.state,
        description: dest.description,
        heroImage: dest.heroImage,
        images: dest.images,
        rating: dest.rating,
        reviewCount: dest.reviewCount,
        packageCount: dest.packageCount,
        isPopular: dest.isPopular,
        isTrending: dest.isTrending,
      },
      create: {
        slug: dest.slug,
        name: dest.name,
        state: dest.state,
        country: dest.country || 'India',
        description: dest.description,
        heroImage: dest.heroImage,
        images: dest.images,
        bestTimeToVisit: dest.bestTimeToVisit,
        averageTemperature: dest.averageTemperature,
        topActivities: dest.topActivities,
        isPopular: dest.isPopular,
        isTrending: dest.isTrending,
        packageCount: dest.packageCount,
        rating: dest.rating,
        reviewCount: dest.reviewCount,
        tags: dest.tags,
      },
    });
    destinationMap.set(dest.slug, record.id);
    destinationMap.set(dest.id, record.id);
  }

  // ─── 6. Seed Packages / Listings ─────────────────────────────
  console.log('🎒 Seeding packages & itineraries...');
  const packageMap = new Map<string, string>(); // pkg.id -> record.id
  for (const pkg of MOCK_PACKAGES) {
    const providerId = providerProfileMap.get(pkg.providerId) || Array.from(providerProfileMap.values())[0];
    const categoryId = categoryMap.get(pkg.category) || Array.from(categoryMap.values())[0];
    const destinationId = destinationMap.get(pkg.destinationId) || Array.from(destinationMap.values())[0];

    const pkgRecord = await prisma.package.upsert({
      where: { slug: pkg.slug },
      update: {
        name: pkg.name,
        description: pkg.description,
        basePrice: pkg.basePrice,
        discountPercent: pkg.discountPercent,
        finalPrice: pkg.finalPrice,
        rating: pkg.rating,
        reviewCount: pkg.reviewCount,
        bookingCount: pkg.bookingCount,
        status: ListingStatus.PUBLISHED,
        approvalStatus: ApprovalStatus.APPROVED,
        isActive: pkg.isActive,
        isFeatured: pkg.isFeatured,
      },
      create: {
        slug: pkg.slug,
        providerId,
        categoryId,
        destinationId,
        name: pkg.name,
        description: pkg.description,
        highlights: pkg.highlights,
        state: pkg.state,
        city: pkg.city,
        durationDays: pkg.durationDays,
        durationNights: pkg.durationNights,
        maxGroupSize: pkg.maxGroupSize,
        basePrice: pkg.basePrice,
        discountPercent: pkg.discountPercent,
        finalPrice: pkg.finalPrice,
        currency: pkg.currency || 'INR',
        videoUrl: pkg.videoUrl,
        rating: pkg.rating,
        reviewCount: pkg.reviewCount,
        bookingCount: pkg.bookingCount,
        status: ListingStatus.PUBLISHED,
        approvalStatus: ApprovalStatus.APPROVED,
        isActive: pkg.isActive,
        isFeatured: pkg.isFeatured,
        tags: pkg.tags,
      },
    });
    packageMap.set(pkg.id, pkgRecord.id);

    // Seed Package Images
    await prisma.packageImage.deleteMany({ where: { packageId: pkgRecord.id } });
    if (pkg.images && pkg.images.length > 0) {
      await prisma.packageImage.createMany({
        data: pkg.images.map((url, idx) => ({
          packageId: pkgRecord.id,
          url,
          sortOrder: idx,
          isCover: idx === 0,
        })),
      });
    }

    // Seed Itinerary Days
    await prisma.itineraryDay.deleteMany({ where: { packageId: pkgRecord.id } });
    if (pkg.itinerary && pkg.itinerary.length > 0) {
      await prisma.itineraryDay.createMany({
        data: pkg.itinerary.map((day) => ({
          packageId: pkgRecord.id,
          day: day.day,
          title: day.title,
          description: day.description,
          activities: day.activities || [],
          meals: day.meals || [],
          accommodation: day.accommodation,
          location: day.location,
        })),
      });
    }

    // Seed Inclusions & Exclusions
    await prisma.packageInclusion.deleteMany({ where: { packageId: pkgRecord.id } });
    const inclusionsData = [
      ...pkg.inclusions.map((text) => ({ packageId: pkgRecord.id, text, isIncluded: true })),
      ...pkg.exclusions.map((text) => ({ packageId: pkgRecord.id, text, isIncluded: false })),
    ];
    if (inclusionsData.length > 0) {
      await prisma.packageInclusion.createMany({ data: inclusionsData });
    }

    // Seed Availability Dates
    await prisma.packageAvailability.deleteMany({ where: { packageId: pkgRecord.id } });
    if (pkg.availableDates && pkg.availableDates.length > 0) {
      await prisma.packageAvailability.createMany({
        data: pkg.availableDates.map((ad) => ({
          packageId: pkgRecord.id,
          date: new Date(ad.date),
          price: ad.price,
          capacity: ad.capacity,
          bookedCount: ad.bookedCount,
          isAvailable: ad.isAvailable,
        })),
      });
    }
  }

  // ─── 7. Seed Bookings ────────────────────────────────────────
  console.log('💳 Seeding sample bookings & payments...');
  for (const b of MOCK_BOOKINGS) {
    const customerId = customerProfileMap.get(b.customerId) || Array.from(customerProfileMap.values())[0];
    const providerId = providerProfileMap.get(b.providerId) || Array.from(providerProfileMap.values())[0];
    const packageId = packageMap.get(b.packageId) || Array.from(packageMap.values())[0];

    const bookingStatus =
      b.bookingStatus === 'confirmed'
        ? BookingStatus.CONFIRMED
        : b.bookingStatus === 'completed'
        ? BookingStatus.COMPLETED
        : b.bookingStatus === 'cancelled'
        ? BookingStatus.CANCELLED
        : BookingStatus.PENDING;

    const booking = await prisma.booking.upsert({
      where: { bookingRef: b.bookingRef },
      update: {
        bookingStatus,
        totalAmount: b.totalAmount,
      },
      create: {
        bookingRef: b.bookingRef,
        packageId,
        providerId,
        customerId,
        travelDate: new Date(b.travelDate),
        adults: b.travelers.adults,
        children: b.travelers.children,
        pickup: b.pickup,
        baseAmount: b.baseAmount,
        optionalServicesAmount: b.optionalServicesAmount,
        discountAmount: b.discountAmount,
        couponCode: b.couponCode,
        taxAmount: b.taxAmount,
        totalAmount: b.totalAmount,
        bookingStatus,
        cancellationReason: b.cancellationReason,
        refundAmount: b.refundAmount,
        refundStatus: b.refundStatus,
      },
    });

    // Seed traveler details
    await prisma.travelerDetail.deleteMany({ where: { bookingId: booking.id } });
    if (b.travelerDetails && b.travelerDetails.length > 0) {
      await prisma.travelerDetail.createMany({
        data: b.travelerDetails.map((t) => ({
          bookingId: booking.id,
          firstName: t.firstName,
          lastName: t.lastName,
          age: t.age,
          gender: t.gender,
          idType: t.idType,
          idNumber: t.idNumber,
        })),
      });
    }

    // Seed mock payment transaction
    if (b.transactionId) {
      await prisma.payment.upsert({
        where: { transactionId: b.transactionId },
        update: {
          amount: b.totalAmount,
          status: b.paymentStatus === 'paid' ? PaymentStatus.PAID : PaymentStatus.PENDING,
        },
        create: {
          bookingId: booking.id,
          transactionId: b.transactionId,
          paymentMethod: b.paymentMethod || 'upi',
          amount: b.totalAmount,
          currency: 'INR',
          status: b.paymentStatus === 'paid' ? PaymentStatus.PAID : PaymentStatus.PENDING,
          paidAt: new Date(b.createdAt),
        },
      });
    }
  }

  // ─── 8. Seed Reviews ─────────────────────────────────────────
  console.log('⭐ Seeding reviews...');
  for (const r of MOCK_REVIEWS) {
    const packageId = packageMap.get(r.packageId) || Array.from(packageMap.values())[0];
    const customerId = customerProfileMap.get(r.customerId) || Array.from(customerProfileMap.values())[0];

    const existingReview = await prisma.review.findFirst({
      where: { packageId, customerId },
    });

    if (existingReview) {
      await prisma.review.update({
        where: { id: existingReview.id },
        data: {
          rating: r.rating,
          title: r.title,
          comment: r.content,
          providerReply: r.providerReply,
          providerReplyAt: r.providerReplyAt ? new Date(r.providerReplyAt) : null,
        },
      });
    } else {
      await prisma.review.create({
        data: {
          packageId,
          customerId,
          rating: r.rating,
          title: r.title,
          comment: r.content,
          providerReply: r.providerReply,
          providerReplyAt: r.providerReplyAt ? new Date(r.providerReplyAt) : null,
        },
      });
    }
  }

  // ─── 9. Seed Coupons ─────────────────────────────────────────
  console.log('🏷️ Seeding coupons...');
  for (const c of MOCK_COUPONS) {
    await prisma.coupon.upsert({
      where: { code: c.code },
      update: {
        discountValue: c.discountValue,
        isActive: c.isActive,
      },
      create: {
        code: c.code,
        description: c.description,
        discountType: c.discountType === 'percentage' ? DiscountType.PERCENTAGE : DiscountType.FIXED,
        discountValue: c.discountValue,
        minimumOrderAmount: c.minimumOrderAmount,
        maximumDiscountAmount: c.maximumDiscountAmount ?? null,
        expiresAt: new Date(c.expiresAt),
        usageLimit: c.usageLimit,
        usedCount: c.usedCount,
        isActive: c.isActive,
      },
    });
  }

  console.log('✅ VibeMiles database seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
