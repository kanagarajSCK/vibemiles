'use client';

import React from 'react';
import { Users } from 'lucide-react';
import { TravelTypeCard, type TravelTypeId } from './TravelTypeCard';
import { TripVibeSelector } from './TripVibeSelector';

export type { TravelTypeId };

export interface TravelType {
  id: TravelTypeId;
  emoji: string;
  title: string;
  subtitle: string;
  tagline: string;
  description: string;
  image: string;
  vibes: string[];
}

export const TRAVEL_TYPES: TravelType[] = [
  { id: 'solo', emoji: '🧭', title: 'Solo', subtitle: 'Just me', tagline: 'Independent escapes', description: 'Discover places, experiences and adventures made for independent travelers.', image: '/travel-solo.jpg', vibes: ['Adventure', 'Nature', 'Beach', 'Culture', 'Wellness'] },
  { id: 'couple', emoji: '💑', title: 'Couple', subtitle: 'Just us', tagline: 'Getaways for two', description: 'Romantic stays, scenic escapes and memorable experiences for two.', image: '/travel-couple.jpg', vibes: ['Romantic', 'Beach', 'Luxury', 'Mountain', 'Relaxing'] },
  { id: 'family', emoji: '👨‍👩‍👧‍👦', title: 'Family', subtitle: 'Together', tagline: 'Memories together', description: 'Comfortable destinations and experiences the whole family can enjoy.', image: '/travel-family.jpg', vibes: ['Kid Friendly', 'Nature', 'Beach', 'Comfort', 'Adventure'] },
  { id: 'friends', emoji: '🎒', title: 'Friends', subtitle: 'Our gang', tagline: 'Trips with your crew', description: 'Adventure, road trips, beaches and experiences made for your crew.', image: '/travel-friends.jpg', vibes: ['Adventure', 'Road Trip', 'Beach', 'Camping', 'Nightlife'] },
];

interface TravelTypeSelectorProps {
  selected: TravelTypeId | '';
  onSelect: (id: TravelTypeId | '') => void;
  selectedVibe: string;
  onSelectVibe: (vibe: string) => void;
  compact?: boolean;
}

export const TravelTypeSelector: React.FC<TravelTypeSelectorProps> = ({ selected, onSelect, selectedVibe, onSelectVibe, compact = false }) => {
  const handleSelect = (id: TravelTypeId) => {
    if (selected === id) { onSelect(''); onSelectVibe(''); } else { onSelect(id); onSelectVibe(''); }
  };
  const activeType = TRAVEL_TYPES.find((t) => t.id === selected);

  if (compact) {
    return (
      <div className="space-y-2">
        <div role="radiogroup" aria-label="Who is coming along?" className="grid grid-cols-2 gap-1.5">
          {TRAVEL_TYPES.map((type) => (
            <TravelTypeCard key={type.id} id={type.id} image={type.image} title={type.title} subtitle={type.subtitle} tagline={type.tagline} selected={selected === type.id} onSelect={handleSelect} compact />
          ))}
        </div>
        {activeType && <TripVibeSelector label="What kind of trip?" vibes={activeType.vibes} selected={selectedVibe} onSelect={onSelectVibe} />}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">
        <Users className="h-3.5 w-3.5 text-teal-600" /> Travelling With
      </div>
      <div role="radiogroup" aria-label="Who is coming along?" className="grid grid-cols-2 gap-2">
        {TRAVEL_TYPES.map((type) => (
          <TravelTypeCard key={type.id} id={type.id} image={type.image} title={type.title} subtitle={type.subtitle} tagline={type.tagline} selected={selected === type.id} onSelect={handleSelect} compact />
        ))}
      </div>
      {activeType && <TripVibeSelector label="Trip Vibe" vibes={activeType.vibes} selected={selectedVibe} onSelect={onSelectVibe} />}
    </div>
  );
};
