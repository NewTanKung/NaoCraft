<template>
  <div class="space-y-8 animate-[fade-in_0.3s_ease-out]">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h3 class="text-xl font-extrabold text-white tracking-tight">การตรวจสอบทรัพยากรระบบ (System Monitor)</h3>
        <p class="text-xs text-nao-text-dim mt-0.5">ติดตามการใช้ CPU, Memory และโหลดของเซิร์ฟเวอร์แบบ Real-time</p>
      </div>

      <div class="flex items-center gap-2">
        <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-nao-emerald/10 border border-nao-emerald/25 text-nao-emerald-light text-xs font-mono">
          <span class="status-beacon-running"></span>
          <span>Polling ทุก 3 วินาที</span>
        </span>
      </div>
    </div>

    <!-- System Stats Cards Grid -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
      <!-- CPU -->
      <div class="glass-card p-6 relative overflow-hidden group">
        <div class="absolute -right-6 -top-6 w-24 h-24 bg-cyan-500/10 rounded-full blur-2xl"></div>
        <div class="flex items-center justify-between">
          <span class="text-xs font-bold text-nao-text-muted uppercase tracking-wider">CPU Usage</span>
          <span class="text-xs font-mono font-bold text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
            {{ systemStats.cpuUsage?.toFixed(1) || '0' }}%
          </span>
        </div>
        <div class="text-3xl font-extrabold font-[--font-display] text-white mt-3 tracking-tight">
          {{ systemStats.cpuUsage?.toFixed(1) || '0' }}<span class="text-lg text-slate-400 font-normal">%</span>
        </div>
        <div class="mt-4 h-2.5 bg-nao-surface-2 rounded-full overflow-hidden p-0.5 border border-nao-border/60">
          <div
            class="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full transition-all duration-500 shadow-[0_0_10px_rgba(6,182,212,0.5)]"
            :style="{ width: `${Math.min(100, systemStats.cpuUsage || 0)}%` }"
          ></div>
        </div>
        <p class="text-[11px] text-nao-text-dim mt-2">ประมวลผลเซิร์ฟเวอร์โดยรวม</p>
      </div>

      <!-- RAM Used -->
      <div class="glass-card p-6 relative overflow-hidden group">
        <div class="absolute -right-6 -top-6 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl"></div>
        <div class="flex items-center justify-between">
          <span class="text-xs font-bold text-nao-text-muted uppercase tracking-wider">RAM ที่กำลังใช้</span>
          <span class="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
            {{ memPercent.toFixed(1) }}%
          </span>
        </div>
        <div class="text-3xl font-extrabold font-[--font-display] text-white mt-3 tracking-tight">
          {{ formatBytes(systemStats.memoryUsed || 0) }}
        </div>
        <div class="mt-4 h-2.5 bg-nao-surface-2 rounded-full overflow-hidden p-0.5 border border-nao-border/60">
          <div
            class="h-full bg-gradient-to-r from-emerald-500 to-emerald-300 rounded-full transition-all duration-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"
            :style="{ width: `${Math.min(100, memPercent)}%` }"
          ></div>
        </div>
        <p class="text-[11px] text-nao-text-dim mt-2">
          จากทั้งหมด {{ formatBytes(systemStats.memoryTotal || 0) }}
        </p>
      </div>

      <!-- RAM Free -->
      <div class="glass-card p-6 relative overflow-hidden group">
        <div class="absolute -right-6 -top-6 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl"></div>
        <div class="flex items-center justify-between">
          <span class="text-xs font-bold text-nao-text-muted uppercase tracking-wider">RAM ว่าง</span>
          <span class="text-xs font-mono font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
            Available
          </span>
        </div>
        <div class="text-3xl font-extrabold font-[--font-display] text-white mt-3 tracking-tight">
          {{ formatBytes(systemStats.memoryFree || 0) }}
        </div>
        <div class="mt-4 h-2.5 bg-nao-surface-2 rounded-full overflow-hidden p-0.5 border border-nao-border/60">
          <div
            class="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]"
            :style="{ width: `${Math.min(100, 100 - memPercent)}%` }"
          ></div>
        </div>
        <p class="text-[11px] text-nao-text-dim mt-2">พร้อมสำหรับเปิดเซิร์ฟเวอร์เพิ่ม</p>
      </div>

      <!-- Uptime -->
      <div class="glass-card p-6 relative overflow-hidden group">
        <div class="absolute -right-6 -top-6 w-24 h-24 bg-purple-500/10 rounded-full blur-2xl"></div>
        <div class="flex items-center justify-between">
          <span class="text-xs font-bold text-nao-text-muted uppercase tracking-wider">Uptime</span>
          <span class="text-xs font-mono font-bold text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">
            Online
          </span>
        </div>
        <div class="text-3xl font-extrabold font-[--font-display] text-white mt-3 tracking-tight">
          {{ formatUptime(systemStats.uptime || 0) }}
        </div>
        <div class="mt-4 h-2.5 bg-nao-surface-2 rounded-full overflow-hidden p-0.5 border border-nao-border/60">
          <div class="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full w-full"></div>
        </div>
        <p class="text-[11px] text-nao-text-dim mt-2">ระยะเวลาเปิดเครื่องทำงาน</p>
      </div>
    </div>

    <!-- Per-Server Resource Breakdown -->
    <div class="glass-card overflow-hidden">
      <div class="p-6 border-b border-nao-border/80 flex items-center justify-between">
        <div>
          <h4 class="text-base font-bold text-white">การใช้ทรัพยากรแยกรายเซิร์ฟเวอร์</h4>
          <p class="text-xs text-nao-text-dim mt-0.5">เซิร์ฟเวอร์ที่กำลังทำงานอยู่จะแสดงข้อมูลโหลด CPU และหน่วยความจำจริง</p>
        </div>
        <span class="badge bg-slate-800 text-slate-300 font-mono text-xs">
          {{ servers.length }} เซิร์ฟเวอร์
        </span>
      </div>

      <div v-if="servers.length === 0" class="p-16 text-center text-nao-text-dim text-xs font-mono">
        -- ยังไม่มีเซิร์ฟเวอร์ในระบบ --
      </div>

      <div v-else class="divide-y divide-nao-border/40">
        <div
          v-for="srv in servers"
          :key="srv.id"
          class="p-5 flex items-center justify-between gap-4 hover:bg-nao-surface-2/40 transition-colors"
        >
          <div class="flex items-center gap-3.5 min-w-0">
            <span
              :class="srv.status === 'running' ? 'status-beacon-running' : 'status-beacon-stopped'"
            ></span>
            <div class="min-w-0">
              <NuxtLink :to="`/servers/${srv.id}`" class="font-bold text-white hover:text-nao-emerald-light transition-colors text-sm truncate block">
                {{ srv.name }}
              </NuxtLink>
              <div class="flex items-center gap-2 text-xs text-nao-text-dim mt-0.5 font-mono">
                <span class="uppercase">{{ srv.loader }}</span>
                <span>•</span>
                <span>MC {{ srv.mcVersion }}</span>
                <span>•</span>
                <span>Port {{ srv.port }}</span>
              </div>
            </div>
          </div>

          <!-- Stats / Status -->
          <div class="flex items-center gap-6">
            <div v-if="srv.status === 'running'" class="flex items-center gap-6 font-mono text-xs">
              <div class="text-right">
                <span class="text-nao-text-dim block text-[10px] uppercase font-bold">CPU</span>
                <span class="text-cyan-400 font-bold">{{ serverStats[srv.id]?.cpuPercent?.toFixed(1) || '0.0' }}%</span>
              </div>
              <div class="text-right">
                <span class="text-nao-text-dim block text-[10px] uppercase font-bold">RAM</span>
                <span class="text-emerald-400 font-bold">{{ serverStats[srv.id]?.memoryMB ? `${serverStats[srv.id].memoryMB.toFixed(0)} MB` : srv.maxMemory }}</span>
              </div>
            </div>

            <div v-else class="text-xs font-mono text-slate-500 bg-slate-900/60 px-2.5 py-1 rounded border border-slate-800">
              เซิร์ฟเวอร์ปิดอยู่
            </div>

            <NuxtLink
              :to="`/servers/${srv.id}`"
              class="btn-secondary !px-3 !py-1 text-xs"
            >
              จัดการ →
            </NuxtLink>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const api = useApi();

const systemStats = ref<any>({});
const servers = ref<any[]>([]);
const serverStats = ref<Record<string, any>>({});

const memPercent = computed(() => {
  if (!systemStats.value.memoryTotal) return 0;
  return (systemStats.value.memoryUsed / systemStats.value.memoryTotal) * 100;
});

const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

const formatUptime = (seconds: number): string => {
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
    systemStats.value = sysData.stats || {};
    servers.value = srvData.servers || [];

    // Fetch per-server stats for running servers
    for (const srv of servers.value) {
      if (srv.status === 'running') {
        try {
          const data = await api.getServerStats(srv.id);
          if (data.stats) {
            serverStats.value[srv.id] = data.stats;
          }
        } catch {}
      }
    }
  } catch {}
};

let timer: NodeJS.Timeout;
onMounted(() => {
  fetchAll();
  timer = setInterval(fetchAll, 3000);
});
onUnmounted(() => clearInterval(timer));
</script>
