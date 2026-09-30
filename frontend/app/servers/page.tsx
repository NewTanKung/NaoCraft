'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import {
  Server,
  ServerOff,
  Plus,
  Play,
  Square,
  RotateCw,
  ArrowRight,
  Search,
  Box,
  Scroll,
  Cpu,
  Hammer,
  Zap,
  Flame,
} from 'lucide-react';

interface ServerItem {
  id: string;
  name: string;
  loader: string;
  mcVersion: string;
  port: number;
  maxMemory?: string;
  status: 'running' | 'stopped' | 'starting' | 'stopping';
}

export default function ServersPage() {
  const [servers, setServers] = useState<ServerItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionId, setActionId] = useState<string | null>(null);

  const fetchServers = async () => {
    try {
      const data = await api.getServers();
      setServers(data.servers || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServers();
    const interval = setInterval(fetchServers, 4000);
    return () => clearInterval(interval);
  }, []);

  const filteredServers = useMemo(() => {
    if (!searchQuery) return servers;
    return servers.filter((s) => s.name.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [servers, searchQuery]);

  const handleStart = async (id: string) => {
    setActionId(id);
    try {
      await api.startServer(id);
      await fetchServers();
    } catch {}
    setActionId(null);
  };

  const handleStop = async (id: string) => {
    setActionId(id);
    try {
      await api.stopServer(id);
      await fetchServers();
    } catch {}
    setActionId(null);
  };

  const handleRestart = async (id: string) => {
    setActionId(id);
    try {
      await api.restartServer(id);
      await fetchServers();
    } catch {}
    setActionId(null);
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

  const getLoaderIcon = (loader: string) => {
    switch (loader) {
      case 'vanilla': return <Box className="w-3.5 h-3.5" />;
      case 'paper': return <Scroll className="w-3.5 h-3.5" />;
      case 'fabric': return <Cpu className="w-3.5 h-3.5" />;
      case 'forge': return <Hammer className="w-3.5 h-3.5" />;
      case 'neoforge': return <Zap className="w-3.5 h-3.5" />;
      case 'purpur': return <Flame className="w-3.5 h-3.5" />;
      default: return <Server className="w-3.5 h-3.5" />;
    }
  };

  return (
    <div className="space-y-6 animate-[fade-in_0.3s_ease-out]">
      {/* Top toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Server className="w-6 h-6 text-emerald-400" />
            <span>เซิร์ฟเวอร์ทั้งหมดในระบบ</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">ควบคุมสถานะ และเข้าไปจัดการ Console หรือไฟล์ของเซิร์ฟเวอร์</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              type="text"
              placeholder="ค้นหาชื่อเซิร์ฟเวอร์..."
              className="w-48 sm:w-60 py-2 pl-9 pr-3.5 rounded-xl bg-slate-900/90 text-slate-100 border border-slate-700/80 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50 outline-none text-xs transition-all placeholder:text-slate-500"
            />
          </div>

          <Link
            href="/create"
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl font-bold text-xs bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white shadow-[0_4px_16px_rgba(16,185,129,0.3)] hover:shadow-[0_6px_22px_rgba(16,185,129,0.45)] hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>สร้างเซิร์ฟเวอร์</span>
          </Link>
        </div>
      </div>

      {/* Loading */}
      {loading ? (
        <div className="rounded-2xl bg-gradient-to-br from-slate-900/90 to-[#0b101e]/90 border border-slate-800 shadow-xl backdrop-blur-xl p-16 text-center">
          <div className="inline-block w-8 h-8 border-3 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
          <p className="text-sm text-slate-400 mt-3">กำลังโหลดเซิร์ฟเวอร์...</p>
        </div>
      ) : filteredServers.length === 0 ? (
        <div className="rounded-2xl bg-gradient-to-br from-slate-900/90 to-[#0b101e]/90 border border-dashed border-2 border-slate-800 shadow-xl backdrop-blur-xl p-16 text-center">
          <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-slate-800/80 border border-slate-700 flex items-center justify-center text-slate-400">
            <ServerOff className="w-7 h-7" />
          </div>
          <h4 className="text-base font-bold text-white">ไม่พบเซิร์ฟเวอร์</h4>
          <p className="text-xs text-slate-400 mt-1">ยังไม่มีเซิร์ฟเวอร์ที่ตรงกับคำค้นหาของคุณ</p>
          <Link
            href="/create"
            className="inline-flex items-center justify-center gap-1.5 mt-4 px-5 py-2 rounded-xl font-bold text-xs bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white shadow-sm hover:shadow-md transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>สร้างเซิร์ฟเวอร์ใหม่</span>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredServers.map((server) => (
            <div
              key={server.id}
              className="rounded-2xl bg-gradient-to-br from-slate-900/90 to-[#0b101e]/90 border border-slate-800 shadow-xl backdrop-blur-xl hover:border-emerald-500/50 hover:-translate-y-1 hover:shadow-[0_12px_30px_rgba(0,0,0,0.5),0_0_25px_rgba(16,185,129,0.25)] transition-all duration-300 p-5 flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <span className={loaderBadgeClass(server.loader)}>
                    {getLoaderIcon(server.loader)}
                    <span>
                      {{
                        vanilla: 'Vanilla',
                        paper: 'Paper',
                        fabric: 'Fabric',
                        forge: 'Forge',
                        neoforge: 'NeoForge',
                        purpur: 'Purpur',
                      }[server.loader] || server.loader}
                    </span>
                  </span>

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
                    <span className={`text-[11px] font-medium ${statusTextClass(server.status)}`}>
                      {statusText(server.status)}
                    </span>
                  </div>
                </div>

                <Link href={`/servers/${server.id}`} className="block">
                  <h4 className="text-lg font-bold text-white group-hover:text-emerald-400 transition-colors truncate">
                    {server.name}
                  </h4>
                </Link>

                <div className="mt-4 p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 text-xs space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Minecraft เวอร์ชัน</span>
                    <span className="font-mono text-slate-200 font-medium">{server.mcVersion}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">พอร์ตเซิร์ฟเวอร์</span>
                    <span className="font-mono text-emerald-400 font-medium">{server.port}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">หน่วยความจำ RAM</span>
                    <span className="font-mono text-slate-300">{server.maxMemory || '2G'}</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-slate-800 flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  {server.status === 'stopped' && (
                    <button
                      onClick={() => handleStart(server.id)}
                      disabled={actionId === server.id}
                      type="button"
                      className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg font-bold text-xs bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white shadow-sm hover:shadow-md transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>เปิดเซิร์ฟ</span>
                    </button>
                  )}
                  {server.status === 'running' && (
                    <>
                      <button
                        onClick={() => handleStop(server.id)}
                        disabled={actionId === server.id}
                        type="button"
                        className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold text-xs bg-red-500/15 hover:bg-red-500/25 text-red-300 hover:text-white border border-red-500/30 hover:border-red-500/60 shadow-sm transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Square className="w-3.5 h-3.5 fill-current" />
                        <span>หยุด</span>
                      </button>
                      <button
                        onClick={() => handleRestart(server.id)}
                        disabled={actionId === server.id}
                        type="button"
                        className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/80 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                        title="รีสตาร์ท"
                      >
                        <RotateCw className={`w-3.5 h-3.5 ${actionId === server.id ? 'animate-spin' : ''}`} />
                      </button>
                    </>
                  )}
                </div>

                <Link
                  href={`/servers/${server.id}`}
                  className="inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-lg font-semibold text-xs bg-slate-800/80 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700/80 hover:border-slate-600 transition-all cursor-pointer group/link"
                >
                  <span>จัดการ</span>
                  <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover/link:translate-x-0.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
