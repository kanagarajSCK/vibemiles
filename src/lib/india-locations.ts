export type IndiaLocationType = 'COUNTRY' | 'STATE' | 'UNION_TERRITORY' | 'DISTRICT' | 'CITY' | 'TOWN' | 'DESTINATION';

export interface IndiaLocation {
  id: string;
  name: string;
  type: IndiaLocationType;
  state: string;
  stateCode: string;
  country: string;
  countryCode: string;
  district?: string;
  aliases: string[];
  searchable: boolean;
  normalizedName: string;
  latitude?: number;
  longitude?: number;
  heroImage?: string;
  nearbyIds?: string[];
  slug?: string;
}

export interface NearbyDestinationSuggestion {
  name: string;
  state: string;
  slug?: string;
  packageCount?: number;
  highlight?: string;
}

export const STATE_CODE_MAP: Record<string, string> = {
  'Andhra Pradesh': 'AP', 'Arunachal Pradesh': 'AR', Assam: 'AS', Bihar: 'BR',
  'Chhattisgarh': 'CG', Goa: 'GA', Gujarat: 'GJ', Haryana: 'HR',
  'Himachal Pradesh': 'HP', Jharkhand: 'JH', Karnataka: 'KA', Kerala: 'KL',
  'Madhya Pradesh': 'MP', Maharashtra: 'MH', Manipur: 'MN', Meghalaya: 'ML',
  Mizoram: 'MZ', Nagaland: 'NL', Odisha: 'OD', Punjab: 'PB', Rajasthan: 'RJ',
  Sikkim: 'SK', 'Tamil Nadu': 'TN', Telangana: 'TS', Tripura: 'TR',
  'Uttar Pradesh': 'UP', Uttarakhand: 'UK', 'West Bengal': 'WB',
  'Andaman and Nicobar Islands': 'AN', Chandigarh: 'CH',
  'Dadra and Nagar Haveli and Daman and Diu': 'DN', Delhi: 'DL',
  'Jammu and Kashmir': 'JK', Ladakh: 'LA', Lakshadweep: 'LD', Puducherry: 'PY',
};

export function normalizeLocationText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/&/g, ' and ')
    .replace(/[-_/()]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

const STATE_LOCATIONS: Partial<IndiaLocation>[] = Object.keys(STATE_CODE_MAP)
  .filter(s => STATE_CODE_MAP[s] !== 'AN' && STATE_CODE_MAP[s] !== 'CH' && STATE_CODE_MAP[s] !== 'DN' && STATE_CODE_MAP[s] !== 'DL' && STATE_CODE_MAP[s] !== 'JK' && STATE_CODE_MAP[s] !== 'LA' && STATE_CODE_MAP[s] !== 'LD' && STATE_CODE_MAP[s] !== 'PY')
  .map(state => ({
    id: `state-${normalizeLocationText(state).replace(/\s+/g, '-')}`,
    name: state, type: 'STATE', state, stateCode: STATE_CODE_MAP[state],
    country: 'India', countryCode: 'IN', aliases: [], searchable: true,
    normalizedName: normalizeLocationText(state)
  }));

const UT_LOCATIONS: Partial<IndiaLocation>[] = [
  'Andaman and Nicobar Islands', 'Chandigarh', 'Dadra and Nagar Haveli and Daman and Diu',
  'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry'
].map(ut => ({
    id: `ut-${normalizeLocationText(ut).replace(/\s+/g, '-')}`,
    name: ut, type: 'UNION_TERRITORY', state: ut, stateCode: STATE_CODE_MAP[ut],
    country: 'India', countryCode: 'IN', aliases: [], searchable: true,
    normalizedName: normalizeLocationText(ut)
}));

export const CITY_MAP: Record<string, string[]> = {
  'Andhra Pradesh': [
    'Visakhapatnam', 'Vijayawada', 'Guntur', 'Nellore', 'Kurnool', 'Kakinada',
    'Rajahmundry', 'Kadapa', 'Tirupati', 'Anantapur', 'Vizianagaram', 'Eluru',
    'Ongole', 'Nandyal', 'Machilipatnam', 'Adoni', 'Tenali', 'Proddatur',
    'Chittoor', 'Hindupur', 'Bhimavaram', 'Madanapalle', 'Guntakal', 'Dharmavaram',
    'Gudivada', 'Srikakulam', 'Narasaraopet', 'Tadepalligudem', 'Amaravati', 'Araku Valley'
  ],
  'Arunachal Pradesh': ['Itanagar', 'Tawang', 'Bomdila', 'Ziro', 'Pasighat', 'Roing', 'Along', 'Tezu', 'Dirang'],
  'Assam': [
    'Guwahati', 'Silchar', 'Dibrugarh', 'Jorhat', 'Nagaon', 'Tinsukia', 'Tezpur',
    'Kaziranga', 'Majuli', 'Manas', 'Bongaigaon', 'Dhubri', 'Diphu', 'North Lakhimpur', 'Haflong'
  ],
  'Bihar': [
    'Patna', 'Gaya', 'Bhagalpur', 'Muzaffarpur', 'Purnia', 'Darbhanga', 'Bihar Sharif',
    'Arrah', 'Begusarai', 'Katihar', 'Munger', 'Chhapra', 'Bodh Gaya', 'Nalanda', 'Rajgir', 'Vaishali', 'Sasaram'
  ],
  'Chhattisgarh': ['Raipur', 'Bhilai', 'Bilaspur', 'Korba', 'Rajnandgaon', 'Jagdalpur', 'Bastar', 'Raigarh', 'Ambikapur', 'Durg', 'Chitrakote'],
  'Goa': [
    'Panaji', 'Margao', 'Vasco da Gama', 'Mapusa', 'Ponda', 'Calangute', 'Baga',
    'Candolim', 'Anjuna', 'Vagator', 'Morjim', 'Arambol', 'Colva', 'Benaulim', 'Palolem', 'Agonda', 'North Goa', 'South Goa'
  ],
  'Gujarat': [
    'Ahmedabad', 'Surat', 'Vadodara', 'Rajkot', 'Bhavnagar', 'Jamnagar', 'Junagadh',
    'Gandhinagar', 'Anand', 'Navsari', 'Surendranagar', 'Morbi', 'Bharuch', 'Porbandar',
    'Godhra', 'Vapi', 'Veraval', 'Bhuj', 'Somnath', 'Dwarka', 'Gir', 'Kutch', 'Statue of Unity', 'Saputara', 'Palanpur'
  ],
  'Haryana': [
    'Faridabad', 'Gurugram', 'Panipat', 'Ambala', 'Yamunanagar', 'Rohtak', 'Hisar',
    'Karnal', 'Sonipat', 'Panchkula', 'Sirsa', 'Bhiwani', 'Bahadurgarh', 'Jind', 'Thanesar', 'Kurukshetra', 'Kaithal'
  ],
  'Himachal Pradesh': [
    'Shimla', 'Manali', 'Dharamshala', 'Kullu', 'Solan', 'Mandi', 'Palampur',
    'Baddi', 'Nahan', 'Paonta Sahib', 'Sundarnagar', 'Chamba', 'Dalhousie', 'Kasol',
    'Spiti', 'Kaza', 'Bir Billing', 'Kasauli', 'Jibhi', 'Kinnaur', 'Tirthan Valley', 'Kalpa', 'Sangla'
  ],
  'Jharkhand': [
    'Ranchi', 'Jamshedpur', 'Dhanbad', 'Bokaro Steel City', 'Deoghar', 'Phusro',
    'Hazaribagh', 'Giridih', 'Ramgarh', 'Medininagar', 'Chirkunda', 'Netarhat', 'Dumka'
  ],
  'Karnataka': [
    'Bengaluru', 'Mysuru', 'Mangaluru', 'Hubballi', 'Dharwad', 'Belagavi', 'Kalaburagi',
    'Davanagere', 'Ballari', 'Vijayapura', 'Shivamogga', 'Tumakuru', 'Raichur', 'Bidar',
    'Hosapete', 'Gadag', 'Udupi', 'Hassan', 'Bhadravati', 'Mandya', 'Chikkamagaluru',
    'Chitradurga', 'Kolar', 'Gangavathi', 'Ranebennur', 'Bagalkot', 'Dandeli', 'Gokarna', 'Coorg', 'Hampi', 'Madikeri'
  ],
  'Kerala': [
    'Thiruvananthapuram', 'Kochi', 'Kozhikode', 'Kollam', 'Thrissur', 'Alappuzha',
    'Palakkad', 'Malappuram', 'Kannur', 'Kasaragod', 'Kottayam', 'Idukki', 'Wayanad',
    'Pathanamthitta', 'Munnar', 'Varkala', 'Kovalam', 'Thekkady', 'Vagamon', 'Bekal', 'Guruvayur', 'Kumarakom'
  ],
  'Madhya Pradesh': [
    'Indore', 'Bhopal', 'Jabalpur', 'Gwalior', 'Ujjain', 'Sagar', 'Dewas', 'Satna',
    'Ratlam', 'Rewa', 'Murwara', 'Singrauli', 'Burhanpur', 'Khandwa', 'Khajuraho',
    'Pachmarhi', 'Kanha', 'Bandhavgarh', 'Orchha', 'Mandu', 'Pench', 'Shivpuri', 'Omkareshwar'
  ],
  'Maharashtra': [
    'Mumbai', 'Pune', 'Nagpur', 'Thane', 'Pimpri-Chinchwad', 'Nashik', 'Kalyan-Dombivli',
    'Vasai-Virar', 'Aurangabad', 'Navi Mumbai', 'Solapur', 'Mira-Bhayandar', 'Bhiwandi',
    'Amravati', 'Nanded', 'Kolhapur', 'Ulhasnagar', 'Sangli', 'Malegaon', 'Jalgaon',
    'Akola', 'Latur', 'Dhule', 'Ahmednagar', 'Chandrapur', 'Parbhani', 'Jalna', 'Panvel',
    'Satara', 'Alibaug', 'Lonavala', 'Mahabaleshwar', 'Shirdi', 'Matheran', 'Panchgani', 'Tarkarli', 'Igatpuri'
  ],
  'Manipur': ['Imphal', 'Loktak Lake', 'Thoubal', 'Bishnupur', 'Churachandpur', 'Ukhrul', 'Senapati', 'Tamenglong', 'Chandel'],
  'Meghalaya': ['Shillong', 'Cherapunji', 'Mawlynnong', 'Tura', 'Jowai', 'Nongpoh', 'Dawki', 'Mawsynram'],
  'Mizoram': ['Aizawl', 'Lunglei', 'Champhai', 'Serchhip', 'Kolasib', 'Lawngtlai', 'Saiha'],
  'Nagaland': ['Kohima', 'Dimapur', 'Mokokchung', 'Tuensang', 'Wokha', 'Mon', 'Zunheboto', 'Phek'],
  'Odisha': [
    'Bhubaneswar', 'Cuttack', 'Rourkela', 'Berhampur', 'Sambalpur', 'Puri', 'Balasore',
    'Bhadrak', 'Baripada', 'Jharsuguda', 'Jeypore', 'Konark', 'Gopalpur', 'Chilika', 'Daringbadi'
  ],
  'Punjab': [
    'Ludhiana', 'Amritsar', 'Jalandhar', 'Patiala', 'Bathinda', 'Mohali', 'Hoshiarpur',
    'Batala', 'Pathankot', 'Moga', 'Abohar', 'Malerkotla', 'Khanna', 'Phagwara', 'Kapurthala'
  ],
  'Rajasthan': [
    'Jaipur', 'Jodhpur', 'Kota', 'Bikaner', 'Ajmer', 'Udaipur', 'Bhilwara', 'Alwar',
    'Bharatpur', 'Sri Ganganagar', 'Sikar', 'Pali', 'Chittorgarh', 'Pushkar', 'Jaisalmer',
    'Mount Abu', 'Ranthambore', 'Mandawa', 'Bundi', 'Kumbhalgarh', 'Shekhawati'
  ],
  'Sikkim': ['Gangtok', 'Namchi', 'Geyzing', 'Mangan', 'Pelling', 'Lachung', 'Lachen', 'Ravangla', 'Yuksom', 'Zuluk'],
  'Tamil Nadu': [
    'Chennai', 'Coimbatore', 'Madurai', 'Tiruchirappalli', 'Salem', 'Tirunelveli',
    'Tirupur', 'Ranipet', 'Erode', 'Vellore', 'Thoothukudi', 'Dindigul', 'Thanjavur',
    'Hosur', 'Sivakasi', 'Karur', 'Udhagamandalam', 'Ooty', 'Kodaikanal', 'Rameswaram',
    'Kanyakumari', 'Kanchipuram', 'Tiruvannamalai', 'Cuddalore', 'Kumbakonam', 'Pollachi',
    'Rajapalayam', 'Pudukkottai', 'Nagercoil', 'Nagapattinam', 'Karaikudi', 'Krishnagiri',
    'Dharmapuri', 'Namakkal', 'Perambalur', 'Ariyalur', 'Tenkasi', 'Mayiladuthurai', 'Yercaud', 'Courtallam', 'Valparai'
  ],
  'Telangana': [
    'Hyderabad', 'Warangal', 'Nizamabad', 'Khammam', 'Karimnagar', 'Ramagundam',
    'Mahbubnagar', 'Nalgonda', 'Adilabad', 'Suryapet', 'Miryalaguda', 'Siddipet', 'Jagtial', 'Mancherial', 'Kothagudem'
  ],
  'Tripura': ['Agartala', 'Dharmanagar', 'Udaipur', 'Kailashahar', 'Belonia', 'Khowai'],
  'Uttar Pradesh': [
    'Lucknow', 'Kanpur', 'Ghaziabad', 'Agra', 'Meerut', 'Varanasi', 'Prayagraj',
    'Bareilly', 'Aligarh', 'Moradabad', 'Saharanpur', 'Gorakhpur', 'Noida', 'Greater Noida',
    'Firozabad', 'Jhansi', 'Muzaffarnagar', 'Mathura', 'Ayodhya', 'Vrindavan', 'Sarnath',
    'Budaun', 'Rampur', 'Shahjahanpur', 'Farrukhabad', 'Hapur', 'Etawah', 'Mirzapur', 'Bulandshahr', 'Sambhal'
  ],
  'Uttarakhand': [
    'Dehradun', 'Haridwar', 'Roorkee', 'Haldwani', 'Rudrapur', 'Kashipur', 'Rishikesh',
    'Nainital', 'Mussoorie', 'Jim Corbett', 'Auli', 'Kedarnath', 'Badrinath', 'Almora',
    'Ranikhet', 'Lansdowne', 'Kausani', 'Mukteshwar', 'Valley of Flowers', 'Gangotri', 'Yamunotri', 'Chopta'
  ],
  'West Bengal': [
    'Kolkata', 'Howrah', 'Asansol', 'Siliguri', 'Durgapur', 'Bardhaman', 'Malda',
    'Baharampur', 'Habra', 'Kharagpur', 'Shantipur', 'Dankuni', 'Darjeeling', 'Kalimpong',
    'Sundarbans', 'Digha', 'Mirik', 'Kurseong', 'Dooars', 'Mandarmani', 'Bishnupur'
  ],
  'Andaman and Nicobar Islands': ['Port Blair', 'Havelock Island', 'Neil Island', 'Radhanagar', 'Baratang'],
  'Chandigarh': ['Chandigarh'],
  'Dadra and Nagar Haveli and Daman and Diu': ['Daman', 'Diu', 'Silvassa'],
  'Delhi': ['New Delhi', 'North Delhi', 'South Delhi', 'East Delhi', 'West Delhi', 'Dwarka', 'Connaught Place'],
  'Jammu and Kashmir': [
    'Srinagar', 'Jammu', 'Anantnag', 'Baramulla', 'Udhampur', 'Sopore', 'Kathua',
    'Gulmarg', 'Pahalgam', 'Sonamarg', 'Patnitop', 'Katra', 'Vaishno Devi', 'Doda', 'Rajouri'
  ],
  'Ladakh': ['Leh', 'Kargil', 'Nubra Valley', 'Pangong Tso', 'Zanskar', 'Tso Moriri', 'Diskit', 'Hunder'],
  'Lakshadweep': ['Kavaratti', 'Agatti', 'Bangaram', 'Minicoy'],
  'Puducherry': ['Puducherry', 'Pondicherry', 'Auroville', 'Karaikal', 'Mahe', 'Yanam']
};

export const CITY_ALIASES: Record<string, string[]> = {
  Mumbai: ['Bombay', 'Mum'],
  Bengaluru: ['Bangalore', 'BLR'],
  Kolkata: ['Calcutta'],
  Chennai: ['Madras', 'MAA'],
  Kochi: ['Cochin', 'Ernakulam'],
  Thiruvananthapuram: ['Trivandrum'],
  Ooty: ['Udhagamandalam', 'Ootacamund', 'Nilgiris'],
  Puducherry: ['Pondicherry', 'Pondy'],
  Delhi: ['New Delhi', 'NCR', 'Dilli'],
  Mangaluru: ['Mangalore'],
  Mysuru: ['Mysore'],
  Rameswaram: ['Rameshwaram', 'Dhanushkodi'],
  Guwahati: ['Gauhati'],
  Varanasi: ['Kashi', 'Banaras', 'Benares'],
  Prayagraj: ['Allahabad'],
  Ayodhya: ['Faizabad'],
  Shimla: ['Simla'],
  Vadodara: ['Baroda'],
  Vijayapura: ['Bijapur'],
  Kalaburagi: ['Gulbarga'],
  Belagavi: ['Belgaum'],
  Shivamogga: ['Shimoga'],
  Visakhapatnam: ['Vizag', 'Waltair'],
  Tiruchirappalli: ['Trichy', 'Tiruchi'],
  Tirunelveli: ['Nellai'],
  Kozhikode: ['Calicut'],
  Alappuzha: ['Alleppey'],
  Salem: ['Salem Steel City', 'Mango City']
};

function determineType(name: string, stateName: string): IndiaLocationType {
  const lowercaseVal = normalizeLocationText(name);
  if (lowercaseVal.includes('district')) return 'DISTRICT';
  if ([
    'goa', 'delhi', 'puducherry', 'manali', 'ooty', 'munnar', 'spiti', 'coorg',
    'hampi', 'rishikesh', 'ladakh', 'sonamarg', 'jaipur', 'varanasi', 'rameswaram', 'mangaluru'
  ].includes(lowercaseVal)) {
    return 'DESTINATION';
  }
  return 'CITY';
}

const buildLocations = (): IndiaLocation[] => {
  const items: IndiaLocation[] = [...STATE_LOCATIONS, ...UT_LOCATIONS] as IndiaLocation[];
  for (const [stateName, cities] of Object.entries(CITY_MAP)) {
    const stateCode = STATE_CODE_MAP[stateName] ?? 'IN';
    for (const rawName of cities) {
      const name = rawName.trim();
      const id = `loc-${normalizeLocationText(stateName)}-${normalizeLocationText(name).replace(/\s+/g, '-')}`;
      items.push({
        id,
        name,
        type: determineType(name, stateName),
        state: stateName,
        stateCode,
        country: 'India',
        countryCode: 'IN',
        district: stateName,
        aliases: CITY_ALIASES[name] ?? [],
        searchable: true,
        normalizedName: normalizeLocationText(name),
      });
    }
  }
  return items;
};

export const INDIA_LOCATIONS: IndiaLocation[] = buildLocations();

export const TOP_POPULAR_DESTINATIONS: NearbyDestinationSuggestion[] = [
  { name: 'Ooty', state: 'Tamil Nadu', slug: 'ooty', packageCount: 1, highlight: 'Queen of Hill Stations' },
  { name: 'Rameswaram', state: 'Tamil Nadu', slug: 'rameswaram', packageCount: 1, highlight: 'Sacred Island & Coastal Serenity' },
  { name: 'Munnar', state: 'Kerala', slug: 'munnar', packageCount: 1, highlight: 'Tea Plantations & Misty Valleys' },
  { name: 'Manali', state: 'Himachal Pradesh', slug: 'manali-himachal-pradesh', packageCount: 2, highlight: 'Snow Peaks & Adventure Valley' },
  { name: 'Goa', state: 'Goa', slug: 'goa', packageCount: 1, highlight: 'Beaches & Vibrant Coastal Retreat' },
  { name: 'Jaipur', state: 'Rajasthan', slug: 'jaipur-rajasthan', packageCount: 2, highlight: 'Royal Palaces & Golden Forts' },
  { name: 'Kochi', state: 'Kerala', slug: 'kochi-59tx', packageCount: 1, highlight: 'Historic Port & Backwaters' },
  { name: 'Mangaluru', state: 'Karnataka', slug: 'mangaluru-karnataka', packageCount: 1, highlight: 'Konkan Coast & Temples' },
  { name: 'Rishikesh & Haridwar', state: 'Uttarakhand', slug: 'rishikesh-haridwar-uttarakhand', packageCount: 2, highlight: 'Holy Ganga & Spiritual Retreat' },
  { name: 'Tirupati', state: 'Andhra Pradesh', slug: 'tirupati-andhra-pradesh', packageCount: 2, highlight: 'Holy Tirumala Balaji Pilgrimage' },
  { name: 'Sonamarg', state: 'Jammu and Kashmir', slug: 'sonamarg-7bjy', packageCount: 1, highlight: 'Meadow of Gold & Alpine Glaciers' },
  { name: 'Varanasi', state: 'Uttar Pradesh', slug: 'varanasi-uttar-pradesh', packageCount: 2, highlight: 'Sacred Ghats & Ganga Aarti' },
  { name: 'Alleppey (Alappuzha)', state: 'Kerala', slug: 'alleppey-kerala', packageCount: 2, highlight: 'Luxury Backwater Houseboats' },
  { name: 'Ladakh', state: 'Ladakh (UT)', slug: 'ladakh', packageCount: 1, highlight: 'High-Altitude Lakes & Passes' },
  { name: 'Manipur', state: 'Manipur', slug: 'manipur', packageCount: 1, highlight: 'Loktak Lake & Floating Islands' },
];

export const STATE_NEARBY_DESTINATIONS: Record<string, NearbyDestinationSuggestion[]> = {
  'Tamil Nadu': [
    { name: 'Ooty', state: 'Tamil Nadu', slug: 'ooty', packageCount: 1, highlight: 'Queen of Hill Stations (Close to Salem & Coimbatore)' },
    { name: 'Rameswaram', state: 'Tamil Nadu', slug: 'rameswaram', packageCount: 1, highlight: 'Sacred Island & Pristine Shoreline' },
    { name: 'Munnar', state: 'Kerala', slug: 'munnar', packageCount: 1, highlight: 'Misty Western Ghats Hill Retreat' },
    { name: 'Kochi', state: 'Kerala', slug: 'kochi-59tx', packageCount: 1, highlight: 'Historic Coastal Port & Backwaters' },
    { name: 'Tirupati', state: 'Andhra Pradesh', slug: 'tirupati-andhra-pradesh', packageCount: 2, highlight: 'Holy Tirumala Balaji Temple Pilgrimage' },
    { name: 'Alleppey (Alappuzha)', state: 'Kerala', slug: 'alleppey-kerala', packageCount: 2, highlight: 'Backwaters & Houseboat Stays' },
  ],
  'Kerala': [
    { name: 'Munnar', state: 'Kerala', slug: 'munnar', packageCount: 1, highlight: 'Tea Plantations & Misty Valleys' },
    { name: 'Kochi', state: 'Kerala', slug: 'kochi-59tx', packageCount: 1, highlight: 'Historic Port & Heritage Island' },
    { name: 'Alleppey (Alappuzha)', state: 'Kerala', slug: 'alleppey-kerala', packageCount: 2, highlight: 'Luxury Houseboat Cruise' },
    { name: 'Ooty', state: 'Tamil Nadu', slug: 'ooty', packageCount: 1, highlight: 'Scenic Nilgiri Mountain Escapes' },
    { name: 'Mangaluru', state: 'Karnataka', slug: 'mangaluru-karnataka', packageCount: 1, highlight: 'Coastal Gateway & Serene Beaches' },
  ],
  'Karnataka': [
    { name: 'Mangaluru', state: 'Karnataka', slug: 'mangaluru-karnataka', packageCount: 1, highlight: 'Coastal Gateway & Coastal Temples' },
    { name: 'Goa', state: 'Goa', slug: 'goa', packageCount: 1, highlight: 'Sun, Sand & Beach Getaway' },
    { name: 'Ooty', state: 'Tamil Nadu', slug: 'ooty', packageCount: 1, highlight: 'Scenic Nilgiri Hills' },
    { name: 'Munnar', state: 'Kerala', slug: 'munnar', packageCount: 1, highlight: 'Misty Hill Station Escape' },
    { name: 'Tirupati', state: 'Andhra Pradesh', slug: 'tirupati-andhra-pradesh', packageCount: 2, highlight: 'Sacred Hill Shrine' },
  ],
  'Andhra Pradesh': [
    { name: 'Tirupati', state: 'Andhra Pradesh', slug: 'tirupati-andhra-pradesh', packageCount: 2, highlight: 'Tirumala Balaji Temple' },
    { name: 'Rameswaram', state: 'Tamil Nadu', slug: 'rameswaram', packageCount: 1, highlight: 'Sacred Island Pilgrimage' },
    { name: 'Mangaluru', state: 'Karnataka', slug: 'mangaluru-karnataka', packageCount: 1, highlight: 'Coastal Konkan Beaches' },
    { name: 'Ooty', state: 'Tamil Nadu', slug: 'ooty', packageCount: 1, highlight: 'Nilgiri Hill Retreat' },
  ],
  'Telangana': [
    { name: 'Tirupati', state: 'Andhra Pradesh', slug: 'tirupati-andhra-pradesh', packageCount: 2, highlight: 'Holy Tirumala Pilgrimage' },
    { name: 'Goa', state: 'Goa', slug: 'goa', packageCount: 1, highlight: 'Coastal Beach Getaway' },
    { name: 'Mangaluru', state: 'Karnataka', slug: 'mangaluru-karnataka', packageCount: 1, highlight: 'Konkan Coastline' },
    { name: 'Jaipur', state: 'Rajasthan', slug: 'jaipur-rajasthan', packageCount: 2, highlight: 'Royal Heritage Golden Triangle' },
  ],
  'Puducherry': [
    { name: 'Ooty', state: 'Tamil Nadu', slug: 'ooty', packageCount: 1, highlight: 'Nilgiri Mountain Retreat' },
    { name: 'Rameswaram', state: 'Tamil Nadu', slug: 'rameswaram', packageCount: 1, highlight: 'Sacred Island Coastal Yatra' },
    { name: 'Kochi', state: 'Kerala', slug: 'kochi-59tx', packageCount: 1, highlight: 'Colonial Port & Arabian Sea' },
  ],
  'Himachal Pradesh': [
    { name: 'Manali', state: 'Himachal Pradesh', slug: 'manali-himachal-pradesh', packageCount: 2, highlight: 'Snow Peaks, Solang & Rohtang Pass' },
    { name: 'Rishikesh & Haridwar', state: 'Uttarakhand', slug: 'rishikesh-haridwar-uttarakhand', packageCount: 2, highlight: 'Holy Ganga & River Rafting' },
    { name: 'Sonamarg', state: 'Jammu and Kashmir', slug: 'sonamarg-7bjy', packageCount: 1, highlight: 'Meadow of Gold & Glaciers' },
    { name: 'Ladakh', state: 'Ladakh (UT)', slug: 'ladakh', packageCount: 1, highlight: 'High-Altitude Himalayan Desert' },
  ],
  'Uttarakhand': [
    { name: 'Rishikesh & Haridwar', state: 'Uttarakhand', slug: 'rishikesh-haridwar-uttarakhand', packageCount: 2, highlight: 'Ganga Aarti, Rafting & Yoga' },
    { name: 'Manali', state: 'Himachal Pradesh', slug: 'manali-himachal-pradesh', packageCount: 2, highlight: 'Himalayan Snow Peaks & Valleys' },
    { name: 'Varanasi', state: 'Uttar Pradesh', slug: 'varanasi-uttar-pradesh', packageCount: 2, highlight: 'Sacred Ancient Ghats' },
    { name: 'Jaipur', state: 'Rajasthan', slug: 'jaipur-rajasthan', packageCount: 2, highlight: 'Royal Forts & Palaces' },
  ],
  'Delhi': [
    { name: 'Manali', state: 'Himachal Pradesh', slug: 'manali-himachal-pradesh', packageCount: 2, highlight: 'Quick Himalayan Hill Station Escape' },
    { name: 'Rishikesh & Haridwar', state: 'Uttarakhand', slug: 'rishikesh-haridwar-uttarakhand', packageCount: 2, highlight: 'Weekend Ganga Spiritual Retreat' },
    { name: 'Jaipur', state: 'Rajasthan', slug: 'jaipur-rajasthan', packageCount: 2, highlight: 'Pink City Royal Weekend Getaway' },
    { name: 'Varanasi', state: 'Uttar Pradesh', slug: 'varanasi-uttar-pradesh', packageCount: 2, highlight: 'Spiritual Yatra & Aarti' },
  ],
  'Haryana': [
    { name: 'Manali', state: 'Himachal Pradesh', slug: 'manali-himachal-pradesh', packageCount: 2, highlight: 'Himalayan Adventure' },
    { name: 'Rishikesh & Haridwar', state: 'Uttarakhand', slug: 'rishikesh-haridwar-uttarakhand', packageCount: 2, highlight: 'Holy Ganga Escapes' },
    { name: 'Jaipur', state: 'Rajasthan', slug: 'jaipur-rajasthan', packageCount: 2, highlight: 'Royal Heritage Tours' },
  ],
  'Punjab': [
    { name: 'Manali', state: 'Himachal Pradesh', slug: 'manali-himachal-pradesh', packageCount: 2, highlight: 'Snowy Himalayan Valleys' },
    { name: 'Rishikesh & Haridwar', state: 'Uttarakhand', slug: 'rishikesh-haridwar-uttarakhand', packageCount: 2, highlight: 'Holy Foothills of the Himalayas' },
    { name: 'Sonamarg', state: 'Jammu and Kashmir', slug: 'sonamarg-7bjy', packageCount: 1, highlight: 'Kashmir Valley & Glaciers' },
  ],
  'Chandigarh': [
    { name: 'Manali', state: 'Himachal Pradesh', slug: 'manali-himachal-pradesh', packageCount: 2, highlight: 'Scenic Mountain Drive & Snow Valley' },
    { name: 'Rishikesh & Haridwar', state: 'Uttarakhand', slug: 'rishikesh-haridwar-uttarakhand', packageCount: 2, highlight: 'Spiritual River Retreat' },
  ],
  'Rajasthan': [
    { name: 'Jaipur', state: 'Rajasthan', slug: 'jaipur-rajasthan', packageCount: 2, highlight: 'Palaces, Forts & Royal Bazaars' },
    { name: 'Rishikesh & Haridwar', state: 'Uttarakhand', slug: 'rishikesh-haridwar-uttarakhand', packageCount: 2, highlight: 'Ganga Foothills Retreat' },
    { name: 'Varanasi', state: 'Uttar Pradesh', slug: 'varanasi-uttar-pradesh', packageCount: 2, highlight: 'Ancient Ghats & Kashi Vishwanath' },
    { name: 'Goa', state: 'Goa', slug: 'goa', packageCount: 1, highlight: 'Tropical Coastal Escape' },
  ],
  'Uttar Pradesh': [
    { name: 'Varanasi', state: 'Uttar Pradesh', slug: 'varanasi-uttar-pradesh', packageCount: 2, highlight: 'Kashi Vishwanath & Ganga Aarti' },
    { name: 'Rishikesh & Haridwar', state: 'Uttarakhand', slug: 'rishikesh-haridwar-uttarakhand', packageCount: 2, highlight: 'Holy Ganga Spiritual Gateway' },
    { name: 'Jaipur', state: 'Rajasthan', slug: 'jaipur-rajasthan', packageCount: 2, highlight: 'Royal Forts & Palaces' },
    { name: 'Manali', state: 'Himachal Pradesh', slug: 'manali-himachal-pradesh', packageCount: 2, highlight: 'Himalayan Mountain Adventure' },
  ],
  'Bihar': [
    { name: 'Varanasi', state: 'Uttar Pradesh', slug: 'varanasi-uttar-pradesh', packageCount: 2, highlight: 'Close Spiritual Hub & Ganga Ghats' },
    { name: 'Rishikesh & Haridwar', state: 'Uttarakhand', slug: 'rishikesh-haridwar-uttarakhand', packageCount: 2, highlight: 'Himalayan Foothills Yatra' },
    { name: 'Jaipur', state: 'Rajasthan', slug: 'jaipur-rajasthan', packageCount: 2, highlight: 'Heritage & Palaces' },
  ],
  'Maharashtra': [
    { name: 'Goa', state: 'Goa', slug: 'goa', packageCount: 1, highlight: 'Beach Paradise & Vibrant Coastal Life' },
    { name: 'Mangaluru', state: 'Karnataka', slug: 'mangaluru-karnataka', packageCount: 1, highlight: 'Konkan Coast & Pristine Beaches' },
    { name: 'Jaipur', state: 'Rajasthan', slug: 'jaipur-rajasthan', packageCount: 2, highlight: 'Royal Heritage Gateway' },
    { name: 'Munnar', state: 'Kerala', slug: 'munnar', packageCount: 1, highlight: 'Tea Hills & Fresh Air' },
  ],
  'Gujarat': [
    { name: 'Jaipur', state: 'Rajasthan', slug: 'jaipur-rajasthan', packageCount: 2, highlight: 'Royal Palaces & Forts' },
    { name: 'Goa', state: 'Goa', slug: 'goa', packageCount: 1, highlight: 'Coastal Beach Escapes' },
    { name: 'Mangaluru', state: 'Karnataka', slug: 'mangaluru-karnataka', packageCount: 1, highlight: 'Konkan Coastline' },
    { name: 'Varanasi', state: 'Uttar Pradesh', slug: 'varanasi-uttar-pradesh', packageCount: 2, highlight: 'Spiritual Yatra' },
  ],
  'Madhya Pradesh': [
    { name: 'Jaipur', state: 'Rajasthan', slug: 'jaipur-rajasthan', packageCount: 2, highlight: 'Royal Heritage Gateway' },
    { name: 'Varanasi', state: 'Uttar Pradesh', slug: 'varanasi-uttar-pradesh', packageCount: 2, highlight: 'Sacred Kashi & Ganga Aarti' },
    { name: 'Rishikesh & Haridwar', state: 'Uttarakhand', slug: 'rishikesh-haridwar-uttarakhand', packageCount: 2, highlight: 'Spiritual River Oasis' },
    { name: 'Goa', state: 'Goa', slug: 'goa', packageCount: 1, highlight: 'Sun, Sand & Beach Relaxation' },
  ],
  'West Bengal': [
    { name: 'Varanasi', state: 'Uttar Pradesh', slug: 'varanasi-uttar-pradesh', packageCount: 2, highlight: 'Sacred Holy City & Ganga Aarti' },
    { name: 'Manipur', state: 'Manipur', slug: 'manipur', packageCount: 1, highlight: 'Northeast Natural Wonders' },
    { name: 'Rishikesh & Haridwar', state: 'Uttarakhand', slug: 'rishikesh-haridwar-uttarakhand', packageCount: 2, highlight: 'Spiritual River Oasis' },
  ],
  'Odisha': [
    { name: 'Varanasi', state: 'Uttar Pradesh', slug: 'varanasi-uttar-pradesh', packageCount: 2, highlight: 'Holy City & Sacred Ghats' },
    { name: 'Rameswaram', state: 'Tamil Nadu', slug: 'rameswaram', packageCount: 1, highlight: 'Spiritual Coastal Pilgrimage' },
    { name: 'Tirupati', state: 'Andhra Pradesh', slug: 'tirupati-andhra-pradesh', packageCount: 2, highlight: 'Sacred Balaji Darshan' },
  ],
  'Jammu and Kashmir': [
    { name: 'Sonamarg', state: 'Jammu and Kashmir', slug: 'sonamarg-7bjy', packageCount: 1, highlight: 'Pristine Snow & Thajiwas Glacier' },
    { name: 'Ladakh', state: 'Ladakh (UT)', slug: 'ladakh', packageCount: 1, highlight: 'Pangong Tso & High Mountain Passes' },
    { name: 'Manali', state: 'Himachal Pradesh', slug: 'manali-himachal-pradesh', packageCount: 2, highlight: 'Rohtang Pass & Solang Valley' },
  ],
  'Ladakh': [
    { name: 'Ladakh', state: 'Ladakh (UT)', slug: 'ladakh', packageCount: 1, highlight: 'High-Altitude Passes & Monasteries' },
    { name: 'Sonamarg', state: 'Jammu and Kashmir', slug: 'sonamarg-7bjy', packageCount: 1, highlight: 'Kashmir Valley & Glaciers' },
    { name: 'Manali', state: 'Himachal Pradesh', slug: 'manali-himachal-pradesh', packageCount: 2, highlight: 'Manali-Leh Highway Hub' },
  ],
  'Goa': [
    { name: 'Goa', state: 'Goa', slug: 'goa', packageCount: 1, highlight: 'Sun, Sand & Beach Escapes' },
    { name: 'Mangaluru', state: 'Karnataka', slug: 'mangaluru-karnataka', packageCount: 1, highlight: 'Pristine Konkan Coastline' },
    { name: 'Kochi', state: 'Kerala', slug: 'kochi-59tx', packageCount: 1, highlight: 'Historic Port & Backwaters' },
    { name: 'Ooty', state: 'Tamil Nadu', slug: 'ooty', packageCount: 1, highlight: 'Misty Mountain Retreat' },
  ],
  'Manipur': [
    { name: 'Manipur', state: 'Manipur', slug: 'manipur', packageCount: 1, highlight: 'Loktak Lake & Rich Tribal Culture' },
    { name: 'Varanasi', state: 'Uttar Pradesh', slug: 'varanasi-uttar-pradesh', packageCount: 2, highlight: 'Sacred Heritage Yatra' },
    { name: 'Manali', state: 'Himachal Pradesh', slug: 'manali-himachal-pradesh', packageCount: 2, highlight: 'Himalayan Mountain Adventure' },
  ],
  'Assam': [
    { name: 'Manipur', state: 'Manipur', slug: 'manipur', packageCount: 1, highlight: 'Explore Northeast Wonders' },
    { name: 'Varanasi', state: 'Uttar Pradesh', slug: 'varanasi-uttar-pradesh', packageCount: 2, highlight: 'Ancient Ghats & Temples' },
    { name: 'Manali', state: 'Himachal Pradesh', slug: 'manali-himachal-pradesh', packageCount: 2, highlight: 'Himalayan Peaks' },
  ],
  'Meghalaya': [
    { name: 'Manipur', state: 'Manipur', slug: 'manipur', packageCount: 1, highlight: 'Northeast Natural Splendor' },
    { name: 'Varanasi', state: 'Uttar Pradesh', slug: 'varanasi-uttar-pradesh', packageCount: 2, highlight: 'Sacred Cultural Heritage' },
  ],
  'Sikkim': [
    { name: 'Manali', state: 'Himachal Pradesh', slug: 'manali-himachal-pradesh', packageCount: 2, highlight: 'Himalayan Alpine Expeditions' },
    { name: 'Rishikesh & Haridwar', state: 'Uttarakhand', slug: 'rishikesh-haridwar-uttarakhand', packageCount: 2, highlight: 'Foothills & River Rafting' },
    { name: 'Sonamarg', state: 'Jammu and Kashmir', slug: 'sonamarg-7bjy', packageCount: 1, highlight: 'Meadows of Gold' },
  ]
};

export function getNearbyDestinations(queryOrCity: string, stateHint?: string): NearbyDestinationSuggestion[] {
  const normQuery = normalizeLocationText(queryOrCity);
  if (!normQuery && !stateHint) return TOP_POPULAR_DESTINATIONS.slice(0, 5);

  let stateName = stateHint;

  // Try to find matching city or state in INDIA_LOCATIONS
  if (!stateName) {
    const matchedLoc = INDIA_LOCATIONS.find(
      (loc) =>
        loc.normalizedName === normQuery ||
        loc.aliases.some((a) => normalizeLocationText(a) === normQuery)
    );
    if (matchedLoc) {
      stateName = matchedLoc.state;
    }
  }

  // Fallback: check if query is directly part of state code or state name
  if (!stateName) {
    const matchedState = Object.keys(STATE_CODE_MAP).find(
      (s) => normalizeLocationText(s) === normQuery || normalizeLocationText(s).includes(normQuery)
    );
    if (matchedState) {
      stateName = matchedState;
    }
  }

  const suggestions: NearbyDestinationSuggestion[] = [];
  const addedNames = new Set<string>();

  // Add state-specific nearby destinations
  if (stateName && STATE_NEARBY_DESTINATIONS[stateName]) {
    for (const item of STATE_NEARBY_DESTINATIONS[stateName]) {
      if (normalizeLocationText(item.name) !== normQuery && !addedNames.has(item.name.toLowerCase())) {
        suggestions.push(item);
        addedNames.add(item.name.toLowerCase());
      }
    }
  }

  // Fill in with top popular destinations if fewer than 4 suggestions
  for (const item of TOP_POPULAR_DESTINATIONS) {
    if (suggestions.length >= 5) break;
    if (normalizeLocationText(item.name) !== normQuery && !addedNames.has(item.name.toLowerCase())) {
      suggestions.push(item);
      addedNames.add(item.name.toLowerCase());
    }
  }

  return suggestions.slice(0, 5);
}

export function searchIndiaLocations(query: string, limit = 15): IndiaLocation[] {
  const normalizedQuery = normalizeLocationText(query);
  if (!normalizedQuery) return [];

  const ranked: Array<{ location: IndiaLocation; score: number }> = [];

  for (const location of INDIA_LOCATIONS) {
    if (!location.searchable) continue;

    const normalizedName = normalizeLocationText(location.name);
    const normalizedState = normalizeLocationText(location.state);
    const aliasText = location.aliases.map(normalizeLocationText).join(' ');

    let score = 0;
    const exactName = normalizedName === normalizedQuery;
    const exactAlias = location.aliases.some((alias) => normalizeLocationText(alias) === normalizedQuery);
    const nameStartsWith = normalizedName.startsWith(normalizedQuery);
    const aliasStartsWith = location.aliases.some((alias) => normalizeLocationText(alias).startsWith(normalizedQuery));
    const nameWordMatch = normalizedName.split(/\s+/).some((w) => w.startsWith(normalizedQuery));
    const nameContains = normalizedName.includes(normalizedQuery);
    const aliasContains = aliasText.includes(normalizedQuery);

    if (exactName) score += 20000;
    else if (exactAlias) score += 18000;
    else if (nameStartsWith) score += 15000;
    else if (nameWordMatch) score += 14000;
    else if (aliasStartsWith) score += 13000;
    else if (nameContains) score += 4000;
    else if (aliasContains) score += 3000;

    // State name match
    if (normalizedState === normalizedQuery) {
      score += location.type === 'STATE' || location.type === 'UNION_TERRITORY' ? 16000 : 3500;
    } else if (normalizedState.startsWith(normalizedQuery)) {
      score += location.type === 'STATE' || location.type === 'UNION_TERRITORY' ? 11000 : 2500;
    } else if (normalizedState.includes(normalizedQuery)) {
      score += location.type === 'STATE' || location.type === 'UNION_TERRITORY' ? 2000 : 1000;
    }

    if (score > 0) {
      const typePriority: Record<IndiaLocationType, number> = {
        DESTINATION: 6,
        CITY: 4,
        DISTRICT: 3,
        STATE: 5,
        UNION_TERRITORY: 4,
        TOWN: 2,
        COUNTRY: 1,
      };
      score += (typePriority[location.type] || 2) * 50;
      ranked.push({ location, score });
    }
  }

  return ranked
    .sort((a, b) => b.score - a.score || a.location.name.localeCompare(b.location.name))
    .slice(0, limit)
    .map(({ location }) => location);
}
