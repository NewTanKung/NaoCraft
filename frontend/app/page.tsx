'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import {
  Server,
  Activity,
  PowerOff,
  Layers,
  Plus,
  Activity as PulseIcon,
  Search,
  Copy,
  Check,
  Play,
  Square,
  RotateCw,
  ChevronRight,
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

export default function DashboardPage() {
  const [servers, setServers] = useState<ServerItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterLoader, setFilterLoader] = useState('');
  const [actionId, setActionId] = useState<string | null>(null);
  const [copiedPort, setCopiedPort] = useState<number | null>(null);

  const fetchServers = async () => {
    try {
      const data = await api.getServers();
      setServers(data.servers || []);
    } catch (e) {
      console.error('Failed to load servers:', e);
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
    return servers.filter((server) => {
      const matchName = server.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchLoader = filterLoader ? server.loader === filterLoader : true;
      return matchName && matchLoader;
    });
  }, [servers, searchQuery, filterLoader]);

  const handleStart = async (id: string) => {
    setActionId(id);
    try {
      await api.startServer(id);
      await fetchServers();
    } catch (e) {
      console.error('Failed to start server:', e);
    } finally {
      setActionId(null);
    }
  };

  const handleStop = async (id: string) => {
    setActionId(id);
    try {
      await api.stopServer(id);
      await fetchServers();
    } catch (e) {
      console.error('Failed to stop server:', e);
    } finally {
      setActionId(null);
    }
  };

  const handleRestart = async (id: string) => {
    setActionId(id);
    try {
      await api.restartServer(id);
      await fetchServers();
    } catch (e) {
      console.error('Failed to restart server:', e);
    } finally {
      setActionId(null);
    }
  };

  const copyAddress = (port: number) => {
    navigator.clipboard.writeText(`localhost:${port}`);
    setCopiedPort(port);
    setTimeout(() => setCopiedPort(null), 2000);
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

  const stats = [
    {
      label: 'เซิร์ฟเวอร์ทั้งหมด',
      value: servers.length,
      suffix: 'เครื่อง',
      description: 'บันทึกในระบบ',
      dotColor: 'bg-blue-500',
      bgGlow: 'bg-blue-500/20',
      iconContainerClass: 'bg-blue-500/10 border-blue-500/20 text-blue-400',
      icon: <Server className="w-5 h-5" />,
    },
    {
      label: 'กำลังทำงาน (Active)',
      value: servers.filter((s) => s.status === 'running').length,
      suffix: 'เครื่อง',
      description: 'เปิดรับการเชื่อมต่อ',
      dotColor: 'bg-emerald-500',
      bgGlow: 'bg-emerald-500/20',
      iconContainerClass: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
      icon: <Activity className="w-5 h-5" />,
    },
    {
      label: 'หยุดทำงาน (Offline)',
      value: servers.filter((s) => s.status === 'stopped').length,
      suffix: 'เครื่อง',
      description: 'พร้อมเริ่มทำงาน',
      dotColor: 'bg-slate-500',
      bgGlow: 'bg-slate-600/20',
      iconContainerClass: 'bg-slate-800 border-slate-700 text-slate-400',
      icon: <PowerOff className="w-5 h-5" />,
    },
    {
      label: 'Loaders ที่เลือกใช้',
      value: new Set(servers.map((s) => s.loader)).size,
      suffix: 'ประเภท',
      description: 'Vanilla, Paper, Forge ฯลฯ',
      dotColor: 'bg-purple-500',
      bgGlow: 'bg-purple-500/20',
      iconContainerClass: 'bg-purple-500/10 border-purple-500/20 text-purple-400',
      icon: <Layers className="w-5 h-5" />,
    },
  ];

  return (
    <div className="space-y-8 animate-[fade-in_0.3s_ease-out]">
      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border border-slate-800 p-7 shadow-xl">
        <div className="absolute -right-16 -top-16 w-64 h-64 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-16 -bottom-16 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs font-semibold">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500 shadow-[0_0_8px_#10b981]" />
              </span>
              <span>ระบบพร้อมใช้งานเต็มประสิทธิภาพ</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
              ยินดีต้อนรับสู่{' '}
              <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
                NaoCraft
              </span>{' '}
              Command Center
            </h2>
            <p className="text-sm text-slate-400 max-w-xl">
              ควบคุม จัดการไฟล์ ดู Console Real-time และติดตั้ง Mod/Plugin ให้กับ Minecraft Server ของคุณได้อย่างสมบูรณ์แบบ
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/create"
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-bold text-sm bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white shadow-[0_4px_20px_rgba(16,185,129,0.35)] hover:shadow-[0_8px_30px_rgba(16,185,129,0.5)] hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span className="font-bold">สร้างเซิร์ฟเวอร์ใหม่</span>
            </Link>

            <Link
              href="/monitor"
              className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-semibold text-xs bg-slate-800/80 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700/80 hover:border-slate-600 hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer"
            >
              <Activity className="w-4 h-4 text-slate-400" />
              <span>ดูมอนิเตอร์</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {stats.map((stat, i) => (
          <div
            key={i}
            className="rounded-2xl bg-gradient-to-br from-slate-900/90 to-[#0b101e]/90 border border-slate-800 shadow-xl backdrop-blur-xl p-5 relative overflow-hidden group hover:border-slate-600 hover:-translate-y-0.5 transition-all duration-300"
          >
            <div
              className={`absolute -right-8 -top-8 w-24 h-24 rounded-full blur-2xl opacity-40 transition-opacity group-hover:opacity-75 ${stat.bgGlow}`}
            />
            <div className="relative z-10 flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-slate-400 tracking-wide">{stat.label}</p>
                <div className="flex items-baseline gap-2 mt-1.5">
                  <span className="text-3xl font-extrabold text-white tracking-tight">{stat.value}</span>
                  {stat.suffix && <span className="text-xs text-slate-400 font-medium">{stat.suffix}</span>}
                </div>
                <p className="text-[11px] text-slate-400 mt-2 flex items-center gap-1.5">
                  <span className={`w-1.5 h-1.5 rounded-full ${stat.dotColor}`} />
                  {stat.description}
                </p>
              </div>
              <div
                className={`w-11 h-11 rounded-xl flex items-center justify-center border transition-all duration-300 group-hover:scale-110 ${stat.iconContainerClass}`}
              >
                {stat.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Servers Section Header */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
              <span>เซิร์ฟเวอร์ที่พร้อมใช้งาน</span>
              <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-slate-800 text-emerald-400 border border-slate-700">
                {filteredServers.length}
              </span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">เลือกเซิร์ฟเวอร์เพื่อเปิด Console หรือตั้งค่าต่าง ๆ</p>
          </div>

          {/* Filter bar */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5 pointer-events-none" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                type="text"
                placeholder="ค้นหาชื่อเซิร์ฟเวอร์..."
                className="w-48 sm:w-60 py-1.5 px-3 pl-9 rounded-xl bg-slate-900/90 text-slate-100 border border-slate-700/80 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50 outline-none text-xs transition-all placeholder:text-slate-500"
              />
            </div>

            <select
              value={filterLoader}
              onChange={(e) => setFilterLoader(e.target.value)}
              className="w-32 py-1.5 px-3 pr-8 rounded-xl bg-slate-900/90 text-slate-100 border border-slate-700/80 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50 outline-none text-xs transition-all cursor-pointer"
            >
              <option value="">ทั้งหมด</option>
              <option value="vanilla">Vanilla</option>
              <option value="paper">Paper</option>
              <option value="fabric">Fabric</option>
              <option value="forge">Forge</option>
              <option value="neoforge">NeoForge</option>
              <option value="purpur">Purpur</option>
            </select>
          </div>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="rounded-2xl bg-gradient-to-br from-slate-900/90 to-[#0b101e]/90 border border-slate-800 shadow-xl backdrop-blur-xl p-16 text-center">
            <div className="inline-block w-10 h-10 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
            <p className="text-sm text-slate-400 mt-4 font-medium">กำลังโหลดข้อมูลเซิร์ฟเวอร์...</p>
          </div>
        ) : servers.length === 0 ? (
          <div className="rounded-2xl bg-gradient-to-br from-slate-900/90 to-[#0b101e]/90 border border-dashed border-2 border-slate-800 shadow-xl backdrop-blur-xl p-16 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.2)]">
              <Server className="w-8 h-8" />
            </div>
            <h4 className="text-lg font-bold text-white">ยังไม่มีเซิร์ฟเวอร์ที่ถูกสร้าง</h4>
            <p className="text-sm text-slate-400 mt-1 max-w-sm mx-auto">
              เริ่มต้นสร้างเซิร์ฟเวอร์ Minecraft ของคุณด้วย Loader ที่ต้องการได้ทันที
            </p>
            <Link
              href="/create"
              className="inline-flex items-center justify-center gap-2 mt-6 px-6 py-2.5 rounded-xl font-bold text-sm bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white shadow-[0_4px_20px_rgba(16,185,129,0.35)] hover:shadow-[0_8px_30px_rgba(16,185,129,0.5)] transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>สร้างเซิร์ฟเวอร์แรกของคุณ</span>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredServers.map((server) => (
              <div
                key={server.id}
                className="rounded-2xl bg-gradient-to-br from-slate-900/90 to-[#0b101e]/90 border border-slate-800 shadow-xl backdrop-blur-xl hover:border-emerald-500/50 hover:-translate-y-1 hover:shadow-[0_12px_30px_rgba(0,0,0,0.5),0_0_25px_rgba(16,185,129,0.25)] transition-all duration-300 p-5 flex flex-col justify-between group relative overflow-hidden"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <span className={loaderBadgeClass(server.loader)}>
                      {getLoaderIcon(server.loader)}
                      <span>{server.loader}</span>
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

                  {/* Server Name */}
                  <Link href={`/servers/${server.id}`} className="block">
                    <h4 className="text-lg font-bold text-white group-hover:text-emerald-400 transition-colors truncate">
                      {server.name}
                    </h4>
                  </Link>

                  {/* Specs Grid */}
                  <div className="grid grid-cols-2 gap-2 mt-4 p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 text-xs">
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">เวอร์ชัน</span>
                      <span className="font-mono text-slate-200 font-medium">MC {server.mcVersion}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">RAM กำหนด</span>
                      <span className="font-mono text-emerald-400 font-medium">{server.maxMemory || '2G'}</span>
                    </div>
                    <div className="col-span-2 pt-2 border-t border-slate-700/60 flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-slate-300">
                        <Server className="w-3.5 h-3.5 text-slate-400" />
                        <span className="font-mono text-[11px]">localhost:{server.port}</span>
                      </div>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          copyAddress(server.port);
                        }}
                        type="button"
                        className="text-[10px] text-emerald-400 hover:text-white transition-colors cursor-pointer flex items-center gap-1"
                        title="คัดลอกที่อยู่เซิร์ฟเวอร์"
                      >
                        {copiedPort === server.port ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-400" />
                            <span>คัดลอกแล้ว</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3 text-emerald-400" />
                            <span>คัดลอก IP</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Bottom Action Buttons */}
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
                    className="inline-flex items-center justify-center gap-1 px-3.5 py-1.5 rounded-lg font-semibold text-xs bg-slate-800/80 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700/80 hover:border-slate-600 transition-all cursor-pointer group/link"
                  >
                    <span>คอนโซล</span>
                    <ChevronRight className="w-3.5 h-3.5 transition-transform group-hover/link:translate-x-0.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
