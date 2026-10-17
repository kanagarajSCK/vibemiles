import React from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { ROUTES } from '@/constants';

const TRAVEL_STYLES = [
  {
    id: 'solo',
    title: 'Solo Escapes',
    desc: 'Discover places, experiences and adventures made for independent travelers.',
    emoji: '🧭',
    gradient: 'from-teal-900 via-teal-800 to-slate-900',
    href: `${ROUTES.PACKAGES}?travelType=solo`,
  },
  {
    id: 'couple',
    title: 'Couple Getaways',
    desc: 'Romantic stays, scenic escapes and memorable experiences for two.',
    emoji: '💑',
    gradient: 'from-rose-900 via-rose-800 to-slate-900',
    href: `${ROUTES.PACKAGES}?travelType=couple`,
  },
  {
    id: 'family',
    title: 'Family Adventures',
    desc: 'Comfortable destinations and experiences the whole family can enjoy.',
    emoji: '👨‍👩‍👧‍👦',
    gradient: 'from-amber-900 via-amber-800 to-slate-900',
    href: `${ROUTES.PACKAGES}?travelType=family`,
  },
  {
    id: 'friends',
    title: 'Friends Trips',
    desc: 'Adventure, road trips, beaches and experiences made for your crew.',
    emoji: '🎒',
    gradient: 'from-indigo-900 via-indigo-800 to-slate-900',
    href: `${ROUTES.PACKAGES}?travelType=friends`,
  },
];

export const TravelStyleSection: React.FC = () => {
  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-8">
      <div className="text-center max-w-2xl mx-auto space-y-2">
        <span className="text-xs font-bold uppercase tracking-wider text-teal-700">
          Travel by Style
        </span>
        <h2 className="text-3xl font-extrabold text-slate-900">
          Explore by Travel Style
        </h2>
        <p className="text-sm text-slate-500">
          Find trips designed around the way you love to travel.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {TRAVEL_STYLES.map((style) => (
          <Link
            key={style.id}
            href={style.href}
            className="group relative flex flex-col justify-end overflow-hidden rounded-2xl border border-slate-200 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md aspect-[4/5] sm:aspect-[3/4] lg:aspect-auto lg:h-72"
          >
            {/* Background gradient */}
            <div className={`absolute inset-0 bg-gradient-to-b ${style.gradient}`} />

            {/* Subtle texture overlay */}
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_30%_20%,_rgba(255,255,255,0.3)_0%,_transparent_60%)]" />

            {/* Emoji icon — center */}
            <div className="absolute inset-0 flex items-center justify-center">
              <span
                className="text-6xl sm:text-7xl transition-transform duration-300 group-hover:scale-110 select-none"
                aria-hidden="true"
              >
                {style.emoji}
              </span>
            </div>

            {/* Bottom content */}
            <div className="relative z-10 p-5 space-y-1.5 bg-gradient-to-t from-black/70 via-black/30 to-transparent pt-20">
              <h3 className="font-bold text-white text-base leading-tight">{style.title}</h3>
              <p className="text-xs text-white/70 leading-relaxed line-clamp-2">{style.desc}</p>
              <div className="inline-flex items-center gap-1 text-xs font-bold text-teal-300 group-hover:text-white transition-colors pt-1">
                Explore Trips <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
};
