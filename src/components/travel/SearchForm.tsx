'use client';

import React, { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { PACKAGE_CATEGORIES } from '@/constants';

interface SearchFormProps {
  initialSearch?: string;
  initialCategory?: string;
}

export function SearchForm({ initialSearch = '', initialCategory = '' }: SearchFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const q = (formData.get('q') as string || '').trim();
    const category = (formData.get('category') as string || '').trim();

    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (category) params.set('category', category);

    startTransition(() => {
      router.push(`/search?${params.toString()}`);
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="grid grid-cols-1 gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:grid-cols-[minmax(0,1fr)_14rem_auto]"
    >
      <label className="sr-only" htmlFor="q">Search destination or package</label>
      <input
        id="q"
        name="q"
        type="search"
        defaultValue={initialSearch}
        placeholder="Destination, city, state, or package"
        className="min-w-0 rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
      />
      <label className="sr-only" htmlFor="category">Package category</label>
      <select
        id="category"
        name="category"
        defaultValue={initialCategory}
        className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
      >
        <option value="">All categories</option>
        {PACKAGE_CATEGORIES.map(({ value, label }) => (
          <option key={value} value={value}>{label}</option>
        ))}
      </select>
      <Button
        type="submit"
        variant="primary"
        size="md"
        isLoading={isPending}
        className="font-semibold"
        leftIcon={<Search className="h-4 w-4" />}
      >
        {isPending ? 'Searching...' : 'Search'}
      </Button>
    </form>
  );
}
