'use client';

import { useEffect, useRef, useState } from 'react';
import { api } from '@/lib/api';

interface ConsoleTabProps {
  serverId: string;
}

export default function ConsoleTab({ serverId }: ConsoleTabProps) {
  const [logs, setLogs] = useState<string[]>([]);
  const [command, setCommand] = useState('');
  const [wsConnected, setWsConnected] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true);
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  const consoleEndRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);

  // Initialize WebSocket and initial logs
  useEffect(() => {
    // 1. Fetch initial logs from REST API
    api.getLogs(serverId)
      .then((data) => {
        if (data.logs && Array.isArray(data.logs)) {
          setLogs(data.logs);
        }
      })
      .catch(() => {});

    // 2. Connect WebSocket
    const connect = () => {
      try {
        const ws = api.connectConsole(serverId);
        wsRef.current = ws;

        ws.onopen = () => {
          setWsConnected(true);
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.type === 'log' || data.log) {
              setLogs((prev) => [...prev, data.log || data.message]);
            } else if (typeof data === 'string') {
              setLogs((prev) => [...prev, data]);
            }
          } catch {
            setLogs((prev) => [...prev, event.data]);
          }
        };

        ws.onclose = () => {
          setWsConnected(false);
        };

        ws.onerror = () => {
          setWsConnected(false);
        };
      } catch (err) {
        console.error('Console WS error:', err);
      }
    };

    connect();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [serverId]);

  // Auto-scroll effect
  useEffect(() => {
    if (autoScroll && consoleEndRef.current) {
      consoleEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, autoScroll]);

  const handleSendCommand = async () => {
    const cmd = command.trim();
    if (!cmd) return;

    // Add to history
    setHistory((prev) => [...prev, cmd]);
    setHistoryIndex(-1);
    setCommand('');

    // Send via WebSocket or REST API fallback
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'command', command: cmd }));
    } else {
      try {
        await api.sendCommand(serverId, cmd);
      } catch (e) {
        console.error('Command send error:', e);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSendCommand();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (history.length > 0) {
        const nextIndex = historyIndex === -1 ? history.length - 1 : Math.max(0, historyIndex - 1);
        setHistoryIndex(nextIndex);
        setCommand(history[nextIndex]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex !== -1) {
        const nextIndex = historyIndex + 1;
        if (nextIndex >= history.length) {
          setHistoryIndex(-1);
          setCommand('');
        } else {
          setHistoryIndex(nextIndex);
          setCommand(history[nextIndex]);
        }
      }
    }
  };

  const getLogClass = (line: string) => {
    if (/ERROR|Exception|FATAL/i.test(line)) return 'text-rose-400';
    if (/WARN|WARNING/i.test(line)) return 'text-amber-300';
    if (/INFO/i.test(line)) return 'text-emerald-400';
    return 'text-slate-300';
  };

  const quickCommands = ['/help', '/list', '/tps', '/reload', '/save-all', '/stop'];

  return (
    <div className="bg-[#040711] rounded-2xl border border-slate-800 shadow-2xl font-mono overflow-hidden">
      {/* Terminal Header Toolbar */}
      <div className="bg-slate-900/95 border-b border-slate-800 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-red-500/80" />
            <span className="w-3 h-3 rounded-full bg-amber-500/80" />
            <span className="w-3 h-3 rounded-full bg-emerald-500/80" />
          </div>
          <span className="text-xs text-slate-400 font-mono">console@minecraft:~#</span>
        </div>

        <div className="flex items-center gap-3 text-xs">
          {/* Connection Indicator */}
          <div className="flex items-center gap-1.5 text-[11px] font-mono">
            <span className={`w-2 h-2 rounded-full ${wsConnected ? 'bg-emerald-400 shadow-[0_0_8px_#34d399]' : 'bg-slate-500'}`} />
            <span className={wsConnected ? 'text-emerald-400' : 'text-slate-400'}>
              {wsConnected ? 'WebSocket Live' : 'Offline'}
            </span>
          </div>

          {/* Auto-scroll toggle */}
          <label className="flex items-center gap-1.5 text-slate-400 hover:text-slate-200 cursor-pointer select-none text-[11px]">
            <input
              checked={autoScroll}
              onChange={(e) => setAutoScroll(e.target.checked)}
              type="checkbox"
              className="w-3.5 h-3.5 rounded accent-emerald-500"
            />
            <span>Auto-Scroll</span>
          </label>

          {/* Clear button */}
          <button
            onClick={() => setLogs([])}
            type="button"
            className="text-slate-400 hover:text-white transition-colors cursor-pointer text-[11px] bg-slate-800 px-2.5 py-1 rounded border border-slate-700"
          >
            ล้างหน้าจอ
          </button>
        </div>
      </div>

      {/* Terminal Output */}
      <div className="h-[480px] overflow-y-auto p-4 select-text font-mono text-xs space-y-0.5">
        {logs.length === 0 ? (
          <div className="text-slate-500 text-center py-28 flex flex-col items-center justify-center">
            <span className="text-3xl mb-2">📟</span>
            <p className="font-mono text-xs">ยังไม่มี Log — สั่งเปิดเซิร์ฟเวอร์เพื่อเริ่มแสดงข้อความ Console</p>
          </div>
        ) : (
          logs.map((log, i) => (
            <div key={i} className={`whitespace-pre-wrap break-all py-0.5 leading-relaxed ${getLogClass(log)}`}>
              {log}
            </div>
          ))
        )}
        <div ref={consoleEndRef} />
      </div>

      {/* Quick Command Chips */}
      <div className="bg-slate-900/60 border-t border-slate-800 px-4 py-2 flex items-center gap-2 overflow-x-auto text-xs">
        <span className="text-slate-400 text-[11px] font-mono flex-shrink-0">คำสั่งด่วน:</span>
        {quickCommands.map((cmd) => (
          <button
            key={cmd}
            onClick={() => {
              setCommand(cmd);
            }}
            type="button"
            className="px-2.5 py-1 rounded bg-slate-800 border border-slate-700 text-slate-300 font-mono text-[11px] hover:border-emerald-500 hover:text-white transition-colors cursor-pointer whitespace-nowrap"
          >
            {cmd}
          </button>
        ))}
      </div>

      {/* Command Input Bar */}
      <div className="border-t border-slate-800 p-3 bg-slate-950 flex items-center gap-2">
        <span className="text-emerald-400 font-mono font-bold pl-2 select-none">&gt;</span>
        <input
          value={command}
          onChange={(e) => setCommand(e.target.value)}
          onKeyDown={handleKeyDown}
          type="text"
          className="flex-1 bg-transparent text-white font-mono text-xs focus:outline-none placeholder-slate-600"
          placeholder="พิมพ์คำสั่ง Minecraft... (เช่น say สวัสดี หรือ op PlayerName) แล้วกด Enter"
        />
        <button
          onClick={handleSendCommand}
          disabled={!command.trim()}
          type="button"
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl font-bold text-xs bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white shadow-sm hover:shadow-md transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed font-mono"
        >
          ส่ง (Enter)
        </button>
      </div>
    </div>
  );
}
