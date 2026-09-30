'use client';

import { useState } from 'react';
import {
  Play,
  Square,
  RotateCw,
  RefreshCw,
  Box,
  Scroll,
  Cpu,
  Hammer,
  Zap,
  Flame,
  Gamepad2,
  Copy,
  Check,
} from 'lucide-react';

interface ServerHeroProps {
  server: any;
  onStart: () => Promise<void>;
  onStop: () => Promise<void>;
  onRestart: () => Promise<void>;
  onRefresh: () => Promise<void>;
}

export default function ServerHero({
  server,
  onStart,
  onStop,
  onRestart,
  onRefresh,
}: ServerHeroProps) {
  const [copied, setCopied] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const copyAddress = () => {
    navigator.clipboard.writeText(`localhost:${server.port}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const wrapAction = async (fn: () => Promise<void>) => {
    setActionLoading(true);
    try {
      await fn();
    } finally {
      setActionLoading(false);
    }
  };

  const renderLoaderIcon = (loader: string) => {
    switch (loader) {
      case 'vanilla':
        return <Box className="w-7 h-7 text-emerald-400" />;
      case 'paper':
        return <Scroll className="w-7 h-7 text-blue-400" />;
      case 'fabric':
        return <Cpu className="w-7 h-7 text-purple-400" />;
      case 'forge':
        return <Hammer className="w-7 h-7 text-amber-400" />;
      case 'neoforge':
        return <Zap className="w-7 h-7 text-orange-400" />;
      case 'purpur':
        return <Flame className="w-7 h-7 text-fuchsia-400" />;
      default:
        return <Gamepad2 className="w-7 h-7 text-slate-400" />;
    }
  };

  const loaderBadgeClass = (loader: string) => {
    switch (loader) {
      case 'vanilla':
        return 'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30';
      case 'paper':
        return 'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/15 text-blue-400 border border-blue-500/30';
      case 'fabric':
        return 'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-500/15 text-purple-400 border border-purple-500/30';
      case 'forge':
        return 'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30';
      case 'neoforge':
        return 'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-orange-500/15 text-orange-400 border border-orange-500/30';
      case 'purpur':
        return 'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-fuchsia-500/15 text-fuchsia-400 border border-fuchsia-500/30';
      default:
        return 'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700';
    }
  };

  const statusText = (status: string) => {
    switch (status) {
      case 'running': return 'ออนไลน์';
      case 'stopped': return 'ออฟไลน์';
      case 'starting': return 'กำลังเริ่ม...';
      case 'stopping': return 'กำลังปิด...';
      default: return status;
    }
  };

  const statusTextClass = (status: string) => {
    switch (status) {
      case 'running': return 'text-emerald-400';
      case 'stopped': return 'text-slate-400';
      case 'starting':
      case 'stopping': return 'text-amber-400';
      default: return 'text-slate-400';
    }
  };

  return (
    <div className="rounded-2xl bg-gradient-to-br from-slate-900/95 via-slate-900/90 to-[#0b101e]/95 p-6 sm:p-7 relative overflow-hidden border border-slate-800 shadow-2xl backdrop-blur-xl">
      <div
        className={`absolute -right-16 -top-16 w-60 h-60 rounded-full blur-3xl pointer-events-none transition-all duration-700 ${
          server.status === 'running' ? 'bg-emerald-500/15' : 'bg-slate-700/15'
        }`}
      />

      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        {/* Server Info */}
        <div className="flex items-start sm:items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-slate-800/90 border border-slate-700 flex items-center justify-center flex-shrink-0 shadow-lg">
            {renderLoaderIcon(server.loader)}
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 className="text-2xl font-extrabold text-white tracking-tight">{server.name}</h2>
              <span className={loaderBadgeClass(server.loader)}>{server.loader}</span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700 font-mono">
                MC {server.mcVersion}
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
                RAM: {server.maxMemory || '2G'}
              </span>
            </div>

            {/* Quick address copy & Status */}
            <div className="flex items-center gap-3 pt-1 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="relative flex h-2.5 w-2.5">
                  {server.status === 'running' && (
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  )}
                  {(server.status === 'starting' || server.status === 'stopping') && (
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                  )}
                  <span
                    className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                      server.status === 'running'
                        ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]'
                        : server.status === 'stopped'
                        ? 'bg-slate-500'
                        : 'bg-amber-400 shadow-[0_0_8px_#f59e0b]'
                    }`}
                  />
                </span>
                <span className={`font-semibold ${statusTextClass(server.status)}`}>
                  {statusText(server.status)}
                </span>
              </div>

              <span className="text-slate-600">•</span>

              {/* IP Copy Button */}
              <button
                onClick={copyAddress}
                type="button"
                className="flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors cursor-pointer group"
                title="คลิกเพื่อคัดลอกที่อยู่เซิร์ฟเวอร์"
              >
                <span className="font-mono text-emerald-400">localhost:{server.port}</span>
                <span className="inline-flex items-center gap-1 text-[10px] bg-slate-800 px-2 py-0.5 rounded border border-slate-700 group-hover:border-emerald-500/50">
                  {copied ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-400" />
                      <span>คัดลอกแล้ว</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3 text-slate-400" />
                      <span>คัดลอก</span>
                    </>
                  )}
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Controls Button Group */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {server.status === 'stopped' && (
            <button
              onClick={() => wrapAction(onStart)}
              disabled={actionLoading}
              type="button"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white shadow-[0_4px_16px_rgba(16,185,129,0.35)] hover:shadow-[0_6px_22px_rgba(16,185,129,0.45)] transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>{actionLoading ? 'กำลังเริ่ม...' : 'เปิดเซิร์ฟเวอร์'}</span>
            </button>
          )}

          {server.status === 'running' && (
            <>
              <button
                onClick={() => wrapAction(onRestart)}
                disabled={actionLoading}
                type="button"
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-xs bg-slate-800/80 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700/80 hover:border-slate-600 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RotateCw className="w-4 h-4 text-amber-400" />
                <span>รีสตาร์ท</span>
              </button>

              <button
                onClick={() => wrapAction(onStop)}
                disabled={actionLoading}
                type="button"
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-xs bg-red-500/15 hover:bg-red-500/25 text-red-300 hover:text-white border border-red-500/30 hover:border-red-500/60 shadow-[0_4px_16px_rgba(239,68,68,0.2)] transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Square className="w-4 h-4 fill-current" />
                <span>หยุดการทำงาน</span>
              </button>
            </>
          )}

          <button
            onClick={() => wrapAction(onRefresh)}
            type="button"
            className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/80 hover:scale-105 transition-all cursor-pointer shadow-sm"
            title="รีเฟรชข้อมูล"
          >
            <RefreshCw className={`w-4 h-4 text-slate-400 ${actionLoading ? 'animate-spin text-emerald-400' : ''}`} />
          </button>
        </div>
      </div>
    </div>
  );
}
