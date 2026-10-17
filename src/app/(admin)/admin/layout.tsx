import React from 'react';
import { AdminSidebar } from '@/components/navigation/AdminSidebar';
import { AdminHeader } from '@/components/navigation/AdminHeader';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-slate-100">
      <AdminHeader />
      <div className="mx-auto w-full max-w-[1700px] px-4 py-6 sm:px-6 lg:px-10">
        <div className="flex flex-col gap-6 lg:flex-row">
          <AdminSidebar />
          <main className="flex-1 min-w-0">{children}</main>
        </div>
      </div>
    </div>
  );
}
