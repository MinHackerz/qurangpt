import type { ReactNode } from 'react';

export default function MosquesLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <main className="max-w-7xl mx-auto w-full px-6 sm:px-8 py-6 sm:py-8">
        {children}
      </main>
    </div>
  );
}


