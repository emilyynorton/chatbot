'use client';

import dynamic from 'next/dynamic';

// Use dynamic import with SSR disabled to prevent hydration issues
// Import from the JSX file instead of the TSX file to avoid TypeScript errors
const DynamicOceanScene = dynamic(
  () => import('./OceanScene.jsx'),
  { ssr: false }
);

export default function OceanBackground() {
  return <DynamicOceanScene />;
}
