'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Server,
  PlusCircle,
  Activity,
  Globe,
  Plus,
  Box,
} from 'lucide-react';

export default function Sidebar() {
  const pathname = usePathname();

  const navItems = [
    {
      to: '/',
      label: 'แดชบอร์ด',
      icon: <LayoutDashboard className="w-4 h-4" />,
    },
    {
      to: '/servers',
      label: 'เซิร์ฟเวอร์ทั้งหมด',
      icon: <Server className="w-4 h-4" />,
    },
    {
      to: '/create',
      label: 'สร้างเซิร์ฟเวอร์',
      icon: <PlusCircle className="w-4 h-4" />,
    },
    {
      to: '/monitor',
      label: 'มอนิเตอร์ทรัพยากร',
      icon: <Activity className="w-4 h-4" />,
    },
    {
      to: '/network',
      label: 'เชื่อมต่อภายนอก',
      icon: <Globe className="w-4 h-4" />,
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
              <Box className="w-5 h-5 text-emerald-400 group-hover:scale-110 transition-transform duration-300" />
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
          <Plus className="w-4 h-4" />
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
