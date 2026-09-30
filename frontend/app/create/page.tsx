'use client';

import { useState, useMemo, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import {
  Box,
  Scroll,
  Cpu,
  Hammer,
  Zap,
  Flame,
  Sparkles,
  Check,
  ArrowLeft,
  AlertCircle,
  Server,
} from 'lucide-react';

interface LoaderOption {
  id: string;
  name: string;
  description: string;
  tag: string;
  icon: ReactNode;
}

export default function CreateServerPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    name: '',
    loader: '',
    mcVersion: '',
    loaderVersion: '',
    port: 25565,
    minMemory: '1G',
    maxMemory: '4G',
    javaPath: 'java',
  });

  const loaders: LoaderOption[] = [
    { id: 'vanilla', name: 'Vanilla', description: '', tag: 'Official', icon: <Box className="w-8 h-8 text-emerald-400" /> },
    { id: 'paper', name: 'Paper', description: '', tag: 'Plugins', icon: <Scroll className="w-8 h-8 text-blue-400" /> },
    { id: 'fabric', name: 'Fabric', description: '', tag: 'Mods', icon: <Cpu className="w-8 h-8 text-purple-400" /> },
    { id: 'forge', name: 'Forge', description: '', tag: 'Mods', icon: <Hammer className="w-8 h-8 text-amber-400" /> },
    { id: 'neoforge', name: 'NeoForge', description: '', tag: 'Mods', icon: <Zap className="w-8 h-8 text-orange-400" /> },
    { id: 'purpur', name: 'Purpur', description: '', tag: 'Plugins', icon: <Flame className="w-8 h-8 text-fuchsia-400" /> },
  ];

  const [versions, setVersions] = useState<any[]>([]);
  const [loaderBuilds, setLoaderBuilds] = useState<any[]>([]);
  const [loadingVersions, setLoadingVersions] = useState(false);
  const [loadingBuilds, setLoadingBuilds] = useState(false);
  const [showSnapshots, setShowSnapshots] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  const showLoaderVersion = ['fabric', 'forge', 'neoforge'].includes(form.loader);

  const filteredVersions = useMemo(() => {
    if (showSnapshots) return versions;
    return versions.filter((v) => v.type === 'release' || v.stable);
  }, [versions, showSnapshots]);

  const selectLoader = async (loaderId: string) => {
    setForm((prev) => ({ ...prev, loader: loaderId, mcVersion: '', loaderVersion: '' }));
    setVersions([]);
    setLoaderBuilds([]);
    setError('');

    setLoadingVersions(true);
    try {
      const data = await api.getLoaderVersions(loaderId);
      const vList = data.versions || [];
      setVersions(vList);
      const initialFiltered = showSnapshots ? vList : vList.filter((v: any) => v.type === 'release' || v.stable);
      if (initialFiltered.length > 0) {
        const firstMcVersion = initialFiltered[0].id;
        setForm((prev) => ({ ...prev, mcVersion: firstMcVersion }));
      }
    } catch (err: any) {
      setError(`โหลดเวอร์ชันล้มเหลว: ${err.message}`);
    } finally {
      setLoadingVersions(false);
    }
  };

  useEffect(() => {
    if (!form.loader || !form.mcVersion || !showLoaderVersion) return;

    let active = true;
    setLoadingBuilds(true);
    api.getLoaderBuilds(form.loader, form.mcVersion)
      .then((data) => {
        if (active) setLoaderBuilds(data.builds || []);
      })
      .catch(() => { })
      .finally(() => {
        if (active) setLoadingBuilds(false);
      });

    return () => {
      active = false;
    };
  }, [form.loader, form.mcVersion, showLoaderVersion]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setCreating(true);

    try {
      const res = await api.createServer({
        name: form.name,
        loader: form.loader,
        mcVersion: form.mcVersion,
        loaderVersion: form.loaderVersion || undefined,
        port: form.port,
        minMemory: form.minMemory,
        maxMemory: form.maxMemory,
        javaPath: form.javaPath || 'java',
      });

      if (res.error) {
        setError(res.error);
      } else {
        router.push(`/servers/${res.server.id}`);
      }
    } catch (err: any) {
      setError(err.message || 'เกิดข้อผิดพลาดในการสร้างเซิร์ฟเวอร์');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-[fade-in_0.3s_ease-out]">
      {/* Breadcrumb & Back button */}
      <div className="flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-emerald-400 transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          <span>กลับหน้าแดชบอร์ด</span>
        </Link>
      </div>

      <div className="rounded-2xl bg-gradient-to-br from-slate-900/90 to-[#0b101e]/90 border border-slate-800 shadow-2xl backdrop-blur-xl overflow-hidden">
        {/* Header Banner */}
        <div className="relative bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-6 sm:p-8 border-b border-slate-800">
          <div className="relative z-10 flex items-center justify-between">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/25 text-emerald-400 text-xs font-semibold mb-2">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Server Creation Wizard</span>
              </div>
              <h3 className="text-2xl font-extrabold text-white tracking-tight">สร้างเซิร์ฟเวอร์ Minecraft</h3>
              <p className="text-xs text-slate-400 mt-1">กำหนดประเภท Loader เวอร์ชันเกม และทรัพยากรฮาร์ดแวร์ตามต้องการ</p>
            </div>
            <div className="hidden md:flex w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 items-center justify-center text-emerald-400">
              <Server className="w-6 h-6" />
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-8">
          {/* 1. Server Name */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-white flex items-center justify-between">
              <span>1. ชื่อเซิร์ฟเวอร์</span>
              <span className="text-xs font-normal text-slate-400">ตั้งชื่อที่จดจำง่าย</span>
            </label>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              type="text"
              className="w-full px-4 py-3 rounded-xl bg-slate-900/90 text-slate-100 border border-slate-700/80 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50 outline-none text-base transition-all placeholder:text-slate-500"
              placeholder="เช่น NaoCraft Survival SMP"
              required
            />
          </div>

          {/* 2. Loader Selection */}
          <div className="space-y-3">
            <label className="text-sm font-bold text-white flex items-center justify-between">
              <span>2. เลือก Loader (Server Core)</span>
              <span className="text-xs font-normal text-slate-400">คลิกเลือก Loader ที่ต้องการ</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {loaders.map((loader) => (
                <button
                  key={loader.id}
                  type="button"
                  onClick={() => selectLoader(loader.id)}
                  className={`p-4 rounded-xl border text-center transition-all duration-200 cursor-pointer group relative flex flex-col items-center justify-between ${form.loader === loader.id
                    ? 'border-emerald-500 bg-emerald-500/15 shadow-[0_0_20px_rgba(16,185,129,0.3)] scale-[1.02]'
                    : 'border-slate-800 bg-slate-800/70 hover:border-slate-500 hover:bg-slate-800'
                    }`}
                >
                  {form.loader === loader.id && (
                    <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center">
                      <Check className="w-2.5 h-2.5" />
                    </div>
                  )}

                  <div className="my-2 group-hover:scale-110 transition-transform">
                    {loader.icon}
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white">{loader.name}</div>
                    <div className="text-[11px] text-slate-400 mt-0.5 leading-snug">{loader.description}</div>
                  </div>
                  <span
                    className={`mt-2 text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${form.loader === loader.id ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-400'
                      }`}
                  >
                    {loader.tag}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* 3. Version Selection */}
          {form.loader && (
            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4 animate-[slide-up_0.2s_ease-out]">
              <div className="flex items-center justify-between">
                <label className="text-sm font-bold text-white">3. เวอร์ชันเกม Minecraft</label>
                <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer hover:text-white transition-colors">
                  <input
                    checked={showSnapshots}
                    onChange={(e) => setShowSnapshots(e.target.checked)}
                    type="checkbox"
                    className="w-4 h-4 rounded accent-emerald-500 cursor-pointer"
                  />
                  <span>แสดง Snapshot / Pre-releases</span>
                </label>
              </div>

              {loadingVersions ? (
                <div className="flex items-center gap-3 text-sm text-slate-400 py-4 justify-center">
                  <div className="w-5 h-5 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
                  <span>กำลังดึงรายการเวอร์ชันจาก Official API...</span>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs text-slate-400 mb-1 font-medium">เวอร์ชันหลัก (MC Version)</div>
                    <select
                      value={form.mcVersion}
                      onChange={(e) => setForm({ ...form, mcVersion: e.target.value })}
                      className="w-full px-4 py-2.5 pr-10 rounded-xl bg-slate-900/90 text-slate-100 border border-slate-700/80 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50 outline-none text-sm transition-all cursor-pointer"
                      required
                    >
                      <option value="" disabled>-- เลือกเวอร์ชัน Minecraft --</option>
                      {filteredVersions.map((v) => (
                        <option key={v.id} value={v.id}>
                          Minecraft {v.id} {v.type === 'snapshot' ? '(Snapshot / Beta)' : '(Stable)'}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Loader Specific Build */}
                  {showLoaderVersion && (
                    <div>
                      <div className="text-xs text-slate-400 mb-1 font-medium">
                        {form.loader === 'fabric'
                          ? 'Fabric Loader Build'
                          : form.loader === 'neoforge'
                            ? 'NeoForge Build'
                            : 'Forge Build'}
                      </div>
                      {loadingBuilds ? (
                        <div className="flex items-center gap-2 text-xs text-slate-400 py-2.5">
                          <div className="w-3.5 h-3.5 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
                          <span>กำลังดึง Builds...</span>
                        </div>
                      ) : (
                        <select
                          value={form.loaderVersion}
                          onChange={(e) => setForm({ ...form, loaderVersion: e.target.value })}
                          className="w-full px-4 py-2.5 pr-10 rounded-xl bg-slate-900/90 text-slate-100 border border-slate-700/80 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50 outline-none text-sm transition-all cursor-pointer"
                        >
                          <option value="">อัตโนมัติ (แนะนำเวอร์ชันล่าสุด)</option>
                          {loaderBuilds.map((b) => (
                            <option key={b.id} value={b.id}>
                              Build: {b.id} {b.stable ? '(Stable / เสถียร)' : '(Beta)'}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* 4. RAM & Resources */}
          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
            <label className="text-sm font-bold text-white flex items-center justify-between">
              <span>4. กำหนดทรัพยากรหน่วยความจำ (RAM)</span>
              <span className="text-xs font-mono text-emerald-400">จัดสรร: {form.maxMemory}</span>
            </label>

            {/* Quick RAM Preset Buttons */}
            <div className="flex flex-wrap items-center gap-2">
              {['2G', '4G', '6G', '8G', '12G', '16G'].map((ram) => (
                <button
                  key={ram}
                  type="button"
                  onClick={() => setForm({ ...form, maxMemory: ram })}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all cursor-pointer ${form.maxMemory === ram
                    ? 'bg-emerald-500 text-white shadow-[0_0_12px_rgba(16,185,129,0.4)]'
                    : 'bg-slate-800/80 border border-slate-700 text-slate-400 hover:text-white hover:border-slate-500'
                    }`}
                >
                  {ram}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <span className="text-xs text-slate-400 block mb-1 font-medium">RAM สูงสุด (-Xmx)</span>
                <select
                  value={form.maxMemory}
                  onChange={(e) => setForm({ ...form, maxMemory: e.target.value })}
                  className="w-full px-4 py-2.5 pr-10 rounded-xl bg-slate-900/90 text-slate-100 border border-slate-700/80 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50 outline-none text-sm transition-all cursor-pointer"
                >
                  <option value="1G">1 GB (เซิร์ฟทดสอบ)</option>
                  <option value="2G">2 GB (Vanilla เล็ก)</option>
                  <option value="4G">4 GB (แนะนำสำหรับ Paper/Fabric)</option>
                  <option value="6G">6 GB (Modpack ขนาดกลาง)</option>
                  <option value="8G">8 GB (Modpack ขนาดใหญ่ / NeoForge)</option>
                  <option value="12G">12 GB (Heavy Modpack / ผู้เล่นเยอะ)</option>
                  <option value="16G">16 GB (Ultimate Performance)</option>
                </select>
              </div>
              <div>
                <span className="text-xs text-slate-400 block mb-1 font-medium">RAM เริ่มต้น (-Xms)</span>
                <select
                  value={form.minMemory}
                  onChange={(e) => setForm({ ...form, minMemory: e.target.value })}
                  className="w-full px-4 py-2.5 pr-10 rounded-xl bg-slate-900/90 text-slate-100 border border-slate-700/80 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50 outline-none text-sm transition-all cursor-pointer"
                >
                  <option value="512M">512 MB</option>
                  <option value="1G">1 GB</option>
                  <option value="2G">2 GB</option>
                  <option value="4G">4 GB</option>
                </select>
              </div>
            </div>
          </div>

          {/* 5. Advanced Settings (Port & Java) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-bold text-white block mb-2">5. พอร์ตการเชื่อมต่อ (Port)</label>
              <input
                value={form.port}
                onChange={(e) => setForm({ ...form, port: parseInt(e.target.value) || 25565 })}
                type="number"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-900/90 text-slate-100 border border-slate-700/80 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50 outline-none text-sm font-mono transition-all placeholder:text-slate-500"
                min="1024"
                max="65535"
                placeholder="25565"
                required
              />
              <p className="text-[11px] text-slate-400 mt-1">Minecraft พอร์ตมาตรฐานคือ 25565</p>
            </div>

            <div>
              <label className="text-sm font-bold text-white block mb-2">Java Path</label>
              <input
                value={form.javaPath}
                onChange={(e) => setForm({ ...form, javaPath: e.target.value })}
                type="text"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-900/90 text-slate-100 border border-slate-700/80 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50 outline-none text-sm font-mono transition-all placeholder:text-slate-500"
                placeholder="java"
              />
              <p className="text-[11px] text-slate-400 mt-1">ใช้ java ค่าเริ่มต้น หรือระบุ path เช่น /usr/bin/java</p>
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm bg-slate-800/80 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700/80 hover:border-slate-600 transition-all cursor-pointer"
            >
              ยกเลิก
            </Link>

            <button
              type="submit"
              disabled={creating || !form.name || !form.loader || !form.mcVersion}
              className="inline-flex items-center justify-center gap-2 px-8 py-3 rounded-xl font-bold text-base bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white shadow-[0_4px_20px_rgba(16,185,129,0.35)] hover:shadow-[0_6px_25px_rgba(16,185,129,0.5)] hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {creating ? (
                <>
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>กำลังติดตั้งเซิร์ฟเวอร์...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  <span>ยืนยันและสร้างเซิร์ฟเวอร์</span>
                </>
              )}
            </button>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-center gap-3 text-red-400 text-sm">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
