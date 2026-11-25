'use client';

import React from 'react';
import { ForestEcosystemProvider } from '@/contexts/ForestEcosystemContext';
import ForestPlusShell from '@/components/layout/ForestPlusShell';

export default function HomePage() {
  return (
    <ForestEcosystemProvider>
      <ForestPlusShell />
    </ForestEcosystemProvider>
  );
}
