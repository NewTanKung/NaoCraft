'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';

export default function MonitorPage() {
  const [systemStats, setSystemStats] = useState<any>({});
  const [servers, setServers] = useState<any[]>([]);
  const [serverStats, setServerStats] = useState<Record<string, any>>({});

  const memPercent = useMemo(() => {
    if (!systemStats.memoryTotal) return 0;
    return (systemStats.memoryUsed / systemStats.memoryTotal) * 100;
  }, [systemStats]);

  const formatBytes = (bytes: number): string => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const formatUptime = (seconds: number): string => {
    if (!seconds) return '0 นาที';
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    if (days > 0) return `${days} วัน ${hours} ชม.`;
    if (hours > 0) return `${hours} ชม. ${mins} นาที`;
    return `${mins} นาที`;
  };

  const fetchAll = async () => {
    try {
      const [sysData, srvData] = await Promise.all([
        api.getSystemStats(),
        api.getServers(),
      ]);
      setSystemStats(sysData.stats || {});
      const srvList = srvData.servers || [];
      setServers(srvList);

      // Fetch per-server stats for running servers
      for (const srv of srvList) {
        if (srv.status === 'running') {
          try {
            const data = await api.getServerStats(srv.id);
            if (data.stats) {
              setServerStats((prev) => ({ ...prev, [srv.id]: data.stats }));
            }
          } catch {}
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchAll();
    const timer = setInterval(fetchAll, 3000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="space-y-8 animate-[fade-in_0.3s_ease-out]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-extrabold text-white tracking-tight">การตรวจสอบทรัพยากรระบบ (System Monitor)</h3>
          <p className="text-xs text-slate-400 mt-0.5">ติดตามการใช้ CPU, Memory และโหลดของเซิร์ฟเวอร์แบบ Real-time</p>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs font-mono">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500 shadow-[0_0_8px_#10b981]" />
            </span>
            <span>Polling ทุก 3 วินาที</span>
          </span>
        </div>
      </div>

      {/* System Stats Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* CPU */}
        <div className="rounded-2xl bg-gradient-to-br from-slate-900/90 to-[#0b101e]/90 border border-slate-800 shadow-xl backdrop-blur-xl p-6 relative overflow-hidden group hover:border-slate-700 transition-all">
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-cyan-500/10 rounded-full blur-2xl" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">CPU Usage</span>
            <span className="text-xs font-mono font-bold text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
              {systemStats.cpuUsage?.toFixed(1) || '0'}%
            </span>
          </div>
          <div className="text-3xl font-extrabold text-white mt-3 tracking-tight">
            {systemStats.cpuUsage?.toFixed(1) || '0'}
            <span className="text-lg text-slate-400 font-normal">%</span>
          </div>
          <div className="mt-4 h-2.5 bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-700">
            <div
              className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full transition-all duration-500 shadow-[0_0_10px_rgba(6,182,212,0.5)]"
              style={{ width: `${Math.min(100, systemStats.cpuUsage || 0)}%` }}
            />
          </div>
          <p className="text-[11px] text-slate-400 mt-2">ประมวลผลเซิร์ฟเวอร์โดยรวม</p>
        </div>

        {/* RAM Used */}
        <div className="rounded-2xl bg-gradient-to-br from-slate-900/90 to-[#0b101e]/90 border border-slate-800 shadow-xl backdrop-blur-xl p-6 relative overflow-hidden group hover:border-slate-700 transition-all">
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">RAM ที่กำลังใช้</span>
            <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
              {memPercent.toFixed(1)}%
            </span>
          </div>
          <div className="text-3xl font-extrabold text-white mt-3 tracking-tight">
            {formatBytes(systemStats.memoryUsed || 0)}
          </div>
          <div className="mt-4 h-2.5 bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-700">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-emerald-300 rounded-full transition-all duration-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"
              style={{ width: `${Math.min(100, memPercent)}%` }}
            />
          </div>
          <p className="text-[11px] text-slate-400 mt-2">
            จากทั้งหมด {formatBytes(systemStats.memoryTotal || 0)}
          </p>
        </div>

        {/* RAM Free */}
        <div className="rounded-2xl bg-gradient-to-br from-slate-900/90 to-[#0b101e]/90 border border-slate-800 shadow-xl backdrop-blur-xl p-6 relative overflow-hidden group hover:border-slate-700 transition-all">
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">RAM ว่าง</span>
            <span className="text-xs font-mono font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
              Available
            </span>
          </div>
          <div className="text-3xl font-extrabold text-white mt-3 tracking-tight">
            {formatBytes(systemStats.memoryFree || 0)}
          </div>
          <div className="mt-4 h-2.5 bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-700">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]"
              style={{ width: `${Math.min(100, 100 - memPercent)}%` }}
            />
          </div>
          <p className="text-[11px] text-slate-400 mt-2">พร้อมสำหรับเปิดเซิร์ฟเวอร์เพิ่ม</p>
        </div>

        {/* Uptime */}
        <div className="rounded-2xl bg-gradient-to-br from-slate-900/90 to-[#0b101e]/90 border border-slate-800 shadow-xl backdrop-blur-xl p-6 relative overflow-hidden group hover:border-slate-700 transition-all">
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-purple-500/10 rounded-full blur-2xl" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Uptime</span>
            <span className="text-xs font-mono font-bold text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">
              Online
            </span>
          </div>
          <div className="text-3xl font-extrabold text-white mt-3 tracking-tight">
            {formatUptime(systemStats.uptime || 0)}
          </div>
          <div className="mt-4 h-2.5 bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-700">
            <div className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full w-full" />
          </div>
          <p className="text-[11px] text-slate-400 mt-2">ระยะเวลาเปิดเครื่องทำงาน</p>
        </div>
      </div>

      {/* Per-Server Resource Breakdown */}
      <div className="rounded-2xl bg-gradient-to-br from-slate-900/90 to-[#0b101e]/90 border border-slate-800 shadow-xl backdrop-blur-xl overflow-hidden">
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h4 className="text-base font-bold text-white">การใช้ทรัพยากรแยกรายเซิร์ฟเวอร์</h4>
            <p className="text-xs text-slate-400 mt-0.5">เซิร์ฟเวอร์ที่กำลังทำงานอยู่จะแสดงข้อมูลโหลด CPU และหน่วยความจำจริง</p>
          </div>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono text-xs border border-slate-700">
            {servers.length} เซิร์ฟเวอร์
          </span>
        </div>

        {servers.length === 0 ? (
          <div className="p-16 text-center text-slate-400 text-xs font-mono">
            -- ยังไม่มีเซิร์ฟเวอร์ในระบบ --
          </div>
        ) : (
          <div className="divide-y divide-slate-800/80">
            {servers.map((srv) => (
              <div
                key={srv.id}
                className="p-5 flex items-center justify-between gap-4 hover:bg-slate-800/30 transition-colors"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <span className="relative flex h-2.5 w-2.5">
                    {srv.status === 'running' && (
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    )}
                    <span
                      className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                        srv.status === 'running' ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]' : 'bg-slate-500'
                      }`}
                    />
                  </span>
                  <div className="min-w-0">
                    <Link
                      href={`/servers/${srv.id}`}
                      className="font-bold text-white hover:text-emerald-400 transition-colors text-sm truncate block"
                    >
                      {srv.name}
                    </Link>
                    <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5 font-mono">
                      <span className="uppercase">{srv.loader}</span>
                      <span>•</span>
                      <span>MC {srv.mcVersion}</span>
                      <span>•</span>
                      <span>Port {srv.port}</span>
                    </div>
                  </div>
                </div>

                {/* Stats / Status */}
                <div className="flex items-center gap-6">
                  {srv.status === 'running' ? (
                    <div className="flex items-center gap-6 font-mono text-xs">
                      <div className="text-right">
                        <span className="text-slate-400 block text-[10px] uppercase font-bold">CPU</span>
                        <span className="text-cyan-400 font-bold">
                          {serverStats[srv.id]?.cpuPercent?.toFixed(1) || '0.0'}%
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-slate-400 block text-[10px] uppercase font-bold">RAM</span>
                        <span className="text-emerald-400 font-bold">
                          {serverStats[srv.id]?.memoryMB
                            ? `${serverStats[srv.id].memoryMB.toFixed(0)} MB`
                            : srv.maxMemory}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-xs font-mono text-slate-500 bg-slate-900/60 px-2.5 py-1 rounded border border-slate-800">
                      เซิร์ฟเวอร์ปิดอยู่
                    </div>
                  )}

                  <Link
                    href={`/servers/${srv.id}`}
                    className="inline-flex items-center justify-center gap-1 px-3 py-1.5 rounded-lg font-semibold text-xs bg-slate-800/80 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700/80 hover:border-slate-600 transition-all cursor-pointer"
                  >
                    จัดการ →
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
