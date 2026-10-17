import { PrismaClient } from '@prisma/client';

async function countRecords() {
  const prisma = new PrismaClient();
  try {
    const counts = {
      Category: await prisma.category.count(),
      Destination: await prisma.destination.count(),
      User: await prisma.user.count(),
      CustomerProfile: await prisma.customerProfile.count(),
      ProviderProfile: await prisma.providerProfile.count(),
      Package: await prisma.package.count(),
      PackageImage: await prisma.packageImage.count(),
      ItineraryDay: await prisma.itineraryDay.count(),
      PackageInclusion: await prisma.packageInclusion.count(),
      PackageAvailability: await prisma.packageAvailability.count(),
      Booking: await prisma.booking.count(),
      TravelerDetail: await prisma.travelerDetail.count(),
      Payment: await prisma.payment.count(),
      Review: await prisma.review.count(),
      Coupon: await prisma.coupon.count(),
    };

    console.log('ACTUAL_RECORD_COUNTS:', JSON.stringify(counts, null, 2));

    // Also check moderation status of packages
    const packagesByStatus = await prisma.package.groupBy({
      by: ['status', 'approvalStatus', 'isActive'],
      _count: true,
    });
    console.log('PACKAGES_BY_STATUS:', packagesByStatus);
  } catch (err) {
    console.error('Count query failed:', err);
  } finally {
    await prisma.$disconnect();
  }
}

countRecords();
