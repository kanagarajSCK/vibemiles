import React from 'react';
import { Compass, ShieldCheck, Heart, Award } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 space-y-12 pb-20">
      <div className="rounded-3xl bg-slate-900 p-8 sm:p-12 text-white shadow-xl text-center space-y-4">
        <div className="inline-flex items-center gap-2 rounded-full bg-teal-500/20 px-3 py-1 text-xs font-bold text-teal-300">
          <Compass className="w-4 h-4" /> About Vibe Miles
        </div>
        <h1 className="text-3xl font-extrabold text-white sm:text-5xl">Revolutionizing Indian Travel & Tourism</h1>
        <p className="text-slate-300 text-sm max-w-2xl mx-auto">
          Vibe Miles connects passionate adventurers with verified local tour operators, luxury houseboat cruisers, and heritage homestay hosts across India.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-2 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-slate-900 text-lg">100% Verified Operators</h3>
          <p className="text-xs text-slate-500">Every tour operator undergoes strict PAN/GST KYC verification.</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-2 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
            <Award className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-slate-900 text-lg">Best Price Guarantee</h3>
          <p className="text-xs text-slate-500">Zero hidden fees with direct operator pricing & exclusive promo codes.</p>
        </div>
 
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-2 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
            <Heart className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-slate-900 text-lg">24/7 Dedicated Support</h3>
          <p className="text-xs text-slate-500">Our traveler helpline is always active throughout your journey.</p>
        </div>
      </div>
    </div>
  );
}
