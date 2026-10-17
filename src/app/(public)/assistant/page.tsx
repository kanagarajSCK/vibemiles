'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles, Send, Bot, User as UserIcon, RefreshCw, Compass,
  Database, CheckCircle2, ChevronRight, ShieldCheck
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { assistantService } from '@/services/assistant.service';
import type { AssistantChatMessage, AssistantResponse } from '@/server/ai/types';
import { AiPackageCard } from '@/components/assistant/AiPackageCard';
import { AiComparisonTable } from '@/components/assistant/AiComparisonTable';
import type { Package } from '@/types';

interface FullPageMessageItem {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  packages?: Package[];
  comparison?: AssistantResponse['comparison'];
  availability?: AssistantResponse['availability'];
  followUpSuggestions?: string[];
  isFallback?: boolean;
  provider?: string;
  timestamp: string;
}

const FEATURED_PROMPTS = [
  {
    title: 'Weekend Budget Trip',
    query: 'Find a weekend trip under ₹5,000',
    desc: 'Quick 2-3 day getaways for spontaneous travellers',
    icon: '⚡',
  },
  {
    title: 'Family Vacations in Ooty',
    query: 'Show family-friendly packages near Ooty',
    desc: 'Scenic hill stations with comfortable stays & sightseeing',
    icon: '🌿',
  },
  {
    title: 'Kerala Backwaters & Houseboat',
    query: 'What is included in the Kerala houseboat packages?',
    desc: 'Alleppey cruise with authentic meals and backwater canals',
    icon: '🛶',
  },
  {
    title: 'Compare Mountain Tours',
    query: 'Compare popular adventure packages in Himachal Pradesh',
    desc: 'Side-by-side comparison of itineraries, prices & ratings',
    icon: '🏔️',
  },
];

let pageMsgCounter = 0;
function createPageMsgId(prefix: string): string {
  pageMsgCounter += 1;
  return `${prefix}-${pageMsgCounter}`;
}

function getPageTime(): string {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function AssistantPage() {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [messages, setMessages] = useState<FullPageMessageItem[]>([
    {
      id: 'init-001',
      role: 'assistant',
      content:
        '👋 Welcome to the **VibeMiles AI Travel Planner**!\n\nI am your intelligent assistant grounded directly in our live database of verified Indian travel listings. Tell me about your destination dreams, preferred travel dates, or budget limits (e.g. *under ₹5,000*), and I will retrieve matching verified packages from our local tour operators.',
      followUpSuggestions: [
        'Find a weekend trip under ₹5,000',
        'Show family-friendly packages near Ooty',
        'Check upcoming dates for Kerala tours',
      ],
      timestamp: 'Just now',
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  async function handleSend(customText?: string) {
    const textToSend = (customText || input).trim();
    if (!textToSend || loading) return;

    setError(null);
    setInput('');

    const userMessage: FullPageMessageItem = {
      id: createPageMsgId('user'),
      role: 'user',
      content: textToSend,
      timestamp: getPageTime(),
    };

    const updatedHistory = [...messages, userMessage];
    setMessages(updatedHistory);
    setLoading(true);

    try {
      const apiPayload: AssistantChatMessage[] = updatedHistory.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const response = await assistantService.sendMessage(apiPayload);

      const assistantMessage: FullPageMessageItem = {
        id: createPageMsgId('asst'),
        role: 'assistant',
        content: response.message,
        packages: response.packages,
        comparison: response.comparison,
        availability: response.availability,
        followUpSuggestions: response.followUpSuggestions,
        isFallback: response.isFallback,
        provider: response.provider,
        timestamp: getPageTime(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'Failed to retrieve travel recommendations.';
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  }

  function handleFormSubmit(e: React.FormEvent) {
    e.preventDefault();
    handleSend();
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Hero Header */}
        <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-800 relative overflow-hidden">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/30">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>Next-Gen Travel Intelligence</span>
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-white">
                VibeMiles AI Travel Assistant
              </h1>
              <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
                Discover verified tour packages, check live departure capacity, and compare curated itineraries across India powered by real database grounding.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row md:flex-col gap-2 shrink-0">
              <div className="flex items-center gap-2 text-xs text-emerald-400 bg-white/5 border border-white/10 px-3.5 py-2 rounded-xl">
                <Database className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Zero Hallucinations Guarantee</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-300 bg-white/5 border border-white/10 px-3.5 py-2 rounded-xl">
                <ShieldCheck className="w-4 h-4 text-teal-400 shrink-0" />
                <span>Live Supabase PostgreSQL Inventory</span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Suggestion Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {FEATURED_PROMPTS.map((item, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(item.query)}
              className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-md hover:border-emerald-300 transition-all text-left flex flex-col justify-between group"
            >
              <div>
                <div className="text-2xl mb-2">{item.icon}</div>
                <h3 className="font-bold text-slate-900 text-sm group-hover:text-emerald-700 transition-colors">
                  {item.title}
                </h3>
                <p className="text-xs text-slate-500 mt-1 line-clamp-2">{item.desc}</p>
              </div>
              <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-700 mt-3 pt-2 border-t border-slate-100">
                <span>Ask this</span>
                <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </button>
          ))}
        </div>

        {/* Chat Thread Panel */}
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-lg overflow-hidden flex flex-col h-[700px]">
          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 bg-slate-50/50">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex gap-3 sm:gap-4 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {m.role === 'assistant' && (
                  <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                    <Bot className="w-5 h-5" />
                  </div>
                )}

                <div
                  className={`max-w-[90%] sm:max-w-[80%] rounded-3xl p-4 sm:p-5 text-sm leading-relaxed space-y-3 shadow-xs ${
                    m.role === 'user'
                      ? 'bg-emerald-700 text-white rounded-tr-xs font-medium'
                      : 'bg-white text-slate-800 border border-slate-200/90 rounded-tl-xs'
                  }`}
                >
                  {/* Markdown Prose */}
                  <div className="prose prose-sm max-w-none break-words whitespace-pre-line text-slate-800">
                    {m.content}
                  </div>

                  {/* Attached Grounded Package Cards */}
                  {m.packages && m.packages.length > 0 && (
                    <div className="space-y-3 pt-3">
                      <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                        Live Database Matches ({m.packages.length})
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {m.packages.map((pkg) => (
                          <AiPackageCard key={pkg.id} packageData={pkg} />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Side-by-Side Comparison */}
                  {m.comparison && m.comparison.packages.length > 0 && (
                    <AiComparisonTable comparison={m.comparison} />
                  )}

                  {/* Availability Slots */}
                  {m.availability && m.availability.availableSlots.length > 0 && (
                    <div className="mt-3 p-3.5 bg-emerald-50/70 border border-emerald-100 rounded-2xl space-y-2">
                      <div className="text-xs font-bold text-emerald-900 uppercase tracking-wide flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        Live Departures with Open Capacity ({m.availability.totalAvailableSlots})
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {m.availability.availableSlots.slice(0, 6).map((slot, i) => (
                          <span
                            key={i}
                            className="bg-white border border-emerald-200 text-emerald-800 text-xs font-bold px-2.5 py-1 rounded-lg shadow-2xs"
                          >
                            📅 {slot.date} • ₹{slot.price.toLocaleString('en-IN')} ({slot.remainingCapacity} seats open)
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Follow-up Chips */}
                  {m.followUpSuggestions && m.followUpSuggestions.length > 0 && (
                    <div className="pt-3 border-t border-slate-100 space-y-2">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                        Suggested Inquiries
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {m.followUpSuggestions.map((suggestion, idx) => (
                          <button
                            key={idx}
                            onClick={() => handleSend(suggestion)}
                            className="text-xs font-medium bg-slate-50 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 border border-slate-200 hover:border-emerald-200 rounded-full px-3 py-1.5 text-left transition-colors flex items-center gap-1.5"
                          >
                            <span>{suggestion}</span>
                            <ChevronRight className="w-3.5 h-3.5 opacity-60" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Timestamp & Provenance */}
                  <div
                    className={`text-[10px] pt-1 flex items-center justify-between ${
                      m.role === 'user' ? 'text-emerald-100' : 'text-slate-400'
                    }`}
                  >
                    <span>{m.timestamp}</span>
                    {m.provider && (
                      <span className="italic">
                        {m.provider === 'gemini' ? 'AI Provider: Google Gemini' : 'Database Grounded Engine'}
                      </span>
                    )}
                  </div>
                </div>

                {m.role === 'user' && (
                  <div className="w-9 h-9 rounded-2xl bg-slate-800 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                    <UserIcon className="w-5 h-5" />
                  </div>
                )}
              </div>
            ))}

            {/* Loading Indicator */}
            {loading && (
              <div className="flex gap-3 items-center">
                <div className="w-9 h-9 rounded-2xl bg-emerald-700 text-white flex items-center justify-center shrink-0 shadow-sm">
                  <Bot className="w-5 h-5" />
                </div>
                <div className="bg-white border border-slate-200/90 rounded-3xl rounded-tl-xs p-4 text-sm text-slate-600 flex items-center gap-2.5 shadow-xs">
                  <RefreshCw className="w-4 h-4 text-emerald-600 animate-spin" />
                  <span>Searching live inventory, availability & itineraries...</span>
                </div>
              </div>
            )}

            {/* Error Banner */}
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-2xl text-xs sm:text-sm flex items-start gap-2.5">
                <div className="font-bold">Error:</div>
                <div>{error}</div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Form Input Footer */}
          <div className="p-4 bg-white border-t border-slate-200/90 shrink-0">
            <form onSubmit={handleFormSubmit} className="flex items-center gap-2 sm:gap-3">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask e.g. 'Show weekend trips under ₹5,000' or 'Compare Kerala tours'..."
                disabled={loading}
                className="flex-1 px-4 py-3 text-sm bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white transition-all disabled:opacity-50"
              />
              <Button
                type="submit"
                disabled={loading || !input.trim()}
                className="bg-emerald-700 hover:bg-emerald-800 text-white px-5 py-3 rounded-2xl font-bold text-sm flex items-center gap-2 shadow-sm"
              >
                <span>Send</span>
                <Send className="w-4 h-4" />
              </Button>
            </form>
            <div className="flex items-center justify-between text-xs text-slate-400 mt-2.5 px-1">
              <span className="flex items-center gap-1.5">
                <Compass className="w-3.5 h-3.5 text-slate-400" />
                Live marketplace query engine
              </span>
              <span className="hidden sm:inline">Press Enter to send</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
