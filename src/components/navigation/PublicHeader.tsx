'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Menu, X, User, Heart, Search, Building2, Compass, ChevronDown, LogOut, LayoutDashboard, CalendarCheck } from 'lucide-react';
import { PUBLIC_NAV, ROUTES } from '@/constants';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/context/AuthContext';

export const PublicHeader: React.FC = () => {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const { user, isAuthenticated, logout } = useAuth();

  const customer = user as unknown as { fullName?: string; customerProfile?: { fullName?: string } } | null;
  const provider = user as unknown as { businessName?: string; providerProfile?: { businessName?: string } } | null;
  const displayName =
    customer?.fullName ||
    customer?.customerProfile?.fullName ||
    provider?.businessName ||
    provider?.providerProfile?.businessName ||
    user?.email?.split('@')[0] ||
    'My Account';

  const dashboardHref =
    user?.role === 'admin'
      ? ROUTES.ADMIN_DASHBOARD
      : user?.role === 'provider'
      ? ROUTES.PROVIDER_DASHBOARD
      : ROUTES.ACCOUNT_DASHBOARD;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200/80 bg-white/95 backdrop-blur-md transition-all">
      <div className="mx-auto flex h-[58px] w-full max-w-[1700px] items-center justify-between gap-2 px-3 min-[360px]:px-4 sm:h-16 sm:gap-4 sm:px-6 xl:h-20 xl:gap-8 lg:px-8">
        
        {/* Brand Logo Area */}
        <div className="flex items-center shrink-0">
          <Link href={ROUTES.HOME} className="flex items-center gap-2 sm:gap-2.5 group py-1">
            <Image
              src="/vibe-miles-logo-green.png"
              alt="Vibe Miles"
              width={160}
              height={160}
              className="h-8 w-8 sm:h-10 sm:w-10 xl:h-11 xl:w-11 rounded-full object-contain bg-white shadow-sm transition-opacity group-hover:opacity-90 shrink-0"
              priority
            />
            <div className="flex flex-col leading-none shrink-0">
              <span className="font-extrabold text-sm min-[360px]:text-base sm:text-lg xl:text-xl tracking-tight text-slate-900 whitespace-nowrap">
                VIBE <span className="text-emerald-700">MILES</span>
              </span>
              <span className="hidden sm:block text-[8px] xl:text-[9px] font-semibold tracking-widest text-slate-400 uppercase whitespace-nowrap mt-0.5">
                Explore. Connect. Experience.
              </span>
            </div>
          </Link>
        </div>

        {/* Desktop Navigation Links */}
        <nav className="hidden lg:flex items-center justify-center gap-1 xl:gap-3 2xl:gap-5 flex-1 min-w-0 px-2">
          {PUBLIC_NAV.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                prefetch={true}
                className={`text-xs xl:text-sm font-medium transition-colors hover:text-teal-700 whitespace-nowrap px-2 py-1.5 rounded-md ${
                  isActive ? 'text-teal-700 font-bold border-b-2 border-teal-700' : 'text-slate-600'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Desktop Header Actions */}
        <div className="hidden lg:flex items-center gap-1.5 sm:gap-2 xl:gap-3 shrink-0">
          <Link href={ROUTES.SEARCH} prefetch={true}>
            <Button
              variant="ghost"
              size="sm"
              leftIcon={<Search className="w-4 h-4 text-slate-500" />}
              className="whitespace-nowrap px-2.5"
            >
              <span className="hidden xl:inline">Search</span>
            </Button>
          </Link>

          <Link href={ROUTES.ACCOUNT_WISHLIST} prefetch={true}>
            <Button
              variant="ghost"
              size="sm"
              leftIcon={<Heart className="w-4 h-4 text-rose-500" />}
              className="whitespace-nowrap px-2.5"
            >
              <span className="hidden xl:inline">Wishlist</span>
            </Button>
          </Link>

          <div className="hidden xl:block h-4 w-px bg-slate-200 mx-0.5" />

          {isAuthenticated && user ? (
            <div className="relative">
              <button
                type="button"
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 hover:border-teal-400 transition-colors"
              >
                <div className="h-6 w-6 rounded-full bg-teal-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                  {displayName.charAt(0).toUpperCase()}
                </div>
                <span className="max-w-[120px] truncate">{displayName}</span>
                <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${userDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {userDropdownOpen && (
                <div className="absolute right-0 top-full mt-2 w-56 rounded-2xl border border-slate-200 bg-white p-2 shadow-2xl z-50 animate-in fade-in zoom-in-95">
                  <div className="px-3 py-2 border-b border-slate-100 mb-1">
                    <p className="text-xs font-bold text-slate-900 truncate">{displayName}</p>
                    <p className="text-[10px] text-slate-500 truncate">{user.email}</p>
                    <span className="inline-block mt-1 rounded bg-teal-50 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-teal-700">
                      {user.role}
                    </span>
                  </div>

                  <Link
                    href={dashboardHref}
                    prefetch={true}
                    onClick={() => setUserDropdownOpen(false)}
                    className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-teal-700 transition-colors"
                  >
                    <LayoutDashboard className="w-3.5 h-3.5" />
                    {user.role === 'provider' ? 'Partner Dashboard' : user.role === 'admin' ? 'Admin Console' : 'My Dashboard'}
                  </Link>

                  {user.role === 'customer' && (
                    <Link
                      href={ROUTES.ACCOUNT_BOOKINGS}
                      prefetch={true}
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-teal-700 transition-colors"
                    >
                      <CalendarCheck className="w-3.5 h-3.5" />
                      My Bookings
                    </Link>
                  )}

                  <div className="my-1 border-t border-slate-100" />

                  <button
                    type="button"
                    onClick={() => {
                      setUserDropdownOpen(false);
                      logout();
                    }}
                    className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 transition-colors"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link href={ROUTES.PROVIDER_HOME} prefetch={true}>
                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={<Building2 className="w-3.5 h-3.5 xl:w-4 xl:h-4 text-teal-700" />}
                  className="whitespace-nowrap px-3 xl:px-4 text-xs xl:text-sm h-8 xl:h-9"
                >
                  List Your Business
                </Button>
              </Link>

              <Link href={ROUTES.LOGIN} prefetch={true}>
                <Button
                  variant="primary"
                  size="sm"
                  leftIcon={<User className="w-3.5 h-3.5 xl:w-4 xl:h-4" />}
                  className="whitespace-nowrap px-3.5 xl:px-4 text-xs xl:text-sm h-8 xl:h-9"
                >
                  Sign In
                </Button>
              </Link>
            </>
          )}
        </div>

        {/* Mobile Menu Button (< lg screens) */}
        <div className="flex lg:hidden items-center gap-0.5 sm:gap-2 shrink-0">
          <Link
            href={ROUTES.SEARCH}
            aria-label="Search devotional trips, foreign trips, and packages"
            className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-600 transition-colors hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600"
          >
            <Search className="h-5 w-5" />
          </Link>
          <Link
            href={isAuthenticated ? dashboardHref : ROUTES.LOGIN}
            aria-label={isAuthenticated ? "Go to your account dashboard" : "Sign in to your account"}
            className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-600 transition-colors hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600"
          >
            {isAuthenticated ? (
              <div className="h-6 w-6 rounded-full bg-teal-600 flex items-center justify-center text-white text-xs font-bold">
                {displayName.charAt(0).toUpperCase()}
              </div>
            ) : (
              <User className="h-5 w-5" />
            )}
          </Link>
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600"
            aria-label="Toggle Navigation"
            aria-expanded={mobileMenuOpen}
            aria-controls="public-mobile-navigation"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer (Mobile & Tablet) */}
      {mobileMenuOpen && (
        <nav
          id="public-mobile-navigation"
          aria-label="Mobile navigation"
          className="absolute inset-x-0 top-full z-50 border-b border-slate-200 bg-white px-4 pt-2 pb-6 shadow-xl animate-in slide-in-from-top-3 lg:hidden"
        >
          <div className="flex flex-col space-y-1.5 pt-2">
            {PUBLIC_NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                prefetch={true}
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-teal-700 transition-colors"
              >
                <Compass className="w-4 h-4 text-slate-400" />
                {item.label}
              </Link>
            ))}
          </div>

          <div className="border-t border-slate-100 pt-3 flex flex-col gap-2">
            <Link href={ROUTES.SEARCH} prefetch={true} onClick={() => setMobileMenuOpen(false)}>
              <Button variant="ghost" size="md" leftIcon={<Search className="w-4 h-4 text-slate-500" />} className="w-full justify-start">
                Search Trips & Packages
              </Button>
            </Link>
            <Link href={ROUTES.ACCOUNT_WISHLIST} prefetch={true} onClick={() => setMobileMenuOpen(false)}>
              <Button variant="ghost" size="md" leftIcon={<Heart className="w-4 h-4 text-rose-500" />} className="w-full justify-start">
                Wishlist
              </Button>
            </Link>
            
            {isAuthenticated && user ? (
              <>
                <div className="rounded-xl border border-teal-100 bg-teal-50/60 p-3 my-1">
                  <p className="text-xs font-bold text-slate-900 truncate">Signed in as {displayName}</p>
                  <p className="text-[10px] text-slate-500 truncate">{user.email}</p>
                </div>
                <Link href={dashboardHref} prefetch={true} onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="primary" size="md" leftIcon={<LayoutDashboard className="w-4 h-4" />} className="w-full">
                    {user.role === 'provider' ? 'Partner Dashboard' : user.role === 'admin' ? 'Admin Console' : 'My Account Dashboard'}
                  </Button>
                </Link>
                {user.role === 'customer' && (
                  <Link href={ROUTES.ACCOUNT_BOOKINGS} prefetch={true} onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="outline" size="md" leftIcon={<CalendarCheck className="w-4 h-4" />} className="w-full">
                      My Bookings
                    </Button>
                  </Link>
                )}
                <Button
                  variant="ghost"
                  size="md"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    logout();
                  }}
                  leftIcon={<LogOut className="w-4 h-4 text-rose-600" />}
                  className="w-full text-rose-600 hover:bg-rose-50 justify-start"
                >
                  Sign Out
                </Button>
              </>
            ) : (
              <>
                <Link href={ROUTES.PROVIDER_HOME} prefetch={true} onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="outline" size="md" leftIcon={<Building2 className="w-4 h-4 text-teal-700" />} className="w-full">
                    List Your Business (Partner SaaS)
                  </Button>
                </Link>
                <Link href={ROUTES.LOGIN} prefetch={true} onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="primary" size="md" leftIcon={<User className="w-4 h-4" />} className="w-full">
                    Sign In / Register
                  </Button>
                </Link>
              </>
            )}
          </div>
        </nav>
      )}
    </header>
  );
};
