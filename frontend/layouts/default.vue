<template>
  <div class="min-h-screen flex bg-nao-bg selection:bg-nao-emerald/30 selection:text-white">
    <!-- Sidebar -->
    <aside class="w-64 bg-nao-surface/90 backdrop-blur-xl border-r border-nao-border flex flex-col fixed h-screen z-30 shadow-2xl">
      <!-- Logo Branding -->
      <div class="p-5 border-b border-nao-border/70">
        <NuxtLink to="/" class="flex items-center gap-3.5 group">
          <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-nao-emerald via-emerald-500 to-cyan-500 p-0.5 shadow-[0_0_18px_rgba(16,185,129,0.35)] group-hover:shadow-[0_0_25px_rgba(16,185,129,0.55)] transition-all duration-300">
            <div class="w-full h-full bg-[#080d1a] rounded-[10px] flex items-center justify-center">
              <!-- Minecraft Cube SVG -->
              <svg class="w-5 h-5 text-nao-emerald-light group-hover:scale-110 transition-transform duration-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
                <line x1="12" y1="22.08" x2="12" y2="12"></line>
              </svg>
            </div>
          </div>
          <div>
            <div class="flex items-center gap-1.5">
              <h1 class="text-lg font-extrabold font-[--font-display] text-white tracking-tight">NaoCraft</h1>
              <span class="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-nao-emerald/15 text-nao-emerald-light border border-nao-emerald/25">v1.0</span>
            </div>
            <p class="text-[11px] text-nao-text-dim">Minecraft Cloud Panel</p>
          </div>
        </NuxtLink>
      </div>

      <!-- Quick Action -->
      <div class="px-4 pt-4 pb-2">
        <NuxtLink
          to="/create"
          class="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-gradient-to-r from-nao-emerald to-emerald-600 hover:from-nao-emerald-light hover:to-nao-emerald text-white text-xs font-semibold shadow-[0_4px_16px_rgba(16,185,129,0.3)] hover:shadow-[0_6px_22px_rgba(16,185,129,0.5)] transition-all duration-200 cursor-pointer active:scale-95"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          <span>สร้างเซิร์ฟเวอร์</span>
        </NuxtLink>
      </div>

      <!-- Navigation -->
      <nav class="flex-1 px-3 py-3 space-y-1.5 overflow-y-auto">
        <div class="text-[10px] font-bold uppercase tracking-wider text-nao-text-dim/80 px-3 pb-1">
          เมนูหลัก
        </div>
        <NuxtLink
          v-for="item in navItems"
          :key="item.to"
          :to="item.to"
          class="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group relative"
          :class="[
            isActiveRoute(item.to)
              ? 'bg-gradient-to-r from-nao-emerald/15 to-transparent text-nao-emerald-light font-semibold border-l-2 border-nao-emerald'
              : 'text-nao-text-muted hover:bg-nao-surface-2/80 hover:text-white'
          ]"
        >
          <div
            class="w-5 h-5 flex items-center justify-center transition-transform group-hover:scale-110"
            :class="isActiveRoute(item.to) ? 'text-nao-emerald-light' : 'text-nao-text-dim group-hover:text-nao-text-muted'"
            v-html="item.svg"
          ></div>
          <span class="tracking-wide">{{ item.label }}</span>

          <span
            v-if="isActiveRoute(item.to)"
            class="absolute right-3 w-1.5 h-1.5 rounded-full bg-nao-emerald shadow-[0_0_8px_#10b981]"
          ></span>
        </NuxtLink>
      </nav>

      <!-- System Status Footer -->
      <div class="p-3.5 border-t border-nao-border/70">
        <div class="p-3 rounded-xl bg-nao-surface-2/60 border border-nao-border/60 hover:border-nao-border-light transition-colors">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <span class="status-beacon-running"></span>
              <span class="text-xs font-medium text-slate-200">Server Engine</span>
            </div>
            <span class="text-[10px] font-mono text-nao-emerald-light bg-nao-emerald/10 px-1.5 py-0.5 rounded border border-nao-emerald/20">Bun :4000</span>
          </div>
          <div class="text-[11px] text-nao-text-dim mt-1.5 flex items-center justify-between">
            <span>สถานะระบบ</span>
            <span class="text-nao-emerald-light font-medium">พร้อมทำงาน 100%</span>
          </div>
        </div>
      </div>
    </aside>

    <!-- Main Content Area -->
    <main class="flex-1 ml-64 min-w-0 flex flex-col min-h-screen">
      <!-- Top Sticky Header -->
      <header class="sticky top-0 z-20 bg-nao-bg/80 backdrop-blur-xl border-b border-nao-border/60 px-8 py-3.5 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <!-- Breadcrumb Icon -->
          <div class="w-8 h-8 rounded-lg bg-nao-surface-2 border border-nao-border flex items-center justify-center text-nao-text-muted">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
              <rect x="2" y="2" width="20" height="8" rx="2" ry="2"></rect>
              <rect x="2" y="14" width="20" height="8" rx="2" ry="2"></rect>
              <line x1="6" y1="6" x2="6.01" y2="6"></line>
              <line x1="6" y1="18" x2="6.01" y2="18"></line>
            </svg>
          </div>
          <div>
            <div class="flex items-center gap-2 text-xs text-nao-text-dim">
              <span>NaoCraft</span>
              <span>/</span>
              <span class="text-nao-emerald-light font-medium">{{ currentPageTitle }}</span>
            </div>
            <h2 class="text-base font-bold text-white tracking-tight leading-tight">{{ currentPageDesc }}</h2>
          </div>
        </div>

        <div class="flex items-center gap-3">
          <!-- Quick Status Pill -->
          <div class="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-nao-surface-2/80 border border-nao-border text-xs text-nao-text-muted">
            <svg class="w-3.5 h-3.5 text-nao-text-dim" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
            <span class="font-mono text-nao-text">{{ currentTime }}</span>
          </div>

          <!-- Documentation / GitHub link -->
          <a
            href="https://github.com"
            target="_blank"
            class="btn-icon !w-9 !h-9"
            title="เอกสารคู่มือ"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
              <polyline points="10 9 9 9 8 9"></polyline>
            </svg>
          </a>
        </div>
      </header>

      <!-- Page Content -->
      <div class="p-8 flex-1">
        <slot />
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
const route = useRoute();

const navItems = [
  {
    to: '/',
    label: 'แดชบอร์ด',
    svg: `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>`
  },
  {
    to: '/servers',
    label: 'เซิร์ฟเวอร์ทั้งหมด',
    svg: `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><rect x="2" y="2" width="20" height="8" rx="2" ry="2"></rect><rect x="2" y="14" width="20" height="8" rx="2" ry="2"></rect><line x1="6" y1="6" x2="6.01" y2="6"></line><line x1="6" y1="18" x2="6.01" y2="18"></line></svg>`
  },
  {
    to: '/create',
    label: 'สร้างเซิร์ฟเวอร์',
    svg: `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="16"></line><line x1="8" y1="12" x2="16" y2="12"></line></svg>`
  },
  {
    to: '/monitor',
    label: 'มอนิเตอร์ทรัพยากร',
    svg: `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"></path></svg>`
  },
];

const isActiveRoute = (path: string) => {
  if (path === '/') return route.path === '/';
  return route.path.startsWith(path);
};

const currentPageTitle = computed(() => {
  const titles: Record<string, string> = {
    '/': 'ภาพรวมแดชบอร์ด',
    '/servers': 'จัดการเซิร์ฟเวอร์',
    '/create': 'สร้างเซิร์ฟเวอร์ใหม่',
    '/monitor': 'มอนิเตอร์ระบบ',
  };
  for (const [path, title] of Object.entries(titles)) {
    if (path === '/' && route.path === '/') return title;
    if (path !== '/' && route.path.startsWith(path)) return title;
  }
  return 'ควบคุมเซิร์ฟเวอร์';
});

const currentPageDesc = computed(() => {
  const descs: Record<string, string> = {
    '/': 'ภาพรวมเซิร์ฟเวอร์และสถานะระบบแบบ Real-time',
    '/servers': 'เซิร์ฟเวอร์ทั้งหมดที่คุณสร้างไว้',
    '/create': 'เลือก Loader, เวอร์ชัน และสเปกของเซิร์ฟเวอร์',
    '/monitor': 'การใช้งาน CPU, RAM และประสิทธิภาพระบบ',
  };
  for (const [path, desc] of Object.entries(descs)) {
    if (path === '/' && route.path === '/') return desc;
    if (path !== '/' && route.path.startsWith(path)) return desc;
  }
  return 'ระบบจัดการ Minecraft Server ขั้นสูง';
});

const currentTime = ref('');
const updateTime = () => {
  currentTime.value = new Date().toLocaleString('th-TH', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
};

let timer: NodeJS.Timeout;
onMounted(() => {
  updateTime();
  timer = setInterval(updateTime, 1000);
});
onUnmounted(() => clearInterval(timer));
</script>
