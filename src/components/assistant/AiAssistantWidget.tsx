'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles, X, Send, Bot, User as UserIcon, RefreshCw,
  Compass, AlertCircle, Database, CheckCircle2, ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { assistantService } from '@/services/assistant.service';
import type { AssistantChatMessage, AssistantResponse } from '@/server/ai/types';
import { AiPackageCard } from './AiPackageCard';
import { AiComparisonTable } from './AiComparisonTable';
import type { Package } from '@/types';

interface ChatMessageItem {
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

const STARTER_PROMPTS = [
  'Find a weekend trip under ₹5,000',
  'Show family-friendly packages near Ooty',
  'What is included in the Kerala tour?',
  'Compare popular adventure packages',
];

let widgetMsgCounter = 0;
function createWidgetMsgId(prefix: string): string {
  widgetMsgCounter += 1;
  return `${prefix}-${widgetMsgCounter}`;
}

function getWidgetTime(): string {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export const AiAssistantWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [messages, setMessages] = useState<ChatMessageItem[]>([
    {
      id: 'welcome-001',
      role: 'assistant',
      content:
        '👋 Welcome to **VibeMiles AI Travel Assistant**! I help you discover and compare real, verified travel packages directly from our live database.\n\nAsk me about weekend getaways, budget limits (e.g. *under ₹5,000*), destinations, or package inclusions.',
      followUpSuggestions: STARTER_PROMPTS,
      timestamp: 'Just now',
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen, messages]);

  // Handle ESC key to close modal
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  async function handleSend(customText?: string) {
    const textToSend = (customText || input).trim();
    if (!textToSend || loading) return;

    setError(null);
    setInput('');

    const userMessage: ChatMessageItem = {
      id: createWidgetMsgId('user'),
      role: 'user',
      content: textToSend,
      timestamp: getWidgetTime(),
    };

    const updatedHistory = [...messages, userMessage];
    setMessages(updatedHistory);
    setLoading(true);

    try {
      // Map to API format
      const apiPayload: AssistantChatMessage[] = updatedHistory.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const response = await assistantService.sendMessage(apiPayload);

      const assistantMessage: ChatMessageItem = {
        id: createWidgetMsgId('asst'),
        role: 'assistant',
        content: response.message,
        packages: response.packages,
        comparison: response.comparison,
        availability: response.availability,
        followUpSuggestions: response.followUpSuggestions,
        isFallback: response.isFallback,
        provider: response.provider,
        timestamp: getWidgetTime(),
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
    <>
      {/* Floating Trigger Button */}
      {!isOpen && (
        <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-40">
          <button
            onClick={() => setIsOpen(true)}
            aria-label="Open VibeMiles AI Travel Assistant"
            className="group flex items-center gap-2.5 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white font-bold px-4 py-3 sm:px-5 sm:py-3.5 rounded-full shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all duration-200 border border-white/20"
          >
            <div className="relative">
              <Sparkles className="w-5 h-5 text-amber-300 animate-pulse" />
              <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-400"></span>
              </span>
            </div>
            <div className="flex flex-col text-left leading-tight">
              <span className="text-xs sm:text-sm font-extrabold tracking-tight">AI Travel Assistant</span>
              <span className="text-[10px] text-emerald-100 font-medium hidden sm:inline">Ask about trips & dates</span>
            </div>
          </button>
        </div>
      )}

      {/* Assistant Modal / Drawer */}
      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="VibeMiles AI Travel Assistant"
          className="fixed inset-y-0 right-0 sm:inset-auto sm:bottom-4 sm:right-4 z-50 w-full sm:w-[440px] md:w-[480px] sm:h-[650px] max-h-[100dvh] sm:max-h-[85vh] flex flex-col bg-slate-50 sm:rounded-3xl shadow-2xl border border-slate-200/80 overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-200"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 text-white p-4 shrink-0 flex items-center justify-between border-b border-slate-700/60">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shadow-xs shrink-0">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h3 className="font-extrabold text-sm tracking-tight truncate">
                    VibeMiles AI Assistant
                  </h3>
                  <span className="inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    <Database className="w-2.5 h-2.5" /> Live DB
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 truncate">
                  Grounded in verified travel listings
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsOpen(false)}
                aria-label="Close Assistant"
                className="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center text-slate-300 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Messages Body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex gap-2.5 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {m.role === 'assistant' && (
                  <div className="w-7 h-7 rounded-lg bg-emerald-700 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`max-w-[88%] sm:max-w-[85%] rounded-2xl p-3.5 text-xs leading-relaxed space-y-2.5 shadow-xs ${
                    m.role === 'user'
                      ? 'bg-emerald-700 text-white rounded-tr-xs font-medium'
                      : 'bg-white text-slate-800 border border-slate-200/90 rounded-tl-xs'
                  }`}
                >
                  {/* Formatted Markdown Content */}
                  <div className="prose prose-xs max-w-none break-words whitespace-pre-line">
                    {m.content}
                  </div>

                  {/* Grounded Package Cards */}
                  {m.packages && m.packages.length > 0 && (
                    <div className="space-y-2.5 pt-2">
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Matched Live Packages ({m.packages.length})
                      </div>
                      <div className="space-y-2">
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

                  {/* Availability Slots Preview */}
                  {m.availability && m.availability.availableSlots.length > 0 && (
                    <div className="mt-2 p-2.5 bg-emerald-50/70 border border-emerald-100 rounded-xl space-y-1.5">
                      <div className="text-[10px] font-bold text-emerald-900 uppercase tracking-wide flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        Upcoming Open Departures ({m.availability.totalAvailableSlots})
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {m.availability.availableSlots.slice(0, 4).map((slot, i) => (
                          <span
                            key={i}
                            className="bg-white border border-emerald-200 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-md shadow-2xs"
                          >
                            {slot.date} • ₹{slot.price.toLocaleString('en-IN')} ({slot.remainingCapacity} seats)
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Follow-up Suggestions Chips */}
                  {m.followUpSuggestions && m.followUpSuggestions.length > 0 && (
                    <div className="pt-2 border-t border-slate-100 space-y-1.5">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Suggested Next Queries
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {m.followUpSuggestions.map((suggestion, idx) => (
                          <button
                            key={idx}
                            onClick={() => handleSend(suggestion)}
                            className="text-[11px] font-medium bg-slate-50 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 border border-slate-200 hover:border-emerald-200 rounded-full px-2.5 py-1 text-left transition-colors flex items-center gap-1"
                          >
                            <span>{suggestion}</span>
                            <ChevronRight className="w-3 h-3 opacity-60" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Message Metadata / Timestamp */}
                  <div
                    className={`text-[9px] pt-1 flex items-center justify-between ${
                      m.role === 'user' ? 'text-emerald-100' : 'text-slate-400'
                    }`}
                  >
                    <span>{m.timestamp}</span>
                    {m.provider && (
                      <span className="italic">
                        {m.provider === 'gemini' ? 'Google Gemini' : 'Database Grounded'}
                      </span>
                    )}
                  </div>
                </div>

                {m.role === 'user' && (
                  <div className="w-7 h-7 rounded-lg bg-slate-800 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                    <UserIcon className="w-4 h-4" />
                  </div>
                )}
              </div>
            ))}

            {/* Loading Indicator */}
            {loading && (
              <div className="flex gap-2.5 items-center">
                <div className="w-7 h-7 rounded-lg bg-emerald-700 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="bg-white border border-slate-200/90 rounded-2xl rounded-tl-xs p-3 text-xs text-slate-600 flex items-center gap-2 shadow-xs">
                  <RefreshCw className="w-3.5 h-3.5 text-emerald-600 animate-spin" />
                  <span>Searching verified inventory & pricing...</span>
                </div>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-500 mt-0.5" />
                <div className="flex-1">
                  <div className="font-bold">Inquiry Notice</div>
                  <div>{error}</div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Footer */}
          <div className="p-3 bg-white border-t border-slate-200/90 shrink-0">
            <form onSubmit={handleFormSubmit} className="flex items-center gap-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about trips, dates, budget or inclusions..."
                disabled={loading}
                className="flex-1 px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white transition-all disabled:opacity-50"
              />
              <Button
                type="submit"
                disabled={loading || !input.trim()}
                size="sm"
                className="bg-emerald-700 hover:bg-emerald-800 text-white px-3.5 py-2.5 rounded-xl shrink-0 font-bold text-xs flex items-center gap-1 shadow-xs"
              >
                <span>Send</span>
                <Send className="w-3.5 h-3.5" />
              </Button>
            </form>
            <div className="flex items-center justify-between text-[10px] text-slate-400 mt-2 px-1">
              <span className="flex items-center gap-1">
                <Compass className="w-3 h-3 text-slate-400" />
                Real-time marketplace recommendations
              </span>
              <span>ESC to close</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
