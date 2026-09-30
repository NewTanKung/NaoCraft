'use client';

import Sidebar from './Sidebar';
import Header from './Header';

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex bg-[#070a13] selection:bg-emerald-500/30 selection:text-white">
      {/* Sidebar navigation */}
      <Sidebar />

      {/* Main Content Area */}
      <main className="flex-1 ml-64 min-w-0 flex flex-col min-h-screen">
        <Header />
        <div className="p-8 flex-1">
          {children}
        </div>
      </main>
    </div>
  );
}
