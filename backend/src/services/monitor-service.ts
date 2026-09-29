// ===== NaoCraft Backend — Monitor Service =====
// Monitors system resource usage (CPU, RAM) for each server process

import { readFile } from 'fs/promises';
import type { SystemStats } from '../types';

import os from 'os';

/**
 * Get system-wide stats (Linux /proc with cross-platform fallback)
 */
export async function getSystemStats(): Promise<SystemStats> {
  try {
    // Attempt Linux /proc first
    const meminfo = await readFile('/proc/meminfo', 'utf-8');
    const memTotal = parseInt(meminfo.match(/MemTotal:\s+(\d+)/)?.[1] || '0') * 1024;
    const memAvail = parseInt(meminfo.match(/MemAvailable:\s+(\d+)/)?.[1] || '0') * 1024;
    const memUsed = memTotal - memAvail;

    // Read /proc/stat for CPU usage
    const stat1 = await readFile('/proc/stat', 'utf-8');
    const cpu1 = parseCpuLine(stat1);

    await new Promise(resolve => setTimeout(resolve, 300));

    const stat2 = await readFile('/proc/stat', 'utf-8');
    const cpu2 = parseCpuLine(stat2);

    const totalDiff = cpu2.total - cpu1.total;
    const idleDiff = cpu2.idle - cpu1.idle;
    const cpuUsage = totalDiff > 0 ? ((totalDiff - idleDiff) / totalDiff) * 100 : 0;

    const uptimeStr = await readFile('/proc/uptime', 'utf-8');
    const uptime = parseFloat(uptimeStr.split(' ')[0]);

    return {
      cpuUsage: Math.round(cpuUsage * 100) / 100,
      memoryTotal: memTotal,
      memoryUsed: memUsed,
      memoryFree: memAvail,
      uptime,
    };
  } catch {
    // Cross-platform fallback (Windows, macOS, etc.)
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    const uptime = os.uptime();

    // CPU usage estimation via os.cpus()
    const cpus = os.cpus();
    let totalIdle = 0;
    let totalTick = 0;
    for (const cpu of cpus) {
      for (const type of Object.keys(cpu.times)) {
        totalTick += (cpu.times as any)[type];
      }
      totalIdle += cpu.times.idle;
    }
    const cpuUsage = totalTick > 0 ? ((totalTick - totalIdle) / totalTick) * 100 : 0;

    return {
      cpuUsage: Math.round(cpuUsage * 100) / 100,
      memoryTotal: totalMem,
      memoryUsed: usedMem,
      memoryFree: freeMem,
      uptime,
    };
  }
}

function parseCpuLine(content: string): { total: number; idle: number } {
  const line = content.split('\n')[0]; // First "cpu" line (aggregate)
  const parts = line.split(/\s+/).slice(1).map(Number);
  const idle = parts[3] + (parts[4] || 0); // idle + iowait
  const total = parts.reduce((a, b) => a + b, 0);
  return { total, idle };
}

/**
 * Get per-process stats (Linux: /proc/<pid>/stat)
 */
export async function getProcessStats(pid: number): Promise<{ cpuPercent: number; memoryMB: number } | null> {
  try {
    // Read process stat
    const statContent = await readFile(`/proc/${pid}/stat`, 'utf-8');
    const parts = statContent.split(' ');

    // RSS (Resident Set Size) is field 23 (0-indexed), in pages
    const rssPages = parseInt(parts[23]);
    const pageSize = 4096; // Standard Linux page size
    const memoryMB = (rssPages * pageSize) / (1024 * 1024);

    // Process CPU time
    const utime = parseInt(parts[13]);
    const stime = parseInt(parts[14]);

    // Read system uptime for CPU calculation
    const uptimeStr = await readFile('/proc/uptime', 'utf-8');
    const uptime = parseFloat(uptimeStr.split(' ')[0]);
    const starttime = parseInt(parts[21]);
    const hertz = 100; // Standard clock ticks per second

    const totalTime = utime + stime;
    const seconds = uptime - (starttime / hertz);
    const cpuPercent = seconds > 0 ? ((totalTime / hertz) / seconds) * 100 : 0;

    return {
      cpuPercent: Math.round(cpuPercent * 100) / 100,
      memoryMB: Math.round(memoryMB * 100) / 100,
    };
  } catch {
    return null;
  }
}
