import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Mail, Phone, MapPin, Shield, Award, Lock, Heart, ChevronDown } from 'lucide-react';
import { APP_CONFIG, ROUTES } from '@/constants';

export const PublicFooter: React.FC = () => {
  return (
    <footer className="border-t border-slate-200 bg-slate-900 text-slate-300">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-5">
          {/* Brand Col */}
          <div className="lg:col-span-2 space-y-4">
            <Link href={ROUTES.HOME} className="flex items-center gap-2.5 group">
              <Image
                src="/vibe-miles-logo.png"
                alt="Vibe Miles"
                width={160}
                height={160}
                className="h-10 sm:h-11 w-auto object-contain transition-opacity group-hover:opacity-85"
              />
              <div className="flex flex-col leading-none">
                <span className="font-extrabold text-lg sm:text-xl tracking-tight text-white">
                  VIBE <span className="text-emerald-400">MILES</span>
                </span>
                <span className="text-[9px] font-semibold tracking-widest text-slate-400 uppercase">
                  Explore. Connect. Experience.
                </span>
              </div>
            </Link>
            <p className="text-sm text-slate-400 max-w-sm">
              {APP_CONFIG.description}. Discover sacred devotional trips, international foreign tours, luxury stays, and curated holiday packages.
            </p>
            <div className="flex items-center gap-4 text-slate-400">
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400 bg-emerald-950/60 px-2.5 py-1 rounded-full border border-emerald-800/40">
                <Shield className="w-3.5 h-3.5" /> 100% Verified Operators
              </span>
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-400 bg-amber-950/60 px-2.5 py-1 rounded-full border border-amber-800/40">
                <Award className="w-3.5 h-3.5" /> Best Price Guarantee
              </span>
            </div>
          </div>

          {/* Desktop Quick Links */}
          <div className="hidden lg:block">
            <h4 className="font-bold text-white text-sm uppercase tracking-wider mb-4">Marketplace</h4>
            <ul className="space-y-2.5 text-sm">
              <li><Link href={ROUTES.PACKAGES} className="hover:text-emerald-400 transition-colors">Tour Packages & Yatras</Link></li>
              <li><Link href={ROUTES.EXPLORE} className="hover:text-emerald-400 transition-colors">Explore Marketplace</Link></li>
              <li><Link href={ROUTES.DEVOTIONAL_TRIPS} className="hover:text-emerald-400 transition-colors">Devotional Trips</Link></li>
              <li><Link href={ROUTES.STAYS} className="hover:text-emerald-400 transition-colors">Luxury Stays & Villas</Link></li>
              <li><Link href={ROUTES.FOREIGN_TRIPS} className="hover:text-emerald-400 transition-colors">Foreign Trips</Link></li>
            </ul>
          </div>

          {/* Desktop Company */}
          <div className="hidden lg:block">
            <h4 className="font-bold text-white text-sm uppercase tracking-wider mb-4">Company</h4>
            <ul className="space-y-2.5 text-sm">
              <li><Link href="/about" className="hover:text-emerald-400 transition-colors">About Vibe Miles</Link></li>
              <li><Link href="/contact" className="hover:text-emerald-400 transition-colors">Contact & Support</Link></li>
              <li><Link href="/terms" className="hover:text-emerald-400 transition-colors">Terms of Service</Link></li>
              <li><Link href="/privacy" className="hover:text-emerald-400 transition-colors">Privacy Policy</Link></li>
              <li><Link href="/cancellation-policy" className="hover:text-emerald-400 transition-colors">Cancellation & Refunds</Link></li>
            </ul>
          </div>

          {/* Desktop Support & Contact */}
          <div className="hidden lg:block">
            <h4 className="font-bold text-white text-sm uppercase tracking-wider mb-4">24/7 Helpline</h4>
            <div className="space-y-3 text-sm">
              <p className="flex items-center gap-2 text-slate-300">
                <Phone className="w-4 h-4 text-emerald-400 shrink-0" />
                <a href={`tel:${APP_CONFIG.supportPhone.replace(/\s/g, '')}`} className="hover:text-emerald-400 transition-colors">
                  {APP_CONFIG.supportPhone}
                </a>
              </p>
              <p className="flex items-center gap-2 text-slate-300">
                <Mail className="w-4 h-4 text-emerald-400 shrink-0" />
                <a href={`mailto:${APP_CONFIG.supportEmail}`} className="hover:text-emerald-400 transition-colors">
                  {APP_CONFIG.supportEmail}
                </a>
              </p>
              <p className="flex items-start gap-2 text-slate-400 text-xs mt-2">
                <MapPin className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>4th Floor, Tech Hub Tower, MG Road, Bengaluru, Karnataka 560001</span>
              </p>
            </div>
          </div>
        </div>

        {/* Mobile and tablet accordion links */}
        <div className="mt-8 divide-y divide-slate-800 border-y border-slate-800 bg-slate-900 text-white lg:hidden">
          <details className="group">
            <summary className="flex min-h-16 cursor-pointer list-none items-center justify-between px-1 text-lg font-medium text-white marker:hidden [&::-webkit-details-marker]:hidden">
              <span>Marketplace</span>
              <ChevronDown className="h-6 w-6 text-emerald-400 transition-transform group-open:rotate-180" />
            </summary>
            <ul className="space-y-3 px-1 pb-5 text-sm text-slate-300">
              <li><Link href={ROUTES.PACKAGES} className="block py-1 hover:text-emerald-400">Tour Packages & Yatras</Link></li>
              <li><Link href={ROUTES.EXPLORE} className="block py-1 hover:text-emerald-400">Explore Marketplace</Link></li>
              <li><Link href={ROUTES.DEVOTIONAL_TRIPS} className="block py-1 hover:text-emerald-400">Devotional Trips</Link></li>
              <li><Link href={ROUTES.STAYS} className="block py-1 hover:text-emerald-400">Luxury Stays & Villas</Link></li>
              <li><Link href={ROUTES.FOREIGN_TRIPS} className="block py-1 hover:text-emerald-400">Foreign Trips</Link></li>
            </ul>
          </details>

          <details className="group">
            <summary className="flex min-h-16 cursor-pointer list-none items-center justify-between px-1 text-lg font-medium text-white marker:hidden [&::-webkit-details-marker]:hidden">
              <span>Company</span>
              <ChevronDown className="h-6 w-6 text-emerald-400 transition-transform group-open:rotate-180" />
            </summary>
            <ul className="space-y-3 px-1 pb-5 text-sm text-slate-300">
              <li><Link href="/about" className="block py-1 hover:text-emerald-400">About Vibe Miles</Link></li>
              <li><Link href="/contact" className="block py-1 hover:text-emerald-400">Contact & Support</Link></li>
              <li><Link href="/terms" className="block py-1 hover:text-emerald-400">Terms of Service</Link></li>
              <li><Link href="/privacy" className="block py-1 hover:text-emerald-400">Privacy Policy</Link></li>
              <li><Link href="/cancellation-policy" className="block py-1 hover:text-emerald-400">Cancellation & Refunds</Link></li>
            </ul>
          </details>

          <details className="group">
            <summary className="flex min-h-16 cursor-pointer list-none items-center justify-between px-1 text-lg font-medium text-white marker:hidden [&::-webkit-details-marker]:hidden">
              <span>24/7 Helpline</span>
              <ChevronDown className="h-6 w-6 text-emerald-400 transition-transform group-open:rotate-180" />
            </summary>
            <div className="space-y-3 px-1 pb-5 text-sm text-slate-300">
              <a href={`tel:${APP_CONFIG.supportPhone.replace(/\s/g, '')}`} className="flex items-center gap-2 py-1 hover:text-emerald-400">
                <Phone className="h-4 w-4 text-emerald-700" /> {APP_CONFIG.supportPhone}
              </a>
              <a href={`mailto:${APP_CONFIG.supportEmail}`} className="flex items-center gap-2 py-1 hover:text-emerald-400">
                <Mail className="h-4 w-4 text-emerald-400" /> {APP_CONFIG.supportEmail}
              </a>
              <p className="flex items-start gap-2 text-xs text-slate-500">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                <span>4th Floor, Tech Hub Tower, MG Road, Bengaluru, Karnataka 560001</span>
              </p>
            </div>
          </details>
        </div>

        <div className="mt-12 border-t border-slate-800 pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} {APP_CONFIG.name} Private Limited. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <span className="flex items-center gap-1"><Lock className="w-3.5 h-3.5 text-emerald-500" /> SSL Encrypted Checkout</span>
            <span className="flex items-center gap-1"><Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" /> Made for Indian Travelers</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
