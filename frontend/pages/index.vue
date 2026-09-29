<template>
  <div class="space-y-8 animate-[fade-in_0.3s_ease-out]">
    <!-- Hero Banner -->
    <div class="relative overflow-hidden rounded-2xl bg-gradient-to-r from-nao-surface via-nao-surface-2 to-nao-surface border border-nao-border/80 p-7 shadow-xl">
      <!-- Glow ambient light -->
      <div class="absolute -right-16 -top-16 w-64 h-64 bg-nao-emerald/15 rounded-full blur-3xl pointer-events-none"></div>
      <div class="absolute -left-16 -bottom-16 w-64 h-64 bg-nao-blue/10 rounded-full blur-3xl pointer-events-none"></div>

      <div class="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div class="space-y-2">
          <div class="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-nao-emerald/10 border border-nao-emerald/25 text-nao-emerald-light text-xs font-semibold">
            <span class="status-beacon-running"></span>
            <span>ระบบพร้อมใช้งานเต็มประสิทธิภาพ</span>
          </div>
          <h2 class="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
            ยินดีต้อนรับสู่ <span class="bg-gradient-to-r from-nao-emerald-light via-teal-300 to-cyan-400 bg-clip-text text-transparent">NaoCraft</span> Command Center
          </h2>
          <p class="text-sm text-nao-text-muted max-w-xl">
            ควบคุม จัดการไฟล์ ดู Console Real-time และติดตั้ง Mod/Plugin ให้กับ Minecraft Server ของคุณได้อย่างสมบูรณ์แบบ
          </p>
        </div>

        <div class="flex items-center gap-3">
          <NuxtLink
            to="/create"
            class="btn-primary !px-5 !py-3 !rounded-xl shadow-[0_4px_20px_rgba(16,185,129,0.35)] hover:shadow-[0_8px_30px_rgba(16,185,129,0.5)] transition-all cursor-pointer flex items-center gap-2"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            <span class="font-bold">สร้างเซิร์ฟเวอร์ใหม่</span>
          </NuxtLink>

          <NuxtLink
            to="/monitor"
            class="btn-secondary !px-4 !py-3 !rounded-xl text-xs font-semibold flex items-center gap-2"
          >
            <svg class="w-4 h-4 text-nao-text-dim" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
              <path d="M22 12h-4l-3 9L9 3l-3 9H2"></path>
            </svg>
            <span>ดูมอนิเตอร์</span>
          </NuxtLink>
        </div>
      </div>
    </div>

    <!-- Stats Grid -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
      <div
        v-for="(stat, i) in statsCards"
        :key="i"
        class="glass-card p-5 relative overflow-hidden group hover:border-slate-600 transition-all duration-300"
      >
        <div
          class="absolute -right-8 -top-8 w-24 h-24 rounded-full blur-2xl opacity-40 transition-opacity group-hover:opacity-75"
          :class="stat.bgGlow"
        ></div>

        <div class="relative z-10 flex items-start justify-between">
          <div>
            <p class="text-xs font-medium text-nao-text-muted tracking-wide">{{ stat.label }}</p>
            <div class="flex items-baseline gap-2 mt-1.5">
              <span class="text-3xl font-extrabold font-[--font-display] text-white tracking-tight">
                {{ stat.value }}
              </span>
              <span v-if="stat.suffix" class="text-xs text-nao-text-dim font-medium">{{ stat.suffix }}</span>
            </div>
            <p class="text-[11px] text-nao-text-dim mt-2 flex items-center gap-1.5">
              <span class="w-1.5 h-1.5 rounded-full" :class="stat.dotColor"></span>
              {{ stat.description }}
            </p>
          </div>

          <div
            class="w-11 h-11 rounded-xl flex items-center justify-center border transition-all duration-300 group-hover:scale-110"
            :class="stat.iconContainerClass"
            v-html="stat.svg"
          ></div>
        </div>
      </div>
    </div>

    <!-- Servers Section Header -->
    <div class="space-y-4">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 class="text-lg font-bold text-white tracking-tight flex items-center gap-2">
            <span>เซิร์ฟเวอร์ที่พร้อมใช้งาน</span>
            <span class="text-xs font-mono px-2 py-0.5 rounded-full bg-nao-surface-2 text-nao-emerald-light border border-nao-border">
              {{ filteredServers.length }}
            </span>
          </h3>
          <p class="text-xs text-nao-text-dim mt-0.5">เลือกเซิร์ฟเวอร์เพื่อเปิด Console หรือตั้งค่าต่าง ๆ</p>
        </div>

        <!-- Filter bar -->
        <div class="flex items-center gap-3">
          <div class="relative">
            <input
              v-model="searchQuery"
              type="text"
              placeholder="ค้นหาชื่อเซิร์ฟเวอร์..."
              class="input-field !py-1.5 !px-3 !pl-9 text-xs w-48 sm:w-60"
            />
            <svg class="w-4 h-4 text-nao-text-dim absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
          </div>

          <select v-model="filterLoader" class="select-field !py-1.5 !text-xs w-32">
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

      <!-- Loading State -->
      <div v-if="loading" class="glass-card p-16 text-center">
        <div class="inline-block w-10 h-10 border-3 border-nao-emerald/20 border-t-nao-emerald rounded-full animate-spin"></div>
        <p class="text-sm text-nao-text-muted mt-4 font-medium">กำลังโหลดข้อมูลเซิร์ฟเวอร์...</p>
      </div>

      <!-- Empty State -->
      <div v-else-if="servers.length === 0" class="glass-card p-16 text-center border-dashed border-2 border-nao-border/80">
        <div class="w-16 h-16 mx-auto mb-4 rounded-2xl bg-nao-emerald/10 border border-nao-emerald/20 flex items-center justify-center text-nao-emerald-light shadow-[0_0_20px_rgba(16,185,129,0.2)]">
          <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.8">
            <rect x="2" y="2" width="20" height="8" rx="2" ry="2"></rect>
            <rect x="2" y="14" width="20" height="8" rx="2" ry="2"></rect>
            <line x1="6" y1="6" x2="6.01" y2="6"></line>
            <line x1="6" y1="18" x2="6.01" y2="18"></line>
          </svg>
        </div>
        <h4 class="text-lg font-bold text-white">ยังไม่มีเซิร์ฟเวอร์ที่ถูกสร้าง</h4>
        <p class="text-sm text-nao-text-muted mt-1 max-w-sm mx-auto">
          เริ่มต้นสร้างเซิร์ฟเวอร์ Minecraft ของคุณด้วย Loader ที่ต้องการได้ทันที
        </p>
        <NuxtLink to="/create" class="btn-primary mt-6 inline-flex text-sm !px-6 !py-2.5">
          <span>+ สร้างเซิร์ฟเวอร์แรกของคุณ</span>
        </NuxtLink>
      </div>

      <!-- Server Cards Grid -->
      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        <div
          v-for="server in filteredServers"
          :key="server.id"
          class="glass-card-interactive p-5 flex flex-col justify-between group relative overflow-hidden"
        >
          <!-- Top info strip -->
          <div>
            <div class="flex items-start justify-between gap-3 mb-3">
              <span :class="loaderBadgeClass(server.loader)">
                <span class="w-1.5 h-1.5 rounded-full bg-current"></span>
                {{ server.loader }}
              </span>

              <div class="flex items-center gap-1.5">
                <span
                  :class="[
                    server.status === 'running' ? 'status-beacon-running' :
                    server.status === 'stopped' ? 'status-beacon-stopped' : 'status-beacon-starting'
                  ]"
                ></span>
                <span :class="statusTextClass(server.status)" class="text-[11px] font-medium">
                  {{ statusText(server.status) }}
                </span>
              </div>
            </div>

            <!-- Server Name -->
            <NuxtLink :to="`/servers/${server.id}`" class="block">
              <h4 class="text-lg font-bold text-white group-hover:text-nao-emerald-light transition-colors truncate">
                {{ server.name }}
              </h4>
            </NuxtLink>

            <!-- Specs Grid -->
            <div class="grid grid-cols-2 gap-2 mt-4 p-3 rounded-xl bg-nao-surface-2/60 border border-nao-border/60 text-xs">
              <div>
                <span class="text-nao-text-dim block text-[10px] uppercase font-bold tracking-wider">เวอร์ชัน</span>
                <span class="font-mono text-slate-200 font-medium">MC {{ server.mcVersion }}</span>
              </div>
              <div>
                <span class="text-nao-text-dim block text-[10px] uppercase font-bold tracking-wider">RAM กำหนด</span>
                <span class="font-mono text-nao-emerald-light font-medium">{{ server.maxMemory || '2G' }}</span>
              </div>
              <div class="col-span-2 pt-2 border-t border-nao-border/40 flex items-center justify-between">
                <div class="flex items-center gap-1.5 text-nao-text-muted">
                  <svg class="w-3.5 h-3.5 text-nao-text-dim" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                    <rect x="2" y="2" width="20" height="8" rx="2" ry="2"></rect>
                    <rect x="2" y="14" width="20" height="8" rx="2" ry="2"></rect>
                  </svg>
                  <span class="font-mono text-[11px]">localhost:{{ server.port }}</span>
                </div>
                <button
                  @click.stop="copyAddress(server.port)"
                  class="text-[10px] text-nao-emerald-light hover:text-white transition-colors cursor-pointer"
                  title="คัดลอกที่อยู่เซิร์ฟเวอร์"
                >
                  {{ copiedPort === server.port ? '✓ คัดลอกแล้ว' : 'คัดลอก IP' }}
                </button>
              </div>
            </div>
          </div>

          <!-- Bottom Action Buttons -->
          <div class="pt-4 mt-4 border-t border-nao-border/60 flex items-center justify-between gap-2">
            <div class="flex items-center gap-1.5">
              <button
                v-if="server.status === 'stopped'"
                @click="startServer(server.id)"
                class="btn-primary !px-3 !py-1.5 !text-xs"
                :disabled="actionId === server.id"
              >
                <svg class="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
                <span>เปิดเซิร์ฟ</span>
              </button>

              <button
                v-if="server.status === 'running'"
                @click="stopServer(server.id)"
                class="btn-danger !px-3 !py-1.5 !text-xs"
                :disabled="actionId === server.id"
              >
                <svg class="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><rect x="6" y="6" width="12" height="12"></rect></svg>
                <span>หยุด</span>
              </button>

              <button
                v-if="server.status === 'running'"
                @click="restartServer(server.id)"
                class="btn-secondary !px-2.5 !py-1.5 !text-xs"
                :disabled="actionId === server.id"
                title="รีสตาร์ท"
              >
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                  <polyline points="23 4 23 10 17 10"></polyline>
                  <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
                </svg>
              </button>
            </div>

            <NuxtLink
              :to="`/servers/${server.id}`"
              class="btn-secondary !px-3.5 !py-1.5 !text-xs flex items-center gap-1.5"
            >
              <span>คอนโซล</span>
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                <polyline points="9 18 15 12 9 6"></polyline>
              </svg>
            </NuxtLink>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const api = useApi();

const loading = ref(true);
const servers = ref<any[]>([]);
const searchQuery = ref('');
const filterLoader = ref('');
const actionId = ref<string | null>(null);
const copiedPort = ref<number | null>(null);

const fetchServers = async () => {
  try {
    const data = await api.getServers();
    servers.value = data.servers || [];
  } catch (e) {
    console.error('โหลดเซิร์ฟเวอร์ล้มเหลว:', e);
  } finally {
    loading.value = false;
  }
};

const filteredServers = computed(() => {
  return servers.value.filter((server) => {
    const matchName = server.name.toLowerCase().includes(searchQuery.value.toLowerCase());
    const matchLoader = filterLoader.value ? server.loader === filterLoader.value : true;
    return matchName && matchLoader;
  });
});

const startServer = async (id: string) => {
  actionId.value = id;
  try {
    await api.startServer(id);
    await fetchServers();
  } catch {}
  actionId.value = null;
};

const stopServer = async (id: string) => {
  actionId.value = id;
  try {
    await api.stopServer(id);
    await fetchServers();
  } catch {}
  actionId.value = null;
};

const restartServer = async (id: string) => {
  actionId.value = id;
  try {
    await api.restartServer(id);
    await fetchServers();
  } catch {}
  actionId.value = null;
};

const copyAddress = (port: number) => {
  navigator.clipboard.writeText(`localhost:${port}`);
  copiedPort.value = port;
  setTimeout(() => {
    copiedPort.value = null;
  }, 2000);
};

const statsCards = computed(() => [
  {
    label: 'เซิร์ฟเวอร์ทั้งหมด',
    value: servers.value.length,
    suffix: 'เครื่อง',
    description: 'บันทึกในระบบ',
    dotColor: 'bg-nao-blue',
    bgGlow: 'bg-nao-blue',
    iconContainerClass: 'bg-nao-blue/10 border-nao-blue/20 text-nao-blue',
    svg: `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><rect x="2" y="2" width="20" height="8" rx="2" ry="2"></rect><rect x="2" y="14" width="20" height="8" rx="2" ry="2"></rect><line x1="6" y1="6" x2="6.01" y2="6"></line><line x1="6" y1="18" x2="6.01" y2="18"></line></svg>`
  },
  {
    label: 'กำลังทำงาน (Active)',
    value: servers.value.filter((s) => s.status === 'running').length,
    suffix: 'เครื่อง',
    description: 'เปิดรับการเชื่อมต่อ',
    dotColor: 'bg-nao-emerald',
    bgGlow: 'bg-nao-emerald',
    iconContainerClass: 'bg-nao-emerald/10 border-nao-emerald/20 text-nao-emerald-light',
    svg: `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"></path></svg>`
  },
  {
    label: 'หยุดทำงาน (Offline)',
    value: servers.value.filter((s) => s.status === 'stopped').length,
    suffix: 'เครื่อง',
    description: 'พร้อมเริ่มทำงาน',
    dotColor: 'bg-slate-500',
    bgGlow: 'bg-slate-700',
    iconContainerClass: 'bg-slate-800/60 border-slate-700 text-slate-400',
    svg: `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line></svg>`
  },
  {
    label: 'Loaders ที่เลือกใช้',
    value: new Set(servers.value.map((s) => s.loader)).size,
    suffix: 'ประเภท',
    description: 'Vanilla, Paper, Forge ฯลฯ',
    dotColor: 'bg-nao-purple',
    bgGlow: 'bg-nao-purple',
    iconContainerClass: 'bg-nao-purple/10 border-nao-purple/20 text-nao-purple',
    svg: `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>`
  },
]);

const statusText = (status: string): string => {
  const texts: Record<string, string> = {
    running: 'ออนไลน์',
    stopped: 'ออฟไลน์',
    starting: 'กำลังเริ่ม...',
    stopping: 'กำลังปิด...',
  };
  return texts[status] || status;
};

const statusTextClass = (status: string) => {
  const classes: Record<string, string> = {
    running: 'text-nao-emerald-light',
    stopped: 'text-slate-400',
    starting: 'text-amber-400',
    stopping: 'text-amber-400',
  };
  return classes[status] || 'text-slate-400';
};

const loaderBadgeClass = (loader: string) => {
  const classes: Record<string, string> = {
    vanilla: 'badge-green',
    paper: 'badge-blue',
    fabric: 'badge-purple',
    forge: 'badge-yellow',
    neoforge: 'badge-orange',
    purpur: 'badge bg-nao-purple/15 text-nao-purple border border-nao-purple/30',
  };
  return classes[loader] || 'badge';
};

let refreshInterval: NodeJS.Timeout;
onMounted(() => {
  fetchServers();
  refreshInterval = setInterval(fetchServers, 4000);
});
onUnmounted(() => clearInterval(refreshInterval));
</script>
