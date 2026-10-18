import { prisma } from '../src/lib/prisma';
import { ListingStatus, ApprovalStatus } from '@prisma/client';

const EXTRA_5_PACKAGES = [
  {
    name: 'Bangkok Grand Palace & Phuket Phi Phi Island Luxury Escape',
    slugBase: 'bangkok-grand-palace-phuket-phi-phi-island-luxury-escape',
    destinationName: 'Bangkok & Phuket',
    destinationState: 'Central & Southern Thailand',
    destinationCountry: 'Thailand',
    categoryName: 'Foreign Trips',
    state: 'Southern Thailand',
    city: 'Phuket & Bangkok',
    durationDays: 6,
    durationNights: 5,
    maxGroupSize: 12,
    basePrice: 49500,
    discountPercent: 10,
    rating: 4.9,
    reviewCount: 38,
    bookingCount: 54,
    isFeatured: true,
    description: 'Immerse yourself in the ultimate Thai adventure combining the cultural grandeur of Bangkok and the tropical paradise of Phuket. Explore golden temples, cruise the Chao Phraya River, speedboat across crystal-clear waters to Phi Phi and Maya Bay, and unwind at 4-star beachfront resort suites.',
    highlights: [
      'Bangkok Grand Palace & Emerald Buddha guided heritage tour',
      'Chao Phraya Princess luxury dinner cruise with live entertainment',
      'Full-day speedboat excursion to Phi Phi Don, Phi Phi Leh & Maya Bay',
      'Snorkeling with marine life at Coral Island and lagoon swimming at Pileh Lagoon',
      'Scenic viewpoint visit at Promthep Cape and Big Buddha hill in Phuket',
    ],
    tags: ['thailand', 'bangkok', 'phuket', 'islands', 'international', 'beach', 'cruise'],
    images: [
      'https://images.unsplash.com/photo-1508009603885-50cf7c579365?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1528181304800-259b08848526?auto=format&fit=crop&w=1200&q=80',
    ],
    inclusions: [
      '2 nights in Bangkok 4-star hotel & 3 nights in Phuket beachfront resort',
      'Daily international buffet breakfasts and select authentic Thai dinners',
      'Domestic flight ticket Bangkok (BKK/DMK) to Phuket (HKT) with 20kg baggage',
      'Speedboat transfer to Phi Phi Islands, national park entrance fees, and snorkeling gear',
      'Private air-conditioned airport and sightseeing transfers throughout Thailand',
    ],
    exclusions: [
      'International flights between India and Thailand',
      'Thailand Visa fees / Fast-track immigration service (if applicable)',
      'Personal water sports (jet skiing, parasailing at Patong Beach)',
    ],
    itinerary: [
      {
        day: 1,
        title: 'Arrival in Bangkok & Chao Phraya Dinner Cruise',
        description: 'Arrive at Bangkok Suvarnabhumi Airport. Private transfer to your hotel. In the evening, embark on a luxury illuminated dinner cruise along the Chao Phraya River featuring live music and international buffet.',
        activities: ['Airport pickup', 'Hotel check-in', 'Chao Phraya dinner cruise', 'Wat Arun night photography'],
        meals: ['Dinner'],
        accommodation: 'Riverside 4-Star Hotel, Bangkok',
        location: 'Bangkok',
      },
      {
        day: 2,
        title: 'Bangkok Grand Palace, Wat Pho & Gems Gallery',
        description: 'Guided tour of the spectacular Grand Palace complex and Wat Phra Kaew (Emerald Buddha). Visit Wat Pho to marvel at the 46-meter Reclining Buddha, followed by traditional Thai silk and gems gallery.',
        activities: ['Grand Palace tour', 'Emerald Buddha visit', 'Wat Pho reclining Buddha', 'Gems gallery visit'],
        meals: ['Breakfast', 'Lunch'],
        accommodation: 'Riverside 4-Star Hotel, Bangkok',
        location: 'Bangkok',
      },
      {
        day: 3,
        title: 'Fly to Phuket & Sunset at Promthep Cape',
        description: 'After breakfast, transfer to airport for a scenic flight to Phuket. Check in to your beach resort. In the late afternoon, drive to Promthep Cape for panoramic sunset views over the Andaman Sea.',
        activities: ['Domestic flight to Phuket', 'Beach resort check-in', 'Promthep Cape sunset', 'Patong Night Market stroll'],
        meals: ['Breakfast'],
        accommodation: 'Andaman Sea Beach Resort, Phuket',
        location: 'Phuket',
      },
      {
        day: 4,
        title: 'Phi Phi Islands & Maya Bay Speedboat Odyssey',
        description: 'Full-day premium speedboat tour to Phi Phi Islands. Snorkel in turquoise waters at Pileh Lagoon, visit the legendary Maya Bay (from "The Beach"), observe Viking Cave, and enjoy a seaside lunch buffet.',
        activities: ['Speedboat cruise', 'Maya Bay sightseeing', 'Pileh Lagoon swimming', 'Snorkeling session', 'Beach relaxation'],
        meals: ['Breakfast', 'Lunch'],
        accommodation: 'Andaman Sea Beach Resort, Phuket',
        location: 'Phi Phi Islands & Phuket',
      },
      {
        day: 5,
        title: 'Phuket Big Buddha, Wat Chalong & Old Town Stroll',
        description: 'Explore the cultural landmarks of Phuket including the 45-meter alabaster Big Buddha, historic Wat Chalong temple, and colorful Sino-Portuguese colonial architecture in Phuket Old Town.',
        activities: ['Big Buddha viewpoint', 'Wat Chalong blessing', 'Old Phuket Town heritage walk', 'Local cashew nut factory visit'],
        meals: ['Breakfast', 'Dinner'],
        accommodation: 'Andaman Sea Beach Resort, Phuket',
        location: 'Phuket',
      },
      {
        day: 6,
        title: 'Leisure Morning & Departure from Phuket',
        description: 'Savor a leisurely breakfast by the pool and indulge in a final tropical swim or souvenir shopping before your private chauffeur transfers you to Phuket International Airport for your flight home.',
        activities: ['Buffet breakfast', 'Souvenir shopping', 'Airport transfer', 'Departure'],
        meals: ['Breakfast'],
        accommodation: 'Departure',
        location: 'Phuket Airport',
      },
    ],
  },

  {
    name: 'Munnar Misty Hills, Tea Plantations & Eravikulam Wilderness',
    slugBase: 'munnar-misty-hills-tea-plantations-eravikulam-wilderness',
    destinationName: 'Munnar',
    destinationState: 'Kerala',
    destinationCountry: 'India',
    categoryName: 'Tour Packages',
    state: 'Kerala',
    city: 'Munnar',
    durationDays: 4,
    durationNights: 3,
    maxGroupSize: 10,
    basePrice: 16500,
    discountPercent: 10,
    rating: 4.8,
    reviewCount: 32,
    bookingCount: 47,
    isFeatured: true,
    description: 'Breathe in the rejuvenating aroma of sprawling emerald tea gardens in Munnar. Unwind in colonial mountain-view chalets, take exhilarating wildlife safaris in Eravikulam National Park, cruise the calm waters of Mattupetty Dam, and discover organic spices at heritage plantation estates.',
    highlights: [
      'Eravikulam National Park wildlife safari to spot the endangered Nilgiri Tahr',
      'Guided Tata Tea Museum tour with artisanal tea tasting session',
      'Speedboating at Mattupetty Dam lake and echo point excursion',
      'Kolukkumalai sunrise 4x4 Jeep trail to the worlds highest organic tea estate',
      'Organic spice garden walking tour with medicinal plant masterclass',
    ],
    tags: ['munnar', 'kerala', 'teagardens', 'nature', 'hills', 'wildlife', 'honeymoon'],
    images: [
      'https://images.unsplash.com/photo-1593693397690-362cb9666fc2?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=1200&q=80',
    ],
    inclusions: [
      '3 nights stay in 4-star luxury tea estate mountain-view resort',
      'Daily gourmet breakfast and authentic Kerala dinners with organic produce',
      'Private air-conditioned sedan/SUV with experienced hill-station driver for all 4 days',
      'Eravikulam National Park safari entry ticket & Tata Tea Museum entry',
      'Mattupetty Dam boat ride tickets and spice garden guided tour',
    ],
    exclusions: [
      'Transport to/from Kochi Airport/Railway station (available on request)',
      'Personal laundry, beverages, and spa therapies',
      'Jeep hire charges for off-road Kolukkumalai sunrise safari',
    ],
    itinerary: [
      {
        day: 1,
        title: 'Scenic Drive to Munnar & Cheeyappara Waterfalls',
        description: 'Drive along winding mountain roads flanked by rubber plantations and pine forests. Stop at Cheeyappara and Valara waterfalls. Check in to your tea-plantation resort and enjoy a welcome cardamom tea.',
        activities: ['Hill drive', 'Waterfall photo stops', 'Resort check-in', 'Tea garden stroll'],
        meals: ['Dinner'],
        accommodation: 'Tea County Heritage Resort, Munnar',
        location: 'Munnar',
      },
      {
        day: 2,
        title: 'Eravikulam National Park & Tea Museum Tour',
        description: 'Morning wildlife drive into Eravikulam National Park to witness the Nilgiri Tahr against the backdrop of Anamudi Peak. Afternoon visit to the Tata Tea Museum to observe vintage tea-making machinery.',
        activities: ['Eravikulam safari', 'Nilgiri Tahr spotting', 'Tea Museum walkthrough', 'Tea leaf tasting'],
        meals: ['Breakfast', 'Dinner'],
        accommodation: 'Tea County Heritage Resort, Munnar',
        location: 'Eravikulam & Munnar',
      },
      {
        day: 3,
        title: 'Mattupetty Lake, Echo Point & Spice Plantation',
        description: 'Visit Mattupetty Dam for serene lake views and optional speedboating. Shout into the valleys at Echo Point, admire Kundala dam lake, and finish with a fragrant spice plantation walk.',
        activities: ['Mattupetty speedboating', 'Echo Point visit', 'Kundala arch dam', 'Organic spice garden tour'],
        meals: ['Breakfast', 'Dinner'],
        accommodation: 'Tea County Heritage Resort, Munnar',
        location: 'Mattupetty & Kundala',
      },
      {
        day: 4,
        title: 'Pothamedu Viewpoint & Return Departure',
        description: 'Early morning photo session at Pothamedu Viewpoint overlooking mist-blanketed valleys. Savor your farewell breakfast before checking out and heading towards Kochi for your onward journey.',
        activities: ['Pothamedu sunrise view', 'Breakfast', 'Souvenir tea shopping', 'Check-out & departure'],
        meals: ['Breakfast'],
        accommodation: 'Departure',
        location: 'Munnar',
      },
    ],
  },

  {
    name: 'Rameswaram Jyotirlinga, Dhanushkodi Ghost Town & Madurai Meenakshi Yatra',
    slugBase: 'rameswaram-jyotirlinga-dhanushkodi-madurai-meenakshi-yatra',
    destinationName: 'Rameswaram',
    destinationState: 'Tamil Nadu',
    destinationCountry: 'India',
    categoryName: 'Devotional Trips',
    state: 'Tamil Nadu',
    city: 'Rameswaram & Madurai',
    durationDays: 3,
    durationNights: 2,
    maxGroupSize: 15,
    basePrice: 11500,
    discountPercent: 10,
    rating: 4.9,
    reviewCount: 44,
    bookingCount: 68,
    isFeatured: true,
    description: 'Undertake a deeply spiritual pilgrimage across the holy shrines of Tamil Nadu. Receive blessings at Madurai Meenakshi Amman Temple, cross the legendary Pamban Sea Bridge, take sacred holy baths at the 22 Teerthams of Ramanathaswamy Jyotirlinga, and visit the mystical tip of India at Dhanushkodi Ram Setu.',
    highlights: [
      'VIP special darshan at the sacred Madurai Meenakshi Amman Temple',
      'Scenic journey across the iconic Pamban Sea Bridge over the Indian Ocean',
      'Sacred bath in Agni Theertham and 22 temple well wells inside Ramanathaswamy Temple',
      '4x4 Jeep excursion to Dhanushkodi ghost town and legendary Ram Setu (Adams Bridge) point',
      'Visit to Dr. A.P.J. Abdul Kalam National Memorial and Kothandaramaswamy Temple',
    ],
    tags: ['pilgrimage', 'spiritual', 'jyotirlinga', 'rameswaram', 'madurai', 'temple', 'southindia'],
    images: [
      'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1609137144813-7d9921338f24?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=1200&q=80',
    ],
    inclusions: [
      '1 night in Madurai 4-star hotel & 1 night in Rameswaram beachfront pilgrim hotel',
      'Daily traditional South Indian vegetarian breakfast and temple sattvic dinners',
      'Private air-conditioned vehicle for all transfers between Madurai and Rameswaram',
      'Assisted ritual bathing guide for 22 sacred Teerthams in Ramanathaswamy Temple',
      'Dhanushkodi off-road beach jeep permit and Pamban Bridge viewing stop',
    ],
    exclusions: [
      'Personal pooja offerings, special archanai tickets, and priest dakshina',
      'Train or flight tickets to/from Madurai',
      'Camera and electronic locker fees at temple premises',
    ],
    itinerary: [
      {
        day: 1,
        title: 'Arrival in Madurai & Meenakshi Amman Special Darshan',
        description: 'Assemble in Madurai. Check in to hotel. In the afternoon, visit the architectural wonder of Thirumalai Nayakkar Palace. In the evening, enter the sacred Meenakshi Amman Temple for special darshan and witness the night palanquin procession ceremony.',
        activities: ['Madurai arrival', 'Thirumalai Nayakkar Palace', 'Meenakshi Amman Temple darshan', 'Night ceremony'],
        meals: ['Dinner'],
        accommodation: 'Heritage Hotel Madurai',
        location: 'Madurai',
      },
      {
        day: 2,
        title: 'Pamban Sea Bridge Drive & Rameswaram Ramanathaswamy Darshan',
        description: 'Morning drive to Rameswaram across the engineering marvel Pamban Sea Bridge. Check in to hotel. Head to Agni Theertham for sea bath, followed by holy bath at all 22 inner temple wells. Experience evening Jyotirlinga darshan.',
        activities: ['Pamban Bridge drive', 'Agni Theertham bath', '22 Theertham snanam', 'Ramanathaswamy Jyotirlinga darshan'],
        meals: ['Breakfast', 'Dinner'],
        accommodation: 'Daiwik Hotel Rameswaram',
        location: 'Rameswaram',
      },
      {
        day: 3,
        title: 'Dhanushkodi Ram Setu Point & Dr. Kalam Memorial',
        description: 'Early morning expedition to the edge of the Indian peninsula at Dhanushkodi. See the submerged church ruins and Ram Setu sandbanks where the Indian Ocean meets the Bay of Bengal. Visit Dr. APJ Abdul Kalam Memorial before returning to Madurai.',
        activities: ['Dhanushkodi beach safari', 'Ram Setu viewpoint', 'Submerged ruins tour', 'Kalam Memorial visit', 'Return to Madurai'],
        meals: ['Breakfast'],
        accommodation: 'Departure',
        location: 'Dhanushkodi & Madurai',
      },
    ],
  },

  {
    name: 'Leh Ladakh High-Pass Expedition, Nubra Valley & Pangong Tso Lake',
    slugBase: 'leh-ladakh-high-pass-expedition-nubra-valley-pangong-tso',
    destinationName: 'Ladakh',
    destinationState: 'Ladakh (UT)',
    destinationCountry: 'India',
    categoryName: 'Adventures',
    state: 'Ladakh',
    city: 'Leh, Nubra & Pangong',
    durationDays: 6,
    durationNights: 5,
    maxGroupSize: 12,
    basePrice: 28000,
    discountPercent: 10,
    rating: 4.9,
    reviewCount: 52,
    bookingCount: 71,
    isFeatured: true,
    description: 'Conquer the majestic roof of the world on an epic high-altitude Himalayan road expedition. Traverse Khardung La pass at 17,982 ft, ride double-humped Bactrian camels among white sand dunes in Nubra Valley, camp beneath milky way stars beside changing shades of Pangong Tso, and experience Tibetan Buddhist monastery chants.',
    highlights: [
      'Cross Khardung La (17,982 ft) — one of the worlds highest motorable mountain passes',
      'Overnight glamping at the surreal blue waters of Pangong Tso Lake',
      'Double-humped camel safari across the alpine sand dunes of Hunder in Nubra Valley',
      'Spiritual visit to ancient Diskit Monastery and 106-foot Maitreya Buddha statue',
      'Leh Palace, Shanti Stupa sunset panoramic views, and Magnetic Hill phenomenon',
    ],
    tags: ['ladakh', 'leh', 'adventure', 'pangong', 'nubra', 'himalayas', 'biking', 'mountains'],
    images: [
      'https://images.unsplash.com/photo-1581793745862-99fde7fa73d2?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80',
    ],
    inclusions: [
      '3 nights in Leh premium hotel, 1 night in Nubra Swiss cottage camp, 1 night in Pangong luxury tent',
      'Daily breakfast and hot multi-course buffet dinners suitable for high altitude',
      'Dedicated 4x4 / tempo traveler vehicle with experienced high-altitude Himalayan driver',
      'Inner Line Permits (ILP) and Ladakh wildlife & ecological conservation fees',
      'Emergency oxygen cylinder and first-aid medical support in all vehicles',
    ],
    exclusions: [
      'Flights to/from Leh Kushok Bakula Rimpochee Airport (IXL)',
      'Bactrian camel ride charges in Hunder dunes & ATV rides',
      'Personal winter down jackets or extreme weather thermal equipment',
    ],
    itinerary: [
      {
        day: 1,
        title: 'Arrival in Leh & Crucial High-Altitude Acclimatization',
        description: 'Fly into Leh Airport with stunning views of snow-clad Karakoram peaks. Transfer to hotel. Rest completely for the day to acclimatize to the 11,500 ft elevation. Gentle evening walk to Shanti Stupa for sunset.',
        activities: ['Airport pickup', 'Hotel check-in', 'Acclimatization rest', 'Shanti Stupa sunset walk'],
        meals: ['Dinner'],
        accommodation: 'Grand Dragon Boutique Hotel, Leh',
        location: 'Leh',
      },
      {
        day: 2,
        title: 'Leh Heritage: Hall of Fame, Magnetic Hill & Sangam Confluence',
        description: 'Visit the Indian Army Hall of Fame museum, experience the gravity-defying Magnetic Hill, stop at Gurudwara Pathar Sahib, and witness the majestic confluence of Indus and Zanskar rivers at Sangam.',
        activities: ['Hall of Fame museum', 'Magnetic Hill demonstration', 'Gurudwara Pathar Sahib', 'Indus-Zanskar confluence'],
        meals: ['Breakfast', 'Dinner'],
        accommodation: 'Grand Dragon Boutique Hotel, Leh',
        location: 'Leh & Nimmu',
      },
      {
        day: 3,
        title: 'Khardung La High Pass to Nubra Valley & Hunder Dunes',
        description: 'Ascend the winding switchbacks of Khardung La pass (17,982 ft). Descend into the picturesque Nubra Valley. Visit the giant Maitreya Buddha at Diskit Monastery and ride double-humped camels at Hunder white sand dunes.',
        activities: ['Khardung La pass crossing', 'Diskit Monastery visit', 'Hunder sand dunes', 'Camel safari', 'Campfire dinner'],
        meals: ['Breakfast', 'Dinner'],
        accommodation: 'Nubra Deluxe Swiss Camps, Hunder',
        location: 'Nubra Valley',
      },
      {
        day: 4,
        title: 'Nubra Valley to Pangong Tso via Shyok River Route',
        description: 'Drive along the rugged and dramatic Shyok river canyon road toward the world-famous Pangong Tso Lake (14,270 ft). Arrive at the dazzling 134-km long turquoise lake that changes colors throughout the afternoon. Overnight lakeside glamping.',
        activities: ['Scenic Shyok river drive', 'Pangong Lake arrival', 'Lakeside photography', 'Stargazing session'],
        meals: ['Breakfast', 'Dinner'],
        accommodation: 'Pangong Lakeview Glamping Tents, Spangmik',
        location: 'Pangong Tso',
      },
      {
        day: 5,
        title: 'Pangong Sunrise, Chang La Pass & Return to Leh',
        description: 'Witness an unforgettable golden sunrise over Pangong Lake. Journey back to Leh via the world-renowned Chang La pass (17,590 ft). Stop at historic Thiksey Monastery, modeled after the Potala Palace of Lhasa.',
        activities: ['Pangong sunrise', 'Chang La pass crossing', 'Thiksey Monastery visit', 'Leh Main Bazaar shopping'],
        meals: ['Breakfast', 'Dinner'],
        accommodation: 'Grand Dragon Boutique Hotel, Leh',
        location: 'Pangong to Leh',
      },
      {
        day: 6,
        title: 'Farewell Ladakh & Departure from Leh',
        description: 'Enjoy a warm breakfast with hot butter tea. Private transfer to Leh Airport with memories of dramatic high passes and shimmering lakes to board your onward flight.',
        activities: ['Breakfast', 'Airport drop-off', 'Departure'],
        meals: ['Breakfast'],
        accommodation: 'Departure',
        location: 'Leh Airport',
      },
    ],
  },

  {
    name: 'Ooty Queen of Hills & Coonoor Heritage Nilgiri Mountain Railway',
    slugBase: 'ooty-queen-of-hills-coonoor-heritage-nilgiri-mountain-railway',
    destinationName: 'Ooty',
    destinationState: 'Tamil Nadu',
    destinationCountry: 'India',
    categoryName: 'Tour Packages',
    state: 'Tamil Nadu',
    city: 'Ooty & Coonoor',
    durationDays: 3,
    durationNights: 2,
    maxGroupSize: 10,
    basePrice: 13000,
    discountPercent: 10,
    rating: 4.8,
    reviewCount: 29,
    bookingCount: 41,
    isFeatured: true,
    description: 'Experience the vintage colonial charm of the Nilgiris in Ooty and Coonoor. Ride the historic UNESCO World Heritage Nilgiri Mountain Railway steam toy train, gaze out across sweeping tea valleys from Doddabetta Peak, stroll among exotic flora in botanical gardens, and taste freshly made artisanal chocolates.',
    highlights: [
      'UNESCO Nilgiri Mountain Railway heritage toy train journey from Ooty to Coonoor',
      'Panoramic 360-degree vista from Doddabetta Peak — the highest point in South India',
      'Guided walk through Government Botanical Garden and Rose Garden with 2,000+ species',
      'Sims Park and Dolphins Nose dramatic view over St. Catherines Falls in Coonoor',
      'Traditional tea factory tour with orthodox Nilgiri tea and handmade chocolate sampling',
    ],
    tags: ['ooty', 'nilgiris', 'toytrain', 'coonoor', 'hills', 'colonial', 'southindia'],
    images: [
      'https://images.unsplash.com/photo-1589182373726-e4f658ab50f0?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80',
    ],
    inclusions: [
      '2 nights in a 4-star colonial heritage bungalow resort in Ooty',
      'Daily multi-cuisine buffet breakfast and chef-crafted dinners',
      'Confirmed reserved tickets for the UNESCO Nilgiri Mountain Railway toy train',
      'Private air-conditioned vehicle for all sightseeing transfers across Ooty and Coonoor',
      'Entry tickets to Botanical Garden, Rose Garden, and Doddabetta Peak',
    ],
    exclusions: [
      'Travel to/from Coimbatore Airport or Railway Station (available as addon)',
      'Boating fees at Ooty Lake / Pykara Lake',
      'Personal chocolate purchases and horse riding charges',
    ],
    itinerary: [
      {
        day: 1,
        title: 'Arrival in Ooty, Botanical Gardens & Ooty Lake',
        description: 'Arrive in Ooty. Check in to your colonial hill-resort amidst tall eucalyptus and pine trees. Visit the lush 55-acre Government Botanical Garden. In the evening, enjoy a peaceful sunset walk and optional pedal boating at Ooty Lake.',
        activities: ['Arrival & check-in', 'Botanical Garden visit', 'Ooty Lake sunset', 'Artisanal chocolate tasting'],
        meals: ['Dinner'],
        accommodation: 'Savoy Heritage Colonial Resort, Ooty',
        location: 'Ooty',
      },
      {
        day: 2,
        title: 'UNESCO Toy Train to Coonoor & Tea Estate Trail',
        description: 'Board the historic Nilgiri Mountain Railway toy train from Ooty to Coonoor, gliding past mist-clad viaducts and tea terraces. In Coonoor, visit Sim’s Park, Lamb’s Rock, and Dolphin’s Nose. Return to Ooty for tea factory tour.',
        activities: ['Heritage toy train ride', 'Sims Park Coonoor', 'Dolphins Nose viewpoint', 'Tea factory visit'],
        meals: ['Breakfast', 'Dinner'],
        accommodation: 'Savoy Heritage Colonial Resort, Ooty',
        location: 'Ooty & Coonoor',
      },
      {
        day: 3,
        title: 'Doddabetta Peak & Pykara Waterfalls',
        description: 'Drive up to Doddabetta Peak (8,650 ft) for sweeping views of the Nilgiri hills. Head to the pristine Pykara Lake and Pykara Waterfalls for pine forest photography before checking out for your return journey.',
        activities: ['Doddabetta Peak viewpoint', 'Pykara Lake visit', 'Pine forest walk', 'Check-out & departure'],
        meals: ['Breakfast'],
        accommodation: 'Departure',
        location: 'Ooty',
      },
    ],
  },
];

async function seedExtra5() {
  console.log('========================================================');
  console.log('SEEDING 5 EXTRA AUTHENTIC PACKAGES FOR REALKANAGARAJ');
  console.log('========================================================');

  const providerUser = await prisma.user.findFirst({
    where: { email: 'realkanagaraj@gmail.com' },
    include: { providerProfile: true },
  });

  if (!providerUser || !providerUser.providerProfile) {
    throw new Error('Provider account realkanagaraj@gmail.com not found!');
  }

  const provider = providerUser.providerProfile;
  console.log(`Provider: "${provider.businessName}" (${provider.id})`);

  // Pre-load categories and destinations
  const categories = await prisma.category.findMany();
  const categoryMap = new Map(categories.map((c) => [c.name.toLowerCase(), c.id]));
  const categorySlugMap = new Map(categories.map((c) => [c.slug.toLowerCase(), c.id]));

  const destinations = await prisma.destination.findMany();
  const destinationMap = new Map(destinations.map((d) => [d.name.toLowerCase(), d.id]));

  let createdCount = 0;

  for (const item of EXTRA_5_PACKAGES) {
    console.log(`\nProcessing: "${item.name}"...`);

    // Match destination
    let destId = destinationMap.get(item.destinationName.toLowerCase());
    if (!destId) {
      const matched = destinations.find((d) =>
        d.name.toLowerCase().includes(item.destinationName.toLowerCase()) ||
        item.destinationName.toLowerCase().includes(d.name.toLowerCase())
      );
      if (matched) destId = matched.id;
    }

    if (!destId) {
      console.log(`Creating missing destination: "${item.destinationName}"`);
      const newDest = await prisma.destination.create({
        data: {
          slug: item.destinationName.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          name: item.destinationName,
          state: item.destinationState,
          country: item.destinationCountry,
          description: `Experience the breathtaking beauty, historic wonders, and cultural charm of ${item.destinationName}.`,
          heroImage: item.images[0],
          images: item.images,
          bestTimeToVisit: 'October to May',
          isPopular: true,
          isTrending: true,
          packageCount: 1,
        },
      });
      destId = newDest.id;
      destinationMap.set(item.destinationName.toLowerCase(), destId);
    }

    // Match category
    let catId = categoryMap.get(item.categoryName.toLowerCase());
    if (!catId) catId = categorySlugMap.get(item.categoryName.toLowerCase());
    if (!catId) {
      const catAliases: Record<string, string> = {
        'tour packages': 'tour',
        'devotional trips': 'devotional',
        'foreign trips': 'foreign',
        'adventures': 'adventure',
      };
      const slug = catAliases[item.categoryName.toLowerCase()];
      if (slug) catId = categorySlugMap.get(slug);
    }
    if (!catId) catId = categories[0].id;

    const finalPrice = Math.round(item.basePrice - (item.basePrice * item.discountPercent) / 100);
    const slug = `${item.slugBase}-${Date.now().toString().slice(-4)}`;

    // Check if package already exists
    const existing = await prisma.package.findFirst({
      where: {
        providerId: provider.id,
        name: item.name,
      },
    });

    let pkgId: string;

    if (existing) {
      console.log(`Updating existing package: ${existing.id}`);
      await prisma.package.update({
        where: { id: existing.id },
        data: {
          categoryId: catId,
          destinationId: destId,
          description: item.description,
          highlights: item.highlights,
          state: item.state,
          city: item.city,
          durationDays: item.durationDays,
          durationNights: item.durationNights,
          maxGroupSize: item.maxGroupSize,
          basePrice: item.basePrice,
          discountPercent: item.discountPercent,
          finalPrice,
          currency: 'INR',
          status: ListingStatus.PUBLISHED,
          approvalStatus: ApprovalStatus.APPROVED,
          isActive: true,
          isFeatured: item.isFeatured,
          tags: item.tags,
          rating: item.rating,
          reviewCount: item.reviewCount,
          bookingCount: item.bookingCount,
        },
      });
      pkgId = existing.id;
    } else {
      console.log(`Creating new package: ${slug}`);
      const created = await prisma.package.create({
        data: {
          slug,
          providerId: provider.id,
          categoryId: catId,
          destinationId: destId,
          name: item.name,
          description: item.description,
          highlights: item.highlights,
          state: item.state,
          city: item.city,
          durationDays: item.durationDays,
          durationNights: item.durationNights,
          maxGroupSize: item.maxGroupSize,
          basePrice: item.basePrice,
          discountPercent: item.discountPercent,
          finalPrice,
          currency: 'INR',
          status: ListingStatus.PUBLISHED,
          approvalStatus: ApprovalStatus.APPROVED,
          isActive: true,
          isFeatured: item.isFeatured,
          tags: item.tags,
          rating: item.rating,
          reviewCount: item.reviewCount,
          bookingCount: item.bookingCount,
        },
      });
      pkgId = created.id;
    }

    // Replace images
    await prisma.packageImage.deleteMany({ where: { packageId: pkgId } });
    await prisma.packageImage.createMany({
      data: item.images.map((url, idx) => ({
        packageId: pkgId,
        url,
        sortOrder: idx,
        isCover: idx === 0,
      })),
    });

    // Replace inclusions
    await prisma.packageInclusion.deleteMany({ where: { packageId: pkgId } });
    await prisma.packageInclusion.createMany({
      data: [
        ...item.inclusions.map((text) => ({ packageId: pkgId, text, isIncluded: true })),
        ...item.exclusions.map((text) => ({ packageId: pkgId, text, isIncluded: false })),
      ],
    });

    // Replace itinerary days
    await prisma.itineraryDay.deleteMany({ where: { packageId: pkgId } });
    await prisma.itineraryDay.createMany({
      data: item.itinerary.map((it) => ({
        packageId: pkgId,
        day: it.day,
        title: it.title,
        description: it.description,
        activities: it.activities,
        meals: it.meals,
        accommodation: it.accommodation,
        location: it.location,
      })),
    });

    // Generate 8 upcoming bookable dates
    await prisma.packageAvailability.deleteMany({ where: { packageId: pkgId } });
    const datesData = [];
    const baseDate = new Date();
    for (let d = 1; d <= 8; d++) {
      const departureDate = new Date(baseDate);
      departureDate.setDate(departureDate.getDate() + d * 5);
      datesData.push({
        packageId: pkgId,
        date: departureDate,
        price: finalPrice,
        capacity: item.maxGroupSize,
        bookedCount: Math.min(2, Math.floor(item.maxGroupSize / 3)),
        isAvailable: true,
      });
    }
    await prisma.packageAvailability.createMany({ data: datesData });

    createdCount++;
    console.log(`✓ Completed: "${item.name}"`);
  }

  // Sync totalPackages on ProviderProfile
  const totalInDb = await prisma.package.count({
    where: { providerId: provider.id },
  });

  await prisma.providerProfile.update({
    where: { id: provider.id },
    data: { totalPackages: totalInDb },
  });

  // Sync packageCount on all destinations
  const allDestinations = await prisma.destination.findMany();
  for (const d of allDestinations) {
    const count = await prisma.package.count({
      where: {
        destinationId: d.id,
        status: ListingStatus.PUBLISHED,
        approvalStatus: ApprovalStatus.APPROVED,
        isActive: true,
      },
    });
    await prisma.destination.update({
      where: { id: d.id },
      data: { packageCount: count },
    });
  }

  console.log(`\n========================================================`);
  console.log(`Successfully added ${createdCount} extra packages!`);
  console.log(`Total packages under realkanagaraj@gmail.com: ${totalInDb}`);
  console.log(`========================================================`);
}

seedExtra5()
  .catch((e) => {
    console.error('Failed to seed extra 5 packages:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
