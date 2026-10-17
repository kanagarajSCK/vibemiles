// ============================================================
// VIBEMILES — PROVIDER-AGNOSTIC AI ADAPTER
// ============================================================
// Supports Google Gemini with structured function calling.
// Seamlessly falls back to deterministic database-grounded engine
// when API keys are absent, on network error, or upon timeout.

import { AI_TRAVEL_ASSISTANT_SYSTEM_PROMPT, scrubAssistantOutput } from './guardrails';
import { runDeterministicAssistant } from './deterministic-assistant';
import {
  searchPublishedPackagesTool,
  getPackageDetailsTool,
  checkPackageAvailabilityTool,
  comparePackagesTool,
} from './tools';
import type {
  AssistantChatMessage,
  AssistantResponse,
  SearchPackagesToolInput,
  GetPackageDetailsToolInput,
  CheckAvailabilityToolInput,
  ComparePackagesToolInput,
  PackageComparisonResult,
  PackageAvailabilityResult,
} from './types';
import type { Package } from '@/types';

const GEMINI_FUNCTION_DECLARATIONS = [
  {
    name: 'search_packages',
    description: 'Search published, approved, and active travel packages in the live VibeMiles marketplace by destination, price, duration, category, or keyword.',
    parameters: {
      type: 'OBJECT',
      properties: {
        query: { type: 'STRING', description: 'Keyword or attraction name' },
        destination: { type: 'STRING', description: 'Destination name or city (e.g. Ooty, Manali, Kerala)' },
        category: { type: 'STRING', description: 'Package category: tour, devotional, foreign, villa, homestay, camping, adventure' },
        minPrice: { type: 'NUMBER', description: 'Minimum price per traveller in INR' },
        maxPrice: { type: 'NUMBER', description: 'Maximum price per traveller in INR' },
        minDurationDays: { type: 'INTEGER', description: 'Minimum duration in days' },
        maxDurationDays: { type: 'INTEGER', description: 'Maximum duration in days' },
        limit: { type: 'INTEGER', description: 'Maximum packages to return (1-10)' },
      },
    },
  },
  {
    name: 'get_package_details',
    description: 'Retrieve full listing details, day-by-day itinerary, inclusions, and exclusions for a specific published package.',
    parameters: {
      type: 'OBJECT',
      properties: {
        packageSlugOrId: { type: 'STRING', description: 'Unique slug or ID of the package' },
      },
      required: ['packageSlugOrId'],
    },
  },
  {
    name: 'check_package_availability',
    description: 'Check verified departure dates, pricing, and remaining capacity slots for a package.',
    parameters: {
      type: 'OBJECT',
      properties: {
        packageSlugOrId: { type: 'STRING', description: 'Unique slug or ID of the package' },
        startDate: { type: 'STRING', description: 'Optional start date filter in YYYY-MM-DD' },
        endDate: { type: 'STRING', description: 'Optional end date filter in YYYY-MM-DD' },
      },
      required: ['packageSlugOrId'],
    },
  },
  {
    name: 'compare_packages',
    description: 'Compare 2 to 4 packages side-by-side across price, rating, duration, and inclusions.',
    parameters: {
      type: 'OBJECT',
      properties: {
        packageSlugsOrIds: {
          type: 'ARRAY',
          items: { type: 'STRING' },
          description: 'Array of 2 to 4 package slugs or IDs to compare',
        },
      },
      required: ['packageSlugsOrIds'],
    },
  },
];

export class AiProviderAdapter {
  private static getApiKey(): string | null {
    return process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY || null;
  }

  /**
   * Main entrypoint for processing chat requests.
   */
  public static async processChat(
    messages: AssistantChatMessage[],
    timeoutMs = 15000
  ): Promise<AssistantResponse> {
    const lastUserMessage = [...messages].reverse().find((m) => m.role === 'user')?.content || '';
    const apiKey = this.getApiKey();

    // If API credentials are not set, immediately dispatch deterministic database fallback
    if (!apiKey) {
      const response = await runDeterministicAssistant(lastUserMessage);
      return {
        ...response,
        message: scrubAssistantOutput(response.message),
        isFallback: true,
        provider: 'deterministic-fallback',
      };
    }

    // Call external LLM provider with timeout and function execution loop
    try {
      const result = await this.callGeminiWithTools(messages, apiKey, timeoutMs);
      return {
        ...result,
        message: scrubAssistantOutput(result.message),
      };
    } catch (err) {
      console.warn('[AI Adapter] External AI provider failed or timed out. Falling back to deterministic engine:', err);
      const fallback = await runDeterministicAssistant(lastUserMessage);
      return {
        ...fallback,
        message: scrubAssistantOutput(fallback.message),
        isFallback: true,
        provider: 'deterministic-fallback',
      };
    }
  }

  /**
   * Communicates with Google Gemini via REST API supporting Tool/Function calls.
   */
  private static async callGeminiWithTools(
    messages: AssistantChatMessage[],
    apiKey: string,
    timeoutMs: number
  ): Promise<AssistantResponse> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    // Format conversation history for Gemini
    const contents: Array<{ role: 'user' | 'model'; parts: Array<{ text?: string; functionCall?: any; functionResponse?: any }> }> = [];

    for (const msg of messages.slice(-10)) {
      if (msg.role === 'user') {
        contents.push({ role: 'user', parts: [{ text: msg.content }] });
      } else if (msg.role === 'assistant') {
        contents.push({ role: 'model', parts: [{ text: msg.content }] });
      }
    }

    let collectedPackages: Package[] = [];
    let collectedComparison: PackageComparisonResult | undefined;
    let collectedAvailability: PackageAvailabilityResult | undefined;

    try {
      // First Turn: Send prompt and available tools
      const firstPayload = {
        contents,
        systemInstruction: {
          parts: [{ text: AI_TRAVEL_ASSISTANT_SYSTEM_PROMPT }],
        },
        tools: [{ functionDeclarations: GEMINI_FUNCTION_DECLARATIONS }],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 1500,
        },
      };

      const res1 = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(firstPayload),
        signal: controller.signal,
      });

      if (!res1.ok) {
        const errorText = await res1.text().catch(() => '');
        throw new Error(`Gemini API returned status ${res1.status}: ${errorText}`);
      }

      const data1 = await res1.json();
      const candidate1 = data1.candidates?.[0]?.content;
      const parts1 = candidate1?.parts || [];

      // Check if model emitted a function call
      const functionCallPart = parts1.find((p: any) => Boolean(p.functionCall));

      if (functionCallPart && functionCallPart.functionCall) {
        const { name, args } = functionCallPart.functionCall;

        // Execute corresponding server-side tool
        let toolOutput: any = null;

        if (name === 'search_packages') {
          const result = await searchPublishedPackagesTool(args as SearchPackagesToolInput);
          toolOutput = result;
          collectedPackages = result.packages;
        } else if (name === 'get_package_details') {
          const result = await getPackageDetailsTool(args as GetPackageDetailsToolInput);
          toolOutput = result;
          if (result.package) collectedPackages = [result.package];
        } else if (name === 'check_package_availability') {
          const result = await checkPackageAvailabilityTool(args as CheckAvailabilityToolInput);
          toolOutput = result;
          collectedAvailability = result;
        } else if (name === 'compare_packages') {
          const result = await comparePackagesTool(args as ComparePackagesToolInput);
          toolOutput = result;
          collectedComparison = result;
        } else {
          toolOutput = { error: `Tool ${name} is not supported.` };
        }

        // Second Turn: Feed tool output back to model for grounded answer synthesis
        const secondTurnContents = [
          ...contents,
          { role: 'model', parts: [{ functionCall: functionCallPart.functionCall }] },
          {
            role: 'user',
            parts: [
              {
                functionResponse: {
                  name,
                  response: toolOutput,
                },
              },
            ],
          },
        ];

        const secondPayload = {
          contents: secondTurnContents,
          systemInstruction: {
            parts: [{ text: AI_TRAVEL_ASSISTANT_SYSTEM_PROMPT }],
          },
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 1500,
          },
        };

        const res2 = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(secondPayload),
          signal: controller.signal,
        });

        if (!res2.ok) {
          throw new Error(`Gemini secondary tool turn failed with status ${res2.status}`);
        }

        const data2 = await res2.json();
        const finalCandidate = data2.candidates?.[0]?.content;
        const textPart = finalCandidate?.parts?.find((p: any) => typeof p.text === 'string');

        return {
          message: textPart?.text || 'Here are the matching travel packages from the database.',
          packages: collectedPackages.length > 0 ? collectedPackages : undefined,
          comparison: collectedComparison,
          availability: collectedAvailability,
          isFallback: false,
          provider: 'gemini',
        };
      }

      // No function call was made — direct conversational text
      const directTextPart = parts1.find((p: any) => typeof p.text === 'string');
      return {
        message: directTextPart?.text || 'How can I assist you with your travel plans in India?',
        packages: undefined,
        isFallback: false,
        provider: 'gemini',
      };
    } finally {
      clearTimeout(timeoutId);
    }
  }
}
