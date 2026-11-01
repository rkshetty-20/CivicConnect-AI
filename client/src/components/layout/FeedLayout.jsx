import React from 'react';
import FeedSidebar from './FeedSidebar';
import BottomNav from './BottomNav';

function FeedLayout({ children }) {
  return (
    <div className="flex min-h-screen bg-surface-muted text-ink font-sans">
      <FeedSidebar />

      <main className="flex-1 flex justify-center pb-20 lg:pb-0 relative h-screen overflow-y-auto">
        {children}
      </main>

      <BottomNav />
    </div>
  );
}

export default FeedLayout;
