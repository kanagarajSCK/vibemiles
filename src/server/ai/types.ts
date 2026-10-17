// ============================================================
// VIBEMILES — AI TRAVEL ASSISTANT TYPES
// ============================================================

import type { Package, SortOption } from '@/types';

export interface AssistantChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface SearchPackagesToolInput {
  query?: string;
  destination?: string;
  state?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  minDurationDays?: number;
  maxDurationDays?: number;
  minRating?: number;
  sort?: SortOption;
  limit?: number;
}

export interface CheckAvailabilityToolInput {
  packageSlugOrId: string;
  startDate?: string; // YYYY-MM-DD
  endDate?: string;   // YYYY-MM-DD
}

export interface GetPackageDetailsToolInput {
  packageSlugOrId: string;
}

export interface ComparePackagesToolInput {
  packageSlugsOrIds: string[];
}

export interface AvailabilitySlotInfo {
  date: string;
  price: number;
  capacity: number;
  bookedCount: number;
  remainingCapacity: number;
  isAvailable: boolean;
}

export interface PackageAvailabilityResult {
  packageId: string;
  packageSlug: string;
  packageName: string;
  finalPrice: number;
  availableSlots: AvailabilitySlotInfo[];
  totalAvailableSlots: number;
  message: string;
}

export interface PackageComparisonItem {
  id: string;
  slug: string;
  name: string;
  destination: string;
  state: string;
  category: string;
  duration: string;
  finalPrice: number;
  basePrice: number;
  discountPercent: number;
  rating: number;
  reviewCount: number;
  maxGroupSize: number;
  providerName: string;
  inclusionsCount: number;
  topInclusions: string[];
  topExclusions: string[];
  highlights: string[];
  cancellationPolicy: string;
  availableDatesCount: number;
  nextAvailableDate?: string;
}

export interface PackageComparisonResult {
  packages: PackageComparisonItem[];
  summary: string;
}

export interface AssistantResponse {
  message: string;
  packages?: Package[];
  comparison?: PackageComparisonResult;
  availability?: PackageAvailabilityResult;
  followUpSuggestions?: string[];
  isFallback: boolean;
  provider: 'gemini' | 'deterministic-fallback';
}
