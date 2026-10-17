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

const CITY_MAP: Record<string, string[]> = {
  'Andhra Pradesh': ['Visakhapatnam', 'Vijayawada', 'Guntur', 'Tirupati', 'Anantapur', 'Rajahmundry', 'Kakinada', 'Araku Valley', 'Chittoor'],
  'Arunachal Pradesh': ['Itanagar', 'Tawang', 'Bomdila', 'Ziro'],
  'Assam': ['Guwahati', 'Kaziranga', 'Shillong', 'Majuli', 'Silchar', 'Tezpur'],
  'Bihar': ['Patna', 'Gaya', 'Nalanda', 'Bodh Gaya', 'Muzaffarpur'],
  'Chhattisgarh': ['Raipur', 'Bastar', 'Jagdalpur', 'Bilaspur'],
  'Goa': ['Panaji', 'North Goa', 'South Goa', 'Calangute', 'Baga', 'Anjuna', 'Vagator'],
  'Gujarat': ['Ahmedabad', 'Surat', 'Vadodara', 'Gandhinagar', 'Gir', 'Kutch'],
  'Haryana': ['Gurugram', 'Faridabad', 'Chandigarh', 'Karnal'],
  'Himachal Pradesh': ['Shimla', 'Manali', 'Dharamshala', 'Kullu', 'Kasol', 'Dalhousie', 'Spiti', 'Mandi'],
  'Jharkhand': ['Ranchi', 'Jamshedpur', 'Hazaribagh', 'Deoghar', 'Dhanbad'],
  'Karnataka': ['Bengaluru', 'Mysuru', 'Mangaluru', 'Hubballi', 'Coorg', 'Chikmagalur', 'Hampi', 'Gokarna', 'Udupi'],
  'Kerala': ['Kochi', 'Thiruvananthapuram', 'Kozhikode', 'Kollam', 'Thrissur', 'Alappuzha', 'Munnar', 'Wayanad', 'Varkala'],
  'Madhya Pradesh': ['Bhopal', 'Indore', 'Gwalior', 'Jabalpur', 'Khajuraho', 'Ujjain'],
  'Maharashtra': ['Mumbai', 'Pune', 'Nashik', 'Nagpur', 'Aurangabad', 'Lonavala', 'Mahabaleshwar'],
  'Manipur': ['Imphal', 'Loktak Lake'],
  'Meghalaya': ['Shillong', 'Cherapunji', 'Mawlynnong'],
  'Mizoram': ['Aizawl', 'Lunglei'],
  'Nagaland': ['Kohima', 'Dimapur'],
  'Odisha': ['Bhubaneswar', 'Puri', 'Konark', 'Cuttack'],
  'Punjab': ['Amritsar', 'Ludhiana', 'Chandigarh', 'Jalandhar', 'Patiala'],
  'Rajasthan': ['Jaipur', 'Udaipur', 'Jodhpur', 'Jaisalmer', 'Pushkar', 'Mount Abu', 'Bikaner'],
  'Sikkim': ['Gangtok', 'Pelling', 'Lachung'],
  'Tamil Nadu': ['Chennai', 'Coimbatore', 'Madurai', 'Salem', 'Tiruchirappalli', 'Tirunelveli', 'Ooty', 'Kodaikanal', 'Rameswaram', 'Kanyakumari', 'Krishnagiri', 'Hosur'],
  'Telangana': ['Hyderabad', 'Warangal'],
  'Tripura': ['Agartala', 'Udaipur'],
  'Uttar Pradesh': ['Lucknow', 'Agra', 'Varanasi', 'Mathura', 'Prayagraj', 'Ayodhya'],
  'Uttarakhand': ['Dehradun', 'Rishikesh', 'Haridwar', 'Nainital', 'Mussoorie', 'Jim Corbett', 'Auli', 'Kedarnath'],
  'West Bengal': ['Kolkata', 'Darjeeling', 'Sundarbans', 'Digha']
};

const CITY_ALIASES: Record<string, string[]> = {
  Mumbai: ['Bombay', 'Mum'], Bengaluru: ['Bangalore', 'BLR'], Kolkata: ['Calcutta'],
  Chennai: ['Madras', 'MAA'], Kochi: ['Cochin'], Thiruvananthapuram: ['Trivandrum'],
  Ooty: ['Udhagamandalam'], Puducherry: ['Pondicherry', 'Pondy'], Delhi: ['New Delhi'],
  Mangaluru: ['Mangalore'], Mysuru: ['Mysore'], Rameswaram: ['Rameshwaram'],
  Guwahati: ['Gauhati']
};

// Auto-infer district or destination classifications dynamically
function determineType(name: string, stateName: string): IndiaLocationType {
  const lowercaseVal = normalizeLocationText(name);
  if (lowercaseVal.includes('district')) return 'DISTRICT';
  if (['goa', 'delhi', 'puducherry', 'manali', 'ooty', 'munnar', 'spiti', 'coorg', 'hampi'].includes(lowercaseVal)) return 'DESTINATION';
  return 'CITY'; // Default to City. Expanding this map grows capabilities over time.
}

const buildLocations = (): IndiaLocation[] => {
  const items: IndiaLocation[] = [...STATE_LOCATIONS, ...UT_LOCATIONS] as IndiaLocation[];
  for (const [stateName, cities] of Object.entries(CITY_MAP)) {
    const stateCode = STATE_CODE_MAP[stateName] ?? 'IN';
    for (const rawName of cities) {
      const name = rawName.trim();
      const id = `loc-${normalizeLocationText(stateName)}-${normalizeLocationText(name).replace(/\s+/g, '-')}`;
      items.push({
        id, name, type: determineType(name, stateName),
        state: stateName, stateCode, country: 'India', countryCode: 'IN',
        district: stateName, // Simple mapping, ideally populated dynamically
        aliases: CITY_ALIASES[name] ?? [], searchable: true,
        normalizedName: normalizeLocationText(name),
      });
    }
  }
  return items;
};

export const INDIA_LOCATIONS: IndiaLocation[] = buildLocations();

export function searchIndiaLocations(query: string, limit = 12): IndiaLocation[] {
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
    const shortFuzzyMatch = normalizedQuery.length <= 3 && [...normalizedQuery].every((char) => normalizedName.includes(char) || normalizedState.includes(char) || aliasText.includes(char));

    if (exactName) score += 10000;
    if (exactAlias) score += 9000;
    if (nameStartsWith) score += 8500;
    if (aliasStartsWith) score += 8200;
    
    // Very simple state matching support (like typing "tamil" should prioritize Tamil Nadu, but also "nadu" works via contains)
    if (normalizedState.startsWith(normalizedQuery) || normalizedState.includes(normalizedQuery)) {
        if (location.type === 'STATE' || location.type === 'UNION_TERRITORY') score += 7000;
        else score += 3000;
    }
    
    if (normalizedName.includes(normalizedQuery)) score += 6000;
    if (aliasText.includes(normalizedQuery)) score += 5000;
    if (shortFuzzyMatch && normalizedQuery.length > 0) score += 1000;

    // Favor destinations and cities heavily if they prefix match accurately.
    const typePriority = { COUNTRY: 1, STATE: 5, UNION_TERRITORY: 4, DISTRICT: 3, CITY: 2, DESTINATION: 6, TOWN: 2 };
    score += typePriority[location.type] * 200;

    if (score > 0) ranked.push({ location, score });
  }

  return ranked.sort((a, b) => b.score - a.score || a.location.name.localeCompare(b.location.name))
    .slice(0, limit).map(({ location }) => location);
}
