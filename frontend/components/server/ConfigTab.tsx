'use client';

import { useState, useEffect, useMemo } from 'react';
import { api } from '@/lib/api';

interface ConfigTabProps {
  serverId: string;
}

export default function ConfigTab({ serverId }: ConfigTabProps) {
  const [config, setConfig] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [saving, setSaving] = useState(false);
  const [savedNotice, setSavedNotice] = useState(false);

  useEffect(() => {
    api.getConfig(serverId)
      .then((data) => {
        setConfig(data.config || {});
      })
      .catch((e) => console.error(e))
      .finally(() => setLoading(false));
  }, [serverId]);

  const filteredConfig = useMemo(() => {
    if (!search) return config;
    const res: Record<string, string> = {};
    for (const [k, v] of Object.entries(config)) {
      if (k.toLowerCase().includes(search.toLowerCase()) || v.toLowerCase().includes(search.toLowerCase())) {
        res[k] = v;
      }
    }
    return res;
  }, [config, search]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.updateConfig(serverId, config);
      setSavedNotice(true);
      setTimeout(() => setSavedNotice(false), 3000);
    } catch (err) {
      console.error('Config save failed:', err);
    } finally {
      setSaving(false);
    }
  };

  const getConfigHint = (key: string) => {
    const hints: Record<string, string> = {
      motd: 'ข้อความต้อนรับของเซิร์ฟเวอร์',
      gamemode: 'โหมดการเล่นเริ่มต้น (survival, creative, ...)',
      difficulty: 'ระดับความยาก (peaceful, easy, normal, hard)',
      pvp: 'เปิด/ปิดการต่อสู้ระหว่างผู้เล่น',
      'max-players': 'จำนวนผู้เล่นสูงสุดที่รองรับ',
      'online-mode': 'ตรวจสอบลิขสิทธิ์ Mojang (true = ID แท้เท่านั้น)',
      'view-distance': 'ระยะการมองเห็นของ Chunk (มาตรฐาน 10)',
      'simulation-distance': 'ระยะการประมวลผล Entity/Redstone',
      'white-list': 'เปิดใช้งานระบบ Whitelist รายชื่อผู้เล่น',
      'enable-command-block': 'เปิดใช้งาน Command Block',
      'spawn-protection': 'ระยะรัศมีป้องกันพื้นที่เกิด (บล็อก)',
      'level-name': 'ชื่อโฟลเดอร์ World',
      'level-seed': 'Seed สำหรับการสุ่มโลก',
    };
    return hints[key] || '';
  };

  return (
    <div className="rounded-2xl bg-[#090d18] border border-slate-800 p-6 space-y-6 shadow-2xl backdrop-blur-md">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h4 className="text-base font-bold text-white">แก้ไขการตั้งค่า (server.properties)</h4>
          <p className="text-xs text-slate-400 mt-0.5">ปรับแต่งค่าเซิร์ฟเวอร์โดยตรง บันทึกแล้วรีสตาร์ทเซิร์ฟเวอร์เพื่อให้มีผล</p>
        </div>

        <div className="flex items-center gap-3">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            type="text"
            placeholder="ค้นหาชื่อการตั้งค่า..."
            className="w-48 sm:w-60 py-1.5 px-3 rounded-xl bg-slate-900/90 text-slate-100 border border-slate-700/80 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50 outline-none text-xs transition-all placeholder:text-slate-500"
          />
          <button
            onClick={handleSave}
            disabled={saving}
            type="button"
            className="inline-flex items-center justify-center gap-2 px-5 py-2 rounded-xl font-bold text-xs bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white shadow-sm transition-all cursor-pointer disabled:opacity-50"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
              <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
              <polyline points="17 21 17 13 7 13 7 21" />
              <polyline points="7 3 7 8 15 8" />
            </svg>
            <span>{saving ? 'กำลังบันทึก...' : 'บันทึกการตั้งค่า'}</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center text-slate-400">
          <div className="w-8 h-8 border-3 border-emerald-500/30 border-t-emerald-400 rounded-full animate-spin inline-block" />
          <p className="text-xs mt-3">กำลังโหลดการตั้งค่า...</p>
        </div>
      ) : (
        <div className="space-y-6">
          {savedNotice && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
              <span>✓</span>
              <span>บันทึก server.properties สำเร็จเรียบร้อย! (กรุณารีสตาร์ทเซิร์ฟเวอร์เพื่อเริ่มใช้การตั้งค่าใหม่)</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(filteredConfig).map(([key, val]) => (
              <div
                key={key}
                className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-colors flex flex-col justify-between"
              >
                <div className="flex items-center justify-between gap-2 mb-2">
                  <label className="text-xs font-mono font-bold text-slate-200 truncate" title={key}>
                    {key}
                  </label>
                  <span className="text-[10px] text-slate-500">{getConfigHint(key)}</span>
                </div>

                {val === 'true' || val === 'false' ? (
                  <div className="flex items-center justify-between pt-1">
                    <span className={`text-xs font-mono ${val === 'true' ? 'text-emerald-400' : 'text-slate-400'}`}>
                      {val === 'true' ? 'เปิดใช้งาน (true)' : 'ปิดใช้งาน (false)'}
                    </span>
                    <button
                      type="button"
                      onClick={() => setConfig({ ...config, [key]: val === 'true' ? 'false' : 'true' })}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                        val === 'true' ? 'bg-emerald-500' : 'bg-slate-700'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          val === 'true' ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                ) : (
                  <input
                    value={val}
                    onChange={(e) => setConfig({ ...config, [key]: e.target.value })}
                    type="text"
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-950/80 text-slate-200 border border-slate-700/80 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50 outline-none font-mono text-xs transition-all"
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
