import { Suspense } from 'react';
import type { Metadata } from 'next';
import { SearchView } from './SearchView';

export const metadata: Metadata = { title: 'Search' };

export default function SearchPage() {
  return (
    <Suspense fallback={null}>
      <SearchView />
    </Suspense>
  );
}
