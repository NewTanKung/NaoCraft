'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

export default function Header() {
  const pathname = usePathname();
  const [time, setTime] = useState('');

  useEffect(() => {
    const update = () => {
      setTime(
        new Date().toLocaleString('th-TH', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      );
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  const getPageTitle = () => {
    if (pathname === '/') return 'ภาพรวมแดชบอร์ด';
    if (pathname === '/servers') return 'จัดการเซิร์ฟเวอร์';
    if (pathname === '/create') return 'สร้างเซิร์ฟเวอร์ใหม่';
    if (pathname === '/monitor') return 'มอนิเตอร์ระบบ';
    if (pathname.startsWith('/servers/')) return 'ควบคุมเซิร์ฟเวอร์';
    return 'แดชบอร์ด';
  };

  const getPageDesc = () => {
    if (pathname === '/') return 'ภาพรวมเซิร์ฟเวอร์และสถานะระบบแบบ Real-time';
    if (pathname === '/servers') return 'เซิร์ฟเวอร์ทั้งหมดที่คุณสร้างไว้';
    if (pathname === '/create') return 'เลือก Loader, เวอร์ชัน และสเปกของเซิร์ฟเวอร์';
    if (pathname === '/monitor') return 'การใช้งาน CPU, RAM และประสิทธิภาพระบบ';
    if (pathname.startsWith('/servers/')) return 'ระบบจัดการ Minecraft Server ขั้นสูง';
    return 'ระบบจัดการ Minecraft Server';
  };

  return (
    <header className="sticky top-0 z-20 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/80 px-8 py-3.5 flex items-center justify-between">
      <div className="flex items-center gap-3">
        {/* Breadcrumb Icon */}
        <div className="w-8 h-8 rounded-lg bg-slate-800/80 border border-slate-700/80 flex items-center justify-center text-slate-400">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
            <rect x="2" y="2" width="20" height="8" rx="2" ry="2" />
            <rect x="2" y="14" width="20" height="8" rx="2" ry="2" />
            <line x1="6" y1="6" x2="6.01" y2="6" />
            <line x1="6" y1="18" x2="6.01" y2="18" />
          </svg>
        </div>
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span>NaoCraft</span>
            <span>/</span>
            <span className="text-emerald-400 font-medium">{getPageTitle()}</span>
          </div>
          <h2 className="text-base font-bold text-white tracking-tight leading-tight">{getPageDesc()}</h2>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Quick Status Pill */}
        {time && (
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/60 border border-slate-700/80 text-xs text-slate-300">
            <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            <span className="font-mono text-slate-200">{time}</span>
          </div>
        )}

        {/* Documentation / GitHub link */}
        <a
          href="https://github.com"
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/80 hover:scale-105 transition-all cursor-pointer shadow-sm"
          title="เอกสารคู่มือ"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
            <polyline points="10 9 9 9 8 9" />
          </svg>
        </a>
      </div>
    </header>
  );
}
