import React from 'react';
import { AccountSidebar } from '@/components/navigation/AccountSidebar';
import { UserHeader } from '@/components/navigation/UserHeader';
import { PublicFooter } from '@/components/navigation/PublicFooter';

export default function CustomerAccountLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="vibemiles-account flex min-h-screen flex-col bg-slate-50">
      <UserHeader />
      <div className="mx-auto w-full max-w-[1700px] px-4 py-6 sm:px-6 lg:px-10">
        <div className="flex flex-col gap-6 lg:flex-row">
          <AccountSidebar />
          <main className="flex-1 min-w-0">{children}</main>
        </div>
      </div>
      <PublicFooter />
    </div>
  );
}
