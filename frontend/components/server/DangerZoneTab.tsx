'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

interface DangerZoneTabProps {
  serverId: string;
  serverName: string;
}

export default function DangerZoneTab({ serverId, serverName }: DangerZoneTabProps) {
  const router = useRouter();

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [confirmName, setConfirmName] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [message, setMessage] = useState<{ text: string; error?: boolean } | null>(null);

  const handleDelete = async (e: React.FormEvent) => {
    e.preventDefault();
    if (confirmName !== serverName) return;

    setDeleting(true);
    try {
      await api.deleteServer(serverId);
      router.push('/');
    } catch (err: any) {
      setMessage({ text: err.message || 'ลบเซิร์ฟเวอร์ล้มเหลว', error: true });
      setDeleting(false);
    }
  };

  const handleClearLogs = async () => {
    if (!confirm('ต้องการล้าง Log ทั้งหมดของเซิร์ฟเวอร์หรือไม่?')) return;
    try {
      await api.deleteFile(serverId, 'logs');
      setMessage({ text: 'ล้าง Log สำเร็จเรียบร้อย' });
    } catch {
      setMessage({ text: 'ล้าง Log ไม่สำเร็จ หรือไม่มีโฟลเดอร์ logs', error: true });
    }
  };

  return (
    <div className="rounded-2xl bg-[#090d18] border border-red-500/30 p-6 space-y-6 shadow-2xl backdrop-blur-md">
      <div className="border-b border-red-500/20 pb-4">
        <h4 className="text-base font-bold text-red-400 flex items-center gap-2">
          <span>⚠️</span>
          <span>โซนอันตราย (Danger Zone)</span>
        </h4>
        <p className="text-xs text-slate-400 mt-0.5">การกระทำในส่วนนี้มีผลกระทบต่อข้อมูลเซิร์ฟเวอร์ กรุณาตรวจสอบให้รอบคอบก่อนทำรายการ</p>
      </div>

      {message && (
        <div
          className={`p-3 rounded-xl border text-xs flex items-center justify-between ${
            message.error
              ? 'bg-red-500/10 border-red-500/30 text-red-400'
              : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
          }`}
        >
          <span>{message.text}</span>
          <button onClick={() => setMessage(null)} type="button" className="cursor-pointer">
            ✕
          </button>
        </div>
      )}

      <div className="space-y-4">
        {/* Clear Logs */}
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between gap-4">
          <div>
            <h5 className="text-sm font-bold text-slate-200">ล้างไฟล์ Log ทั้งหมด (Clear Server Logs)</h5>
            <p className="text-xs text-slate-400 mt-0.5">ลบไฟล์ log ในไดเรกทอรี logs/ เพื่อประหยัดพื้นที่ฮาร์ดดิสก์</p>
          </div>
          <button
            onClick={handleClearLogs}
            type="button"
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 transition-colors cursor-pointer whitespace-nowrap"
          >
            ล้าง Logs
          </button>
        </div>

        {/* Delete Server */}
        <div className="p-4 rounded-xl bg-red-500/5 border border-red-500/30 flex items-center justify-between gap-4">
          <div>
            <h5 className="text-sm font-bold text-red-400">ลบเซิร์ฟเวอร์นี้ออกจากระบบ (Delete Server)</h5>
            <p className="text-xs text-slate-400 mt-0.5">
              ลบโฟลเดอร์ไฟล์ World, Plugin, Mod และคอนฟิกทั้งหมดอย่างถาวร ไม่สามารถกู้คืนได้
            </p>
          </div>
          <button
            onClick={() => setShowDeleteModal(true)}
            type="button"
            className="px-4 py-2.5 rounded-xl text-xs font-bold bg-red-600/90 hover:bg-red-600 text-white shadow-md transition-colors cursor-pointer whitespace-nowrap"
          >
            🗑️ ลบเซิร์ฟเวอร์นี้
          </button>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <form
            onSubmit={handleDelete}
            className="bg-[#0b101e] border border-red-500/40 rounded-2xl w-full max-w-md p-6 space-y-5 shadow-2xl animate-[scale-in_0.15s_ease-out]"
          >
            <div className="flex items-center gap-3 text-red-400">
              <span className="text-2xl">⚠️</span>
              <div>
                <h4 className="text-base font-bold">ยืนยันการลบเซิร์ฟเวอร์</h4>
                <p className="text-xs text-slate-400">การกระทำนี้จะลบข้อมูลทั้งหมดอย่างถาวร</p>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs text-slate-300 block">
                พิมพ์ชื่อเซิร์ฟเวอร์ <span className="font-mono font-bold text-white bg-slate-800 px-1.5 py-0.5 rounded">{serverName}</span> เพื่อยืนยัน:
              </label>
              <input
                value={confirmName}
                onChange={(e) => setConfirmName(e.target.value)}
                autoFocus
                type="text"
                placeholder={serverName}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs outline-none focus:border-red-500 font-mono"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setConfirmName('');
                }}
                type="button"
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                disabled={confirmName !== serverName || deleting}
                className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold shadow-md cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {deleting ? 'กำลังลบ...' : 'ยืนยันลบเซิร์ฟเวอร์ถาวร'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
