import { PrismaClient, UserRole, VerificationStatus, ListingStatus, ApprovalStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();
const DEMO_PASSWORD_HASH = bcrypt.hashSync('password123', 10);

async function main() {
  console.log('🌱 Starting Devotional & Foreign Trips database seed...');

  // 1. Upsert Categories
  console.log('📦 Seeding devotional and foreign categories...');
  const devotionalCategory = await prisma.category.upsert({
    where: { slug: 'devotional' },
    update: {
      name: 'Devotional Trips',
      icon: '🛕',
      description: 'Spiritual temple yatras, holy pilgrimages, and sacred heritage tours across India.',
      isActive: true,
    },
    create: {
      slug: 'devotional',
      name: 'Devotional Trips',
      icon: '🛕',
      description: 'Spiritual temple yatras, holy pilgrimages, and sacred heritage tours across India.',
      isActive: true,
    },
  });

  const foreignCategory = await prisma.category.upsert({
    where: { slug: 'foreign' },
    update: {
      name: 'Foreign Trips',
      icon: '✈️',
      description: 'Curated international holidays, island getaways, and global city explorations.',
      isActive: true,
    },
    create: {
      slug: 'foreign',
      name: 'Foreign Trips',
      icon: '✈️',
      description: 'Curated international holidays, island getaways, and global city explorations.',
      isActive: true,
    },
  });

  // 2. Providers
  console.log('🏢 Seeding dedicated tour operators...');
  const devotionalUser = await prisma.user.upsert({
    where: { email: 'devotional.provider@vibemiles.com' },
    update: { role: UserRole.PROVIDER, passwordHash: DEMO_PASSWORD_HASH },
    create: {
      email: 'devotional.provider@vibemiles.com',
      phone: '9840123456',
      passwordHash: DEMO_PASSWORD_HASH,
      role: UserRole.PROVIDER,
    },
  });

  const devotionalProvider = await prisma.providerProfile.upsert({
    where: { userId: devotionalUser.id },
    update: {
      businessName: 'Vedic Heritage & Sacred Yatras',
      ownerName: 'Rameshwar Sharma',
      businessCategory: 'Tour Organizer',
      verificationStatus: VerificationStatus.VERIFIED,
      rating: 4.9,
      reviewCount: 38,
      totalPackages: 3,
    },
    create: {
      userId: devotionalUser.id,
      businessName: 'Vedic Heritage & Sacred Yatras',
      ownerName: 'Rameshwar Sharma',
      businessCategory: 'Tour Organizer',
      description: 'Specialized pilgrimage and heritage tour agency guiding yatris to sacred temples across Kashi, Tirumala, and Uttarakhand.',
      addressLine1: 'Ghat Road, Dashashwamedh',
      city: 'Varanasi',
      state: 'Uttar Pradesh',
      pincode: '221001',
      country: 'India',
      verificationStatus: VerificationStatus.VERIFIED,
      rating: 4.9,
      reviewCount: 38,
      totalPackages: 3,
    },
  });

  const foreignUser = await prisma.user.upsert({
    where: { email: 'foreign.provider@vibemiles.com' },
    update: { role: UserRole.PROVIDER, passwordHash: DEMO_PASSWORD_HASH },
    create: {
      email: 'foreign.provider@vibemiles.com',
      phone: '9840654321',
      passwordHash: DEMO_PASSWORD_HASH,
      role: UserRole.PROVIDER,
    },
  });

  const foreignProvider = await prisma.providerProfile.upsert({
    where: { userId: foreignUser.id },
    update: {
      businessName: 'Global Horizons International Tours',
      ownerName: 'Kunal Singhania',
      businessCategory: 'Tour Organizer',
      verificationStatus: VerificationStatus.VERIFIED,
      rating: 4.8,
      reviewCount: 42,
      totalPackages: 3,
    },
    create: {
      userId: foreignUser.id,
      businessName: 'Global Horizons International Tours',
      ownerName: 'Kunal Singhania',
      businessCategory: 'Tour Organizer',
      description: 'Licensed international holiday and overseas excursion specialists connecting Indian travellers to Dubai, Bali, and Southeast Asia.',
      addressLine1: 'Level 4, Commerce Tower, Indiranagar',
      city: 'Bengaluru',
      state: 'Karnataka',
      pincode: '560038',
      country: 'India',
      verificationStatus: VerificationStatus.VERIFIED,
      rating: 4.8,
      reviewCount: 42,
      totalPackages: 3,
    },
  });

  // 3. Destinations
  console.log('📍 Seeding sacred and international destinations...');
  const varanasiDest = await prisma.destination.upsert({
    where: { slug: 'varanasi-uttar-pradesh' },
    update: {
      name: 'Varanasi',
      state: 'Uttar Pradesh',
      country: 'India',
      description: 'The world’s oldest living sacred city on the banks of holy river Ganges, famous for Kashi Vishwanath temple, iconic river ghats, and evening Ganga Aarti.',
      heroImage: 'https://images.unsplash.com/photo-1561361513-2d000a50f0dc?auto=format&fit=crop&w=1200&q=80',
      images: [
        'https://images.unsplash.com/photo-1561361513-2d000a50f0dc?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1571536802807-30451e3955d8?auto=format&fit=crop&w=800&q=80',
      ],
      bestTimeToVisit: 'October to March',
      averageTemperature: '18°C - 28°C',
      topActivities: [
        'Dashashwamedh Ghat Evening Ganga Aarti',
        'Shri Kashi Vishwanath Darshan Walk',
        'Sunrise Boat Ride on the Ganges',
        'Sarnath Buddhist Heritage Excursion',
      ],
      isPopular: true,
      isTrending: true,
      packageCount: 1,
      rating: 4.9,
      reviewCount: 38,
      tags: ['devotional', 'spiritual', 'temple', 'varanasi', 'kashi', 'ganga'],
    },
    create: {
      slug: 'varanasi-uttar-pradesh',
      name: 'Varanasi',
      state: 'Uttar Pradesh',
      country: 'India',
      description: 'The world’s oldest living sacred city on the banks of holy river Ganges, famous for Kashi Vishwanath temple, iconic river ghats, and evening Ganga Aarti.',
      heroImage: 'https://images.unsplash.com/photo-1561361513-2d000a50f0dc?auto=format&fit=crop&w=1200&q=80',
      images: [
        'https://images.unsplash.com/photo-1561361513-2d000a50f0dc?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1571536802807-30451e3955d8?auto=format&fit=crop&w=800&q=80',
      ],
      bestTimeToVisit: 'October to March',
      averageTemperature: '18°C - 28°C',
      topActivities: [
        'Dashashwamedh Ghat Evening Ganga Aarti',
        'Shri Kashi Vishwanath Darshan Walk',
        'Sunrise Boat Ride on the Ganges',
        'Sarnath Buddhist Heritage Excursion',
      ],
      isPopular: true,
      isTrending: true,
      packageCount: 1,
      rating: 4.9,
      reviewCount: 38,
      tags: ['devotional', 'spiritual', 'temple', 'varanasi', 'kashi', 'ganga'],
    },
  });

  const tirupatiDest = await prisma.destination.upsert({
    where: { slug: 'tirupati-andhra-pradesh' },
    update: {
      name: 'Tirupati',
      state: 'Andhra Pradesh',
      country: 'India',
      description: 'Revered spiritual abode of Lord Sri Venkateswara Swami perched atop the sacred seven hills of Tirumala, attracting millions of devotees worldwide.',
      heroImage: 'https://images.unsplash.com/photo-1609766857041-ed402ea8069a?auto=format&fit=crop&w=1200&q=80',
      images: [
        'https://images.unsplash.com/photo-1609766857041-ed402ea8069a?auto=format&fit=crop&w=800&q=80',
      ],
      bestTimeToVisit: 'September to February',
      averageTemperature: '22°C - 30°C',
      topActivities: [
        'Tirumala Venkateswara Temple Orientation',
        'Sri Padmavathi Ammavari Temple Visit',
        'Kapila Theertham Waterfalls',
        'Silathoranam Natural Rock Formation',
      ],
      isPopular: true,
      isTrending: true,
      packageCount: 1,
      rating: 4.8,
      reviewCount: 29,
      tags: ['devotional', 'spiritual', 'temple', 'tirupati', 'balaji', 'tirumala'],
    },
    create: {
      slug: 'tirupati-andhra-pradesh',
      name: 'Tirupati',
      state: 'Andhra Pradesh',
      country: 'India',
      description: 'Revered spiritual abode of Lord Sri Venkateswara Swami perched atop the sacred seven hills of Tirumala, attracting millions of devotees worldwide.',
      heroImage: 'https://images.unsplash.com/photo-1609766857041-ed402ea8069a?auto=format&fit=crop&w=1200&q=80',
      images: [
        'https://images.unsplash.com/photo-1609766857041-ed402ea8069a?auto=format&fit=crop&w=800&q=80',
      ],
      bestTimeToVisit: 'September to February',
      averageTemperature: '22°C - 30°C',
      topActivities: [
        'Tirumala Venkateswara Temple Orientation',
        'Sri Padmavathi Ammavari Temple Visit',
        'Kapila Theertham Waterfalls',
        'Silathoranam Natural Rock Formation',
      ],
      isPopular: true,
      isTrending: true,
      packageCount: 1,
      rating: 4.8,
      reviewCount: 29,
      tags: ['devotional', 'spiritual', 'temple', 'tirupati', 'balaji', 'tirumala'],
    },
  });

  const rishikeshDest = await prisma.destination.upsert({
    where: { slug: 'rishikesh-haridwar-uttarakhand' },
    update: {
      name: 'Rishikesh & Haridwar',
      state: 'Uttarakhand',
      country: 'India',
      description: 'The spiritual gateway to the Garhwal Himalayas where the sacred river Ganga meets pristine valleys, famous for holy ghats, ancient ashrams, and evening Maha Aarti.',
      heroImage: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=1200&q=80',
      images: [
        'https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=800&q=80',
      ],
      bestTimeToVisit: 'September to April',
      averageTemperature: '15°C - 26°C',
      topActivities: [
        'Har Ki Pauri Evening Ganga Aarti',
        'Mansa Devi & Chandi Devi Ropeway Temples',
        'Ganges Riverside Meditation & Yoga',
        'Ram Jhula & Laxman Jhula Heritage Walk',
      ],
      isPopular: true,
      isTrending: false,
      packageCount: 1,
      rating: 4.9,
      reviewCount: 31,
      tags: ['devotional', 'spiritual', 'temple', 'rishikesh', 'haridwar', 'ganga'],
    },
    create: {
      slug: 'rishikesh-haridwar-uttarakhand',
      name: 'Rishikesh & Haridwar',
      state: 'Uttarakhand',
      country: 'India',
      description: 'The spiritual gateway to the Garhwal Himalayas where the sacred river Ganga meets pristine valleys, famous for holy ghats, ancient ashrams, and evening Maha Aarti.',
      heroImage: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=1200&q=80',
      images: [
        'https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=800&q=80',
      ],
      bestTimeToVisit: 'September to April',
      averageTemperature: '15°C - 26°C',
      topActivities: [
        'Har Ki Pauri Evening Ganga Aarti',
        'Mansa Devi & Chandi Devi Ropeway Temples',
        'Ganges Riverside Meditation & Yoga',
        'Ram Jhula & Laxman Jhula Heritage Walk',
      ],
      isPopular: true,
      isTrending: false,
      packageCount: 1,
      rating: 4.9,
      reviewCount: 31,
      tags: ['devotional', 'spiritual', 'temple', 'rishikesh', 'haridwar', 'ganga'],
    },
  });

  const dubaiDest = await prisma.destination.upsert({
    where: { slug: 'dubai-uae' },
    update: {
      name: 'Dubai',
      state: 'Dubai Emirate',
      country: 'United Arab Emirates',
      description: 'A global metropolis known for futuristic architecture, high-end shopping, luxury dhow cruises, and expansive Arabian desert safaris.',
      heroImage: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=1200&q=80',
      images: [
        'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=800&q=80',
      ],
      bestTimeToVisit: 'November to March',
      averageTemperature: '20°C - 29°C',
      topActivities: [
        'Burj Khalifa At the Top Observation Deck',
        '4x4 Red Dune Desert Safari with BBQ',
        'Dubai Marina Luxury Dhow Cruise',
        'Gold & Spice Souk Walking Tour',
      ],
      isPopular: true,
      isTrending: true,
      packageCount: 1,
      rating: 4.8,
      reviewCount: 45,
      tags: ['foreign', 'international', 'dubai', 'uae', 'middle-east', 'desert-safari'],
    },
    create: {
      slug: 'dubai-uae',
      name: 'Dubai',
      state: 'Dubai Emirate',
      country: 'United Arab Emirates',
      description: 'A global metropolis known for futuristic architecture, high-end shopping, luxury dhow cruises, and expansive Arabian desert safaris.',
      heroImage: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=1200&q=80',
      images: [
        'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=800&q=80',
      ],
      bestTimeToVisit: 'November to March',
      averageTemperature: '20°C - 29°C',
      topActivities: [
        'Burj Khalifa At the Top Observation Deck',
        '4x4 Red Dune Desert Safari with BBQ',
        'Dubai Marina Luxury Dhow Cruise',
        'Gold & Spice Souk Walking Tour',
      ],
      isPopular: true,
      isTrending: true,
      packageCount: 1,
      rating: 4.8,
      reviewCount: 45,
      tags: ['foreign', 'international', 'dubai', 'uae', 'middle-east', 'desert-safari'],
    },
  });

  const baliDest = await prisma.destination.upsert({
    where: { slug: 'bali-indonesia' },
    update: {
      name: 'Bali',
      state: 'Bali Province',
      country: 'Indonesia',
      description: 'An Indonesian tropical paradise famous for volcanic forested mountains, iconic rice paddy terraces, coral reefs, and cliffside sea temples.',
      heroImage: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=1200&q=80',
      images: [
        'https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=800&q=80',
      ],
      bestTimeToVisit: 'April to October',
      averageTemperature: '26°C - 31°C',
      topActivities: [
        'Tanah Lot Sunset Sea Temple Tour',
        'Ubud Sacred Monkey Forest Walk',
        'Tegalalang Rice Terraces & Swing',
        'Uluwatu Sunset Kecak Fire Dance',
      ],
      isPopular: true,
      isTrending: true,
      packageCount: 1,
      rating: 4.9,
      reviewCount: 39,
      tags: ['foreign', 'international', 'bali', 'indonesia', 'island', 'tropical'],
    },
    create: {
      slug: 'bali-indonesia',
      name: 'Bali',
      state: 'Bali Province',
      country: 'Indonesia',
      description: 'An Indonesian tropical paradise famous for volcanic forested mountains, iconic rice paddy terraces, coral reefs, and cliffside sea temples.',
      heroImage: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=1200&q=80',
      images: [
        'https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=800&q=80',
      ],
      bestTimeToVisit: 'April to October',
      averageTemperature: '26°C - 31°C',
      topActivities: [
        'Tanah Lot Sunset Sea Temple Tour',
        'Ubud Sacred Monkey Forest Walk',
        'Tegalalang Rice Terraces & Swing',
        'Uluwatu Sunset Kecak Fire Dance',
      ],
      isPopular: true,
      isTrending: true,
      packageCount: 1,
      rating: 4.9,
      reviewCount: 39,
      tags: ['foreign', 'international', 'bali', 'indonesia', 'island', 'tropical'],
    },
  });

  const thailandDest = await prisma.destination.upsert({
    where: { slug: 'bangkok-phuket-thailand' },
    update: {
      name: 'Bangkok & Phuket',
      state: 'Central & Southern Thailand',
      country: 'Thailand',
      description: 'The quintessential Southeast Asian journey pairing vibrant golden temples and floating markets in Bangkok with turquoise Andaman waters and island beaches in Phuket.',
      heroImage: 'https://images.unsplash.com/photo-1508009603885-50cf7c579365?auto=format&fit=crop&w=1200&q=80',
      images: [
        'https://images.unsplash.com/photo-1508009603885-50cf7c579365?auto=format&fit=crop&w=800&q=80',
      ],
      bestTimeToVisit: 'November to April',
      averageTemperature: '24°C - 32°C',
      topActivities: [
        'Phi Phi Island Speedboat Excursion',
        'Bangkok Reclining Buddha (Wat Pho) Tour',
        'Phuket Big Buddha & Karon Viewpoint',
        'Chao Phraya Princess Dinner Cruise',
      ],
      isPopular: true,
      isTrending: true,
      packageCount: 1,
      rating: 4.7,
      reviewCount: 34,
      tags: ['foreign', 'international', 'thailand', 'bangkok', 'phuket', 'islands'],
    },
    create: {
      slug: 'bangkok-phuket-thailand',
      name: 'Bangkok & Phuket',
      state: 'Central & Southern Thailand',
      country: 'Thailand',
      description: 'The quintessential Southeast Asian journey pairing vibrant golden temples and floating markets in Bangkok with turquoise Andaman waters and island beaches in Phuket.',
      heroImage: 'https://images.unsplash.com/photo-1508009603885-50cf7c579365?auto=format&fit=crop&w=1200&q=80',
      images: [
        'https://images.unsplash.com/photo-1508009603885-50cf7c579365?auto=format&fit=crop&w=800&q=80',
      ],
      bestTimeToVisit: 'November to April',
      averageTemperature: '24°C - 32°C',
      topActivities: [
        'Phi Phi Island Speedboat Excursion',
        'Bangkok Reclining Buddha (Wat Pho) Tour',
        'Phuket Big Buddha & Karon Viewpoint',
        'Chao Phraya Princess Dinner Cruise',
      ],
      isPopular: true,
      isTrending: true,
      packageCount: 1,
      rating: 4.7,
      reviewCount: 34,
      tags: ['foreign', 'international', 'thailand', 'bangkok', 'phuket', 'islands'],
    },
  });

  // 4. Upsert Devotional Packages
  console.log('🛕 Seeding devotional packages...');
  
  // Package D1: Varanasi
  const pkgD1 = await prisma.package.upsert({
    where: { slug: '3-day-varanasi-kashi-vishwanath-ganga-aarti-yatra' },
    update: {
      name: '3-Day Varanasi Kashi Vishwanath & Ganga Aarti Spiritual Yatra',
      description: 'Experience the divine essence of holy Varanasi. Includes guided Kashi Vishwanath orientation, sunrise boat ride on river Ganga, reserved ghat seating for evening Ganga Aarti, and Sarnath Buddhist heritage excursion. Ideal for families and elderly devotees seeking comfortable spiritual guidance.',
      basePrice: 12999,
      discountPercent: 23,
      finalPrice: 9999,
      rating: 4.9,
      reviewCount: 24,
      durationDays: 3,
      durationNights: 2,
      maxGroupSize: 10,
      highlights: [
        'Kashi Vishwanath Temple orientation with experienced local guide',
        'Sunrise boat cruise along Dashashwamedh, Manikarnika and Assi Ghats',
        'Reserved boat seating for magnificent Dashashwamedh Evening Ganga Aarti',
        'Excursion to sacred Sarnath Buddhist deer park and museum',
      ],
      status: ListingStatus.PUBLISHED,
      approvalStatus: ApprovalStatus.APPROVED,
      isActive: true,
      isFeatured: true,
      tags: ['devotional', 'spiritual', 'temple', 'varanasi', 'kashi', 'ganga', 'pilgrimage', 'darshan'],
    },
    create: {
      slug: '3-day-varanasi-kashi-vishwanath-ganga-aarti-yatra',
      providerId: devotionalProvider.id,
      categoryId: devotionalCategory.id,
      destinationId: varanasiDest.id,
      name: '3-Day Varanasi Kashi Vishwanath & Ganga Aarti Spiritual Yatra',
      description: 'Experience the divine essence of holy Varanasi. Includes guided Kashi Vishwanath orientation, sunrise boat ride on river Ganga, reserved ghat seating for evening Ganga Aarti, and Sarnath Buddhist heritage excursion. Ideal for families and elderly devotees seeking comfortable spiritual guidance.',
      highlights: [
        'Kashi Vishwanath Temple orientation with experienced local guide',
        'Sunrise boat cruise along Dashashwamedh, Manikarnika and Assi Ghats',
        'Reserved boat seating for magnificent Dashashwamedh Evening Ganga Aarti',
        'Excursion to sacred Sarnath Buddhist deer park and museum',
      ],
      state: 'Uttar Pradesh',
      city: 'Varanasi',
      durationDays: 3,
      durationNights: 2,
      maxGroupSize: 10,
      basePrice: 12999,
      discountPercent: 23,
      finalPrice: 9999,
      currency: 'INR',
      rating: 4.9,
      reviewCount: 24,
      bookingCount: 52,
      status: ListingStatus.PUBLISHED,
      approvalStatus: ApprovalStatus.APPROVED,
      isActive: true,
      isFeatured: true,
      tags: ['devotional', 'spiritual', 'temple', 'varanasi', 'kashi', 'ganga', 'pilgrimage', 'darshan'],
    },
  });

  await prisma.packageImage.deleteMany({ where: { packageId: pkgD1.id } });
  await prisma.packageImage.createMany({
    data: [
      { packageId: pkgD1.id, url: 'https://images.unsplash.com/photo-1561361513-2d000a50f0dc?auto=format&fit=crop&w=800&q=80', isCover: true, sortOrder: 0 },
      { packageId: pkgD1.id, url: 'https://images.unsplash.com/photo-1571536802807-30451e3955d8?auto=format&fit=crop&w=800&q=80', isCover: false, sortOrder: 1 },
    ],
  });

  await prisma.itineraryDay.deleteMany({ where: { packageId: pkgD1.id } });
  await prisma.itineraryDay.createMany({
    data: [
      {
        packageId: pkgD1.id,
        day: 1,
        title: 'Arrival in Kashi & Evening Ganga Aarti',
        description: 'Airport/station pickup in AC vehicle. Check in at comfortable hotel. In the evening, witness the soul-stirring Ganga Aarti at Dashashwamedh Ghat from a reserved boat.',
        activities: ['Hotel check-in', 'Evening Ganga Aarti boat viewing', 'Ghat orientation walk'],
        meals: ['Dinner'],
        accommodation: 'Heritage AC Hotel near Godowlia',
        location: 'Varanasi',
      },
      {
        packageId: pkgD1.id,
        day: 2,
        title: 'Sunrise Boat Ride & Temple Darshan Walk',
        description: 'Early morning sacred boat cruise past 84 ghats. Visit Sri Kashi Vishwanath temple corridor, Annapurna Mandir, and Vishalakshi Temple with spiritual guide. Afternoon visit to Sarnath.',
        activities: ['Sunrise Ganga boat cruise', 'Kashi Vishwanath Corridor guidance', 'Sarnath Buddhist Stupa tour'],
        meals: ['Breakfast', 'Dinner'],
        accommodation: 'Heritage AC Hotel near Godowlia',
        location: 'Varanasi & Sarnath',
      },
      {
        packageId: pkgD1.id,
        day: 3,
        title: 'Kal Bhairav Temple & Departure',
        description: 'Morning visit to Kotwal of Kashi — Kal Bhairav temple and Sankat Mochan Hanuman temple. Authentic Banarasi breakfast and timely airport/railway station drop.',
        activities: ['Kal Bhairav Temple visit', 'Sankat Mochan Temple', 'Departure transfer'],
        meals: ['Breakfast'],
        location: 'Varanasi',
      },
    ],
  });

  await prisma.packageInclusion.deleteMany({ where: { packageId: pkgD1.id } });
  await prisma.packageInclusion.createMany({
    data: [
      { packageId: pkgD1.id, text: '2 Nights AC hotel stay in Varanasi on twin-sharing basis', isIncluded: true },
      { packageId: pkgD1.id, text: 'Daily vegetarian Sattvic breakfast at hotel', isIncluded: true },
      { packageId: pkgD1.id, text: 'Morning private rowing boat cruise on the Ganges', isIncluded: true },
      { packageId: pkgD1.id, text: 'Reserved boat viewing for evening Dashashwamedh Aarti', isIncluded: true },
      { packageId: pkgD1.id, text: 'Experienced spiritual local guide for temple orientation', isIncluded: true },
      { packageId: pkgD1.id, text: 'All sightseeing transfers in sanitized AC car', isIncluded: true },
      { packageId: pkgD1.id, text: 'Special VIP Sugam Darshan passes (must be booked directly on official Shri Kashi Vishwanath Temple Trust portal; VibeMiles provides guidance only)', isIncluded: false },
      { packageId: pkgD1.id, text: 'Airfare or train tickets to/from Varanasi', isIncluded: false },
      { packageId: pkgD1.id, text: 'Personal special pooja / abhishek dakshina fees', isIncluded: false },
      { packageId: pkgD1.id, text: 'Personal expenses and shopping', isIncluded: false },
    ],
  });

  // Package D2: Tirupati
  const pkgD2 = await prisma.package.upsert({
    where: { slug: '2-day-tirupati-balaji-darshan-tirumala-pilgrimage' },
    update: {
      name: '2-Day Tirupati Balaji & Tirumala Temple Pilgrimage Yatra',
      description: 'Comfortable spiritual weekend pilgrimage to the holy seven hills of Tirumala. Includes dedicated AC vehicle from Chennai or Bengaluru, foothill hotel stay, local pilgrimage assistance, and visit to Sri Padmavathi Ammavari temple.',
      basePrice: 7999,
      discountPercent: 18,
      finalPrice: 6499,
      rating: 4.8,
      reviewCount: 19,
      durationDays: 2,
      durationNights: 1,
      maxGroupSize: 8,
      highlights: [
        'Dedicated AC car transfers from Chennai or Bengaluru doorstep',
        'Comfortable stay at 3-star hotel in Tirupati foothills',
        'Local pilgrimage guide to assist with Tirumala entry logistics',
        'Visit to sacred Sri Padmavathi Devi temple in Tiruchanur',
      ],
      status: ListingStatus.PUBLISHED,
      approvalStatus: ApprovalStatus.APPROVED,
      isActive: true,
      isFeatured: true,
      tags: ['devotional', 'spiritual', 'temple', 'tirupati', 'balaji', 'tirumala', 'pilgrimage', 'darshan'],
    },
    create: {
      slug: '2-day-tirupati-balaji-darshan-tirumala-pilgrimage',
      providerId: devotionalProvider.id,
      categoryId: devotionalCategory.id,
      destinationId: tirupatiDest.id,
      name: '2-Day Tirupati Balaji & Tirumala Temple Pilgrimage Yatra',
      description: 'Comfortable spiritual weekend pilgrimage to the holy seven hills of Tirumala. Includes dedicated AC vehicle from Chennai or Bengaluru, foothill hotel stay, local pilgrimage assistance, and visit to Sri Padmavathi Ammavari temple.',
      highlights: [
        'Dedicated AC car transfers from Chennai or Bengaluru doorstep',
        'Comfortable stay at 3-star hotel in Tirupati foothills',
        'Local pilgrimage guide to assist with Tirumala entry logistics',
        'Visit to sacred Sri Padmavathi Devi temple in Tiruchanur',
      ],
      state: 'Andhra Pradesh',
      city: 'Tirupati',
      durationDays: 2,
      durationNights: 1,
      maxGroupSize: 8,
      basePrice: 7999,
      discountPercent: 18,
      finalPrice: 6499,
      currency: 'INR',
      rating: 4.8,
      reviewCount: 19,
      bookingCount: 46,
      status: ListingStatus.PUBLISHED,
      approvalStatus: ApprovalStatus.APPROVED,
      isActive: true,
      isFeatured: true,
      tags: ['devotional', 'spiritual', 'temple', 'tirupati', 'balaji', 'tirumala', 'pilgrimage', 'darshan'],
    },
  });

  await prisma.packageImage.deleteMany({ where: { packageId: pkgD2.id } });
  await prisma.packageImage.createMany({
    data: [
      { packageId: pkgD2.id, url: 'https://images.unsplash.com/photo-1609766857041-ed402ea8069a?auto=format&fit=crop&w=800&q=80', isCover: true, sortOrder: 0 },
    ],
  });

  await prisma.itineraryDay.deleteMany({ where: { packageId: pkgD2.id } });
  await prisma.itineraryDay.createMany({
    data: [
      {
        packageId: pkgD2.id,
        day: 1,
        title: 'Morning Pickup & Tirupati Arrival',
        description: 'AC car pickup from your address in Bengaluru or Chennai. Scenic drive to Tirupati foothills. Check in, refresh, and visit Sri Padmavathi Ammavari Temple at Tiruchanur and Kapila Theertham.',
        activities: ['Doorstep pickup', 'Scenic drive', 'Sri Padmavathi Temple visit'],
        meals: ['Dinner'],
        accommodation: '3-Star AC Hotel in Tirupati',
        location: 'Tirupati',
      },
      {
        packageId: pkgD2.id,
        day: 2,
        title: 'Tirumala Balaji Darshan & Return',
        description: 'Early morning ghat road ascent to Tirumala. Assistance with reporting at darshan queue complex as per your official TTD slot. Collect laddu prasadam, visit Silathoranam, and return journey.',
        activities: ['Tirumala ghat road travel', 'Darshan queue assistance', 'Return transfer'],
        meals: ['Breakfast'],
        location: 'Tirumala & Return',
      },
    ],
  });

  await prisma.packageInclusion.deleteMany({ where: { packageId: pkgD2.id } });
  await prisma.packageInclusion.createMany({
    data: [
      { packageId: pkgD2.id, text: 'Dedicated AC Sedan / SUV for the entire trip from Bengaluru/Chennai', isIncluded: true },
      { packageId: pkgD2.id, text: '1 Night AC hotel stay in Tirupati town on twin sharing', isIncluded: true },
      { packageId: pkgD2.id, text: 'Ghat road toll fees, driver beta, and parking charges', isIncluded: true },
      { packageId: pkgD2.id, text: 'Breakfast and local pilgrimage coordination', isIncluded: true },
      { packageId: pkgD2.id, text: 'Official TTD Special Entry Darshan pass (₹300 pass must be booked under traveller’s own ID on official tirupatibalaji.ap.gov.in portal; VibeMiles does not sell tickets)', isIncluded: false },
      { packageId: pkgD2.id, text: 'Special Arjitha Seva or Kalyanam tickets', isIncluded: false },
      { packageId: pkgD2.id, text: 'Personal tonsure or hundi donations', isIncluded: false },
    ],
  });

  // Package D3: Haridwar & Rishikesh
  const pkgD3 = await prisma.package.upsert({
    where: { slug: '4-day-haridwar-rishikesh-sacred-ganga-retreat' },
    update: {
      name: '4-Day Haridwar & Rishikesh Sacred Ganga Retreat',
      description: 'Immerse your spirit along the sacred foothills of the Himalayas. Includes Har Ki Pauri VIP evening aarti seating, cable car tickets to Mansa Devi temple, morning riverside yoga in Rishikesh, and serene ashram visits.',
      basePrice: 14000,
      discountPercent: 18,
      finalPrice: 11500,
      rating: 4.9,
      reviewCount: 28,
      durationDays: 4,
      durationNights: 3,
      maxGroupSize: 12,
      highlights: [
        'Har Ki Pauri Evening Ganga Aarti VIP ghat access',
        'Mansa Devi & Chandi Devi ropeway cable car temple visits',
        'Sunrise Vedic meditation & yoga along holy Ganga ghats in Rishikesh',
        'Visits to Parmarth Niketan, Beatles Ashram, and Ram Jhula',
      ],
      status: ListingStatus.PUBLISHED,
      approvalStatus: ApprovalStatus.APPROVED,
      isActive: true,
      isFeatured: false,
      tags: ['devotional', 'spiritual', 'temple', 'rishikesh', 'haridwar', 'ganga', 'pilgrimage', 'yoga'],
    },
    create: {
      slug: '4-day-haridwar-rishikesh-sacred-ganga-retreat',
      providerId: devotionalProvider.id,
      categoryId: devotionalCategory.id,
      destinationId: rishikeshDest.id,
      name: '4-Day Haridwar & Rishikesh Sacred Ganga Retreat',
      description: 'Immerse your spirit along the sacred foothills of the Himalayas. Includes Har Ki Pauri VIP evening aarti seating, cable car tickets to Mansa Devi temple, morning riverside yoga in Rishikesh, and serene ashram visits.',
      highlights: [
        'Har Ki Pauri Evening Ganga Aarti VIP ghat access',
        'Mansa Devi & Chandi Devi ropeway cable car temple visits',
        'Sunrise Vedic meditation & yoga along holy Ganga ghats in Rishikesh',
        'Visits to Parmarth Niketan, Beatles Ashram, and Ram Jhula',
      ],
      state: 'Uttarakhand',
      city: 'Rishikesh',
      durationDays: 4,
      durationNights: 3,
      maxGroupSize: 12,
      basePrice: 14000,
      discountPercent: 18,
      finalPrice: 11500,
      currency: 'INR',
      rating: 4.9,
      reviewCount: 28,
      bookingCount: 39,
      status: ListingStatus.PUBLISHED,
      approvalStatus: ApprovalStatus.APPROVED,
      isActive: true,
      isFeatured: false,
      tags: ['devotional', 'spiritual', 'temple', 'rishikesh', 'haridwar', 'ganga', 'pilgrimage', 'yoga'],
    },
  });

  await prisma.packageImage.deleteMany({ where: { packageId: pkgD3.id } });
  await prisma.packageImage.createMany({
    data: [
      { packageId: pkgD3.id, url: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=800&q=80', isCover: true, sortOrder: 0 },
    ],
  });

  await prisma.itineraryDay.deleteMany({ where: { packageId: pkgD3.id } });
  await prisma.itineraryDay.createMany({
    data: [
      {
        packageId: pkgD3.id,
        day: 1,
        title: 'Arrival in Haridwar & Evening Ganga Aarti',
        description: 'Pickup from Haridwar/Dehradun railway station or airport. Check in to river-view hotel. In the evening, witness Har Ki Pauri Maha Aarti.',
        activities: ['Transfer to hotel', 'Evening Har Ki Pauri Aarti'],
        meals: ['Dinner'],
        location: 'Haridwar',
      },
      {
        packageId: pkgD3.id,
        day: 2,
        title: 'Mansa Devi & Chandi Devi Temple Ropeways',
        description: 'Ascend to the hilltop shrines of Mansa Devi and Chandi Devi using ropeway cable cars. Afternoon drive to Rishikesh, check in to riverside wellness resort.',
        activities: ['Ropeway temple tours', 'Drive to Rishikesh', 'Triveni Ghat Aarti'],
        meals: ['Breakfast', 'Dinner'],
        location: 'Haridwar to Rishikesh',
      },
      {
        packageId: pkgD3.id,
        day: 3,
        title: 'Rishikesh Spiritual Ashram & Yoga Day',
        description: 'Gentle sunrise yoga by the holy river. Walk across Ram Jhula and explore Parmarth Niketan, Gita Bhawan, and ancient ashrams.',
        activities: ['Sunrise yoga', 'Ashram heritage tour', 'Evening bhajan at Parmarth'],
        meals: ['Breakfast', 'Dinner'],
        location: 'Rishikesh',
      },
      {
        packageId: pkgD3.id,
        day: 4,
        title: 'Morning Dip & Departure',
        description: 'Sacred morning snan at clean river ghat. Traditional Sattvic breakfast, followed by timely transfer to Dehradun (DED) airport or Haridwar station.',
        activities: ['Morning ghat meditation', 'Check out and departure transfer'],
        meals: ['Breakfast'],
        location: 'Rishikesh to Dehradun',
      },
    ],
  });

  await prisma.packageInclusion.deleteMany({ where: { packageId: pkgD3.id } });
  await prisma.packageInclusion.createMany({
    data: [
      { packageId: pkgD3.id, text: '3 Nights accommodation (1N Haridwar + 2N Rishikesh)', isIncluded: true },
      { packageId: pkgD3.id, text: 'Daily pure vegetarian breakfast and dinner', isIncluded: true },
      { packageId: pkgD3.id, text: 'Private AC vehicle for all transfers and sightseeing', isIncluded: true },
      { packageId: pkgD3.id, text: 'Ropeway tickets for Mansa Devi temple', isIncluded: true },
      { packageId: pkgD3.id, text: 'Daily morning yoga and guided meditation session', isIncluded: true },
      { packageId: pkgD3.id, text: 'Airfare or train tickets to Haridwar/Dehradun', isIncluded: false },
      { packageId: pkgD3.id, text: 'Personal special pooja materials or pandit dakshina', isIncluded: false },
      { packageId: pkgD3.id, text: 'Rafting or adventure sports add-ons', isIncluded: false },
    ],
  });

  // 5. Upsert Foreign Packages
  console.log('✈️ Seeding foreign/international packages...');

  // Package F1: Dubai
  const pkgF1 = await prisma.package.upsert({
    where: { slug: '5-day-dubai-city-lights-desert-safari' },
    update: {
      name: '5-Day Dubai International City Lights & Desert Safari',
      description: 'Discover the iconic wonders of Dubai. Experience Burj Khalifa 124th floor observation deck, 4x4 desert safari with dune bashing & BBQ dinner, Dubai Marina luxury dhow dinner cruise, and modern city tour.',
      basePrice: 52000,
      discountPercent: 13,
      finalPrice: 44999,
      rating: 4.8,
      reviewCount: 31,
      durationDays: 5,
      durationNights: 4,
      maxGroupSize: 15,
      highlights: [
        'Burj Khalifa 124th & 125th floor At the Top observation deck ticket',
        '4x4 Red Dune Desert Safari with dune bashing, camel ride, and BBQ buffet',
        'Dubai Marina evening luxury Dhow dinner cruise with Tanoura dance show',
        'Half-day guided modern & heritage city tour with Dubai Frame photo stop',
      ],
      status: ListingStatus.PUBLISHED,
      approvalStatus: ApprovalStatus.APPROVED,
      isActive: true,
      isFeatured: true,
      tags: ['foreign', 'international', 'dubai', 'uae', 'middle-east', 'desert-safari', 'burj-khalifa'],
    },
    create: {
      slug: '5-day-dubai-city-lights-desert-safari',
      providerId: foreignProvider.id,
      categoryId: foreignCategory.id,
      destinationId: dubaiDest.id,
      name: '5-Day Dubai International City Lights & Desert Safari',
      description: 'Discover the iconic wonders of Dubai. Experience Burj Khalifa 124th floor observation deck, 4x4 desert safari with dune bashing & BBQ dinner, Dubai Marina luxury dhow dinner cruise, and modern city tour.',
      highlights: [
        'Burj Khalifa 124th & 125th floor At the Top observation deck ticket',
        '4x4 Red Dune Desert Safari with dune bashing, camel ride, and BBQ buffet',
        'Dubai Marina evening luxury Dhow dinner cruise with Tanoura dance show',
        'Half-day guided modern & heritage city tour with Dubai Frame photo stop',
      ],
      state: 'Dubai Emirate',
      city: 'Dubai',
      durationDays: 5,
      durationNights: 4,
      maxGroupSize: 15,
      basePrice: 52000,
      discountPercent: 13,
      finalPrice: 44999,
      currency: 'INR',
      rating: 4.8,
      reviewCount: 31,
      bookingCount: 68,
      status: ListingStatus.PUBLISHED,
      approvalStatus: ApprovalStatus.APPROVED,
      isActive: true,
      isFeatured: true,
      tags: ['foreign', 'international', 'dubai', 'uae', 'middle-east', 'desert-safari', 'burj-khalifa'],
    },
  });

  await prisma.packageImage.deleteMany({ where: { packageId: pkgF1.id } });
  await prisma.packageImage.createMany({
    data: [
      { packageId: pkgF1.id, url: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=800&q=80', isCover: true, sortOrder: 0 },
    ],
  });

  await prisma.itineraryDay.deleteMany({ where: { packageId: pkgF1.id } });
  await prisma.itineraryDay.createMany({
    data: [
      {
        packageId: pkgF1.id,
        day: 1,
        title: 'Arrival in Dubai & Marina Dhow Dinner Cruise',
        description: 'Warm airport meet and transfer to 4-star city hotel. In the evening, board a luxury illuminated traditional Dhow on Dubai Marina with 5-star international buffet dinner and live entertainment.',
        activities: ['DXB airport transfer', 'Hotel check-in', 'Dubai Marina Dhow Cruise with dinner'],
        meals: ['Dinner'],
        accommodation: '4-Star City Hotel (Bur Dubai / Al Barsha)',
        location: 'Dubai',
      },
      {
        packageId: pkgF1.id,
        day: 2,
        title: 'Half-Day Dubai City Tour & Burj Khalifa',
        description: 'Guided city sightseeing: Jumeirah Mosque, Burj Al Arab photo point, Palm Jumeirah monorail ride. Evening visit to Dubai Mall and 124th floor observation deck of Burj Khalifa.',
        activities: ['City orientation tour', 'Burj Khalifa 124th floor ticket', 'Dubai Fountain show'],
        meals: ['Breakfast'],
        accommodation: '4-Star City Hotel',
        location: 'Dubai Downtown',
      },
      {
        packageId: pkgF1.id,
        day: 3,
        title: 'Morning Leisure & Desert Safari with BBQ Dinner',
        description: 'Morning free for shopping at Gold & Spice souks. At 3 PM, 4x4 Land Cruisers pick you up for heart-thumping red dune bashing, camel riding, sandboarding, and sunset BBQ banquet with belly dance and Tanoura show.',
        activities: ['Dune bashing in 4x4', 'Desert camp BBQ buffet', 'Tanoura and fire show'],
        meals: ['Breakfast', 'Dinner'],
        accommodation: '4-Star City Hotel',
        location: 'Lahbab Desert',
      },
      {
        packageId: pkgF1.id,
        day: 4,
        title: 'Miracle Garden or Museum of the Future',
        description: 'Explore Dubai Miracle Garden (seasonal) or photograph the architectural marvel of the Museum of the Future. Afternoon free for luxury retail shopping.',
        activities: ['Miracle Garden / Museum visit', 'Shopping at Mall of the Emirates'],
        meals: ['Breakfast'],
        accommodation: '4-Star City Hotel',
        location: 'Dubai',
      },
      {
        packageId: pkgF1.id,
        day: 5,
        title: 'Souk Shopping & Departure',
        description: 'Enjoy leisurely breakfast. Check out and transfer to Dubai International Airport (DXB) for flight back home.',
        activities: ['Breakfast', 'Airport departure transfer'],
        meals: ['Breakfast'],
        location: 'Dubai to Home',
      },
    ],
  });

  await prisma.packageInclusion.deleteMany({ where: { packageId: pkgF1.id } });
  await prisma.packageInclusion.createMany({
    data: [
      { packageId: pkgF1.id, text: '4 Nights in 4-star city hotel with daily international breakfast', isIncluded: true },
      { packageId: pkgF1.id, text: 'Burj Khalifa 124th floor At the Top observation ticket (non-prime)', isIncluded: true },
      { packageId: pkgF1.id, text: '4x4 Desert Safari with dune bashing, camel ride & BBQ buffet dinner', isIncluded: true },
      { packageId: pkgF1.id, text: 'Dubai Marina luxury Dhow dinner cruise with international buffet', isIncluded: true },
      { packageId: pkgF1.id, text: 'Round-trip Dubai International Airport (DXB) transfers', isIncluded: true },
      { packageId: pkgF1.id, text: 'International round-trip flights from India (not included; book independently)', isIncluded: false },
      { packageId: pkgF1.id, text: 'UAE Tourist Visa fees (approx ₹6,500 - ₹7,500; VibeMiles does not issue visas)', isIncluded: false },
      { packageId: pkgF1.id, text: 'Mandatory international travel medical insurance', isIncluded: false },
      { packageId: pkgF1.id, text: 'Tourism Dirham Fee payable directly at hotel check-in (AED 15/room/night)', isIncluded: false },
      { packageId: pkgF1.id, text: 'Lunch and personal shopping expenses', isIncluded: false },
    ],
  });

  // Package F2: Bali
  const pkgF2 = await prisma.package.upsert({
    where: { slug: '6-day-bali-tropical-paradise-ubud-cultural-journey' },
    update: {
      name: '6-Day Bali Tropical Paradise & Ubud Cultural Journey',
      description: 'Immerse yourself in Bali’s enchanting beauty. Stay at boutique pool resorts, visit the iconic Tanah Lot and Uluwatu cliff temples, stroll through Ubud monkey forest and Tegalalang rice terraces, with private car and English-speaking Balinese driver.',
      basePrice: 46000,
      discountPercent: 16,
      finalPrice: 38500,
      rating: 4.9,
      reviewCount: 26,
      durationDays: 6,
      durationNights: 5,
      maxGroupSize: 10,
      highlights: [
        'Private AC vehicle with dedicated English-speaking driver for all tours',
        'Iconic Tanah Lot sunset sea temple and Uluwatu cliff temple visits',
        'Ubud cultural tour: Sacred Monkey Forest, art market & Tegalalang terraces',
        'Kintamani volcano viewpoint overlooking Mount Batur and lake',
      ],
      status: ListingStatus.PUBLISHED,
      approvalStatus: ApprovalStatus.APPROVED,
      isActive: true,
      isFeatured: true,
      tags: ['foreign', 'international', 'bali', 'indonesia', 'island', 'tropical', 'ubud', 'southeast-asia'],
    },
    create: {
      slug: '6-day-bali-tropical-paradise-ubud-cultural-journey',
      providerId: foreignProvider.id,
      categoryId: foreignCategory.id,
      destinationId: baliDest.id,
      name: '6-Day Bali Tropical Paradise & Ubud Cultural Journey',
      description: 'Immerse yourself in Bali’s enchanting beauty. Stay at boutique pool resorts, visit the iconic Tanah Lot and Uluwatu cliff temples, stroll through Ubud monkey forest and Tegalalang rice terraces, with private car and English-speaking Balinese driver.',
      highlights: [
        'Private AC vehicle with dedicated English-speaking driver for all tours',
        'Iconic Tanah Lot sunset sea temple and Uluwatu cliff temple visits',
        'Ubud cultural tour: Sacred Monkey Forest, art market & Tegalalang terraces',
        'Kintamani volcano viewpoint overlooking Mount Batur and lake',
      ],
      state: 'Bali Province',
      city: 'Denpasar & Ubud',
      durationDays: 6,
      durationNights: 5,
      maxGroupSize: 10,
      basePrice: 46000,
      discountPercent: 16,
      finalPrice: 38500,
      currency: 'INR',
      rating: 4.9,
      reviewCount: 26,
      bookingCount: 54,
      status: ListingStatus.PUBLISHED,
      approvalStatus: ApprovalStatus.APPROVED,
      isActive: true,
      isFeatured: true,
      tags: ['foreign', 'international', 'bali', 'indonesia', 'island', 'tropical', 'ubud', 'southeast-asia'],
    },
  });

  await prisma.packageImage.deleteMany({ where: { packageId: pkgF2.id } });
  await prisma.packageImage.createMany({
    data: [
      { packageId: pkgF2.id, url: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=800&q=80', isCover: true, sortOrder: 0 },
    ],
  });

  await prisma.itineraryDay.deleteMany({ where: { packageId: pkgF2.id } });
  await prisma.itineraryDay.createMany({
    data: [
      {
        packageId: pkgF2.id,
        day: 1,
        title: 'Arrival in Bali (Denpasar DPS)',
        description: 'Traditional flower garland welcome at Ngurah Rai International Airport. Transfer to boutique resort in Seminyak/Kuta. Rest and sunset beach walk.',
        activities: ['Airport welcome & transfer', 'Resort check-in', 'Seminyak beach sunset'],
        meals: [],
        accommodation: '4-Star Pool Resort',
        location: 'Seminyak',
      },
      {
        packageId: pkgF2.id,
        day: 2,
        title: 'Ubud Cultural Heart & Tegalalang Rice Terraces',
        description: 'Drive to Ubud. Visit Sacred Monkey Forest Sanctuary, royal Ubud Palace, art market, and emerald Tegalalang rice terraces with optional jungle swing.',
        activities: ['Monkey Forest', 'Ubud Palace', 'Tegalalang rice terraces'],
        meals: ['Breakfast'],
        accommodation: '4-Star Resort',
        location: 'Ubud',
      },
      {
        packageId: pkgF2.id,
        day: 3,
        title: 'Kintamani Volcano & Coffee Plantation Tour',
        description: 'Scenic drive to Kintamani highlands with panoramic views of active volcano Mount Batur. Visit traditional Luwak coffee plantation and Tirta Empul holy spring temple.',
        activities: ['Mount Batur viewpoint', 'Tirta Empul temple blessing', 'Coffee tasting'],
        meals: ['Breakfast'],
        accommodation: '4-Star Resort',
        location: 'Kintamani',
      },
      {
        packageId: pkgF2.id,
        day: 4,
        title: 'Nusa Dua Water Sports & Uluwatu Clifftop Temple',
        description: 'Morning visit to Tanjung Benoa for beach activities (banana boat included). Afternoon visit to dramatic Uluwatu clifftop temple perched 70 meters above roaring Indian ocean waves.',
        activities: ['Tanjung Benoa beach', 'Uluwatu Temple', 'Sunset Kecak fire dance'],
        meals: ['Breakfast'],
        accommodation: '4-Star Resort',
        location: 'Uluwatu',
      },
      {
        packageId: pkgF2.id,
        day: 5,
        title: 'Tanah Lot Sunset Sea Temple',
        description: 'Morning leisure. In the afternoon, visit the legendary Tanah Lot temple built on a wave-carved offshore rock island for one of the world’s most famous golden sunsets.',
        activities: ['Tanah Lot offshore temple', 'Sunset photography'],
        meals: ['Breakfast'],
        accommodation: '4-Star Resort',
        location: 'Tanah Lot',
      },
      {
        packageId: pkgF2.id,
        day: 6,
        title: 'Souvenir Shopping & Departure Transfer',
        description: 'Breakfast at resort, last-minute shopping at Krisna Oleh Oleh market, and private transfer to Denpasar airport for flight home.',
        activities: ['Breakfast', 'Airport departure transfer'],
        meals: ['Breakfast'],
        location: 'Denpasar to Home',
      },
    ],
  });

  await prisma.packageInclusion.deleteMany({ where: { packageId: pkgF2.id } });
  await prisma.packageInclusion.createMany({
    data: [
      { packageId: pkgF2.id, text: '5 Nights stay in boutique 4-star pool resort with daily breakfast', isIncluded: true },
      { packageId: pkgF2.id, text: 'Private air-conditioned car with dedicated English-speaking driver', isIncluded: true },
      { packageId: pkgF2.id, text: 'All sightseeing temple entrance tickets as per itinerary', isIncluded: true },
      { packageId: pkgF2.id, text: 'Roundtrip airport pickup and drop at Denpasar (DPS)', isIncluded: true },
      { packageId: pkgF2.id, text: 'International round-trip flights from India (not included; book separately)', isIncluded: false },
      { packageId: pkgF2.id, text: 'Indonesia Visa on Arrival (VoA) fee (IDR 500,000 / ~₹2,700 paid on arrival or e-VoA)', isIncluded: false },
      { packageId: pkgF2.id, text: 'Bali International Tourist Levy (IDR 150,000 / ~₹800)', isIncluded: false },
      { packageId: pkgF2.id, text: 'Overseas travel health insurance', isIncluded: false },
    ],
  });

  // Package F3: Thailand
  const pkgF3 = await prisma.package.upsert({
    where: { slug: '5-day-thailand-explorer-bangkok-temples-phuket-islands' },
    update: {
      name: '5-Day Thailand Explorer — Bangkok Temples & Phuket Islands',
      description: 'The ultimate Thailand introduction pairing the vibrant culture of Bangkok with tropical island paradise in Phuket. Includes Phi Phi Island speedboat tour, Bangkok Wat Pho reclining Buddha tour, 4-star hotel stays, and all inter-city transfers.',
      basePrice: 39000,
      discountPercent: 15,
      finalPrice: 32999,
      rating: 4.7,
      reviewCount: 22,
      durationDays: 5,
      durationNights: 4,
      maxGroupSize: 12,
      highlights: [
        'Full-day Phi Phi Island speedboat tour with buffet lunch and snorkeling',
        'Bangkok historic temple tour: Wat Pho (Reclining Buddha) & Golden Buddha',
        'Phuket scenic island viewpoints and Big Buddha photo stop',
        '4-star hotel accommodations with daily international breakfast',
      ],
      status: ListingStatus.PUBLISHED,
      approvalStatus: ApprovalStatus.APPROVED,
      isActive: true,
      isFeatured: false,
      tags: ['foreign', 'international', 'thailand', 'bangkok', 'phuket', 'islands', 'southeast-asia'],
    },
    create: {
      slug: '5-day-thailand-explorer-bangkok-temples-phuket-islands',
      providerId: foreignProvider.id,
      categoryId: foreignCategory.id,
      destinationId: thailandDest.id,
      name: '5-Day Thailand Explorer — Bangkok Temples & Phuket Islands',
      description: 'The ultimate Thailand introduction pairing the vibrant culture of Bangkok with tropical island paradise in Phuket. Includes Phi Phi Island speedboat tour, Bangkok Wat Pho reclining Buddha tour, 4-star hotel stays, and all inter-city transfers.',
      highlights: [
        'Full-day Phi Phi Island speedboat tour with buffet lunch and snorkeling',
        'Bangkok historic temple tour: Wat Pho (Reclining Buddha) & Golden Buddha',
        'Phuket scenic island viewpoints and Big Buddha photo stop',
        '4-star hotel accommodations with daily international breakfast',
      ],
      state: 'Central & Southern Thailand',
      city: 'Bangkok & Phuket',
      durationDays: 5,
      durationNights: 4,
      maxGroupSize: 12,
      basePrice: 39000,
      discountPercent: 15,
      finalPrice: 32999,
      currency: 'INR',
      rating: 4.7,
      reviewCount: 22,
      bookingCount: 41,
      status: ListingStatus.PUBLISHED,
      approvalStatus: ApprovalStatus.APPROVED,
      isActive: true,
      isFeatured: false,
      tags: ['foreign', 'international', 'thailand', 'bangkok', 'phuket', 'islands', 'southeast-asia'],
    },
  });

  await prisma.packageImage.deleteMany({ where: { packageId: pkgF3.id } });
  await prisma.packageImage.createMany({
    data: [
      { packageId: pkgF3.id, url: 'https://images.unsplash.com/photo-1508009603885-50cf7c579365?auto=format&fit=crop&w=800&q=80', isCover: true, sortOrder: 0 },
    ],
  });

  await prisma.itineraryDay.deleteMany({ where: { packageId: pkgF3.id } });
  await prisma.itineraryDay.createMany({
    data: [
      {
        packageId: pkgF3.id,
        day: 1,
        title: 'Arrival in Phuket',
        description: 'Airport meet and greet at Phuket International (HKT). Transfer to Patong beach resort. Evening free for Bangla Road walk and night market food.',
        activities: ['Phuket airport transfer', 'Resort check-in', 'Patong beach walk'],
        meals: [],
        accommodation: '4-Star Resort in Patong',
        location: 'Phuket',
      },
      {
        packageId: pkgF3.id,
        day: 2,
        title: 'Phi Phi Island Speedboat Excursion',
        description: 'Full-day cruise across Andaman sea to Maya Bay, Viking Cave, and Monkey Beach. Snorkeling equipment and island buffet lunch included.',
        activities: ['Speedboat to Phi Phi Islands', 'Snorkeling in crystal waters', 'Buffet lunch on island'],
        meals: ['Breakfast', 'Lunch'],
        accommodation: '4-Star Resort in Patong',
        location: 'Phi Phi Islands',
      },
      {
        packageId: pkgF3.id,
        day: 3,
        title: 'Fly to Bangkok & City Orientation',
        description: 'Flight transfer to Bangkok. Check in at central city hotel. Evening free to explore famous shopping malls like Siam Paragon and MBK.',
        activities: ['Flight transfer to Bangkok', 'Hotel check-in', 'Siam shopping evening'],
        meals: ['Breakfast'],
        accommodation: '4-Star Hotel in Bangkok',
        location: 'Bangkok',
      },
      {
        packageId: pkgF3.id,
        day: 4,
        title: 'Bangkok Temples Tour & Chao Phraya Dinner',
        description: 'Morning guided tour of Wat Pho (Reclining Buddha) and Wat Traimit (Golden Buddha). Evening optional Chao Phraya river dinner cruise.',
        activities: ['Wat Pho temple visit', 'Wat Traimit Golden Buddha', 'Evening river cruise'],
        meals: ['Breakfast'],
        accommodation: '4-Star Hotel in Bangkok',
        location: 'Bangkok',
      },
      {
        packageId: pkgF3.id,
        day: 5,
        title: 'Departure from Bangkok',
        description: 'Enjoy delicious Thai buffet breakfast. Transfer to Suvarnabhumi (BKK) or Don Mueang (DMK) airport for departure flight.',
        activities: ['Breakfast', 'Airport transfer'],
        meals: ['Breakfast'],
        location: 'Bangkok to Home',
      },
    ],
  });

  await prisma.packageInclusion.deleteMany({ where: { packageId: pkgF3.id } });
  await prisma.packageInclusion.createMany({
    data: [
      { packageId: pkgF3.id, text: '2 Nights Phuket + 2 Nights Bangkok 4-star hotel stay with breakfast', isIncluded: true },
      { packageId: pkgF3.id, text: 'Full-day Phi Phi Island speedboat tour with buffet lunch and snorkeling mask', isIncluded: true },
      { packageId: pkgF3.id, text: 'Bangkok city and historic temples tour with English-speaking guide', isIncluded: true },
      { packageId: pkgF3.id, text: 'All airport and hotel transfers in Thailand', isIncluded: true },
      { packageId: pkgF3.id, text: 'International flights between India and Thailand (book separately)', isIncluded: false },
      { packageId: pkgF3.id, text: 'Domestic flight between Phuket and Bangkok (approx ₹3,500)', isIncluded: false },
      { packageId: pkgF3.id, text: 'National Park fee for Phi Phi Island (THB 400 paid directly in cash on island)', isIncluded: false },
      { packageId: pkgF3.id, text: 'Overseas travel health insurance and personal expenses', isIncluded: false },
    ],
  });

  console.log('✅ Devotional & Foreign Trips seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
