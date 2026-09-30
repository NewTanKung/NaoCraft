'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import {
  Globe,
  Radio,
  Zap,
  Flame,
  Copy,
  Check,
  Play,
  Square,
  RefreshCw,
  Share2,
  Info,
  ExternalLink,
  Shield,
  Layers,
} from 'lucide-react';

interface NetworkTabProps {
  serverId: string;
  server: any;
}

export default function NetworkTab({ serverId, server }: NetworkTabProps) {
  const [connectionInfo, setConnectionInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [startingTunnel, setStartingTunnel] = useState(false);
  const [tunnelProvider, setTunnelProvider] = useState<'playit' | 'ngrok'>('playit');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const fetchConnection = async () => {
    try {
      const res = await api.getServerConnection(serverId);
      if (res.status === 'ok') {
        setConnectionInfo(res.connection);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConnection();
    const interval = setInterval(fetchConnection, 4000);
    return () => clearInterval(interval);
  }, [serverId]);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleStartTunnel = async () => {
    setStartingTunnel(true);
    try {
      await api.startTunnel({
        provider: tunnelProvider,
        targetType: 'minecraft',
        targetPort: server.port,
        serverId: server.id,
        serverName: server.name,
      });
      await fetchConnection();
    } catch (e) {
      console.error(e);
    } finally {
      setStartingTunnel(false);
    }
  };

  const handleStopTunnel = async (tunnelId: string) => {
    try {
      await api.stopTunnel(tunnelId);
      await fetchConnection();
    } catch (e) {
      console.error(e);
    }
  };

  if (loading && !connectionInfo) {
    return (
      <div className="rounded-2xl bg-gradient-to-br from-slate-900/90 to-[#0b101e]/90 border border-slate-800 p-16 text-center shadow-xl">
        <div className="w-8 h-8 border-3 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin inline-block" />
        <p className="text-xs text-slate-400 mt-3 font-medium">กำลังตรวจสอบการเชื่อมต่อเครือข่าย...</p>
      </div>
    );
  }

  const directPublic = connectionInfo?.publicAddress;
  const directLan = connectionInfo?.lanAddress || `127.0.0.1:${server.port}`;
  const activeTunnel = connectionInfo?.activeTunnel;

  // Formatted invitation text for Discord
  const inviteText = `🎮 เข้ามาเล่น Minecraft กับเราสิ!\nเซิร์ฟเวอร์: ${server.name}\nเวอร์ชัน: Minecraft ${server.mcVersion} (${server.loader})\nที่อยู่ IP สำหรับเข้าเล่น: ${activeTunnel?.publicAddress || directPublic || directLan}`;

  return (
    <div className="space-y-6 animate-[fade-in_0.3s_ease-out]">
      {/* 1. Connection Methods Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Direct IP (Port Forwarding) */}
        <div className="rounded-2xl bg-gradient-to-br from-slate-900/90 to-[#0b101e]/90 border border-slate-800 shadow-xl backdrop-blur-xl p-5 space-y-4 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Globe className="w-4 h-4 text-emerald-400" />
              <span>การเชื่อมต่อตรง (Direct IP & Port)</span>
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Direct WAN
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400">Public IP (สำหรับเพื่อนเล่นนอกบ้าน):</span>
              {directPublic ? (
                <button
                  onClick={() => copyToClipboard(directPublic, 'directPublic')}
                  type="button"
                  className="text-xs text-emerald-400 hover:text-white font-mono font-bold flex items-center gap-1 cursor-pointer transition-colors"
                >
                  {directPublic}
                  {copiedKey === 'directPublic' ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              ) : (
                <span className="text-xs text-slate-500 font-mono">ไม่มี Public IP</span>
              )}
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
              <span className="text-xs text-slate-400">LAN IP (สำหรับคนในบ้านเดียวกัน):</span>
              <button
                onClick={() => copyToClipboard(directLan, 'directLan')}
                type="button"
                className="text-xs text-cyan-400 hover:text-white font-mono font-bold flex items-center gap-1 cursor-pointer transition-colors"
              >
                {directLan}
                {copiedKey === 'directLan' ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          </div>

          <div className="text-[11px] text-slate-400 flex items-start gap-1.5 leading-relaxed">
            <Info className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
            <span>
              การใช้ Public IP โดยตรงจำเป็นต้องเปิด Port <code className="text-emerald-400 font-mono">{server.port}</code> ในหน้าตั้งค่าเราเตอร์ (Port Forwarding)
            </span>
          </div>
        </div>

        {/* Zero-Port Tunnel Card */}
        <div className="rounded-2xl bg-gradient-to-br from-slate-900/90 to-[#0b101e]/90 border border-slate-800 shadow-xl backdrop-blur-xl p-5 space-y-4 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-purple-400" />
              <span>Zero-Port Tunnel (ไม่ต้องเปิด Port)</span>
            </span>
            <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
              activeTunnel ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-slate-800 text-slate-400 border-slate-700'
            }`}>
              {activeTunnel ? 'Active' : 'Offline'}
            </span>
          </div>

          {activeTunnel ? (
            <div className="p-3.5 rounded-xl bg-purple-500/10 border border-purple-500/30 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-purple-300 block font-semibold">ที่อยู่สาธารณะสำหรับเชื่อมต่อ:</span>
                  <span className="font-mono text-base font-bold text-white tracking-wide">
                    {activeTunnel.publicAddress || 'กำลังเชื่อมต่อ...'}
                  </span>
                </div>
                {activeTunnel.publicAddress && (
                  <button
                    onClick={() => copyToClipboard(activeTunnel.publicAddress!, 'tunnelAddress')}
                    type="button"
                    className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition-colors cursor-pointer flex items-center gap-1.5 shadow-md"
                  >
                    {copiedKey === 'tunnelAddress' ? (
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

              <div className="flex items-center justify-between pt-2 border-t border-purple-500/20 text-xs">
                <span className="text-slate-400">ผู้ให้บริการ: <span className="uppercase text-purple-300 font-bold">{activeTunnel.provider}</span></span>
                <button
                  onClick={() => handleStopTunnel(activeTunnel.id)}
                  type="button"
                  className="text-red-400 hover:text-red-300 font-semibold cursor-pointer text-xs"
                >
                  ปิด Tunnel
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setTunnelProvider('playit')}
                  className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                    tunnelProvider === 'playit'
                      ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
                      : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:text-white'
                  }`}
                >
                  <Flame className="w-3.5 h-3.5" />
                  <span>Playit.gg</span>
                </button>
                <button
                  type="button"
                  onClick={() => setTunnelProvider('ngrok')}
                  className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                    tunnelProvider === 'ngrok'
                      ? 'bg-blue-500/20 border-blue-500 text-blue-400'
                      : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:text-white'
                  }`}
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>ngrok TCP</span>
                </button>
              </div>

              <button
                onClick={handleStartTunnel}
                disabled={startingTunnel}
                type="button"
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-bold text-xs bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-[0_4px_16px_rgba(147,51,234,0.3)] transition-all cursor-pointer disabled:opacity-50"
              >
                {startingTunnel ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>กำลังเปิด Tunnel...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>เปิด Tunnel สำหรับเซิร์ฟเวอร์นี้</span>
                  </>
                )}
              </button>
            </div>
          )}

          <p className="text-[11px] text-slate-400">
            ไม่ต้องตั้งค่าเราเตอร์ ทำงานได้แม้แชร์เน็ตมือถือหรืออยู่หอพัก
          </p>
        </div>
      </div>

      {/* 2. Share with Friends Card */}
      <div className="rounded-2xl bg-gradient-to-br from-slate-900/90 to-[#0b101e]/90 border border-slate-800 shadow-xl backdrop-blur-xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-base font-bold text-white flex items-center gap-2">
              <Share2 className="w-5 h-5 text-cyan-400" />
              <span>ข้อความชวนเพื่อนเข้าเล่น (Shareable Invite)</span>
            </h4>
            <p className="text-xs text-slate-400 mt-0.5">คัดลอกข้อความด้านล่างนี้ไปวางใน Discord, LINE หรือ Messenger ได้ทันที</p>
          </div>

          <button
            onClick={() => copyToClipboard(inviteText, 'inviteMsg')}
            type="button"
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-400 font-bold text-xs border border-slate-700 transition-colors cursor-pointer flex items-center gap-1.5"
          >
            {copiedKey === 'inviteMsg' ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>คัดลอกเรียบร้อยแล้ว</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>คัดลอกข้อความชวนเพื่อน</span>
              </>
            )}
          </button>
        </div>

        <pre className="p-4 rounded-xl bg-[#070b14] border border-slate-800 font-mono text-xs text-slate-300 whitespace-pre-wrap leading-relaxed">
          {inviteText}
        </pre>
      </div>

      {/* 3. DNS SRV Records Helper */}
      <div className="rounded-2xl bg-gradient-to-br from-slate-900/90 to-[#0b101e]/90 border border-slate-800 shadow-xl backdrop-blur-xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-base font-bold text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-emerald-400" />
              <span>ตั้งค่า Custom Domain & DNS SRV Record</span>
            </h4>
            <p className="text-xs text-slate-400 mt-0.5">
              หากคุณมีโดเมนส่วนตัว สามารถตั้งค่า DNS Record เพื่อให้เพื่อนพิมพ์ <code className="text-emerald-400 font-mono">play.yourdomain.com</code> เข้าเล่นได้
            </p>
          </div>

          <Link
            href="/network"
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-semibold text-xs border border-slate-700 transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <span>ไปที่หน้า Network Hub เต็มรูปแบบ</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs font-mono">
          <div className="p-3 rounded-xl bg-[#070b14] border border-slate-800">
            <span className="text-slate-500 block text-[10px] uppercase font-bold">Record Type</span>
            <span className="text-cyan-400 font-bold text-sm">SRV</span>
          </div>
          <div className="p-3 rounded-xl bg-[#070b14] border border-slate-800">
            <span className="text-slate-500 block text-[10px] uppercase font-bold">Service & Proto</span>
            <span className="text-white font-bold text-sm">_minecraft._tcp</span>
          </div>
          <div className="p-3 rounded-xl bg-[#070b14] border border-slate-800">
            <span className="text-slate-500 block text-[10px] uppercase font-bold">Port</span>
            <span className="text-amber-400 font-bold text-sm">{server.port}</span>
          </div>
          <div className="p-3 rounded-xl bg-[#070b14] border border-slate-800">
            <span className="text-slate-500 block text-[10px] uppercase font-bold">Target Host</span>
            <span className="text-emerald-400 font-bold text-sm truncate block">{directPublic?.split(':')[0] || 'your-ip'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
