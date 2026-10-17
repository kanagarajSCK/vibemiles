import { MOCK_DESTINATIONS } from '@/lib/mock-data';

export interface DestinationSuggestion {
  id: string;
  slug: string;
  name: string;
  state: string;
  country: string;
  heroImage?: string;
  aliases?: string[];
  nearbyIds?: string[];
}

const ADDITIONAL_DESTINATIONS: DestinationSuggestion[] = [
  { id: 'dest-munnar', slug: 'munnar-kerala', name: 'Munnar', state: 'Kerala', country: 'India', aliases: ['munnar hills'] },
  { id: 'dest-mahabalipuram', slug: 'mahabalipuram-tamil-nadu', name: 'Mahabalipuram', state: 'Tamil Nadu', country: 'India', aliases: ['mamallapuram'] },
  { id: 'dest-madurai', slug: 'madurai-tamil-nadu', name: 'Madurai', state: 'Tamil Nadu', country: 'India', aliases: ['meenakshi temple city'] },
  { id: 'dest-manikaran', slug: 'manikaran-himachal-pradesh', name: 'Manikaran', state: 'Himachal Pradesh', country: 'India', aliases: ['kasol manikaran'] },
  { id: 'dest-mashobra', slug: 'mashobra-himachal-pradesh', name: 'Mashobra', state: 'Himachal Pradesh', country: 'India' },
  { id: 'dest-mandi', slug: 'mandi-himachal-pradesh', name: 'Mandi', state: 'Himachal Pradesh', country: 'India' },
  { id: 'dest-mandrem', slug: 'mandrem-goa', name: 'Mandrem', state: 'Goa', country: 'India', aliases: ['mandrem beach'] },
  { id: 'dest-malana', slug: 'malana-himachal-pradesh', name: 'Malana', state: 'Himachal Pradesh', country: 'India' },
];

const EXISTING_DESTINATIONS: DestinationSuggestion[] = MOCK_DESTINATIONS.map((destination) => ({
  id: destination.id,
  slug: destination.slug,
  name: destination.name,
  state: destination.state,
  country: destination.country,
  heroImage: destination.heroImage,
}));

const DESTINATIONS_BY_ID = new Map(
  [...EXISTING_DESTINATIONS, ...ADDITIONAL_DESTINATIONS].map((destination) => [destination.id, destination])
);

const MANALI_NEARBY_IDS = ['dest-manikaran', 'dest-mandi', 'dest-mashobra', 'dest-malana'];

export const DESTINATION_SUGGESTIONS: DestinationSuggestion[] = [
  ...EXISTING_DESTINATIONS.map((destination) =>
    destination.id === 'dest-1' ? { ...destination, nearbyIds: MANALI_NEARBY_IDS } : destination
  ),
  ...ADDITIONAL_DESTINATIONS,
];

export function getDestinationSuggestions(query: string): DestinationSuggestion[] {
  const normalizedQuery = query.trim().toLocaleLowerCase();
  if (normalizedQuery.length < 2) return [];

  const matches = DESTINATION_SUGGESTIONS
    .map((destination) => {
      const searchableText = [
        destination.name,
        destination.state,
        destination.country,
        ...(destination.aliases ?? []),
      ].join(' ').toLocaleLowerCase();
      const normalizedName = destination.name.toLocaleLowerCase();
      let score = searchableText.includes(normalizedQuery) ? 100 : 0;

      if (normalizedName === normalizedQuery) score = 1000;
      else if (normalizedName.startsWith(normalizedQuery)) score = 800;
      else if (normalizedName.includes(normalizedQuery)) score = 650;
      else if (destination.state.toLocaleLowerCase().startsWith(normalizedQuery)) score = 500;

      return { destination, score };
    })
    .filter(({ score }) => score > 0);

  const exactMatch = matches.find(({ destination }) => destination.name.toLocaleLowerCase() === normalizedQuery);
  if (exactMatch) {
    for (const nearbyId of exactMatch.destination.nearbyIds ?? []) {
      const nearbyDestination = DESTINATIONS_BY_ID.get(nearbyId);
      if (nearbyDestination && !matches.some(({ destination }) => destination.id === nearbyDestination.id)) {
        matches.push({ destination: nearbyDestination, score: 600 });
      }
    }
  }

  return matches
    .sort((a, b) => b.score - a.score || a.destination.name.localeCompare(b.destination.name))
    .map(({ destination }) => destination);
}
