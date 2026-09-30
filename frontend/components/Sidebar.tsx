'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Sidebar() {
  const pathname = usePathname();

  const navItems = [
    {
      to: '/',
      label: 'แดชบอร์ด',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
          <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
      ),
    },
    {
      to: '/servers',
      label: 'เซิร์ฟเวอร์ทั้งหมด',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
          <rect x="2" y="2" width="20" height="8" rx="2" ry="2" />
          <rect x="2" y="14" width="20" height="8" rx="2" ry="2" />
          <line x1="6" y1="6" x2="6.01" y2="6" />
          <line x1="6" y1="18" x2="6.01" y2="18" />
        </svg>
      ),
    },
    {
      to: '/create',
      label: 'สร้างเซิร์ฟเวอร์',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="16" />
          <line x1="8" y1="12" x2="16" y2="12" />
        </svg>
      ),
    },
    {
      to: '/monitor',
      label: 'มอนิเตอร์ทรัพยากร',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
          <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
        </svg>
      ),
    },
  ];

  const isActive = (path: string) => {
    if (path === '/') return pathname === '/';
    return pathname.startsWith(path);
  };

  return (
    <aside className="w-64 bg-slate-900/90 backdrop-blur-xl border-r border-slate-800 flex flex-col fixed h-screen z-30 shadow-2xl">
      {/* Logo Branding */}
      <div className="p-5 border-b border-slate-800/80">
        <Link href="/" className="flex items-center gap-3.5 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 via-emerald-600 to-cyan-500 p-0.5 shadow-[0_0_18px_rgba(16,185,129,0.35)] group-hover:shadow-[0_0_25px_rgba(16,185,129,0.55)] transition-all duration-300">
            <div className="w-full h-full bg-[#080d1a] rounded-[10px] flex items-center justify-center">
              <svg className="w-5 h-5 text-emerald-400 group-hover:scale-110 transition-transform duration-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                <line x1="12" y1="22.08" x2="12" y2="12" />
              </svg>
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="text-lg font-extrabold text-white tracking-tight">NaoCraft</h1>
              <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">v1.0</span>
            </div>
            <p className="text-[11px] text-slate-400">Minecraft Cloud Panel</p>
          </div>
        </Link>
      </div>

      {/* Quick Action */}
      <div className="px-4 pt-4 pb-2">
        <Link
          href="/create"
          className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white text-xs font-semibold shadow-[0_4px_16px_rgba(16,185,129,0.3)] hover:shadow-[0_6px_22px_rgba(16,185,129,0.5)] transition-all duration-200 cursor-pointer active:scale-95"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          <span>สร้างเซิร์ฟเวอร์</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-3 space-y-1.5 overflow-y-auto">
        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 pb-1">
          เมนูหลัก
        </div>
        {navItems.map((item) => {
          const active = isActive(item.to);
          return (
            <Link
              key={item.to}
              href={item.to}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group relative ${
                active
                  ? 'bg-gradient-to-r from-emerald-500/15 to-transparent text-emerald-400 font-semibold border-l-2 border-emerald-500'
                  : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
              }`}
            >
              <div
                className={`w-5 h-5 flex items-center justify-center transition-transform group-hover:scale-110 ${
                  active ? 'text-emerald-400' : 'text-slate-400 group-hover:text-slate-200'
                }`}
              >
                {item.icon}
              </div>
              <span className="tracking-wide">{item.label}</span>

              {active && (
                <span className="absolute right-3 w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* System Status Footer */}
      <div className="p-3.5 border-t border-slate-800/80">
        <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-800 hover:border-slate-700 transition-colors">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500 shadow-[0_0_8px_#10b981]" />
              </span>
              <span className="text-xs font-medium text-slate-200">Server Engine</span>
            </div>
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
              Bun :4000
            </span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1.5 flex items-center justify-between">
            <span>สถานะระบบ</span>
            <span className="text-emerald-400 font-medium">พร้อมทำงาน 100%</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
