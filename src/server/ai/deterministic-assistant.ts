// ============================================================
// VIBEMILES — DETERMINISTIC DATABASE-BACKED ASSISTANT ENGINE
// ============================================================
// Provides honest, grounded conversational responses when external
// AI model credentials are not configured, on timeout, or as a
// verifiable search baseline. Never simulates or fabricates inventory.

import {
  searchPublishedPackagesTool,
  getPackageDetailsTool,
  checkPackageAvailabilityTool,
  comparePackagesTool,
} from './tools';
import type {
  AssistantResponse,
  SearchPackagesToolInput,
} from './types';
import type { Package } from '@/types';

/**
 * Extracts numeric prices from natural language queries.
 * Handles "under ₹5,000", "below 10000", "budget 8,000", etc.
 */
function extractBudget(text: string): { minPrice?: number; maxPrice?: number } {
  const clean = text.toLowerCase().replace(/,/g, '');

  // "between X and Y"
  const betweenMatch = clean.match(/between\s*(?:rs\.?|inr|₹)?\s*(\d+)\s*(?:and|to|-)\s*(?:rs\.?|inr|₹)?\s*(\d+)/i);
  if (betweenMatch) {
    const val1 = parseInt(betweenMatch[1], 10);
    const val2 = parseInt(betweenMatch[2], 10);
    return {
      minPrice: Math.min(val1, val2),
      maxPrice: Math.max(val1, val2),
    };
  }

  // "under / below / less than / max / budget of X"
  const underMatch = clean.match(/(?:under|below|less\s+than|max|budget\s*(?:of|is|:)?)\s*(?:rs\.?|inr|₹)?\s*(\d+)/i);
  if (underMatch) {
    return { maxPrice: parseInt(underMatch[1], 10) };
  }

  // "above / more than / min X"
  const aboveMatch = clean.match(/(?:above|more\s+than|min|starting\s*(?:from|at)?)\s*(?:rs\.?|inr|₹)?\s*(\d+)/i);
  if (aboveMatch) {
    return { minPrice: parseInt(aboveMatch[1], 10) };
  }

  return {};
}

/**
 * Extracts duration preferences from natural language.
 * Handles "weekend", "3 days", "week long", etc.
 */
function extractDuration(text: string): { minDurationDays?: number; maxDurationDays?: number } {
  const clean = text.toLowerCase();

  if (clean.includes('weekend') || clean.includes('short trip') || clean.includes('2 days') || clean.includes('2-day')) {
    return { minDurationDays: 1, maxDurationDays: 3 };
  }

  if (clean.includes('week') || clean.includes('7 days')) {
    return { minDurationDays: 6, maxDurationDays: 8 };
  }

  const daysMatch = clean.match(/(\d+)\s*(?:days?|nights?)/i);
  if (daysMatch) {
    const num = parseInt(daysMatch[1], 10);
    return { minDurationDays: Math.max(1, num - 1), maxDurationDays: num + 1 };
  }

  return {};
}

/**
 * Extracts popular Indian destinations and states from natural language.
 */
function extractDestination(text: string): string | undefined {
  const knownLocations = [
    'ooty', 'manali', 'kerala', 'goa', 'ladakh', 'shimla', 'rishikesh',
    'jaipur', 'udaipur', 'munnar', 'coorg', 'darjeeling', 'kashmir',
    'andaman', 'varanasi', 'alleppey', 'hampi', 'wayanad', 'pondicherry',
    'tirupati', 'haridwar', 'ayodhya', 'puri', 'dubai', 'bali', 'thailand',
    'phuket', 'bangkok', 'singapore', 'himachal', 'uttarakhand', 'rajasthan',
    'tamil nadu', 'karnataka', 'andhra pradesh', 'uttar pradesh',
  ];

  const lower = text.toLowerCase();
  for (const loc of knownLocations) {
    if (new RegExp(`\\b${loc}\\b`, 'i').test(lower)) {
      return loc;
    }
  }

  // Try extracting after "near", "in", "to", "visit", "around"
  const prepositions = text.match(/(?:in|near|to|around|visit|explore)\s+([A-Z][a-zA-Z]+)/);
  if (prepositions && prepositions[1]) {
    return prepositions[1];
  }

  return undefined;
}

/**
 * Extracts category from query.
 */
function extractCategory(text: string): string | undefined {
  const lower = text.toLowerCase();
  if (lower.includes('devotional') || lower.includes('temple') || lower.includes('pilgrimage') || lower.includes('yatra') || lower.includes('spiritual') || lower.includes('darshan')) return 'devotional';
  if (lower.includes('foreign') || lower.includes('international') || lower.includes('abroad') || lower.includes('dubai') || lower.includes('bali') || lower.includes('thailand') || lower.includes('overseas')) return 'foreign';
  if (lower.includes('adventure') || lower.includes('trek') || lower.includes('rafting')) return 'adventure';
  if (lower.includes('villa') || lower.includes('resort')) return 'villa';
  if (lower.includes('homestay')) return 'homestay';
  if (lower.includes('camp') || lower.includes('glamping')) return 'camping';
  if (lower.includes('hotel')) return 'hotel';
  if (lower.includes('tour') || lower.includes('sightseeing')) return 'tour';
  return undefined;
}

/**
 * Detects if the query is a comparison between packages.
 */
function isComparisonQuery(text: string): boolean {
  const lower = text.toLowerCase();
  return lower.includes('compare') || lower.includes(' vs ') || lower.includes(' versus ') || lower.includes('difference between');
}

/**
 * Detects if the query asks about availability or dates.
 */
function isAvailabilityQuery(text: string): boolean {
  const lower = text.toLowerCase();
  return (
    lower.includes('available') ||
    lower.includes('dates') ||
    lower.includes('departure') ||
    lower.includes('seats') ||
    lower.includes('when can i') ||
    lower.includes('slots')
  );
}

/**
 * Detects if the query is asking about inclusions or exclusions for a specific package.
 */
function isInclusionsQuery(text: string): boolean {
  const lower = text.toLowerCase();
  return (
    lower.includes('what is included') ||
    lower.includes('whats included') ||
    lower.includes('inclusions') ||
    lower.includes('exclusions') ||
    lower.includes('itinerary') ||
    lower.includes('activities in')
  );
}

/**
 * Formats package list into rich, grounded markdown response.
 */
function formatPackageListMarkdown(packages: Package[], queryContext: string): string {
  if (packages.length === 0) {
    return `### No Matching Packages Found\n\nI couldn't find any published travel packages in our live catalog that match your request for **${queryContext}**.\n\n*Suggestions:*\n- Try broadening your budget or destination.\n- Consider searching by state (e.g. "Himachal Pradesh" or "Kerala").\n- Ask to see our popular or featured packages.`;
  }

  const lines: string[] = [];
  lines.push(`### Verified Travel Packages for ${queryContext}\n`);
  lines.push(`Found **${packages.length}** published package${packages.length > 1 ? 's' : ''} matching your preferences:\n`);

  for (const p of packages) {
    const stars = '★'.repeat(Math.round(p.rating || 5));
    const discount = p.discountPercent > 0 ? ` ~~₹${p.basePrice.toLocaleString('en-IN')}~~ (${p.discountPercent}% OFF)` : '';
    lines.push(`- **[${p.name}](/packages/${p.slug})** — **₹${p.finalPrice.toLocaleString('en-IN')}**${discount}`);
    lines.push(`  - 📍 **Location:** ${p.destinationName}, ${p.state}`);
    lines.push(`  - ⏱️ **Duration:** ${p.durationDays} Days / ${p.durationNights} Nights`);
    lines.push(`  - ⭐ **Rating:** ${p.rating.toFixed(1)} ${stars} (${p.reviewCount} reviews)`);
    if (p.highlights && p.highlights.length > 0) {
      lines.push(`  - 🌟 **Highlights:** ${p.highlights.slice(0, 3).join(', ')}`);
    }
    lines.push('');
  }

  const hasDevotional = packages.some(
    (p) => p.category === 'devotional' || p.tags.includes('devotional') || p.tags.includes('spiritual')
  );
  const hasForeign = packages.some(
    (p) => p.category === 'foreign' || p.tags.includes('foreign') || p.tags.includes('international')
  );

  if (hasDevotional) {
    lines.push(`\n> **Devotee Note:** Official sanctum darshan passes are governed exclusively by respective temple trusts (e.g. TTD, Kashi Vishwanath) and must be booked directly under the traveller's identity. Packages provide transport, hotel stay, and local guidance.`);
  }

  if (hasForeign) {
    lines.push(`\n> **International Travel Note:** VibeMiles does NOT issue visas. Ensure your passport is valid for at least 6 months from travel date. International airfare, visa fees, and overseas insurance are excluded unless explicitly stated in package inclusions.`);
  }

  lines.push(`\n*Tip:* Click on any package title or card below to review dates, full itinerary, and proceed to secure booking.`);
  return lines.join('\n');
}

/**
 * Executes deterministic database search & synthesizes response.
 */
export async function runDeterministicAssistant(
  userQuery: string
): Promise<AssistantResponse> {
  const trimmed = userQuery.trim();

  // 1. Check for Package Comparison
  if (isComparisonQuery(trimmed)) {
    // Attempt to search 2 packages matching keywords or compare recent
    const searchRes = await searchPublishedPackagesTool({ limit: 4 });
    if (searchRes.packages.length >= 2) {
      const topTwo = searchRes.packages.slice(0, 2);
      const compRes = await comparePackagesTool({
        packageSlugsOrIds: [topTwo[0].slug, topTwo[1].slug],
      });

      const message = `### Package Comparison: ${topTwo[0].name} vs ${topTwo[1].name}\n\nHere is a side-by-side comparison of real published listings:\n\n` +
        `| Metric | ${topTwo[0].name} | ${topTwo[1].name} |\n` +
        `| --- | --- | --- |\n` +
        `| **Price** | ₹${topTwo[0].finalPrice.toLocaleString('en-IN')} | ₹${topTwo[1].finalPrice.toLocaleString('en-IN')} |\n` +
        `| **Duration** | ${topTwo[0].durationDays}D / ${topTwo[0].durationNights}N | ${topTwo[1].durationDays}D / ${topTwo[1].durationNights}N |\n` +
        `| **Location** | ${topTwo[0].destinationName}, ${topTwo[0].state} | ${topTwo[1].destinationName}, ${topTwo[1].state} |\n` +
        `| **Rating** | ⭐ ${topTwo[0].rating.toFixed(1)} (${topTwo[0].reviewCount}) | ⭐ ${topTwo[1].rating.toFixed(1)} (${topTwo[1].reviewCount}) |\n` +
        `| **Inclusions** | ${topTwo[0].inclusions?.slice(0, 3).join(', ') || 'Standard'} | ${topTwo[1].inclusions?.slice(0, 3).join(', ') || 'Standard'} |\n\n` +
        `You can click either package card below to view available departure dates and book directly.`;

      return {
        message,
        packages: topTwo,
        comparison: compRes,
        followUpSuggestions: [
          `Check dates for ${topTwo[0].name}`,
          `Check dates for ${topTwo[1].name}`,
          'Show more packages in this category',
        ],
        isFallback: true,
        provider: 'deterministic-fallback',
      };
    }
  }

  // 2. Check for Specific Package Inclusions / Details
  if (isInclusionsQuery(trimmed)) {
    const dest = extractDestination(trimmed);
    const searchRes = await searchPublishedPackagesTool({
      query: dest || trimmed.replace(/what is included in|inclusions|exclusions|itinerary/gi, '').trim(),
      limit: 1,
    });

    if (searchRes.packages.length > 0) {
      const pkg = searchRes.packages[0];
      const details = await getPackageDetailsTool({ packageSlugOrId: pkg.slug });
      const detailedPkg = details.package || pkg;

      const incList = detailedPkg.inclusions && detailedPkg.inclusions.length > 0
        ? detailedPkg.inclusions.map((i) => `- ✅ ${i}`).join('\n')
        : '- ✅ Standard tour arrangements included';

      const excList = detailedPkg.exclusions && detailedPkg.exclusions.length > 0
        ? detailedPkg.exclusions.map((e) => `- ❌ ${e}`).join('\n')
        : '- ❌ Personal expenses and discretionary gratuities';

      const message = `### Inclusions & Exclusions for "${detailedPkg.name}"\n\n` +
        `**What is included:**\n${incList}\n\n` +
        `**What is not included:**\n${excList}\n\n` +
        `**Duration:** ${detailedPkg.durationDays} Days / ${detailedPkg.durationNights} Nights | **Price:** ₹${detailedPkg.finalPrice.toLocaleString('en-IN')} per traveller.\n\n` +
        `Click the card below to inspect the full itinerary and reserve your spot.`;

      return {
        message,
        packages: [detailedPkg],
        followUpSuggestions: [
          `When is ${detailedPkg.name} available?`,
          `Compare with other ${detailedPkg.destinationName} tours`,
          'Ask about cancellation policy',
        ],
        isFallback: true,
        provider: 'deterministic-fallback',
      };
    }
  }

  // 3. Check for Availability
  if (isAvailabilityQuery(trimmed)) {
    const dest = extractDestination(trimmed);
    const searchRes = await searchPublishedPackagesTool({
      destination: dest,
      limit: 1,
    });

    if (searchRes.packages.length > 0) {
      const pkg = searchRes.packages[0];
      const availRes = await checkPackageAvailabilityTool({ packageSlugOrId: pkg.slug });

      let datesMsg = '';
      if (availRes.availableSlots.length > 0) {
        datesMsg = availRes.availableSlots
          .slice(0, 5)
          .map((s) => `- 📅 **${s.date}**: ₹${s.price.toLocaleString('en-IN')} (${s.remainingCapacity} seats left)`)
          .join('\n');
      } else {
        datesMsg = 'There are no active departure slots currently open for this package in the database.';
      }

      const message = `### Live Availability for "${pkg.name}"\n\n` +
        `${datesMsg}\n\n` +
        `*Note:* Departures are subject to capacity limits. You can secure your reservation through the official booking portal.`;

      return {
        message,
        packages: [pkg],
        availability: availRes,
        followUpSuggestions: [
          `What is included in ${pkg.name}?`,
          'Find packages under ₹10,000',
          'Explore other destinations',
        ],
        isFallback: true,
        provider: 'deterministic-fallback',
      };
    }
  }

  // 4. Standard Search with Extracted Criteria (Budget, Destination, Duration, Category)
  const budget = extractBudget(trimmed);
  const duration = extractDuration(trimmed);
  const destination = extractDestination(trimmed);
  const category = extractCategory(trimmed);

  const searchParams: SearchPackagesToolInput = {
    destination,
    category,
    minPrice: budget.minPrice,
    maxPrice: budget.maxPrice,
    minDurationDays: duration.minDurationDays,
    maxDurationDays: duration.maxDurationDays,
    query: (!destination && !category && !budget.maxPrice) ? trimmed : undefined,
    limit: 6,
  };

  const results = await searchPublishedPackagesTool(searchParams);

  // Formulate Context Title
  const contextParts: string[] = [];
  if (destination) contextParts.push(`Destination: ${destination.toUpperCase()}`);
  if (budget.maxPrice) contextParts.push(`Budget under ₹${budget.maxPrice.toLocaleString('en-IN')}`);
  if (duration.maxDurationDays) contextParts.push(`Duration: ${duration.minDurationDays || 1}-${duration.maxDurationDays} Days`);
  if (category) contextParts.push(`Category: ${category}`);

  const contextStr = contextParts.length > 0 ? contextParts.join(', ') : 'Your Travel Inquiry';
  const message = formatPackageListMarkdown(results.packages, contextStr);

  const followUpSuggestions: string[] = [];
  if (results.packages.length > 0) {
    followUpSuggestions.push(`What is included in ${results.packages[0].name}?`);
    followUpSuggestions.push(`When is ${results.packages[0].name} available?`);
    if (results.packages.length > 1) {
      followUpSuggestions.push(`Compare ${results.packages[0].name} and ${results.packages[1].name}`);
    }
  } else {
    followUpSuggestions.push('Show all weekend getaways');
    followUpSuggestions.push('Show tours under ₹10,000');
    followUpSuggestions.push('Show popular packages in Kerala');
  }

  return {
    message,
    packages: results.packages,
    followUpSuggestions,
    isFallback: true,
    provider: 'deterministic-fallback',
  };
}
