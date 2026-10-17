'use client';

import React, { Suspense } from 'react';

export default function UnauthorizedLayout({ children }: { children: React.ReactNode }) {
  return <Suspense>{children}</Suspense>;
}
