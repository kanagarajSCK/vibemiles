'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { ProviderSidebar } from '@/components/navigation/ProviderSidebar';
import { ProviderHeader } from '@/components/navigation/ProviderHeader';

export default function ProviderLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isPublicProviderPage = pathname === '/provider' || pathname === '/provider/register';

  if (isPublicProviderPage) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-100">
      <ProviderHeader />
      <div className="mx-auto w-full max-w-[1700px] px-4 py-6 sm:px-6 lg:px-10">
        <div className="flex flex-col gap-6 lg:flex-row">
          <ProviderSidebar />
          <main className="flex-1 min-w-0">{children}</main>
        </div>
      </div>
    </div>
  );
}
