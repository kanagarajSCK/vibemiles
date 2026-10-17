'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Loader2, MapPin } from 'lucide-react';
import { type IndiaLocation as DestinationSuggestion } from '@/lib/india-locations';

interface DestinationAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onSelect: (destination: DestinationSuggestion) => void;
}

function highlightMatch(name: string, query: string) {
  const matchStart = name.toLocaleLowerCase().indexOf(query.trim().toLocaleLowerCase());
  if (matchStart < 0 || !query.trim()) return name;

  const matchEnd = matchStart + query.trim().length;
  return (
    <>
      {name.slice(0, matchStart)}
      <strong className="font-extrabold text-teal-800">{name.slice(matchStart, matchEnd)}</strong>
      {name.slice(matchEnd)}
    </>
  );
}

export const DestinationAutocomplete: React.FC<DestinationAutocompleteProps> = ({
  value,
  onChange,
  onSelect,
}) => {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [suggestions, setSuggestions] = useState<DestinationSuggestion[]>([]);

  useEffect(() => {
    const handleOutsidePointer = (event: PointerEvent) => {
      if (!wrapperRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
        setIsSearching(false);
      }
    };

    document.addEventListener('pointerdown', handleOutsidePointer);
    return () => document.removeEventListener('pointerdown', handleOutsidePointer);
  }, []);

  useEffect(() => {
    const query = value.trim();
    if (query.length < 2 || !isOpen) return;

    const controller = new AbortController();
    const timeoutId = window.setTimeout(async () => {
      try {
        setIsSearching(true);
        const res = await fetch(`/api/locations/search?q=${encodeURIComponent(query)}&limit=12`, {
          signal: controller.signal,
          headers: { Accept: 'application/json' },
        });
        if (res.ok) {
           const payload = await res.json();
           setSuggestions(payload.results || []);
        }
      } catch (err: unknown) {
        if (err instanceof Error && err.name !== 'AbortError') {
          setSuggestions([]);
        }
      } finally {
        setIsSearching(false);
        setHighlightedIndex(-1);
      }
    }, 250);

    return () => {
      controller.abort();
      window.clearTimeout(timeoutId);
    };
  }, [value, isOpen]);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || value.trim().length < 2) {
      if (event.key === 'ArrowDown' && value.trim().length >= 2) setIsOpen(true);
      return;
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setHighlightedIndex((current) => Math.min(current + 1, suggestions.length - 1));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setHighlightedIndex((current) => Math.max(current - 1, 0));
    } else if (event.key === 'Enter' && highlightedIndex >= 0) {
      event.preventDefault();
      const selected = suggestions[highlightedIndex];
      if (selected) {
        onChange(selected.name);
        onSelect(selected);
        setIsOpen(false);
      }
    } else if (event.key === 'Escape') {
      event.preventDefault();
      setIsOpen(false);
      setIsSearching(false);
      setHighlightedIndex(-1);
    }
  };

  const handleSelect = (destination: DestinationSuggestion) => {
    onChange(destination.name);
    onSelect(destination);
    setIsOpen(false);
    setIsSearching(false);
    setHighlightedIndex(-1);
    inputRef.current?.focus();
  };

  const showDropdown = isOpen && value.trim().length >= 2;

  return (
    <div ref={wrapperRef} className="relative">
      <input
        ref={inputRef}
        type="text"
        name="destination"
        value={value}
        onChange={(event) => {
          const nextValue = event.target.value;
          onChange(nextValue);
          setSuggestions([]);
          setHighlightedIndex(-1);
          setIsSearching(nextValue.trim().length >= 2);
          setIsOpen(true);
        }}
        onFocus={() => {
          if (value.trim().length >= 2) {
            setIsSearching(true);
            setIsOpen(true);
          }
        }}
        onKeyDown={handleKeyDown}
        placeholder="Where to? (e.g. Manali, Goa)"
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={showDropdown}
        aria-controls="destination-suggestions"
        aria-activedescendant={highlightedIndex >= 0 ? `destination-option-${highlightedIndex}` : undefined}
        className="min-h-11 w-full min-w-0 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-[15px] text-slate-900 placeholder-slate-400 focus:border-teal-600 focus:bg-white focus:outline-none sm:min-h-0 sm:py-2 sm:text-sm"
      />

      {showDropdown && (
        <div
          id="destination-suggestions"
          role="listbox"
          aria-label="Destination suggestions"
          className="absolute left-0 right-0 top-full z-50 mt-2 max-h-80 overflow-y-auto rounded-xl border border-slate-200 bg-white p-1.5 text-left shadow-xl"
        >
          <div className="flex items-center justify-between px-3 pb-1.5 pt-2 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
            <span>Destinations</span>
            {isSearching && <Loader2 className="h-3.5 w-3.5 animate-spin text-teal-600" aria-label="Loading destinations" />}
          </div>

          {!isSearching && suggestions.length === 0 && (
            <p className="px-3 py-5 text-center text-sm text-slate-500">No destinations found</p>
          )}

          {suggestions.map((suggestion, index) => (
            <button
              key={suggestion.id}
              id={`destination-option-${index}`}
              type="button"
              role="option"
              aria-selected={highlightedIndex === index}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => handleSelect(suggestion)}
              className={`flex min-h-14 w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors ${
                highlightedIndex === index ? 'bg-teal-50' : 'hover:bg-slate-50'
              }`}
            >
              {suggestion.heroImage ? (
                <img
                  src={suggestion.heroImage}
                  alt=""
                  aria-hidden="true"
                  className="h-10 w-10 shrink-0 rounded-lg object-cover"
                />
              ) : (
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-teal-50">
                  <MapPin className="h-4 w-4 text-teal-700" />
                </span>
              )}
              <span className="min-w-0">
                <span className="block truncate text-sm font-bold text-slate-900">
                  {highlightMatch(suggestion.name, value)}
                </span>
                <span className="block truncate text-xs text-slate-500">
                  {suggestion.state}, {suggestion.country}
                </span>
              </span>
              <MapPin className="ml-auto h-4 w-4 shrink-0 text-teal-600" aria-hidden="true" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
