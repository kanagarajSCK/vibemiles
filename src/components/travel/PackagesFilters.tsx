'use client';

import React, { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { SlidersHorizontal } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { TravelTypeSelector, type TravelTypeId } from './TravelTypeSelector';
import { DestinationAutocomplete, type DestinationOption } from './DestinationAutocomplete';
import { PACKAGE_CATEGORIES, SORT_OPTIONS, ROUTES } from '@/constants';

interface PackagesFiltersProps {
  baseRoute?: string;
  categories?: readonly { value: string; label: string; icon?: string }[] | { value: string; label: string; icon?: string }[];
  allCategoriesLabel?: string;
  title?: string;
  defaultDestination?: string;
  defaultDestinationId?: string;
  defaultCategory?: string;
  defaultSort?: string;
  defaultMinPrice?: string;
  defaultMaxPrice?: string;
  defaultTravelType?: TravelTypeId | '';
  defaultVibe?: string;
}

export const PackagesFilters: React.FC<PackagesFiltersProps> = ({
  baseRoute = ROUTES.PACKAGES,
  categories = PACKAGE_CATEGORIES,
  allCategoriesLabel = 'All Categories',
  title = 'Filter Packages',
  defaultDestination = '',
  defaultDestinationId = '',
  defaultCategory = '',
  defaultSort = 'recommended',
  defaultMinPrice = '',
  defaultMaxPrice = '',
  defaultTravelType = '',
  defaultVibe = '',
}) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [destination, setDestination] = useState(defaultDestination);
  const [destinationId, setDestinationId] = useState(defaultDestinationId);
  const [selectedDestination, setSelectedDestination] = useState<DestinationOption | null>(null);
  const [category, setCategory] = useState(defaultCategory);
  const [sort, setSort] = useState(defaultSort);
  const [minPrice, setMinPrice] = useState(defaultMinPrice);
  const [maxPrice, setMaxPrice] = useState(defaultMaxPrice);
  const [travelType, setTravelType] = useState<TravelTypeId | ''>(defaultTravelType);
  const [tripVibe, setTripVibe] = useState(defaultVibe);

  const [mobileOpen, setMobileOpen] = useState(false);

  const handleApply = (e: React.FormEvent) => {
    e.preventDefault();
    setMobileOpen(false);
    const params = new URLSearchParams();
    if (destination.trim()) {
      params.set('destination', destination.trim());
      if (destinationId) {
        params.set('destinationId', destinationId);
      }
      if (selectedDestination?.slug) {
        params.set('destinationSlug', selectedDestination.slug);
      }
    }
    if (category) params.set('category', category);
    if (sort) params.set('sort', sort);
    if (minPrice) params.set('minPrice', minPrice);
    if (maxPrice) params.set('maxPrice', maxPrice);
    if (travelType) params.set('travelType', travelType);
    if (tripVibe) params.set('vibe', tripVibe);
    startTransition(() => {
      router.push(`${baseRoute}?${params.toString()}`);
    });
  };

  const handleReset = () => {
    setDestination('');
    setDestinationId('');
    setSelectedDestination(null);
    setCategory('');
    setSort('recommended');
    setMinPrice('');
    setMaxPrice('');
    setTravelType('');
    setTripVibe('');
    setMobileOpen(false);
    startTransition(() => {
      router.push(baseRoute);
    });
  };

  const filterForm = (
    <form onSubmit={handleApply} className="space-y-3 lg:space-y-4">
      <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
        <h3 className="flex items-center gap-2 text-[15px] font-bold text-slate-900 sm:text-sm">
          <SlidersHorizontal className="h-4 w-4 text-teal-700" /> {title}
        </h3>
        <button
          type="button"
          onClick={handleReset}
          className="text-[12px] font-semibold text-teal-700 transition-colors hover:text-teal-900 hover:underline"
        >
          Reset
        </button>
      </div>

      {/* Destination Autocomplete */}
      <div className="space-y-1.5 relative z-30">
        <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600">
          Destination / City
        </label>
        <DestinationAutocomplete
          value={destination}
          onChange={(val) => {
            setDestination(val);
            setSelectedDestination(null);
            setDestinationId('');
          }}
          onSelect={(dest) => {
            setDestination(dest.name);
            setSelectedDestination(dest);
            setDestinationId(dest.id);
          }}
          placeholder="e.g. Manali, Goa, Mangaluru"
        />
      </div>

      {/* Price Range */}
      <div className="grid grid-cols-2 gap-2">
        <Input
          name="minPrice"
          type="number"
          min="0"
          label="Min Price"
          labelClassName="text-[11px]"
          placeholder="No minimum"
          value={minPrice}
          onChange={(e) => setMinPrice(e.target.value)}
          className="min-h-11.5 rounded-lg border-slate-200 bg-slate-50 text-[15px] shadow-none focus:bg-white"
        />
        <Input
          name="maxPrice"
          type="number"
          min="0"
          label="Max Price"
          labelClassName="text-[11px]"
          placeholder="No maximum"
          value={maxPrice}
          onChange={(e) => setMaxPrice(e.target.value)}
          className="min-h-11.5 rounded-lg border-slate-200 bg-slate-50 text-[15px] shadow-none focus:bg-white"
        />
      </div>

      {/* Travel Type Selector */}
      <TravelTypeSelector
        selected={travelType}
        onSelect={setTravelType}
        selectedVibe={tripVibe}
        onSelectVibe={setTripVibe}
        compact
      />

      {/* Category Filter */}
      <Select
        name="category"
        label="Category"
        labelClassName="text-[11px]"
        value={category}
        onChange={(e) => setCategory(e.target.value)}
        className="min-h-11.5 rounded-lg border-slate-200 bg-slate-50 text-[15px] shadow-none focus:bg-white"
        options={[
          { value: '', label: allCategoriesLabel },
          ...categories.map((c) => ({ value: c.value, label: `${c.icon ? `${c.icon} ` : ''}${c.label}` })),
        ]}
      />

      {/* Sort Select */}
      <Select
        name="sort"
        label="Sort By"
        labelClassName="text-[11px]"
        value={sort}
        onChange={(e) => setSort(e.target.value)}
        className="min-h-11.5 rounded-lg border-slate-200 bg-slate-50 text-[15px] shadow-none focus:bg-white"
        options={SORT_OPTIONS}
      />

      <Button
        type="submit"
        variant="primary"
        size="md"
        isLoading={isPending}
        className="w-full font-bold"
      >
        {isPending ? 'Applying Filters...' : 'Apply Filters'}
      </Button>
    </form>
  );

  return (
    <>
      {/* Mobile Toggle Button */}
      <div className="lg:hidden w-full">
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 shadow-sm"
        >
          <SlidersHorizontal className="h-4 w-4" /> Filter & Sort Packages
        </button>
      </div>

      {/* Desktop Inline */}
      <div className="hidden lg:block rounded-2xl border border-slate-200 bg-white p-3.5 shadow-sm sm:p-4">
        {filterForm}
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-[100] flex flex-col justify-end lg:hidden">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative flex max-h-[85vh] w-full flex-col overflow-y-auto rounded-t-3xl bg-white p-5 shadow-2xl animate-in slide-in-from-bottom-4">
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors"
            >
              ×
            </button>
            {filterForm}
          </div>
        </div>
      )}
    </>
  );
};
