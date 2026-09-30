'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import {
  Globe,
  Radio,
  Server,
  Shield,
  Copy,
  Check,
  Play,
  Square,
  RefreshCw,
  Terminal,
  ExternalLink,
  Lock,
  Layers,
  Sparkles,
  Flame,
  Zap,
  ArrowRight,
  Info,
} from 'lucide-react';

interface NetworkStatusData {
  publicIpv4: string | null;
  publicIpv6: string | null;
  lanIps: Array<{ name: string; address: string; family: string }>;
  hostname: string;
  uptime: number;
}

export default function NetworkPage() {
  const [networkStatus, setNetworkStatus] = useState<NetworkStatusData | null>(null);
  const [servers, setServers] = useState<any[]>([]);
  const [tunnels, setTunnels] = useState<any[]>([]);
  const [config, setConfig] = useState<any>({
    panelDomain: 'panel.naocraft.net',
    panelSslEnabled: true,
    ngrokAuthToken: '',
    playitSecret: '',
    cloudflareTunnelToken: '',
  });

  const [activeTab, setActiveTab] = useState<'tunnels' | 'panel' | 'dns'>('tunnels');
  const [loading, setLoading] = useState(true);
  const [savingConfig, setSavingConfig] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Tunnel Launcher State
  const [selectedServerId, setSelectedServerId] = useState<string>('');
  const [tunnelProvider, setTunnelProvider] = useState<'playit' | 'ngrok' | 'cloudflare'>('playit');
  const [startingTunnel, setStartingTunnel] = useState(false);

  // Template State
  const [templates, setTemplates] = useState<{ nginx: string; firewall: any } | null>(null);
  const [customDomain, setCustomDomain] = useState('play.yourdomain.com');

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const loadData = async () => {
    try {
      const [netRes, srvRes, tunRes, cfgRes] = await Promise.all([
        api.getNetworkStatus(),
        api.getServers(),
        api.getTunnels(),
        api.getNetworkConfig(),
      ]);

      if (netRes.status === 'ok') setNetworkStatus(netRes.data);
      if (srvRes.servers) {
        setServers(srvRes.servers);
        if (!selectedServerId && srvRes.servers.length > 0) {
          setSelectedServerId(srvRes.servers[0].id);
        }
      }
      if (tunRes.tunnels) setTunnels(tunRes.tunnels);
      if (cfgRes.config) {
        setConfig((prev: any) => ({ ...prev, ...cfgRes.config }));
      }
    } catch (e) {
      console.error('Failed to load network data:', e);
    } finally {
      setLoading(false);
    }
  };

  const loadTemplates = async () => {
    try {
      const res = await api.getNetworkTemplates(
        config.panelDomain || 'panel.yourdomain.com',
        config.panelSslEnabled ?? true
      );
      if (res.status === 'ok') {
        setTemplates(res);
      }
    } catch {}
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    loadTemplates();
  }, [config.panelDomain, config.panelSslEnabled]);

  const handleStartTunnel = async () => {
    const srv = servers.find((s) => s.id === selectedServerId);
    if (!srv) return;

    setStartingTunnel(true);
    try {
      await api.startTunnel({
        provider: tunnelProvider,
        targetType: 'minecraft',
        targetPort: srv.port,
        serverId: srv.id,
        serverName: srv.name,
      });
      await loadData();
    } catch (e) {
      console.error(e);
    } finally {
      setStartingTunnel(false);
    }
  };

  const handleStopTunnel = async (tunnelId: string) => {
    try {
      await api.stopTunnel(tunnelId);
      await loadData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingConfig(true);
    try {
      await api.saveNetworkConfig(config);
      await loadTemplates();
    } catch (e) {
      console.error(e);
    } finally {
      setSavingConfig(false);
    }
  };

  const primaryLan = networkStatus?.lanIps[0]?.address || '127.0.0.1';

  return (
    <div className="space-y-8 animate-[fade-in_0.3s_ease-out]">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border border-slate-800 p-7 shadow-xl">
        <div className="absolute -right-16 -top-16 w-64 h-64 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-16 -bottom-16 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs font-semibold">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500 shadow-[0_0_8px_#10b981]" />
              </span>
              <span>Network & Remote Connection Hub</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
              <Globe className="w-8 h-8 text-emerald-400" />
              <span>การเชื่อมต่อจากภายนอก</span>
            </h2>
            <p className="text-sm text-slate-400 max-w-2xl">
              จัดการการเชื่อมต่อเข้าเซิร์ฟเวอร์ Minecraft ผ่าน Public IP, ระบบ Tunnel แบบไม่ต้องเปิด Port (Playit.gg / ngrok) และตั้งค่า Remote Access สำหรับ Web Panel
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={loadData}
              type="button"
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-xs bg-slate-800/80 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700/80 transition-all cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              <span>รีเฟรชเครือข่าย</span>
            </button>
          </div>
        </div>
      </div>

      {/* Network Overview Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Public IPv4 Card */}
        <div className="rounded-2xl bg-gradient-to-br from-slate-900/90 to-[#0b101e]/90 border border-slate-800 shadow-xl backdrop-blur-xl p-5 relative overflow-hidden group hover:border-emerald-500/50 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Globe className="w-4 h-4 text-emerald-400" />
              <span>Public IPv4 (ภายนอก)</span>
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Direct WAN
            </span>
          </div>
          <div className="text-2xl font-mono font-bold text-white mt-3 truncate tracking-tight">
            {networkStatus?.publicIpv4 || 'กำลังตรวจสอบ...'}
          </div>
          <div className="mt-3 flex items-center justify-between pt-3 border-t border-slate-800 text-xs">
            <span className="text-slate-400 text-[11px]">ใช้เชื่อมต่อตรงเมื่อเปิด Port</span>
            {networkStatus?.publicIpv4 && (
              <button
                onClick={() => copyToClipboard(networkStatus.publicIpv4!, 'publicIpv4')}
                type="button"
                className="text-emerald-400 hover:text-white transition-colors cursor-pointer flex items-center gap-1 text-[11px]"
              >
                {copiedKey === 'publicIpv4' ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>คัดลอกแล้ว</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>คัดลอก IP</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Local LAN IP Card */}
        <div className="rounded-2xl bg-gradient-to-br from-slate-900/90 to-[#0b101e]/90 border border-slate-800 shadow-xl backdrop-blur-xl p-5 relative overflow-hidden group hover:border-cyan-500/50 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Radio className="w-4 h-4 text-cyan-400" />
              <span>Local LAN IP (ในบ้าน)</span>
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              LAN / Wi-Fi
            </span>
          </div>
          <div className="text-2xl font-mono font-bold text-white mt-3 truncate tracking-tight">
            {primaryLan}
          </div>
          <div className="mt-3 flex items-center justify-between pt-3 border-t border-slate-800 text-xs">
            <span className="text-slate-400 text-[11px]">เครื่องในวง LAN เดียวกัน</span>
            <button
              onClick={() => copyToClipboard(primaryLan, 'lanIp')}
              type="button"
              className="text-cyan-400 hover:text-white transition-colors cursor-pointer flex items-center gap-1 text-[11px]"
            >
              {copiedKey === 'lanIp' ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>คัดลอกแล้ว</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>คัดลอก</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Active Tunnels Card */}
        <div className="rounded-2xl bg-gradient-to-br from-slate-900/90 to-[#0b101e]/90 border border-slate-800 shadow-xl backdrop-blur-xl p-5 relative overflow-hidden group hover:border-purple-500/50 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-purple-400" />
              <span>Zero-Port Tunnels</span>
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20">
              Active: {tunnels.filter((t) => t.status === 'active').length}
            </span>
          </div>
          <div className="text-2xl font-extrabold text-white mt-3 tracking-tight">
            {tunnels.filter((t) => t.status === 'active').length}
            <span className="text-sm font-normal text-slate-400 ml-1.5">ท่อเชื่อมต่อ</span>
          </div>
          <div className="mt-3 flex items-center justify-between pt-3 border-t border-slate-800 text-xs text-slate-400 text-[11px]">
            <span>Playit.gg / ngrok / Cloudflare</span>
            <span className="text-purple-400">ไม่ต้อง Forward Port</span>
          </div>
        </div>

        {/* Web Panel Status */}
        <div className="rounded-2xl bg-gradient-to-br from-slate-900/90 to-[#0b101e]/90 border border-slate-800 shadow-xl backdrop-blur-xl p-5 relative overflow-hidden group hover:border-amber-500/50 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-amber-400" />
              <span>Panel Remote Access</span>
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
              Nginx / Proxy
            </span>
          </div>
          <div className="text-lg font-bold text-white mt-3 truncate tracking-tight">
            {config.panelDomain || 'localhost:3000'}
          </div>
          <div className="mt-3 flex items-center justify-between pt-3 border-t border-slate-800 text-xs text-slate-400 text-[11px]">
            <span>สถานะ HTTPS:</span>
            <span className={config.panelSslEnabled ? 'text-emerald-400 font-semibold' : 'text-slate-400'}>
              {config.panelSslEnabled ? 'SSL เปิดใช้งาน' : 'HTTP มาตรฐาน'}
            </span>
          </div>
        </div>
      </div>

      {/* Modern Tabs Bar */}
      <div className="flex items-center gap-2 p-2 rounded-2xl bg-[#0b101e]/95 border border-slate-800 shadow-xl backdrop-blur-xl overflow-x-auto">
        <button
          onClick={() => setActiveTab('tunnels')}
          type="button"
          className={`flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold transition-all cursor-pointer whitespace-nowrap select-none ${
            activeTab === 'tunnels'
              ? 'bg-gradient-to-r from-emerald-500 via-emerald-600 to-teal-600 text-white shadow-[0_4px_20px_rgba(16,185,129,0.35)]'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
          }`}
        >
          <Zap className="w-4 h-4" />
          <span>Zero-Port Tunnels (Playit / ngrok)</span>
        </button>

        <button
          onClick={() => setActiveTab('panel')}
          type="button"
          className={`flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold transition-all cursor-pointer whitespace-nowrap select-none ${
            activeTab === 'panel'
              ? 'bg-gradient-to-r from-emerald-500 via-emerald-600 to-teal-600 text-white shadow-[0_4px_20px_rgba(16,185,129,0.35)]'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
          }`}
        >
          <Shield className="w-4 h-4" />
          <span>ตั้งค่า Remote Access สำหรับ Web Panel</span>
        </button>

        <button
          onClick={() => setActiveTab('dns')}
          type="button"
          className={`flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold transition-all cursor-pointer whitespace-nowrap select-none ${
            activeTab === 'dns'
              ? 'bg-gradient-to-r from-emerald-500 via-emerald-600 to-teal-600 text-white shadow-[0_4px_20px_rgba(16,185,129,0.35)]'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>สร้าง DNS & SRV Record (Custom Domain)</span>
        </button>
      </div>

      {/* TAB 1: ZERO-PORT TUNNELS */}
      {activeTab === 'tunnels' && (
        <div className="space-y-6">
          {/* Quick Tunnel Launch Box */}
          <div className="rounded-2xl bg-gradient-to-br from-slate-900/90 to-[#0b101e]/90 border border-slate-800 shadow-xl backdrop-blur-xl p-6 space-y-6">
            <div className="border-b border-slate-800 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h4 className="text-base font-bold text-white flex items-center gap-2">
                  <Zap className="w-5 h-5 text-emerald-400" />
                  <span>เริ่มการเชื่อมต่อ Tunnel ทันที (ไม่ต้องเปิด Port ในเราเตอร์)</span>
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  เหมาะสำหรับผู้ที่อยู่หอพัก คอนโด หรือเครือข่ายที่มี CGNAT / ไม่สามารถ Forward Port ในเราเตอร์ได้
                </p>
              </div>

              <div className="flex items-center gap-2 text-xs">
                <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold">
                  ✓ พร้อมแชร์ให้เพื่อนเล่นได้ทันที
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Select Server */}
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1.5">
                  1. เลือกเซิร์ฟเวอร์ Minecraft
                </label>
                <select
                  value={selectedServerId}
                  onChange={(e) => setSelectedServerId(e.target.value)}
                  className="w-full px-4 py-2.5 pr-10 rounded-xl bg-slate-900 text-slate-100 border border-slate-700 focus:border-emerald-500 outline-none text-xs cursor-pointer"
                >
                  {servers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} (Port: {s.port}, {s.loader})
                    </option>
                  ))}
                </select>
              </div>

              {/* Select Provider */}
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1.5">
                  2. เลือกผู้ให้บริการ Tunnel
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setTunnelProvider('playit')}
                    className={`px-3 py-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                      tunnelProvider === 'playit'
                        ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.3)]'
                        : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:text-white'
                    }`}
                  >
                    <Flame className="w-3.5 h-3.5" />
                    <span>Playit.gg</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTunnelProvider('ngrok')}
                    className={`px-3 py-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                      tunnelProvider === 'ngrok'
                        ? 'bg-blue-500/20 border-blue-500 text-blue-400 shadow-[0_0_12px_rgba(59,130,246,0.3)]'
                        : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:text-white'
                    }`}
                  >
                    <Zap className="w-3.5 h-3.5" />
                    <span>ngrok</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTunnelProvider('cloudflare')}
                    className={`px-3 py-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                      tunnelProvider === 'cloudflare'
                        ? 'bg-orange-500/20 border-orange-500 text-orange-400 shadow-[0_0_12px_rgba(249,115,22,0.3)]'
                        : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:text-white'
                    }`}
                  >
                    <Shield className="w-3.5 h-3.5" />
                    <span>Cloudflare</span>
                  </button>
                </div>
              </div>

              {/* Start Button */}
              <div className="flex items-end">
                <button
                  onClick={handleStartTunnel}
                  disabled={startingTunnel || servers.length === 0}
                  type="button"
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-bold text-xs bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white shadow-[0_4px_16px_rgba(16,185,129,0.3)] hover:shadow-[0_6px_22px_rgba(16,185,129,0.45)] transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {startingTunnel ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>กำลังเริ่ม Tunnel...</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 fill-current" />
                      <span>เปิด Tunnel ให้เพื่อนเข้าเล่น</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Active Tunnels List */}
          <div className="rounded-2xl bg-gradient-to-br from-slate-900/90 to-[#0b101e]/90 border border-slate-800 shadow-xl backdrop-blur-xl overflow-hidden">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h4 className="text-base font-bold text-white">รายการ Tunnels ที่กำลังทำงาน</h4>
                <p className="text-xs text-slate-400 mt-0.5">คัดลอกที่อยู่ Public Tunnel ด้านล่างนี้ไปให้เพื่อนพิมพ์ใน Minecraft เพื่อเข้าเล่นได้ทันที</p>
              </div>
              <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                {tunnels.length} ท่อทำงาน
              </span>
            </div>

            {tunnels.length === 0 ? (
              <div className="p-16 text-center space-y-3">
                <div className="w-12 h-12 mx-auto rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400">
                  <Zap className="w-6 h-6" />
                </div>
                <h5 className="text-sm font-bold text-white">ยังไม่มี Tunnel ที่กำลังทำงาน</h5>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  เลือกเซิร์ฟเวอร์ด้านบนแล้วกดปุ่ม &quot;เปิด Tunnel ให้เพื่อนเข้าเล่น&quot; เพื่อสร้างช่องทางเชื่อมต่อสาธารณะ
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-800/80">
                {tunnels.map((tun) => (
                  <div key={tun.id} className="p-5 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                            {tun.provider}
                          </span>
                          <span className="text-sm font-bold text-white">
                            {tun.serverName || 'Minecraft Server'}
                          </span>
                          <span className="text-xs text-slate-400 font-mono">
                            (Port {tun.targetPort})
                          </span>
                        </div>
                        <div className="text-xs text-slate-400 flex items-center gap-2">
                          <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500 shadow-[0_0_8px_#10b981]" />
                          </span>
                          <span>สถานะ: {tun.status === 'active' ? 'ออนไลน์พร้อมเชื่อมต่อ' : tun.status}</span>
                        </div>
                      </div>

                      {/* Public Address Badge & Actions */}
                      <div className="flex items-center gap-3">
                        {tun.publicAddress ? (
                          <div className="flex items-center gap-2 p-1.5 pl-3 rounded-xl bg-slate-800/90 border border-emerald-500/40">
                            <span className="font-mono text-xs font-bold text-emerald-300">
                              {tun.publicAddress}
                            </span>
                            <button
                              onClick={() => copyToClipboard(tun.publicAddress!, tun.id)}
                              type="button"
                              className="px-2.5 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-white font-bold text-[11px] transition-colors cursor-pointer flex items-center gap-1 shadow-sm"
                            >
                              {copiedKey === tun.id ? (
                                <>
                                  <Check className="w-3 h-3" />
                                  <span>คัดลอกแล้ว</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3 h-3" />
                                  <span>คัดลอก IP</span>
                                </>
                              )}
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs font-mono text-slate-400">กำลังรับ Public URL...</span>
                        )}

                        <button
                          onClick={() => handleStopTunnel(tun.id)}
                          type="button"
                          className="px-3 py-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5"
                        >
                          <Square className="w-3 h-3 fill-current" />
                          <span>ปิด Tunnel</span>
                        </button>
                      </div>
                    </div>

                    {/* Tunnel Logs preview */}
                    {tun.logs && tun.logs.length > 0 && (
                      <div className="p-3 rounded-xl bg-black/60 border border-slate-800/80 font-mono text-[11px] text-slate-400 max-h-24 overflow-y-auto space-y-0.5">
                        {tun.logs.slice(-5).map((log: string, idx: number) => (
                          <div key={idx} className="truncate">{log}</div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: WEB PANEL REMOTE ACCESS (NGINX & SSL) */}
      {activeTab === 'panel' && (
        <div className="space-y-6">
          <form onSubmit={handleSaveConfig} className="rounded-2xl bg-gradient-to-br from-slate-900/90 to-[#0b101e]/90 border border-slate-800 shadow-xl backdrop-blur-xl p-6 space-y-6">
            <div className="border-b border-slate-800 pb-4">
              <h4 className="text-base font-bold text-white flex items-center gap-2">
                <Shield className="w-5 h-5 text-amber-400" />
                <span>การตั้งค่าโดเมนและ Remote Access ของ NaoCraft</span>
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">
                กำหนดชื่อโดเมนสำหรับเข้าหน้าเว็บคอนโทรลพาเนลจากภายนอก พร้อมสร้างไฟล์ Nginx Configuration และคำสั่งเปิด Firewall อัตโนมัติ
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1.5">
                  ชื่อโดเมนของพาเนล (Panel Domain)
                </label>
                <input
                  value={config.panelDomain}
                  onChange={(e) => setConfig({ ...config, panelDomain: e.target.value })}
                  type="text"
                  placeholder="เช่น panel.yourdomain.com หรือ naocraft.mydomain.net"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900 text-slate-100 border border-slate-700 focus:border-emerald-500 outline-none text-xs font-mono transition-all"
                />
                <p className="text-[11px] text-slate-400 mt-1">ชี้ A Record ของโดเมนนี้มาที่ Public IP: {networkStatus?.publicIpv4 || 'Server IP'}</p>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1.5">
                  ความปลอดภัย HTTPS (SSL)
                </label>
                <div className="flex items-center gap-3 pt-1">
                  <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.panelSslEnabled}
                      onChange={(e) => setConfig({ ...config, panelSslEnabled: e.target.checked })}
                      className="w-4 h-4 rounded accent-emerald-500 cursor-pointer"
                    />
                    <span className="font-semibold text-white">เปิดใช้งาน SSL / HTTPS อัตโนมัติ (Let&apos;s Encrypt Certbot)</span>
                  </label>
                </div>
                <p className="text-[11px] text-slate-400 mt-1.5">เข้ารหัสการสื่อสารระหว่างเบราว์เซอร์กับพาเนล และรองรับ Secure WebSocket (WSS)</p>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1.5">
                  ngrok Auth Token (ไม่บังคับ)
                </label>
                <input
                  value={config.ngrokAuthToken || ''}
                  onChange={(e) => setConfig({ ...config, ngrokAuthToken: e.target.value })}
                  type="password"
                  placeholder="ใส่ ngrok authtoken จากแดชบอร์ด ngrok.com"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900 text-slate-100 border border-slate-700 focus:border-emerald-500 outline-none text-xs font-mono transition-all"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1.5">
                  Cloudflare Tunnel Token (ไม่บังคับ)
                </label>
                <input
                  value={config.cloudflareTunnelToken || ''}
                  onChange={(e) => setConfig({ ...config, cloudflareTunnelToken: e.target.value })}
                  type="password"
                  placeholder="eyJh..."
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900 text-slate-100 border border-slate-700 focus:border-emerald-500 outline-none text-xs font-mono transition-all"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={savingConfig}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white font-bold text-xs transition-all cursor-pointer shadow-md"
              >
                {savingConfig ? 'กำลังบันทึก...' : 'บันทึกการตั้งค่าโดเมน'}
              </button>
            </div>
          </form>

          {/* Generated Nginx Config Card */}
          {templates && (
            <div className="rounded-2xl bg-gradient-to-br from-slate-900/90 to-[#0b101e]/90 border border-slate-800 shadow-xl backdrop-blur-xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-base font-bold text-white flex items-center gap-2">
                    <Terminal className="w-5 h-5 text-cyan-400" />
                    <span>Nginx Reverse Proxy Configuration (คัดลอกไปวางที่เซิร์ฟเวอร์)</span>
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    ไฟล์คอนฟิกสำหรับวางที่ <code className="text-emerald-400 font-mono">/etc/nginx/sites-available/naocraft</code>
                  </p>
                </div>

                <button
                  onClick={() => copyToClipboard(templates.nginx, 'nginxConfig')}
                  type="button"
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 font-bold text-xs border border-slate-700 transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  {copiedKey === 'nginxConfig' ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>คัดลอกเรียบร้อยแล้ว</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>คัดลอก Nginx Config</span>
                    </>
                  )}
                </button>
              </div>

              <pre className="p-4 rounded-xl bg-[#070b14] border border-slate-800 font-mono text-xs text-slate-300 overflow-x-auto max-h-80 leading-relaxed">
                {templates.nginx}
              </pre>

              {/* Firewall Rules helper */}
              <div className="pt-4 border-t border-slate-800 space-y-3">
                <h5 className="text-sm font-bold text-white flex items-center gap-2">
                  <Shield className="w-4 h-4 text-emerald-400" />
                  <span>คำสั่งเปิด Firewall (Linux UFW & Windows PowerShell)</span>
                </h5>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-3.5 rounded-xl bg-[#070b14] border border-slate-800 space-y-2">
                    <div className="flex justify-between items-center text-xs font-bold text-slate-400">
                      <span>Ubuntu / Debian UFW</span>
                      <button
                        onClick={() => copyToClipboard(templates.firewall.ufw.join('\n'), 'ufwCmd')}
                        type="button"
                        className="text-emerald-400 hover:text-white transition-colors cursor-pointer"
                      >
                        {copiedKey === 'ufwCmd' ? '✓ คัดลอกแล้ว' : 'คัดลอก'}
                      </button>
                    </div>
                    <pre className="font-mono text-[11px] text-emerald-300/90 whitespace-pre-wrap">
                      {templates.firewall.ufw.join('\n')}
                    </pre>
                  </div>

                  <div className="p-3.5 rounded-xl bg-[#070b14] border border-slate-800 space-y-2">
                    <div className="flex justify-between items-center text-xs font-bold text-slate-400">
                      <span>Windows PowerShell (Run as Admin)</span>
                      <button
                        onClick={() => copyToClipboard(templates.firewall.powershell.join('\n'), 'psCmd')}
                        type="button"
                        className="text-emerald-400 hover:text-white transition-colors cursor-pointer"
                      >
                        {copiedKey === 'psCmd' ? '✓ คัดลอกแล้ว' : 'คัดลอก'}
                      </button>
                    </div>
                    <pre className="font-mono text-[11px] text-cyan-300/90 whitespace-pre-wrap">
                      {templates.firewall.powershell.join('\n')}
                    </pre>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: DNS & SRV RECORD GENERATOR */}
      {activeTab === 'dns' && (
        <div className="rounded-2xl bg-gradient-to-br from-slate-900/90 to-[#0b101e]/90 border border-slate-800 shadow-xl backdrop-blur-xl p-6 space-y-6">
          <div className="border-b border-slate-800 pb-4">
            <h4 className="text-base font-bold text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-cyan-400" />
              <span>เครื่องมือสร้าง DNS SRV Record สำหรับ Minecraft (เล่นโดยไม่ต้องใส่เลขพอร์ต)</span>
            </h4>
            <p className="text-xs text-slate-400 mt-0.5">
              ช่วยให้ผู้เล่นสามารถพิมพ์ชื่อโดเมนสั้น ๆ เช่น <code className="text-emerald-400 font-mono">play.yourdomain.com</code> เข้าเซิร์ฟเวอร์ได้ทันทีโดยไม่ต้องจำเลขพอร์ต (เช่น :25565)
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1.5">
                เซิร์ฟเวอร์เป้าหมาย
              </label>
              <select
                value={selectedServerId}
                onChange={(e) => setSelectedServerId(e.target.value)}
                className="w-full px-4 py-2.5 pr-10 rounded-xl bg-slate-900 text-slate-100 border border-slate-700 focus:border-emerald-500 outline-none text-xs cursor-pointer"
              >
                {servers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} (Port: {s.port})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1.5">
                ชื่อโดเมนที่คุณต้องการให้ผู้เล่นพิมพ์
              </label>
              <input
                value={customDomain}
                onChange={(e) => setCustomDomain(e.target.value)}
                type="text"
                placeholder="play.yourdomain.com"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-900 text-slate-100 border border-slate-700 focus:border-emerald-500 outline-none text-xs font-mono"
              />
            </div>
          </div>

          {/* DNS Records Table */}
          <div className="space-y-3 pt-2">
            <h5 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              ค่าที่ต้องนำไปใส่ในผู้ให้บริการโดเมนของคุณ (Cloudflare, Namecheap, GoDaddy):
            </h5>

            <div className="overflow-x-auto rounded-xl border border-slate-800">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-slate-800/80 text-slate-300 uppercase text-[11px] border-b border-slate-700">
                  <tr>
                    <th className="py-2.5 px-4">Type</th>
                    <th className="py-2.5 px-4">Name / Host</th>
                    <th className="py-2.5 px-4">Service & Proto</th>
                    <th className="py-2.5 px-4">Priority / Weight</th>
                    <th className="py-2.5 px-4">Port</th>
                    <th className="py-2.5 px-4">Target / IP</th>
                    <th className="py-2.5 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 bg-[#090d18] text-slate-200">
                  <tr>
                    <td className="py-3 px-4 font-bold text-cyan-400">SRV</td>
                    <td className="py-3 px-4 text-emerald-400">{customDomain.split('.')[0] || 'play'}</td>
                    <td className="py-3 px-4 text-slate-300">_minecraft._tcp</td>
                    <td className="py-3 px-4">0 / 5</td>
                    <td className="py-3 px-4 font-bold text-amber-400">
                      {servers.find((s) => s.id === selectedServerId)?.port || 25565}
                    </td>
                    <td className="py-3 px-4 font-bold text-white">
                      {networkStatus?.publicIpv4 || primaryLan}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() =>
                          copyToClipboard(
                            `SRV _minecraft._tcp.${customDomain} 0 5 ${
                              servers.find((s) => s.id === selectedServerId)?.port || 25565
                            } ${networkStatus?.publicIpv4 || primaryLan}`,
                            'srvRecord'
                          )
                        }
                        type="button"
                        className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-400 text-xs transition-colors cursor-pointer"
                      >
                        {copiedKey === 'srvRecord' ? '✓ คัดลอกแล้ว' : 'คัดลอกค่า'}
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20 text-xs text-slate-300 flex items-start gap-2.5">
              <Info className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-emerald-400">คำแนะนำ:</span> สำหรับผู้ที่ใช้ Cloudflare DNS ให้ปิด Proxy Status (สีเทา / DNS Only) บน SRV Record เพื่อให้ Minecraft Server สามารถเชื่อมต่อผ่าน TCP โดยตรงได้โดยไม่ถูกบล็อก
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
