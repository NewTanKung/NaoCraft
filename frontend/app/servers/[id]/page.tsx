'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import ServerHero from '@/components/server/ServerHero';
import ConsoleTab from '@/components/server/ConsoleTab';
import FileManagerTab from '@/components/server/FileManagerTab';
import ConfigTab from '@/components/server/ConfigTab';
import DangerZoneTab from '@/components/server/DangerZoneTab';

interface ServerDetailsPageProps {
  params: Promise<{ id: string }>;
}

export default function ServerDetailsPage({ params }: ServerDetailsPageProps) {
  const resolvedParams = use(params);
  const serverId = resolvedParams.id;

  const [server, setServer] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'console' | 'files' | 'config' | 'danger'>('console');

  const fetchServer = async () => {
    try {
      const data = await api.getServer(serverId);
      setServer(data.server || null);
    } catch (e) {
      console.error('Failed to load server:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServer();
    const interval = setInterval(fetchServer, 4000);
    return () => clearInterval(interval);
  }, [serverId]);

  const handleStart = async () => {
    await api.startServer(serverId);
    await fetchServer();
  };

  const handleStop = async () => {
    await api.stopServer(serverId);
    await fetchServer();
  };

  const handleRestart = async () => {
    await api.restartServer(serverId);
    await fetchServer();
  };

  const tabs = [
    {
      id: 'console' as const,
      label: 'คอนโซลสด (Live Console)',
      icon: (
        <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
          <polyline points="4 17 10 11 4 5" />
          <line x1="12" y1="19" x2="20" y2="19" />
        </svg>
      ),
    },
    {
      id: 'files' as const,
      label: 'จัดการไฟล์ (File Manager)',
      icon: (
        <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
        </svg>
      ),
    },
    {
      id: 'config' as const,
      label: 'การตั้งค่า (server.properties)',
      icon: (
        <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
      ),
    },
    {
      id: 'danger' as const,
      label: 'โซนอันตราย (Danger Zone)',
      icon: (
        <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
          <line x1="12" y1="9" x2="12" y2="13" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
      ),
    },
  ];

  if (loading) {
    return (
      <div className="rounded-2xl bg-gradient-to-br from-slate-900/90 to-[#0b101e]/90 border border-slate-800 shadow-xl backdrop-blur-xl p-20 text-center animate-[fade-in_0.3s_ease-out]">
        <div className="w-10 h-10 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin inline-block" />
        <p className="text-sm text-slate-400 mt-4 font-medium">กำลังโหลดข้อมูลเซิร์ฟเวอร์...</p>
      </div>
    );
  }

  if (!server) {
    return (
      <div className="rounded-2xl bg-gradient-to-br from-slate-900/90 to-[#0b101e]/90 border border-slate-800 shadow-xl backdrop-blur-xl p-16 text-center animate-[fade-in_0.3s_ease-out]">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 text-3xl">
          ⚠️
        </div>
        <h3 className="text-xl font-bold text-white">ไม่พบเซิร์ฟเวอร์ที่ต้องการ</h3>
        <p className="text-xs text-slate-400 mt-1">เซิร์ฟเวอร์นี้อาจถูกลบไปแล้ว หรือไม่มีอยู่ในระบบ</p>
        <Link
          href="/"
          className="inline-flex items-center justify-center gap-2 mt-6 px-6 py-2.5 rounded-xl font-bold text-sm bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white shadow-sm transition-all cursor-pointer"
        >
          กลับหน้าหลัก
        </Link>
      </div>
    );
  }

  return (
    <div className="animate-[fade-in_0.3s_ease-out] space-y-6">
      {/* Breadcrumb & Back button */}
      <div className="flex items-center justify-between">
        <Link
          href="/servers"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-emerald-400 transition-colors group"
        >
          <svg className="w-4 h-4 transition-transform group-hover:-translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
          <span>กลับหน้ารายการเซิร์ฟเวอร์</span>
        </Link>
      </div>

      {/* Hero Control Card */}
      <ServerHero
        server={server}
        onStart={handleStart}
        onStop={handleStop}
        onRestart={handleRestart}
        onRefresh={fetchServer}
      />

      {/* Modern Tabs Bar */}
      <div className="flex items-center gap-2 p-2 rounded-2xl bg-[#0b101e]/95 border border-slate-800 shadow-xl backdrop-blur-xl overflow-x-auto">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              type="button"
              className={`flex items-center gap-2.5 px-5 py-3 rounded-xl text-sm font-bold transition-all cursor-pointer whitespace-nowrap select-none ${
                isActive
                  ? 'bg-gradient-to-r from-emerald-500 via-emerald-600 to-teal-600 text-white shadow-[0_4px_20px_rgba(16,185,129,0.35)] scale-[1.01]'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
              }`}
            >
              {tab.icon}
              <span className="tracking-wide">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Panels */}
      <div>
        {activeTab === 'console' && <ConsoleTab serverId={serverId} />}
        {activeTab === 'files' && <FileManagerTab serverId={serverId} server={server} />}
        {activeTab === 'config' && <ConfigTab serverId={serverId} />}
        {activeTab === 'danger' && <DangerZoneTab serverId={serverId} serverName={server.name} />}
      </div>
    </div>
  );
}
