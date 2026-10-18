import { prisma } from '../src/lib/prisma';
import { ListingStatus, ApprovalStatus } from '@prisma/client';

const PACKAGES_DATA = [
  {
    name: 'Solang Valley & Rohtang Pass Alpine Snow Expedition',
    slugBase: 'solang-valley-rohtang-pass-alpine-expedition',
    destinationName: 'Manali',
    categoryName: 'Tour Packages',
    state: 'Himachal Pradesh',
    city: 'Manali',
    durationDays: 5,
    durationNights: 4,
    maxGroupSize: 12,
    basePrice: 18500,
    discountPercent: 10,
    rating: 4.9,
    reviewCount: 28,
    bookingCount: 42,
    isFeatured: true,
    description: 'Embark on an unforgettable Himalayan escape through pine-scented valleys in Manali. Experience thrilling snow activities at Solang Valley and Rohtang Pass, stroll through heritage Old Manali cafes, relax in luxury heated river-view wooden chalets, and rejuvenate at Vashisht natural hot sulfur springs.',
    highlights: [
      'Rohtang Pass high-altitude snow excursion at 13,058 feet',
      'Tandem paragliding and zorbing at Solang Valley with certified pilots',
      '4-star luxury heated pine chalets overlooking the Beas River',
      'Guided scenic trek to Jogini Waterfalls and heritage Vashisht hot springs',
      'Naggar Castle heritage tour and authentic Himachali Dham dinner'
    ],
    tags: ['snow', 'adventure', 'himalayas', 'manali', 'paragliding', 'mountains'],
    images: [
      'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1596761224166-31e71439996b?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=1200&q=80',
    ],
    inclusions: [
      '4 nights in 4-star boutique river-view chalets',
      'Daily buffet breakfast and multi-course chef dinner',
      'Private chauffeured 4x4 SUV for all transfers and sightseeing',
      'National Green Tribunal (NGT) Rohtang Pass travel permit and environmental fees',
      'Certified mountain trek guide and emergency medical oxygen support'
    ],
    exclusions: [
      'Airfare or train tickets to Chandigarh/Bhuntar',
      'Personal winter extreme-cold snow suit and boot rental',
      'Optional adventure rides (ATV quad biking, river crossing fees)'
    ],
    itinerary: [
      {
        day: 1,
        title: 'Arrival in Manali & Old Manali Heritage Stroll',
        description: 'Check in to your riverside chalet. Enjoy welcome drinks, followed by an afternoon walking tour through Old Manali, visiting Manu Temple and quaint bohemian artisan cafes.',
        activities: ['Hotel check-in', 'Welcome drink', 'Old Manali walk', 'Manu Temple visit'],
        meals: ['Dinner'],
        accommodation: 'Riverside Alpine Chalet',
        location: 'Old Manali'
      },
      {
        day: 2,
        title: 'Solang Valley High Adventure & Paragliding',
        description: 'Drive to Solang Valley for exhilarating outdoor pursuits. Soar over green meadows and snow ridges with tandem paragliding, try zorbing, and take the scenic Solang ropeway gondola.',
        activities: ['Solang Valley excursion', 'Tandem paragliding', 'Ropeway gondola ride'],
        meals: ['Breakfast', 'Dinner'],
        accommodation: 'Riverside Alpine Chalet',
        location: 'Solang Valley'
      },
      {
        day: 3,
        title: 'Rohtang Pass High Altitude Snow Summit',
        description: 'Early morning scenic ascent to Rohtang Pass (13,058 ft). Marvel at glaciers, pristine snowscapes, and the gateway to the remote Lahaul & Spiti valley.',
        activities: ['Rohtang Pass drive', 'Snow walking & photography', 'Atal Tunnel traverse'],
        meals: ['Breakfast', 'Dinner'],
        accommodation: 'Riverside Alpine Chalet',
        location: 'Rohtang Pass'
      },
      {
        day: 4,
        title: 'Naggar Castle & Traditional Himachali Feast',
        description: 'Explore the ancient wood-and-stone architectural marvel of Naggar Castle, visit the Nicholas Roerich Art Gallery, and savor a traditional 7-course Himachali Dham.',
        activities: ['Naggar Castle tour', 'Art gallery visit', 'Himachali Dham lunch'],
        meals: ['Breakfast', 'Dinner'],
        accommodation: 'Riverside Alpine Chalet',
        location: 'Naggar'
      },
      {
        day: 5,
        title: 'Jogini Waterfalls Walk & Departure',
        description: 'A refreshing morning nature hike through apple orchards to Jogini Waterfalls, followed by a warm dip at Vashisht hot springs before your departure transfer.',
        activities: ['Jogini Waterfall hike', 'Vashisht hot springs', 'Departure transfer'],
        meals: ['Breakfast'],
        accommodation: 'Check-out',
        location: 'Vashisht'
      }
    ]
  },
  {
    name: 'South Goa Coastal Serenity & Private Luxury Yacht Retreat',
    slugBase: 'south-goa-coastal-serenity-private-yacht-retreat',
    destinationName: 'Goa',
    categoryName: 'Tour Packages',
    state: 'Goa',
    city: 'South Goa',
    durationDays: 4,
    durationNights: 3,
    maxGroupSize: 8,
    basePrice: 24000,
    discountPercent: 15,
    rating: 4.8,
    reviewCount: 34,
    bookingCount: 56,
    isFeatured: true,
    description: 'Experience Goa beyond the ordinary with five-star beachfront luxury. Relish a private 3-hour sunset catamaran yacht cruise on the Arabian Sea, explore pastel-painted Portuguese heritage mansions in Fontainhas, and unwind on secluded white sands of Palolem and Cavelossim.',
    highlights: [
      '3-hour private luxury yacht cruise along the Arabian coastline with sundowners',
      '3 nights stay at a 5-star beachfront resort in Cavelossim',
      'Private heritage walking tour of Fontainhas Latin Quarter in Panaji',
      'Watersports package including parasailing and jet-skiing at Benaulim',
      'Chef-curated candlelit beach dinner with fresh coastal seafood'
    ],
    tags: ['goa', 'beach', 'yacht', 'luxury', 'coastal', 'sunset', 'honeymoon'],
    images: [
      'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1587974928442-77dc3e0dba72?auto=format&fit=crop&w=1200&q=80',
    ],
    inclusions: [
      '3 nights in 5-star beachfront luxury suite',
      'Daily lavish buffet breakfast and one candlelit beach dinner',
      'Exclusive private 3-hour sunset catamaran yacht charter',
      'Private AC premium sedan for all airport and sightseeing transfers',
      'Heritage guide for Fontainhas and Old Goa churches'
    ],
    exclusions: [
      'Flight tickets to Dabolim or Mopa airport',
      'Personal alcoholic beverages outside yacht charter',
      'Casino entry fees and personal shopping'
    ],
    itinerary: [
      {
        day: 1,
        title: 'Arrival in Goa & Beachfront Sunset Welcome',
        description: 'Chauffeured pickup from airport to your 5-star luxury resort. Relax by the infinity pool and enjoy a welcome cocktail as the sun dips into the Arabian Sea.',
        activities: ['Airport pickup', 'Check-in', 'Poolside relaxation', 'Welcome dinner'],
        meals: ['Dinner'],
        accommodation: '5-Star Beachfront Luxury Resort',
        location: 'Cavelossim Beach'
      },
      {
        day: 2,
        title: 'Latin Quarter Heritage & Private Sunset Yacht Charter',
        description: 'Morning walking tour of the historic Portuguese Latin Quarter Fontainhas. In the late afternoon, board your private luxury yacht from the marina for a 3-hour sunset cruise with drinks and tapas.',
        activities: ['Fontainhas walking tour', 'Old Goa heritage walk', '3-Hour Private Yacht Cruise'],
        meals: ['Breakfast', 'Dinner'],
        accommodation: '5-Star Beachfront Luxury Resort',
        location: 'Panaji Marina & Arabian Sea'
      },
      {
        day: 3,
        title: 'Palolem Beach & Thrilling Water Adventures',
        description: 'Travel south to scenic Palolem Beach. Enjoy guided parasailing and jet-ski rides, followed by an evening candlelit seafood barbecue dinner right on the soft sands.',
        activities: ['Palolem beach excursion', 'Parasailing & Jet-ski', 'Candlelit beach dinner'],
        meals: ['Breakfast', 'Dinner'],
        accommodation: '5-Star Beachfront Luxury Resort',
        location: 'Palolem Beach'
      },
      {
        day: 4,
        title: 'Leisure Morning & Airport Departure',
        description: 'Enjoy a leisurely breakfast and optional beach walk or spa massage before your comfortable airport transfer.',
        activities: ['Buffet breakfast', 'Resort spa session (optional)', 'Airport transfer'],
        meals: ['Breakfast'],
        accommodation: 'Check-out',
        location: 'South Goa'
      }
    ]
  },
  {
    name: 'Alleppey Backwaters Presidential Houseboat Cruise',
    slugBase: 'alleppey-backwaters-presidential-houseboat-cruise',
    destinationName: 'Alleppey (Alappuzha)',
    categoryName: 'Tour Packages',
    state: 'Kerala',
    city: 'Alappuzha',
    durationDays: 3,
    durationNights: 2,
    maxGroupSize: 6,
    basePrice: 21000,
    discountPercent: 10,
    rating: 4.9,
    reviewCount: 42,
    bookingCount: 65,
    isFeatured: true,
    description: 'Drift along the serene backwaters of Kerala aboard an exclusive air-conditioned Presidential Houseboat. Cruise past palm-fringed canals, paddy fields below sea level, and picturesque backwater hamlets while your personal onboard chef serves fresh Karimeen fish and traditional Kerala Sadya.',
    highlights: [
      'Exclusive AC Presidential Houseboat on Vembanad Lake & Punnamada backwaters',
      'Personal onboard chef serving all fresh traditional Kerala meals',
      'Evening guided wooden country canoe tour through narrow village waterways',
      'Sunset fishing and bird watching across emerald palm lagoons',
      'Complimentary organic spice village visit and coir-making workshop'
    ],
    tags: ['kerala', 'alleppey', 'houseboat', 'backwaters', 'romantic', 'nature'],
    images: [
      'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1593693397690-362cb9666fc2?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80',
    ],
    inclusions: [
      '2 nights stay aboard private luxury 2-bedroom AC Houseboat',
      'All meals: authentic Kerala breakfast, multi-dish lunch, high tea, and dinner',
      'Dedicated onboard crew (captain, chef, and boat attendant)',
      '1-hour country wooden canoe ride through interior canals',
      'Private AC vehicle pickup and drop from Kochi Airport/Railway station'
    ],
    exclusions: [
      'Air/Train fares to Kochi',
      'Personal Ayurvedic treatments outside complimentary session',
      'Gratuities and personal tips'
    ],
    itinerary: [
      {
        day: 1,
        title: 'Boarding in Alleppey & Vembanad Lake Cruise',
        description: 'Board your private luxury houseboat at 12:00 PM with tender coconut welcome drinks. Cruise across Punnamada Lake, witness the Nehru Trophy Snake Boat race venue, and dock at sunset.',
        activities: ['Boarding houseboat', 'Welcome coconut drink', 'Scenic cruising', 'Candlelit dinner'],
        meals: ['Lunch', 'Dinner'],
        accommodation: 'Private Presidential Houseboat',
        location: 'Vembanad Lake'
      },
      {
        day: 2,
        title: 'Interior Canals, Country Canoeing & Village Life',
        description: 'Glide into the Kuttanad region where farming is done below sea level. Transfer to an open wooden country canoe to navigate tranquil narrow canals and meet local coir weavers.',
        activities: ['Morning cruise', 'Country canoe excursion', 'Coir-making village tour', 'Sunset angling'],
        meals: ['Breakfast', 'Lunch', 'Dinner'],
        accommodation: 'Private Presidential Houseboat',
        location: 'Kuttanad Backwaters'
      },
      {
        day: 3,
        title: 'Morning Serenity & Disembarkation to Kochi',
        description: 'Wake up to the sounds of kingfishers and waterbirds. Enjoy fresh Appam and stew breakfast on the upper sundeck before checking out at 9:30 AM for transfer to Kochi.',
        activities: ['Sunrise sundeck breakfast', 'Disembarkation', 'Transfer to Kochi airport'],
        meals: ['Breakfast'],
        accommodation: 'Check-out',
        location: 'Alleppey Jetty'
      }
    ]
  },
  {
    name: 'Royal Jaipur Citadel & Maharajas Regal Heritage Trail',
    slugBase: 'royal-jaipur-citadel-maharajas-regal-trail',
    destinationName: 'Jaipur',
    categoryName: 'Tour Packages',
    state: 'Rajasthan',
    city: 'Jaipur',
    durationDays: 4,
    durationNights: 3,
    maxGroupSize: 10,
    basePrice: 16500,
    discountPercent: 12,
    rating: 4.8,
    reviewCount: 31,
    bookingCount: 49,
    isFeatured: false,
    description: 'Immerse yourself in Rajput royal grandeur across the historic Pink City of Jaipur. Tour the majestic ramparts of Amer Fort and Jaigarh, marvel at the wind windows of Hawa Mahal, stay in an authentic heritage Haveli with live Rajasthani folk music, and relish royal cuisine.',
    highlights: [
      'VIP guided access to Amer Fort, Sheesh Mahal and Jaigarh Fort',
      'Stay in an authentic heritage Haveli with royal courtyard dining',
      'Exclusive sunset tea overlooking Jaipur from Nahargarh Fort ramparts',
      'Private walking photography tour of Hawa Mahal and Jantar Mantar',
      'Traditional Rajasthani Thali culinary experience with live Kalbelia dance'
    ],
    tags: ['rajasthan', 'jaipur', 'heritage', 'palace', 'culture', 'royal'],
    images: [
      'https://images.unsplash.com/photo-1477587458883-47145ed94245?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1603288940300-4b4231b67277?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=1200&q=80',
    ],
    inclusions: [
      '3 nights stay in a restored Heritage Haveli hotel',
      'Daily breakfast and one grand royal dinner with folk performance',
      'All monument entry tickets and English-speaking licensed historian guide',
      'Air-conditioned private sedan for all transfers and city tours',
      'Complimentary block-printing workshop in Bagru'
    ],
    exclusions: [
      'Camera and video commercial photography permits',
      'Personal shopping for gems, jewelry, and textiles',
      'Lunches and additional snacks'
    ],
    itinerary: [
      {
        day: 1,
        title: 'Arrival in Jaipur & Evening Bazaar Walk',
        description: 'Chauffeured pickup from Jaipur airport/station. Check in to your heritage haveli. In the evening, take a guided stroll through Johari and Bapu Bazaars.',
        activities: ['Check-in', 'Heritage welcome drink', 'Old city bazaar walk'],
        meals: ['Dinner'],
        accommodation: 'Royal Heritage Haveli Hotel',
        location: 'Jaipur Old City'
      },
      {
        day: 2,
        title: 'Amer Fort, Sheesh Mahal & Nahargarh Sunset',
        description: 'Explore the grand hilltop Amer Fort with its mirrored Sheesh Mahal. Visit Panna Meena Ka Kund stepwell, and watch a breathtaking sunset over Jaipur from Nahargarh Fort.',
        activities: ['Amer Fort tour', 'Stepwell photography', 'Nahargarh sunset view'],
        meals: ['Breakfast', 'Dinner'],
        accommodation: 'Royal Heritage Haveli Hotel',
        location: 'Amer & Nahargarh'
      },
      {
        day: 3,
        title: 'City Palace, Hawa Mahal & Royal Observatories',
        description: 'Visit the City Palace museum complex, the astronomical instruments of UNESCO-listed Jantar Mantar, and capture memorable photos outside Hawa Mahal.',
        activities: ['City Palace guided tour', 'Jantar Mantar exploration', 'Hawa Mahal photoshoot'],
        meals: ['Breakfast'],
        accommodation: 'Royal Heritage Haveli Hotel',
        location: 'Central Jaipur'
      },
      {
        day: 4,
        title: 'Bagru Block Printing & Departure',
        description: 'Morning visit to artisan block printers in Bagru before returning for airport/station drop-off with cherished memories.',
        activities: ['Block printing workshop', 'Souvenir shopping', 'Airport departure'],
        meals: ['Breakfast'],
        accommodation: 'Check-out',
        location: 'Jaipur'
      }
    ]
  },
  {
    name: 'Varanasi Sacred Moksha, Ganga Aarti & Sarnath Pilgrimage',
    slugBase: 'varanasi-sacred-moksha-ganga-aarti-pilgrimage',
    destinationName: 'Varanasi',
    categoryName: 'Devotional Trips',
    state: 'Uttar Pradesh',
    city: 'Varanasi',
    durationDays: 3,
    durationNights: 2,
    maxGroupSize: 8,
    basePrice: 12500,
    discountPercent: 10,
    rating: 4.9,
    reviewCount: 39,
    bookingCount: 52,
    isFeatured: true,
    description: 'Immerse your soul in the world\'s oldest living holy city. Witness the spectacular evening Maha Ganga Aarti from a reserved river boat, take a silent dawn rowboat cruise across 84 historic ghats, receive special VIP Sugam Darshan at Kashi Vishwanath, and explore Sarnath.',
    highlights: [
      'Reserved front-row boat seating for evening Dashashwamedh Ghat Maha Aarti',
      'VIP Sugam Darshan at Kashi Vishwanath Jyotirlinga Corridor',
      'Mystical sunrise wooden rowboat cruise along the Ganges river ghats',
      'Guided excursion to Sarnath Dhamek Stupa and museum where Buddha gave his first sermon',
      'Banarasi silk weaving demonstration and heritage street food trail'
    ],
    tags: ['varanasi', 'devotional', 'ganga', 'spiritual', 'kashi', 'pilgrimage'],
    images: [
      'https://images.unsplash.com/photo-1561361513-2d000a50f0dc?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1571536802807-30451e3955d8?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?auto=format&fit=crop&w=1200&q=80',
    ],
    inclusions: [
      '2 nights stay in 4-star riverfront heritage boutique hotel',
      'Daily breakfast and traditional Satvik temple meals',
      'Private sunrise and evening Aarti boat rides on the Ganges',
      'VIP Kashi Vishwanath Temple pass and certified Sanskrit scholar guide',
      'AC private transportation for Sarnath and airport transfers'
    ],
    exclusions: [
      'Air/Train fares to Varanasi',
      'Personal pooja offerings (pandit dakshina)',
      'Personal silk shopping'
    ],
    itinerary: [
      {
        day: 1,
        title: 'Arrival in Kashi & Evening Maha Ganga Aarti',
        description: 'Airport pickup and check-in to your riverside heritage hotel. At dusk, board a private riverboat for an unobstructed view of the divine Dashashwamedh Maha Aarti.',
        activities: ['Hotel check-in', 'Private boat boarding', 'Maha Ganga Aarti darshan'],
        meals: ['Dinner'],
        accommodation: 'Riverside Heritage Boutique Hotel',
        location: 'Dashashwamedh Ghat'
      },
      {
        day: 2,
        title: 'Subah-e-Banaras Dawn Cruise & Kashi Vishwanath',
        description: 'Witness the morning rituals of pilgrims on a dawn rowboat cruise. Later, proceed for VIP Sugam Darshan at Shri Kashi Vishwanath Temple and Annapurna Temple.',
        activities: ['Sunrise boat cruise', 'VIP Kashi Vishwanath Darshan', 'Banarasi Silk weaver visit'],
        meals: ['Breakfast', 'Dinner'],
        accommodation: 'Riverside Heritage Boutique Hotel',
        location: 'Kashi Vishwanath Corridor'
      },
      {
        day: 3,
        title: 'Sarnath Buddhist Enlightenment & Departure',
        description: 'Morning excursion to Sarnath to see the ancient Dhamek Stupa, Ashoka Pillar, and museum. Afternoon airport drop-off.',
        activities: ['Sarnath tour', 'Dhamek Stupa', 'Airport transfer'],
        meals: ['Breakfast'],
        accommodation: 'Check-out',
        location: 'Sarnath & Varanasi Airport'
      }
    ]
  },
  {
    name: 'Rishikesh White Water Rafting, Cliff Jumping & Riverside Camp',
    slugBase: 'rishikesh-white-water-rafting-cliff-jump-camp',
    destinationName: 'Rishikesh & Haridwar',
    categoryName: 'Adventures',
    state: 'Uttarakhand',
    city: 'Rishikesh',
    durationDays: 3,
    durationNights: 2,
    maxGroupSize: 14,
    basePrice: 9500,
    discountPercent: 10,
    rating: 4.8,
    reviewCount: 46,
    bookingCount: 78,
    isFeatured: false,
    description: 'Get your adrenaline pumping in India\'s outdoor adventure capital. Conquer thrilling Grade III and IV rapids from Marine Drive to NIM Beach, brave the iconic 25-foot cliff jump, practice dawn yoga on white sand riverbanks, and stargaze by a crackling campfire at our eco-resort.',
    highlights: [
      '16 km thrilling white water rafting through Three Blind Mice & Roller Coaster',
      '25-foot cliff jumping and body surfing under expert river guides',
      'Riverside luxury dome camping with attached modern washrooms',
      'Evening bonfire with acoustic guitar session & barbecue',
      'Morning Himalayan Hatha Yoga and meditation workshop'
    ],
    tags: ['rishikesh', 'adventure', 'rafting', 'camping', 'yoga', 'ganges'],
    images: [
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1506197603052-3cc9c3a201bd?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1545205597-3d9d02c29597?auto=format&fit=crop&w=1200&q=80',
    ],
    inclusions: [
      '2 nights stay in luxury riverside dome tents with attached bathrooms',
      'All meals: 2 breakfasts, 2 lunches, 2 barbecue dinners',
      'Complete 16 km white water rafting with certified river safety marshals',
      'Cliff jumping, body surfing, and life jacket safety gear',
      'Evening campfire and morning yoga session'
    ],
    exclusions: [
      'Bungee jumping and giant swing fees at Mohanchatti (optional add-on)',
      'Transport to/from Dehradun airport or Haridwar railway station',
      'Personal adventure action camera rentals'
    ],
    itinerary: [
      {
        day: 1,
        title: 'Check-in to Riverside Camp & Sunset Beach Volleyball',
        description: 'Arrive at the scenic river camp in Shivpuri. Settle into your luxury dome tent, play beach volleyball by the Ganges, and enjoy an evening barbecue campfire.',
        activities: ['Camp check-in', 'River bank stroll', 'Campfire & live music'],
        meals: ['Lunch', 'Dinner'],
        accommodation: 'Riverside Luxury Dome Tent',
        location: 'Shivpuri, Rishikesh'
      },
      {
        day: 2,
        title: '16 km White Water Rafting & 25-Foot Cliff Jump',
        description: 'Gear up with helmets and life jackets for a heart-pounding 16 km rafting expedition through rapids like Roller Coaster, Golf Course, and Clubhouse. Stop for the 25-foot cliff jump.',
        activities: ['White water rafting', '25ft cliff jump', 'Body surfing', 'Evening Ganga Aarti at Triveni Ghat'],
        meals: ['Breakfast', 'Lunch', 'Dinner'],
        accommodation: 'Riverside Luxury Dome Tent',
        location: 'Marine Drive to NIM Beach'
      },
      {
        day: 3,
        title: 'Sunrise Riverfront Yoga & Departure',
        description: 'Start your morning with a rejuvenating 60-minute Hatha Yoga and Pranayama session right on the white sand banks. Savor a wholesome breakfast before check-out.',
        activities: ['Sunrise yoga & meditation', 'Breakfast buffet', 'Departure'],
        meals: ['Breakfast'],
        accommodation: 'Check-out',
        location: 'Shivpuri'
      }
    ]
  },
  {
    name: 'Tirupati Balaji VIP Quick Darshan & Srikalahasti Divine Yatra',
    slugBase: 'tirupati-balaji-vip-quick-darshan-yatra',
    destinationName: 'Tirupati',
    categoryName: 'Devotional Trips',
    state: 'Andhra Pradesh',
    city: 'Tirupati',
    durationDays: 2,
    durationNights: 1,
    maxGroupSize: 8,
    basePrice: 9000,
    discountPercent: 5,
    rating: 4.9,
    reviewCount: 51,
    bookingCount: 88,
    isFeatured: false,
    description: 'Complete your sacred pilgrimage to Lord Venkateswara on the divine seven hills of Tirumala with total peace of mind. Benefit from confirmed VIP Special Entry Darshan, experienced pilgrim assistance, comfortable AC transport, and visits to Srikalahasti Temple.',
    highlights: [
      'Pre-booked confirmed VIP Special Entry Darshan (SED) at Tirumala Temple',
      'Personal pilgrim assistant guiding through the complex and prasad collection',
      'Visit to historic Srikalahasti Temple (famous Vayu Linga & Rahu-Ketu Kshetra)',
      'Overnight stay at a 4-star hotel in Tirupati foothills with Satvik meals',
      'Darshan at Sri Padmavathi Ammavari Temple in Tiruchanur'
    ],
    tags: ['tirupati', 'balaji', 'devotional', 'pilgrimage', 'darshan', 'south-india'],
    images: [
      'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1609766857041-ed402ea8069a?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1621847468516-1ed5d0df56fe?auto=format&fit=crop&w=1200&q=80',
    ],
    inclusions: [
      '1 night stay in 4-star deluxe AC hotel in Tirupati',
      'VIP Special Entry Darshan ticket for Lord Venkateswara with Laddoo Prasadam',
      'Dedicated temple guide handling line logistics',
      'Private air-conditioned car for Tirumala hill transfers and Srikalahasti',
      'Pure vegetarian traditional South Indian Satvik meals'
    ],
    exclusions: [
      'Personal seva tickets or tonsure fee',
      'Travel tickets to/from Chennai/Bangalore/Tirupati airport',
      'Personal shopping and offerings'
    ],
    itinerary: [
      {
        day: 1,
        title: 'Arrival in Tirupati & Srikalahasti Temple Darshan',
        description: 'Arrival at Tirupati station/airport. Check into your hotel. Afternoon drive to Srikalahasti Temple to seek the blessings of Lord Shiva (Vayu Linga) and Padmavathi Temple.',
        activities: ['Hotel check-in', 'Srikalahasti Temple visit', 'Padmavathi Temple darshan'],
        meals: ['Dinner'],
        accommodation: '4-Star Deluxe Hotel Tirupati',
        location: 'Tirupati & Srikalahasti'
      },
      {
        day: 2,
        title: 'Tirumala Hill Ascent & VIP Balaji Darshan',
        description: 'Early morning scenic ascent to Tirumala hills. Enter through the VIP Special Entry queue for divine darshan of Sri Venkateswara Swamy. Receive sacred Tirupati Laddoo prasadam before departure.',
        activities: ['Tirumala hill drive', 'VIP Balaji Darshan', 'Prasadam collection', 'Departure drop-off'],
        meals: ['Breakfast'],
        accommodation: 'Check-out',
        location: 'Tirumala'
      }
    ]
  },
  {
    name: 'Sonamarg Meadow of Gold & Thajiwas Glacier Snow Trek',
    slugBase: 'sonamarg-meadow-of-gold-thajiwas-glacier-trek',
    destinationName: 'Sonamarg',
    categoryName: 'Tour Packages',
    state: 'Jammu and Kashmir',
    city: 'Sonamarg',
    durationDays: 5,
    durationNights: 4,
    maxGroupSize: 10,
    basePrice: 29500,
    discountPercent: 15,
    rating: 4.9,
    reviewCount: 22,
    bookingCount: 38,
    isFeatured: true,
    description: 'Step into Kashmir\'s golden meadow where crystal glaciers meet wildflowers. Ride ponies to the base of ancient Thajiwas Glacier, fish for trout along the roaring Sindh River, explore Zoji La gateway to Ladakh, and stay in heated alpine wood cottages.',
    highlights: [
      'Guided pony and hiking expedition to ancient Thajiwas Glacier snow fields',
      'Scenic alpine drive to Zoji La pass viewpoint (11,575 ft)',
      'Trout fishing and riverside picnic lunch along the crystal Sindh River',
      '4 nights in 4-star heated wooden cottages overlooking snowy peaks',
      'Traditional 7-course Kashmiri Wazwan feast with saffron Kahwa'
    ],
    tags: ['kashmir', 'sonamarg', 'glacier', 'snow', 'meadows', 'himalayas'],
    images: [
      'https://images.unsplash.com/photo-1595815771614-ade9d652a65d?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1566837945700-30057527ade0?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80',
    ],
    inclusions: [
      '4 nights in luxury heated alpine cottage in Sonamarg',
      'Daily breakfast and multi-course Kashmiri dinner',
      'Pony ride fee to Thajiwas Glacier with local guide',
      'Private 4x4 SUV for Srinagar airport transfers and local sightseeing',
      'Authentic Wazwan dinner experience and Kahwa tea'
    ],
    exclusions: [
      'Flights to Srinagar airport',
      'Personal sledging and snow mobile rental fees',
      'Personal cold weather clothing'
    ],
    itinerary: [
      {
        day: 1,
        title: 'Srinagar to Sonamarg Scenic Drive',
        description: 'Pickup from Srinagar Airport and drive along the gushing Sindh River through walnut and willow groves to Sonamarg. Check into your heated wooden chalet.',
        activities: ['Airport pickup', 'Sindh Valley scenic drive', 'Chalet check-in', 'Welcome Kahwa'],
        meals: ['Dinner'],
        accommodation: 'Heated Alpine Wooden Cottage',
        location: 'Sonamarg'
      },
      {
        day: 2,
        title: 'Thajiwas Glacier Trek & Snow Field Walk',
        description: 'Mount hardy mountain ponies for a 2-hour ride up to the gleaming Thajiwas Glacier. Walk across ancient ice, slide on snow sledges, and enjoy alpine tea.',
        activities: ['Pony ride to Thajiwas Glacier', 'Snow field walking', 'Glacier photography'],
        meals: ['Breakfast', 'Dinner'],
        accommodation: 'Heated Alpine Wooden Cottage',
        location: 'Thajiwas Glacier'
      },
      {
        day: 3,
        title: 'Zoji La Pass Viewpoint & Zero Point',
        description: 'Ascend toward the formidable Zoji La Pass, the historic lifeline connecting Kashmir to Ladakh. Experience panoramic mountain views at Zero Point.',
        activities: ['Zoji La pass drive', 'Zero Point snow excursion', 'High altitude tea stop'],
        meals: ['Breakfast', 'Dinner'],
        accommodation: 'Heated Alpine Wooden Cottage',
        location: 'Zoji La Pass'
      },
      {
        day: 4,
        title: 'Sindh River Walk & Kashmiri Wazwan Feast',
        description: 'Spend a relaxing day nature walking along trout streams and pine forests. In the evening, savor a royal Kashmiri Wazwan feast cooked by master wazas.',
        activities: ['Riverbank nature walk', 'Trout stream photography', 'Royal Wazwan dinner'],
        meals: ['Breakfast', 'Dinner'],
        accommodation: 'Heated Alpine Wooden Cottage',
        location: 'Sindh River Valley'
      },
      {
        day: 5,
        title: 'Farewell Sonamarg & Srinagar Airport Drop',
        description: 'Morning breakfast overlooking morning mist over snow peaks before your scenic drive back to Srinagar Airport.',
        activities: ['Scenic breakfast', 'Return drive to Srinagar Airport'],
        meals: ['Breakfast'],
        accommodation: 'Check-out',
        location: 'Srinagar Airport'
      }
    ]
  },
  {
    name: 'Mangaluru & Udupi Coastal Flavors, Beaches & Island Trail',
    slugBase: 'mangaluru-udupi-coastal-flavors-island-trail',
    destinationName: 'Mangaluru',
    categoryName: 'Food Experiences',
    state: 'Karnataka',
    city: 'Mangaluru',
    durationDays: 4,
    durationNights: 3,
    maxGroupSize: 10,
    basePrice: 14500,
    discountPercent: 10,
    rating: 4.8,
    reviewCount: 29,
    bookingCount: 44,
    isFeatured: false,
    description: 'Discover the vibrant soul of the Tulunadu coastline. Taste world-famous Mangalorean Ghee Roast, Kori Rotti and coastal sea cuisine, visit the historic Udupi Krishna Matha, take a ferry to the volcanic hexagonal basalt rocks of St. Mary\'s Island, and unwind on untouched beaches.',
    highlights: [
      'Culinary trail tasting authentic Mangalorean Ghee Roast, Anjal fry & Neer Dosa',
      'Boat cruise to geological wonder St. Mary\'s Island with hexagonal basalt rocks',
      'VIP darshan at ancient Udupi Sri Krishna Matha with traditional Annadana',
      'Sunset photography and water sports at Malpe and Panambur beaches',
      'Guided walk through 10th-century Kadri Manjunatha and Mangaladevi temples'
    ],
    tags: ['karnataka', 'mangaluru', 'udupi', 'food', 'beach', 'temples', 'islands'],
    images: [
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1610057099431-d73a1c9d2f2f?auto=format&fit=crop&w=1200&q=80',
    ],
    inclusions: [
      '3 nights stay in 4-star coastal resort hotel',
      'Daily breakfast and curated regional food tasting lunches/dinners',
      'Ferry tickets and entry to St. Mary\'s Island',
      'AC private vehicle for all intercity travel between Mangaluru and Udupi',
      'Local food expert and cultural guide'
    ],
    exclusions: [
      'Flight/Train tickets to Mangaluru (IXE)',
      'Water sports rides at Malpe beach (parasailing, banana ride)',
      'Personal beverage expenses'
    ],
    itinerary: [
      {
        day: 1,
        title: 'Arrival in Mangaluru & Iconic Food Safari',
        description: 'Chauffeured pickup from Mangaluru Airport. Check in to your coastal resort. Evening food tour to sample legendary Mangalore Chicken/Paneer Ghee Roast and crispy Neer Dosa.',
        activities: ['Airport pickup', 'Check-in', 'Famous Ghee Roast dinner tour'],
        meals: ['Dinner'],
        accommodation: '4-Star Coastal Resort',
        location: 'Mangaluru City'
      },
      {
        day: 2,
        title: 'St. Mary\'s Island Expedition & Malpe Beach',
        description: 'Drive along the coastline to Malpe harbour. Board the ferry to St. Mary\'s Island to marvel at millions-of-years-old volcanic hexagonal pillars. Return to Malpe for sunset.',
        activities: ['Malpe boat cruise', 'St. Mary\'s Island exploration', 'Malpe beach sunset walk'],
        meals: ['Breakfast', 'Dinner'],
        accommodation: '4-Star Coastal Resort',
        location: 'St. Mary\'s Island & Malpe'
      },
      {
        day: 3,
        title: 'Udupi Krishna Temple & Cultural Heritage',
        description: 'Visit the 13th-century Udupi Sri Krishna Matha to see the deity through the sacred silver window (Kanakana Kindi). Enjoy temple Annadanam and visit Kaup light house.',
        activities: ['Udupi temple darshan', 'Kanakana Kindi viewing', 'Kaup lighthouse sunset'],
        meals: ['Breakfast', 'Lunch'],
        accommodation: '4-Star Coastal Resort',
        location: 'Udupi'
      },
      {
        day: 4,
        title: 'Kadri Temple & Departure',
        description: 'Morning visit to 10th-century Kadri Manjunatha temple and Panambur beach before your departure transfer to Mangaluru Airport/Station.',
        activities: ['Kadri Temple visit', 'Last minute cashew & halwa shopping', 'Airport drop-off'],
        meals: ['Breakfast'],
        accommodation: 'Check-out',
        location: 'Mangaluru'
      }
    ]
  },
  {
    name: 'Fort Kochi Colonial Heritage, Spice Trail & Kathakali Night',
    slugBase: 'fort-kochi-colonial-heritage-spice-trail',
    destinationName: 'Kochi',
    categoryName: 'Tour Packages',
    state: 'Kerala',
    city: 'Kochi',
    durationDays: 3,
    durationNights: 2,
    maxGroupSize: 10,
    basePrice: 12000,
    discountPercent: 10,
    rating: 4.8,
    reviewCount: 35,
    bookingCount: 50,
    isFeatured: false,
    description: 'Immerse yourself in centuries of colonial history where Portuguese, Dutch, British, and Arab merchants traded precious spices. Watch iconic Chinese fishing nets operate at sunset, tour fragrant spice warehouses in Mattancherry, and enjoy front-row seats to classical Kathakali dance.',
    highlights: [
      'Front-row VIP tickets to classical Kathakali dance and green-room makeup session',
      'Guided heritage walk through Santa Cruz Basilica & St. Francis Church (Vasco da Gama\'s tomb)',
      'Walking spice tasting tour through Jew Town and historic spice godowns',
      'Sunset catamaran cruise around Kochi harbour and Bolgatty Island',
      'Stay in a boutique heritage hotel with courtyard pool in Fort Kochi'
    ],
    tags: ['kerala', 'kochi', 'heritage', 'culture', 'spices', 'kathakali'],
    images: [
      'https://images.unsplash.com/photo-1593693397690-362cb9666fc2?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?auto=format&fit=crop&w=1200&q=80',
    ],
    inclusions: [
      '2 nights stay in a restored boutique colonial heritage hotel',
      'Daily breakfast and one traditional Kerala seafood dinner',
      'VIP tickets to Kathakali dance performance',
      'Sunset harbour cruise tickets',
      'Private AC car for all transfers and sightseeing with licensed historian guide'
    ],
    exclusions: [
      'Flights/trains to Kochi',
      'Personal spice and antique shopping',
      'Camera fees at Jewish Synagogue / Mattancherry Palace'
    ],
    itinerary: [
      {
        day: 1,
        title: 'Arrival in Fort Kochi & Sunset Chinese Fishing Nets',
        description: 'Chauffeured pickup from Kochi Airport to Fort Kochi. Check into your boutique heritage hotel. Walk to the waterfront to watch fishermen work the legendary Chinese fishing nets at sunset.',
        activities: ['Check-in', 'Chinese fishing nets visit', 'Harbour sunset walk'],
        meals: ['Dinner'],
        accommodation: 'Boutique Colonial Heritage Hotel',
        location: 'Fort Kochi Waterfront'
      },
      {
        day: 2,
        title: 'Spice Warehouses, Jew Town & Live Kathakali Drama',
        description: 'Visit the Paradesi Synagogue, Dutch Palace with its epic Ramayana murals, and smell exotic cardamom and pepper in Jew Town. In the evening, watch the elaborate Kathakali dance drama.',
        activities: ['Jew Town walking tour', 'Dutch Palace visit', 'Spice godowns', 'VIP Kathakali performance'],
        meals: ['Breakfast', 'Dinner'],
        accommodation: 'Boutique Colonial Heritage Hotel',
        location: 'Mattancherry & Fort Kochi'
      },
      {
        day: 3,
        title: 'St. Francis Church & Departure',
        description: 'Morning walk through St. Francis Church and Santa Cruz Basilica. Enjoy a fresh filter coffee and banana fritters before your airport departure transfer.',
        activities: ['Historic churches walk', 'Cafe visit', 'Airport transfer'],
        meals: ['Breakfast'],
        accommodation: 'Check-out',
        location: 'Kochi Airport'
      }
    ]
  },
  {
    name: 'Dubai Ultramodern Skyline, Desert Safari & Luxury Marina Cruise',
    slugBase: 'dubai-ultramodern-skyline-desert-safari-cruise',
    destinationName: 'Dubai',
    categoryName: 'Foreign Trips',
    state: 'Dubai Emirate',
    city: 'Dubai',
    durationDays: 5,
    durationNights: 4,
    maxGroupSize: 12,
    basePrice: 64000,
    discountPercent: 12,
    rating: 4.9,
    reviewCount: 38,
    bookingCount: 62,
    isFeatured: true,
    description: 'Experience the glittering jewel of the Middle East. Stand at the 124th floor of Burj Khalifa, blast across red dunes in a 4x4 Land Cruiser with a desert camp dinner and belly dancing, cruise Dubai Marina aboard a 5-star glass Dhow, and explore Abu Dhabi\'s Sheikh Zayed Mosque.',
    highlights: [
      'Burj Khalifa "At The Top" observation deck tickets for Level 124 & 125',
      'Thrilling 4x4 red dune desert safari with dune bashing, camel ride & BBQ banquet',
      '5-star glass dhow dinner cruise through Dubai Marina skyline',
      'Full-day Abu Dhabi day excursion including the magnificent Sheikh Zayed Grand Mosque',
      '4-star centrally located hotel with daily international breakfast buffet'
    ],
    tags: ['dubai', 'international', 'foreign-trips', 'desert-safari', 'burj-khalifa', 'luxury'],
    images: [
      'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1451337516015-6b6e9a44a8a3?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1518684079-3c830dcef090?auto=format&fit=crop&w=1200&q=80',
    ],
    inclusions: [
      '4 nights in 4-star deluxe city hotel in Downtown/Marina',
      'Daily international breakfast buffet and 2 special banquet dinners',
      'Burj Khalifa level 124/125 entry tickets',
      '4x4 Desert Safari with dune bashing, Tanoura show & barbecue buffet',
      'Marina Dhow Cruise with international dinner buffet',
      'Full-day Abu Dhabi tour with Sheikh Zayed Grand Mosque entry',
      'Round-trip private Dubai airport transfers'
    ],
    exclusions: [
      'International flight tickets and UAE tourist visa fee',
      'Tourism Dirham fee payable directly to the hotel',
      'Personal luxury shopping at Dubai Mall / Gold Souk'
    ],
    itinerary: [
      {
        day: 1,
        title: 'Arrival in Dubai & 5-Star Marina Dhow Cruise',
        description: 'Chauffeured pickup from Dubai International Airport. Check in to your 4-star hotel. Evening boarding of a luxury glass dhow for a 2-hour dinner cruise past illuminated Marina skyscrapers.',
        activities: ['Airport pickup', 'Hotel check-in', 'Dubai Marina Dhow Cruise & Dinner'],
        meals: ['Dinner'],
        accommodation: '4-Star Deluxe City Hotel',
        location: 'Dubai Marina'
      },
      {
        day: 2,
        title: 'Burj Khalifa Observation Deck & Dubai Mall',
        description: 'Ascend to the 124th floor of Burj Khalifa for breathtaking 360-degree views of the Persian Gulf and desert skyline. Watch the famous Dubai Fountain show and explore Dubai Mall.',
        activities: ['Burj Khalifa Level 124', 'Dubai Mall walk', 'Dubai Fountain light show'],
        meals: ['Breakfast'],
        accommodation: '4-Star Deluxe City Hotel',
        location: 'Downtown Dubai'
      },
      {
        day: 3,
        title: 'Desert Safari, Dune Bashing & Arabian Campfire',
        description: 'Mid-afternoon 4x4 Land Cruiser pickup for high-dune bashing in the Lahbab desert. Enjoy sunset sandboarding, camel rides, and an Arabian feast with live Tanoura and belly dance.',
        activities: ['4x4 Dune bashing', 'Sunset sandboarding', 'Camel ride', 'Desert camp BBQ & live shows'],
        meals: ['Breakfast', 'Dinner'],
        accommodation: '4-Star Deluxe City Hotel',
        location: 'Lahbab Red Dunes'
      },
      {
        day: 4,
        title: 'Abu Dhabi Grand Mosque & Louvre Day Tour',
        description: 'Full-day tour to UAE\'s capital Abu Dhabi. Marvel at the architectural perfection of the pure white marble Sheikh Zayed Grand Mosque and view the Emirates Palace.',
        activities: ['Sheikh Zayed Grand Mosque visit', 'Abu Dhabi Corniche drive', 'Heritage Village tour'],
        meals: ['Breakfast'],
        accommodation: '4-Star Deluxe City Hotel',
        location: 'Abu Dhabi'
      },
      {
        day: 5,
        title: 'Gold Souk Shopping & Airport Departure',
        description: 'Morning visit to the historic Deira Gold & Spice Souks crossing by traditional Abra water taxi, followed by transfer to Dubai Airport.',
        activities: ['Deira Gold Souk visit', 'Abra creek crossing', 'Airport departure transfer'],
        meals: ['Breakfast'],
        accommodation: 'Check-out',
        location: 'Dubai International Airport'
      }
    ]
  },
  {
    name: 'Bali Tropical Island Escape: Ubud Terraces & Seminyak Coast',
    slugBase: 'bali-tropical-island-escape-ubud-seminyak',
    destinationName: 'Bali',
    categoryName: 'Foreign Trips',
    state: 'Bali Province',
    city: 'Ubud & Seminyak',
    durationDays: 6,
    durationNights: 5,
    maxGroupSize: 8,
    basePrice: 58000,
    discountPercent: 10,
    rating: 4.9,
    reviewCount: 41,
    bookingCount: 67,
    isFeatured: true,
    description: 'Escape to the magical Island of the Gods. Discover the emerald rice terraces, giant jungle swings, and sacred Monkey Forest of Ubud, cross by speedboat to Nusa Penida\'s dramatic cliffs, catch fiery sunsets at cliffside Uluwatu Temple, and unwind in private pool villas.',
    highlights: [
      '3 nights in a private jungle pool villa in Ubud + 2 nights in coastal Seminyak',
      'Day trip by speedboat to Nusa Penida (Kelingking T-Rex cliff & Broken Beach)',
      'Tegalalang Rice Terraces, Aloha Jungle Swing and Sacred Monkey Forest sanctuary',
      'Uluwatu cliffside temple sunset tour with traditional Kecak Fire Dance',
      'Balinese cooking masterclass and organic coffee plantation tasting'
    ],
    tags: ['bali', 'indonesia', 'foreign-trips', 'ubud', 'nusa-penida', 'honeymoon', 'tropical'],
    images: [
      'https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1552733407-5d5c46c3bb3b?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1518548419970-58e3b4079ab2?auto=format&fit=crop&w=1200&q=80',
    ],
    inclusions: [
      '5 nights luxury accommodation (3 nights Ubud Pool Villa + 2 nights Seminyak)',
      'Daily floating/villa breakfast and 2 special Balinese dinners',
      'Speedboat transfer and guided island tour of Nusa Penida with lunch',
      'Entry tickets to Tegalalang, Jungle Swing, Monkey Forest, and Uluwatu Temple',
      'Private air-conditioned car and English-speaking Balinese driver guide throughout',
      'Ngurah Rai (Denpasar) Airport roundtrip transfers'
    ],
    exclusions: [
      'International airfare to Bali (DPS)',
      'Bali tourist tourist tax and Indonesia visa-on-arrival fee',
      'Personal water sports and spa therapies'
    ],
    itinerary: [
      {
        day: 1,
        title: 'Arrival in Bali & Check-in to Ubud Jungle Villa',
        description: 'Warm Balinese welcome at Denpasar Airport with flower garlands. Scenic drive to the cultural heart of Ubud. Settle into your private jungle pool villa.',
        activities: ['Airport pickup', 'Flower garland welcome', 'Villa check-in', 'Private pool relaxation'],
        meals: ['Dinner'],
        accommodation: 'Private Jungle Pool Villa',
        location: 'Ubud'
      },
      {
        day: 2,
        title: 'Tegalalang Rice Terraces, Jungle Swing & Monkey Forest',
        description: 'Morning walk through emerald Tegalalang rice paddies. Fly high over jungle valleys on the iconic Bali swing, sample Luwak coffee, and explore the ancient Sacred Monkey Forest.',
        activities: ['Tegalalang terraces walk', 'Jungle swing', 'Coffee tasting', 'Sacred Monkey Forest'],
        meals: ['Breakfast', 'Lunch'],
        accommodation: 'Private Jungle Pool Villa',
        location: 'Tegalalang & Ubud'
      },
      {
        day: 3,
        title: 'Nusa Penida Island Adventure (Kelingking Beach)',
        description: 'Early morning speedboat to rugged Nusa Penida island. Marvel at the dramatic T-Rex shaped cliff of Kelingking Beach, Broken Beach, and Angel\'s Billabong natural infinity pool.',
        activities: ['Speedboat to Nusa Penida', 'Kelingking cliff photography', 'Broken Beach & Angel Billabong'],
        meals: ['Breakfast', 'Lunch'],
        accommodation: 'Private Jungle Pool Villa',
        location: 'Nusa Penida Island'
      },
      {
        day: 4,
        title: 'Transfer to Seminyak & Sunset Beach Club',
        description: 'Check out from Ubud and drive south to the fashionable coastal town of Seminyak. Check in to your beachside hotel and relax at a premier sunset beach club.',
        activities: ['Transfer to Seminyak', 'Hotel check-in', 'Seminyak beach sunset walk'],
        meals: ['Breakfast'],
        accommodation: 'Deluxe Coastal Hotel',
        location: 'Seminyak'
      },
      {
        day: 5,
        title: 'Uluwatu Cliff Temple & Mesmerizing Kecak Fire Dance',
        description: 'Drive along the Bukit Peninsula to the 70-meter cliff-top Uluwatu Temple. As the sun sets into the ocean, watch the dramatic chanting of the hypnotic Kecak Fire Dance.',
        activities: ['Uluwatu temple visit', 'Kecak Fire Dance performance', 'Jimbaran Bay seafood dinner'],
        meals: ['Breakfast', 'Dinner'],
        accommodation: 'Deluxe Coastal Hotel',
        location: 'Uluwatu & Jimbaran'
      },
      {
        day: 6,
        title: 'Souvenir Shopping & Airport Departure',
        description: 'Morning relaxation and last-minute handicraft shopping at Seminyak markets before your transfer to Denpasar International Airport.',
        activities: ['Leisure breakfast', 'Art market shopping', 'Airport departure transfer'],
        meals: ['Breakfast'],
        accommodation: 'Check-out',
        location: 'Denpasar Airport'
      }
    ]
  }
];

async function seedListingsForRealKanagaraj() {
  console.log('===============================================================');
  console.log('SEEDING 12+ REALISTIC MARKETPLACE LISTINGS FOR realkanagaraj@gmail.com');
  console.log('===============================================================');

  const providerEmail = 'realkanagaraj@gmail.com';
  const user = await prisma.user.findFirst({
    where: { email: providerEmail },
    include: { providerProfile: true },
  });

  if (!user || !user.providerProfile) {
    throw new Error(`Provider user ${providerEmail} not found!`);
  }

  const provider = user.providerProfile;
  console.log(`Found provider: id=${provider.id}, business=${provider.businessName}, status=${provider.verificationStatus}`);

  // Update business profile if needed to make it look professional
  await prisma.providerProfile.update({
    where: { id: provider.id },
    data: {
      businessName: 'VibeMiles Premium Journeys & Expeditions',
      ownerName: 'Kanagaraj',
      description: 'Premier tour operator and bespoke travel concierge specializing in authentic Himalayan adventures, South Indian coastal getaways, spiritual pilgrimages, and curated international vacations.',
      city: 'Manali',
      state: 'Himachal Pradesh',
      verificationStatus: 'VERIFIED',
      isActive: true,
      rating: 4.9,
      reviewCount: 148,
    },
  });

  // Pre-load all categories and destinations
  const categories = await prisma.category.findMany();
  const categoryMap = new Map(categories.map((c) => [c.name.toLowerCase(), c.id]));
  const categorySlugMap = new Map(categories.map((c) => [c.slug.toLowerCase(), c.id]));

  const destinations = await prisma.destination.findMany();
  const destinationMap = new Map(destinations.map((d) => [d.name.toLowerCase(), d.id]));

  console.log(`Loaded ${categories.length} categories and ${destinations.length} destinations.`);

  // Create or update packages
  let createdCount = 0;

  for (const item of PACKAGES_DATA) {
    console.log(`\nProcessing: "${item.name}"...`);

    // Match destination
    let destId = destinationMap.get(item.destinationName.toLowerCase());
    if (!destId) {
      // Find partial match
      const matched = destinations.find((d) =>
        d.name.toLowerCase().includes(item.destinationName.toLowerCase())
      );
      if (matched) destId = matched.id;
    }

    if (!destId) {
      // Create destination if somehow missing
      console.log(`Creating missing destination: ${item.destinationName}`);
      const newDest = await prisma.destination.create({
        data: {
          slug: item.destinationName.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          name: item.destinationName,
          state: item.state,
          description: `Explore the wonder of ${item.destinationName}, featuring breathtaking sights and cultural richness.`,
          heroImage: item.images[0],
          images: item.images,
          bestTimeToVisit: 'Throughout the year',
          isPopular: true,
        },
      });
      destId = newDest.id;
      destinationMap.set(item.destinationName.toLowerCase(), destId);
    }

    // Match category
    let catId = categoryMap.get(item.categoryName.toLowerCase());
    if (!catId) {
      catId = categorySlugMap.get(item.categoryName.toLowerCase());
    }
    if (!catId) {
      catId = categories[0].id;
    }

    const finalPrice = Math.round(item.basePrice - (item.basePrice * item.discountPercent) / 100);
    const slug = `${item.slugBase}-${Date.now().toString().slice(-4)}`;

    // Upsert package
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

    // Replace availability dates (next 6 weeks upcoming dates)
    await prisma.packageAvailability.deleteMany({ where: { packageId: pkgId } });
    const now = new Date();
    const upcomingAvailabilities = [3, 7, 10, 14, 18, 21, 28, 35].map((daysAhead) => {
      const d = new Date(now);
      d.setDate(d.getDate() + daysAhead);
      d.setHours(0, 0, 0, 0);
      return {
        packageId: pkgId,
        date: d,
        price: finalPrice,
        capacity: item.maxGroupSize,
        bookedCount: Math.floor(Math.random() * 3),
        isAvailable: true,
      };
    });
    await prisma.packageAvailability.createMany({ data: upcomingAvailabilities });

    createdCount++;
    console.log(`✓ Saved package ${createdCount}/12: "${item.name}"`);
  }

  // Update provider total packages counter
  const totalPkgs = await prisma.package.count({ where: { providerId: provider.id } });
  await prisma.providerProfile.update({
    where: { id: provider.id },
    data: { totalPackages: totalPkgs },
  });
  console.log(`\nUpdated provider profile: totalPackages = ${totalPkgs}`);

  // Re-sync packageCount on all destinations
  for (const dest of destinations) {
    const count = await prisma.package.count({
      where: {
        destinationId: dest.id,
        status: ListingStatus.PUBLISHED,
        approvalStatus: ApprovalStatus.APPROVED,
      },
    });
    await prisma.destination.update({
      where: { id: dest.id },
      data: { packageCount: count },
    });
  }
  console.log('✓ Destination package counters synced.');

  console.log('\n===============================================================');
  console.log(`SUCCESS: Created/Updated ${createdCount} genuine listings for ${providerEmail}!`);
  console.log('===============================================================');
}

seedListingsForRealKanagaraj().catch(console.error).finally(() => prisma.$disconnect());
