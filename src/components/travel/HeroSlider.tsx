'use client';

import React, { useState, useEffect } from 'react';

const HERO_IMAGES = [
  {
    src: '/hero-waterfall.jpg',
    alt: 'Jog Falls — Karnataka, India',
    label: 'Karnataka',
    subtitle: 'Jog Falls — Cascading Wonders',
  },
  {
    src: '/hero-kashmir.jpg',
    alt: 'Kashmir Valley — Snow-Capped Mountains',
    label: 'Kashmir',
    subtitle: 'Paradise on Earth — Snow Valley',
  },
  {
    src: '/hero-victoria.jpg',
    alt: 'Victoria Memorial — Kolkata',
    label: 'Kolkata',
    subtitle: 'Victoria Memorial — Crown of Heritage',
  },
  {
    src: '/hero-hampi.jpg',
    alt: 'Hampi Temple Ruins — Karnataka',
    label: 'Hampi',
    subtitle: 'Ancient Ruins at Sunset',
  },
];

interface HeroSliderProps {
  interval?: number; // ms per slide, default 3000
}

export const HeroSlider: React.FC<HeroSliderProps> = ({ interval = 6000 }) => {
  const [current, setCurrent] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrent((prev) => (prev + 1) % HERO_IMAGES.length);
        setIsTransitioning(false);
      }, 600); // crossfade duration
    }, interval);

    return () => clearInterval(timer);
  }, [interval]);

  return (
    <div className="absolute inset-x-0 top-0 z-0 h-[50vh] w-full overflow-hidden sm:inset-0 sm:h-auto">
      {HERO_IMAGES.map((img, idx) => (
        <div
          key={img.src}
          className="absolute inset-0 transition-opacity duration-700 ease-in-out"
          style={{ opacity: idx === current ? (isTransitioning ? 0 : 1) : 0 }}
        >
          <img
            src={img.src}
            alt={img.alt}
            className="h-full w-full object-cover object-center"
            loading={idx === 0 ? 'eager' : 'lazy'}
          />
          {/* Dark gradient overlay */}
          <div className="absolute inset-0 bg-linear-to-t from-slate-950/95 via-slate-900/65 to-slate-900/40 sm:from-slate-950 sm:via-slate-900/60 sm:to-slate-900/30" />
        </div>
      ))}

      {/* Location badge (bottom-left) */}
      <div className="absolute bottom-6 left-6 z-10 flex items-center gap-2 rounded-full border border-white/20 bg-black/40 px-3 py-1.5 backdrop-blur-md">
        <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
        <span className="text-xs font-semibold text-white">
          {HERO_IMAGES[current].subtitle}
        </span>
      </div>

      {/* Dot indicators */}
      <div className="absolute bottom-6 right-6 z-10 flex items-center gap-2">
        {HERO_IMAGES.map((_, idx) => (
          <button
            key={idx}
            onClick={() => { setCurrent(idx); setIsTransitioning(false); }}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              idx === current ? 'w-6 bg-white' : 'w-1.5 bg-white/40'
            }`}
            aria-label={`Slide ${idx + 1}`}
          />
        ))}
      </div>
    </div>
  );
};
