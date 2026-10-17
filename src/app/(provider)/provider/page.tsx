import React from 'react';
import Link from 'next/link';
import {
  Building2, MapPin, Users,
  TrendingUp, ShieldCheck, Star, BarChart3, CreditCard,
  Bell, Smartphone, ArrowRight,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { PartnerLandingHeader } from '@/components/navigation/PartnerLandingHeader';
import { PublicFooter } from '@/components/navigation/PublicFooter';
import { ROUTES } from '@/constants';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'List Your Travel Business | Become a Partner — Vibe Miles',
  description:
    'Join our travel marketplace and showcase your stays, tours, experiences, transport and travel services to more travelers across India.',
};

const PARTNER_BENEFITS = [
  { icon: TrendingUp, title: 'Reach More Travelers', desc: 'Get discovered by thousands of active travelers searching for experiences across India every day.' },
  { icon: Smartphone, title: 'Manage Bookings Easily', desc: 'Accept, track, and manage all bookings from one powerful partner dashboard.' },
  { icon: CreditCard, title: 'Secure Payments', desc: 'Receive payments directly and securely. No payment collection hassle for your team.' },
  { icon: BarChart3, title: 'Business Analytics', desc: 'Track views, bookings, revenue and customer insights with built-in analytics.' },
  { icon: Star, title: 'Reviews & Ratings', desc: 'Build trust with genuine verified traveler reviews displayed on your listing.' },
  { icon: ShieldCheck, title: 'Verified Operator Badge', desc: 'Get the Vibe Miles Verified badge — a trust signal that boosts traveler confidence.' },
  { icon: Bell, title: 'Instant Notifications', desc: 'Never miss a booking with real-time alerts for new bookings, payments and messages.' },
  { icon: Users, title: 'Dedicated Partner Support', desc: 'Our partner success team is available to help you grow your business on the platform.' },
];

const HOW_IT_WORKS = [
  { step: '01', title: 'Create Your Partner Account', desc: 'Sign up with your business details. It takes less than 5 minutes to get started.' },
  { step: '02', title: 'Add Your Business Details', desc: 'Add your business name, category, location, services and pricing information.' },
  { step: '03', title: 'Submit Verification Documents', desc: 'Upload your business registration proof and ID for our secure verification process.' },
  { step: '04', title: 'Get Approved & Start Receiving Bookings', desc: "Once verified, your listing goes live and travelers can book your services directly." },
];

export default function PartnerLandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <PartnerLandingHeader />

      <main className="flex-1">
        {/* ── HERO ── */}
        <section className="relative overflow-hidden bg-emerald-950 py-20 sm:py-28 text-white">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(52,211,153,0.15)_0%,_transparent_60%)]" />
          <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center space-y-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-teal-500/30 bg-teal-950/70 px-4 py-1.5 text-xs font-bold text-teal-300">
              <Building2 className="w-4 h-4" />
              Travel Business Partner Programme
            </div>

            <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white leading-tight max-w-4xl mx-auto">
              Grow Your Travel Business{' '}
              <span className="text-teal-400">With Us</span>
            </h1>

            <p className="max-w-2xl mx-auto text-lg text-slate-300">
              Reach more travelers, manage bookings, showcase your services, and grow your business with our all-in-one travel marketplace.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href={ROUTES.PARTNER_REGISTER}>
                <Button size="lg" rightIcon={<ArrowRight className="w-5 h-5" />} 
                  className="bg-emerald-500 hover:bg-emerald-400 text-white font-bold px-8 border-none shadow-lg shadow-emerald-500/20">
                  Start Listing Your Business
                </Button>
              </Link>
              <Link href={ROUTES.PARTNER_LOGIN}>
                <Button variant="outline" size="lg" 
                  className="border-2 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/10 hover:text-emerald-200 font-semibold">
                  Already a Partner? Sign In
                </Button>
              </Link>
            </div>

            <p className="text-xs text-slate-500 tracking-wide">
              Simple onboarding &nbsp;•&nbsp; Secure verification &nbsp;•&nbsp; Powerful business tools
            </p>
          </div>
        </section>

        {/* ── WHY PARTNER WITH US ── */}
        <section className="py-20 bg-slate-50">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-12">
            <div className="text-center max-w-2xl mx-auto space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-teal-700">Why Partner With Us</span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900">
                Everything You Need to Grow
              </h2>
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {PARTNER_BENEFITS.map((b) => {
                const Icon = b.icon;
                return (
                  <div key={b.title} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
                      <Icon className="w-5 h-5" />
                    </div>
                    <h3 className="font-bold text-slate-900">{b.title}</h3>
                    <p className="text-sm text-slate-500 leading-relaxed">{b.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ── HOW IT WORKS ── */}
        <section className="py-20 bg-white">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-12">
            <div className="text-center max-w-2xl mx-auto space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-teal-700">Simple Onboarding</span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900">How It Works</h2>
              <p className="text-slate-500 text-sm">Four simple steps to get your business listed and receiving bookings.</p>
            </div>

            {/* Desktop timeline */}
            <div className="hidden md:grid grid-cols-4 gap-8 relative">
              <div className="absolute top-7 left-[12.5%] right-[12.5%] h-px bg-slate-200" />
              {HOW_IT_WORKS.map((step, i) => (
                <div key={step.step} className="relative flex flex-col items-center text-center space-y-3">
                  <div className="relative z-10 flex h-14 w-14 items-center justify-center rounded-full bg-teal-700 text-white font-extrabold text-lg shadow-md">
                    {i + 1}
                  </div>
                  <h3 className="font-bold text-slate-900">{step.title}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">{step.desc}</p>
                </div>
              ))}
            </div>

            {/* Mobile timeline */}
            <div className="flex md:hidden flex-col gap-6">
              {HOW_IT_WORKS.map((step, i) => (
                <div key={step.step} className="flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-teal-700 text-white font-extrabold shadow-md">
                    {i + 1}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900">{step.title}</h3>
                    <p className="text-sm text-slate-500 mt-1 leading-relaxed">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
