'use client';

import React, { useEffect, useRef, useState, useId } from 'react';
import { Loader2, MapPin, Search } from 'lucide-react';

export interface DestinationOption {
  id: string;
  name: string;
  slug?: string;
  state: string;
  stateCode?: string;
  country: string;
  countryCode?: string;
  type?: string;
  heroImage?: string;
  packageCount?: number;
  rating?: number;
  tags?: string[];
}

interface DestinationAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onSelect?: (destination: DestinationOption) => void;
  placeholder?: string;
  className?: string;
  inputClassName?: string;
  name?: string;
  id?: string;
  disabled?: boolean;
  required?: boolean;
}

function highlightMatch(name: string, query: string) {
  const q = query.trim().toLocaleLowerCase();
  const matchStart = name.toLocaleLowerCase().indexOf(q);
  if (matchStart < 0 || !q) return name;

  const matchEnd = matchStart + q.length;
  return (
    <>
      {name.slice(0, matchStart)}
      <strong className="font-extrabold text-teal-800 underline decoration-teal-400 decoration-2">
        {name.slice(matchStart, matchEnd)}
      </strong>
      {name.slice(matchEnd)}
    </>
  );
}

export const DestinationAutocomplete: React.FC<DestinationAutocompleteProps> = ({
  value,
  onChange,
  onSelect,
  placeholder = 'Where to? (e.g. Manali, Goa, Mangaluru)',
  className = '',
  inputClassName = '',
  name = 'destination',
  id,
  disabled = false,
  required = false,
}) => {
  const generatedId = useId();
  const inputId = id || `destination-input-${generatedId}`;
  const listboxId = `destination-listbox-${generatedId}`;

  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [suggestions, setSuggestions] = useState<DestinationOption[]>([]);

  // Close dropdown on outside click or pointer down
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

  // Debounced search with AbortController
  useEffect(() => {
    const query = value.trim();
    if (query.length < 1 || !isOpen) {
      setSuggestions([]);
      setIsSearching(false);
      return;
    }

    const controller = new AbortController();
    setIsSearching(true);

    const timeoutId = window.setTimeout(async () => {
      try {
        const res = await fetch(`/api/locations/search?q=${encodeURIComponent(query)}&limit=10`, {
          signal: controller.signal,
          headers: { Accept: 'application/json' },
        });

        if (res.ok) {
          const payload = await res.json();
          const results: DestinationOption[] = Array.isArray(payload.results) ? payload.results : [];
          setSuggestions(results);
        } else {
          setSuggestions([]);
        }
      } catch (err: unknown) {
        if (err instanceof Error && err.name !== 'AbortError') {
          setSuggestions([]);
        }
      } finally {
        setIsSearching(false);
        setHighlightedIndex(-1);
      }
    }, 200);

    return () => {
      controller.abort();
      window.clearTimeout(timeoutId);
    };
  }, [value, isOpen]);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || suggestions.length === 0) {
      if (event.key === 'ArrowDown' && suggestions.length > 0) {
        event.preventDefault();
        setIsOpen(true);
        setHighlightedIndex(0);
      }
      return;
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setHighlightedIndex((current) => Math.min(current + 1, suggestions.length - 1));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setHighlightedIndex((current) => Math.max(current - 1, 0));
    } else if (event.key === 'Enter') {
      if (highlightedIndex >= 0 && highlightedIndex < suggestions.length) {
        event.preventDefault();
        const selected = suggestions[highlightedIndex];
        if (selected) {
          handleSelect(selected);
        }
      }
    } else if (event.key === 'Escape') {
      event.preventDefault();
      setIsOpen(false);
      setIsSearching(false);
      setHighlightedIndex(-1);
    }
  };

  const handleSelect = (destination: DestinationOption) => {
    onChange(destination.name);
    if (onSelect) {
      onSelect(destination);
    }
    setIsOpen(false);
    setIsSearching(false);
    setHighlightedIndex(-1);
    inputRef.current?.focus();
  };

  const showDropdown = isOpen && value.trim().length >= 1;

  return (
    <div ref={wrapperRef} className={`relative ${className}`}>
      <div className="relative flex items-center">
        <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <input
          ref={inputRef}
          id={inputId}
          type="text"
          name={name}
          value={value}
          disabled={disabled}
          required={required}
          autoComplete="off"
          onChange={(event) => {
            const nextValue = event.target.value;
            onChange(nextValue);
            setHighlightedIndex(-1);
            if (nextValue.trim().length >= 1) {
              setIsOpen(true);
            } else {
              setIsOpen(false);
              setSuggestions([]);
            }
          }}
          onFocus={() => {
            if (value.trim().length >= 1) {
              setIsOpen(true);
            }
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={showDropdown}
          aria-controls={listboxId}
          aria-activedescendant={
            highlightedIndex >= 0 ? `${inputId}-option-${highlightedIndex}` : undefined
          }
          className={`min-h-11 w-full min-w-0 rounded-lg border border-slate-200 bg-slate-50 pl-9.5 pr-8 py-2.5 text-[15px] text-slate-900 placeholder-slate-400 transition-all focus:border-teal-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-600/20 disabled:cursor-not-allowed disabled:bg-slate-100 sm:min-h-0 sm:py-2 sm:text-sm ${inputClassName}`}
        />
        {isSearching && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <Loader2 className="h-4 w-4 animate-spin text-teal-600" aria-label="Searching destinations..." />
          </div>
        )}
      </div>

      {showDropdown && (
        <div
          id={listboxId}
          role="listbox"
          aria-label="Destination suggestions"
          className="absolute left-0 top-full z-50 mt-1.5 w-full min-w-full sm:min-w-[360px] md:min-w-[400px] max-w-[min(440px,calc(100vw-2rem))] max-h-80 overflow-y-auto rounded-2xl border border-slate-200 bg-white p-2 text-left shadow-2xl animate-in fade-in-50 zoom-in-95 duration-100"
        >
          <div className="flex items-center justify-between px-3 pb-1.5 pt-2 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
            <span>Destinations</span>
            {isSearching && (
              <span className="flex items-center gap-1 text-teal-600">
                <Loader2 className="h-3 w-3 animate-spin" />
                <span>Searching</span>
              </span>
            )}
          </div>

          {!isSearching && suggestions.length === 0 && (
            <div className="px-3 py-6 text-center text-sm text-slate-500">
              <p className="font-semibold text-slate-700">No destinations found</p>
              <p className="mt-1 text-xs text-slate-400">
                Try searching for a different city or state name
              </p>
            </div>
          )}

          {suggestions.map((suggestion, index) => {
            const isHighlighted = highlightedIndex === index;
            const tourCount = suggestion.packageCount ?? 0;

            return (
              <button
                key={suggestion.id}
                id={`${inputId}-option-${index}`}
                type="button"
                role="option"
                aria-selected={isHighlighted}
                onPointerDown={(event) => {
                  event.preventDefault();
                  handleSelect(suggestion);
                }}
                onMouseEnter={() => setHighlightedIndex(index)}
                className={`group flex min-h-12 w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition-colors ${
                  isHighlighted ? 'bg-teal-50 text-teal-950' : 'hover:bg-slate-50 text-slate-800'
                }`}
              >
                {suggestion.heroImage ? (
                  <img
                    src={suggestion.heroImage}
                    alt=""
                    aria-hidden="true"
                    className="h-10 w-10 shrink-0 rounded-lg object-cover border border-slate-100"
                  />
                ) : (
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-teal-50 text-teal-700">
                    <MapPin className="h-4 w-4" />
                  </span>
                )}

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-bold text-slate-900 leading-snug break-words">
                      {highlightMatch(suggestion.name, value)}
                    </span>
                    {tourCount > 0 ? (
                      <span className="shrink-0 whitespace-nowrap rounded-full bg-teal-100/70 px-2 py-0.5 text-[10px] font-semibold text-teal-800">
                        {tourCount} {tourCount === 1 ? 'tour' : 'tours'}
                      </span>
                    ) : (
                      <span className="shrink-0 whitespace-nowrap rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-400">
                        0 tours
                      </span>
                    )}
                  </div>
                  <span className="block text-xs text-slate-500 leading-normal mt-0.5 break-words">
                    {suggestion.state ? `${suggestion.state}, ` : ''}{suggestion.country}
                  </span>
                </div>

                <MapPin className={`h-4 w-4 shrink-0 transition-opacity ${isHighlighted ? 'text-teal-600 opacity-100' : 'text-slate-300 opacity-0 group-hover:opacity-100'}`} aria-hidden="true" />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
