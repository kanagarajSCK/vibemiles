import { prisma } from '../src/lib/prisma';
import { ListingStatus, ApprovalStatus } from '@prisma/client';

async function seedManipur() {
  console.log('Seeding Manipur destination and package for provider realkanagaraj@gmail.com...');

  const provider = await prisma.providerProfile.findFirst({
    where: { user: { email: 'realkanagaraj@gmail.com' } },
  });

  if (!provider) {
    throw new Error('Provider realkanagaraj@gmail.com not found');
  }

  const category = await prisma.category.findFirst({
    where: { slug: 'tour' },
  });

  if (!category) {
    throw new Error('Category "tour" not found');
  }

  // 1. Create / Upsert Manipur Destination
  const destination = await prisma.destination.upsert({
    where: { slug: 'manipur' },
    update: {
      name: 'Manipur',
      state: 'Manipur',
      country: 'India',
      packageCount: 1,
      heroImage: 'https://images.unsplash.com/photo-1626014303757-658b16c14101?auto=format&fit=crop&w=1200&q=80',
      description: 'Explore the jewel of Northeast India — Manipur. Discover the magical floating islands (phumdis) of Loktak Lake, the sacred Kangla Fort, world-famous Ima Keithel all-women market, and the lush green hills of Imphal valley.',
      bestTimeToVisit: 'October to April',
      averageTemperature: '15°C - 25°C',
      topActivities: ['Loktak Lake Boat Safari', 'Keibul Lamjao Wildlife', 'Kangla Fort Heritage Walk', 'Ima Keithel Handloom Tour'],
      tags: ['manipur', 'imphal', 'loktak', 'northeast', 'nature', 'wildlife', 'floating-islands', 'heritage'],
      isPopular: true,
      isTrending: true,
      rating: 4.9,
      reviewCount: 18,
    },
    create: {
      name: 'Manipur',
      slug: 'manipur',
      state: 'Manipur',
      country: 'India',
      packageCount: 1,
      heroImage: 'https://images.unsplash.com/photo-1626014303757-658b16c14101?auto=format&fit=crop&w=1200&q=80',
      images: [
        'https://images.unsplash.com/photo-1626014303757-658b16c14101?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1608889825205-eebdb9fc5806?auto=format&fit=crop&w=1200&q=80',
      ],
      description: 'Explore the jewel of Northeast India — Manipur. Discover the magical floating islands (phumdis) of Loktak Lake, the sacred Kangla Fort, world-famous Ima Keithel all-women market, and the lush green hills of Imphal valley.',
      bestTimeToVisit: 'October to April',
      averageTemperature: '15°C - 25°C',
      topActivities: ['Loktak Lake Boat Safari', 'Keibul Lamjao Wildlife', 'Kangla Fort Heritage Walk', 'Ima Keithel Handloom Tour'],
      tags: ['manipur', 'imphal', 'loktak', 'northeast', 'nature', 'wildlife', 'floating-islands', 'heritage'],
      isPopular: true,
      isTrending: true,
      rating: 4.9,
      reviewCount: 18,
    },
  });

  console.log(`✓ Destination ready: ${destination.name} (${destination.id})`);

  // 2. Upsert Package
  const pkgSlug = 'manipur-loktak-lake-floating-phumdis-imphal-valley-heritage';
  const pkg = await prisma.package.upsert({
    where: { slug: pkgSlug },
    update: {
      name: 'Manipur Loktak Lake Floating Phumdis & Imphal Valley Heritage',
      description: 'Experience the mystical floating islands of Loktak Lake, the rare Sangai deer sanctuary at Keibul Lamjao, royal Kangla Fort, and the vibrant handloom heritage of Imphal in an authentic 4-day guided Northeast journey.',
      highlights: [
        'Boat safari through Loktak Lake floating phumdis & Sendra Island viewpoint',
        'Keibul Lamjao National Park — world’s only floating national park',
        'Royal Kangla Fort & historic Govindajee Temple exploration',
        'Ima Keithel 500-year-old historic all-women managed marketplace visit',
        'Authentic Meitei traditional cuisine and traditional village homestay dinner',
      ],
      state: 'Manipur',
      city: 'Imphal & Moirang',
      durationDays: 4,
      durationNights: 3,
      maxGroupSize: 12,
      basePrice: 17500,
      discountPercent: 10,
      finalPrice: 15750,
      currency: 'INR',
      cancellationPolicy: 'Free cancellation up to 7 days before departure. 50% refund up to 72 hours before trip starts.',
      rating: 4.9,
      reviewCount: 16,
      approvalStatus: ApprovalStatus.APPROVED,
      status: ListingStatus.PUBLISHED,
      isActive: true,
      isFeatured: true,
      tags: ['manipur', 'imphal', 'loktak', 'lake', 'floating-park', 'sangai', 'northeast'],
      providerId: provider.id,
      categoryId: category.id,
      destinationId: destination.id,
    },
    create: {
      name: 'Manipur Loktak Lake Floating Phumdis & Imphal Valley Heritage',
      slug: pkgSlug,
      description: 'Experience the mystical floating islands of Loktak Lake, the rare Sangai deer sanctuary at Keibul Lamjao, royal Kangla Fort, and the vibrant handloom heritage of Imphal in an authentic 4-day guided Northeast journey.',
      highlights: [
        'Boat safari through Loktak Lake floating phumdis & Sendra Island viewpoint',
        'Keibul Lamjao National Park — world’s only floating national park',
        'Royal Kangla Fort & historic Govindajee Temple exploration',
        'Ima Keithel 500-year-old historic all-women managed marketplace visit',
        'Authentic Meitei traditional cuisine and traditional village homestay dinner',
      ],
      state: 'Manipur',
      city: 'Imphal & Moirang',
      durationDays: 4,
      durationNights: 3,
      maxGroupSize: 12,
      basePrice: 17500,
      discountPercent: 10,
      finalPrice: 15750,
      currency: 'INR',
      cancellationPolicy: 'Free cancellation up to 7 days before departure. 50% refund up to 72 hours before trip starts.',
      rating: 4.9,
      reviewCount: 16,
      approvalStatus: ApprovalStatus.APPROVED,
      status: ListingStatus.PUBLISHED,
      isActive: true,
      isFeatured: true,
      tags: ['manipur', 'imphal', 'loktak', 'lake', 'floating-park', 'sangai', 'northeast'],
      providerId: provider.id,
      categoryId: category.id,
      destinationId: destination.id,
    },
  });

  console.log(`✓ Package ready: ${pkg.name} (${pkg.id})`);

  // 3. Clear existing sub-records for clean rebuild
  await prisma.packageImage.deleteMany({ where: { packageId: pkg.id } });
  await prisma.itineraryDay.deleteMany({ where: { packageId: pkg.id } });
  await prisma.packageInclusion.deleteMany({ where: { packageId: pkg.id } });
  await prisma.packageAvailability.deleteMany({ where: { packageId: pkg.id } });

  // 4. Add Images
  await prisma.packageImage.createMany({
    data: [
      {
        packageId: pkg.id,
        url: 'https://images.unsplash.com/photo-1626014303757-658b16c14101?auto=format&fit=crop&w=1200&q=80',
        altText: 'Loktak Lake floating circular phumdis at sunrise, Manipur',
        isCover: true,
        sortOrder: 1,
      },
      {
        packageId: pkg.id,
        url: 'https://images.unsplash.com/photo-1608889825205-eebdb9fc5806?auto=format&fit=crop&w=1200&q=80',
        altText: 'Kangla Fort palace and royal moat in Imphal',
        isCover: false,
        sortOrder: 2,
      },
      {
        packageId: pkg.id,
        url: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=1200&q=80',
        altText: 'Misty hills and tea estates of Manipur valley',
        isCover: false,
        sortOrder: 3,
      },
    ],
  });

  // 5. Add Itinerary
  await prisma.itineraryDay.createMany({
    data: [
      {
        packageId: pkg.id,
        day: 1,
        title: 'Arrival in Imphal & Kangla Fort Royal Heritage',
        description: 'Airport pickup at Bir Tikendrajit International Airport. Transfer to luxury boutique hotel. Afternoon walking tour of Kangla Fort, the ancient royal seat of Manipur kingdom, followed by Govindajee Temple evening aarti.',
        activities: ['Airport reception & check-in', 'Kangla Fort tour with heritage guide', 'Govindajee Temple visit'],
        meals: ['Dinner'],
        accommodation: 'The Classic Grande or Hotel Imphal (Deluxe Room)',
        location: 'Imphal',
      },
      {
        packageId: pkg.id,
        day: 2,
        title: 'Mystical Loktak Lake Boat Safari & Keibul Lamjao Floating Park',
        description: 'Full day scenic excursion to Moirang. Traditional motorized canoe boat ride through the floating circular phumdis. Visit Keibul Lamjao National Park to spot the rare dancing Sangai deer. Sunset panoramic vista from Sendra Island hillock.',
        activities: ['Loktak Lake boat safari', 'Keibul Lamjao wildlife viewpoint', 'Sendra Island sunset viewing'],
        meals: ['Breakfast', 'Lunch', 'Dinner'],
        accommodation: 'Sendra Eco Resort / Lake View Cottage',
        location: 'Moirang & Loktak Lake',
      },
      {
        packageId: pkg.id,
        day: 3,
        title: 'INA Memorial, Andro Heritage Village & Pottery',
        description: 'Pay tribute at the historic Indian National Army (INA) Memorial at Moirang where Netaji Subhash Chandra Bose unfurled the Tricolour. Afternoon visit to ancient Andro village to witness centuries-old coil pottery making and traditional sacred fire shrine.',
        activities: ['INA War Memorial visit', 'Andro Cultural Complex & Pottery demonstration', 'Traditional Meitei feast dinner'],
        meals: ['Breakfast', 'Dinner'],
        accommodation: 'The Classic Grande, Imphal',
        location: 'Moirang & Andro Village',
      },
      {
        packageId: pkg.id,
        day: 4,
        title: 'Ima Keithel (Mother Market) & Farewell Departure',
        description: 'Morning exploration of Ima Keithel — Asia’s largest all-women operated market selling exquisite handlooms, organic spices, and Manipuri crafts. Transfer to Imphal Airport for flight home with unforgettable memories.',
        activities: ['Ima Keithel handloom shopping', 'Airport departure transfer'],
        meals: ['Breakfast'],
        accommodation: 'Trip concludes',
        location: 'Imphal Airport',
      },
    ],
  });

  // 6. Inclusions & Exclusions
  await prisma.packageInclusion.createMany({
    data: [
      { packageId: pkg.id, text: '3 Nights deluxe hotel & eco-resort accommodation', isIncluded: true },
      { packageId: pkg.id, text: 'Private AC Innova/Scorpio vehicle for all 4 days', isIncluded: true },
      { packageId: pkg.id, text: 'Breakfast daily and 3 specialty dinners', isIncluded: true },
      { packageId: pkg.id, text: 'Private motorized boat safari on Loktak Lake', isIncluded: true },
      { packageId: pkg.id, text: 'Keibul Lamjao & Kangla Fort entry permits & guide fees', isIncluded: true },
      { packageId: pkg.id, text: 'Airport pickup and drop-off', isIncluded: true },
      { packageId: pkg.id, text: 'Airfare / Train tickets to Imphal', isIncluded: false },
      { packageId: pkg.id, text: 'Personal shopping and optional water sports', isIncluded: false },
    ],
  });

  // 7. Add Availability
  const baseDates = [
    '2026-11-05', '2026-11-19', '2026-12-03', '2026-12-17',
    '2027-01-07', '2027-01-21', '2027-02-11', '2027-02-25',
  ];
  await prisma.packageAvailability.createMany({
    data: baseDates.map((dateStr) => ({
      packageId: pkg.id,
      date: new Date(dateStr),
      price: 15750,
      capacity: 12,
      bookedCount: 2,
      isAvailable: true,
    })),
  });

  // 8. Update Provider & Destination package counts
  const totalPackages = await prisma.package.count({
    where: { providerId: provider.id, status: ListingStatus.PUBLISHED, approvalStatus: ApprovalStatus.APPROVED, isActive: true },
  });
  await prisma.providerProfile.update({
    where: { id: provider.id },
    data: { totalPackages },
  });

  const destCount = await prisma.package.count({
    where: { destinationId: destination.id, status: ListingStatus.PUBLISHED, approvalStatus: ApprovalStatus.APPROVED, isActive: true },
  });
  await prisma.destination.update({
    where: { id: destination.id },
    data: { packageCount: destCount },
  });

  console.log(`✅ Successfully seeded Manipur! Provider now has ${totalPackages} packages.`);
}

seedManipur()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
