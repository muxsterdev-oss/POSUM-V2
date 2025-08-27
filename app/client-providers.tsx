// app/client-providers.tsx
'use client'; // This directive is essential

import dynamic from 'next/dynamic';
import React from 'react';

// Dynamically import the main Providers component with SSR disabled
const Providers = dynamic(() => import('./providers').then(mod => mod.Providers), {
  ssr: false,
});

// This is a new wrapper component that will only render on the client
export default function ClientProviders({ children }: { children: React.ReactNode }) {
  return <Providers>{children}</Providers>;
}
