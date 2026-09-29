<template>
  <div class="max-w-4xl mx-auto space-y-6 animate-[fade-in_0.3s_ease-out]">
    <!-- Breadcrumb & Back button -->
    <div class="flex items-center justify-between">
      <NuxtLink to="/" class="inline-flex items-center gap-2 text-xs font-semibold text-nao-text-muted hover:text-nao-emerald-light transition-colors group">
        <svg class="w-4 h-4 transition-transform group-hover:-translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
          <line x1="19" y1="12" x2="5" y2="12"></line>
          <polyline points="12 19 5 12 12 5"></polyline>
        </svg>
        <span>กลับหน้าแดชบอร์ด</span>
      </NuxtLink>
    </div>

    <div class="glass-card overflow-hidden border border-nao-border/80 shadow-2xl">
      <!-- Header Banner -->
      <div class="relative bg-gradient-to-r from-nao-surface-2 via-nao-surface to-nao-surface-2 p-6 sm:p-8 border-b border-nao-border">
        <div class="relative z-10 flex items-center justify-between">
          <div>
            <div class="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-nao-emerald/15 border border-nao-emerald/25 text-nao-emerald-light text-xs font-semibold mb-2">
              <span>🚀 Server Creation Wizard</span>
            </div>
            <h3 class="text-2xl font-extrabold text-white tracking-tight">สร้างเซิร์ฟเวอร์ Minecraft</h3>
            <p class="text-xs text-nao-text-muted mt-1">กำหนดประเภท Loader เวอร์ชันเกม และทรัพยากรฮาร์ดแวร์ตามต้องการ</p>
          </div>
          <div class="hidden md:flex w-12 h-12 rounded-2xl bg-nao-emerald/10 border border-nao-emerald/20 items-center justify-center text-nao-emerald-light">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
              <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
              <line x1="12" y1="22.08" x2="12" y2="12"></line>
            </svg>
          </div>
        </div>
      </div>

      <form @submit.prevent="handleCreate" class="p-6 sm:p-8 space-y-8">
        <!-- 1. Server Name -->
        <div class="space-y-2">
          <label class="label !text-sm !font-bold text-white flex items-center justify-between">
            <span>1. ชื่อเซิร์ฟเวอร์</span>
            <span class="text-xs font-normal text-nao-text-dim">ตั้งชื่อที่จดจำง่าย</span>
          </label>
          <input
            v-model="form.name"
            type="text"
            class="input-field !text-base !py-3"
            placeholder="เช่น NaoCraft Survival SMP"
            required
          />
        </div>

        <!-- 2. Loader Selection -->
        <div class="space-y-3">
          <label class="label !text-sm !font-bold text-white flex items-center justify-between">
            <span>2. เลือก Loader (Server Core)</span>
            <span class="text-xs font-normal text-nao-text-dim">คลิกเลือก Loader ที่ต้องการ</span>
          </label>
          <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <button
              v-for="loader in loaders"
              :key="loader.id"
              type="button"
              @click="selectLoader(loader.id)"
              class="p-4 rounded-xl border text-center transition-all duration-200 cursor-pointer group relative flex flex-col items-center justify-between"
              :class="[
                form.loader === loader.id
                  ? 'border-nao-emerald bg-nao-emerald/15 shadow-[0_0_20px_rgba(16,185,129,0.3)] scale-[1.02]'
                  : 'border-nao-border bg-nao-surface-2/70 hover:border-slate-500 hover:bg-nao-surface-2'
              ]"
            >
              <!-- Checkmark for selected -->
              <div
                v-if="form.loader === loader.id"
                class="absolute top-2 right-2 w-4 h-4 rounded-full bg-nao-emerald text-white flex items-center justify-center text-[10px]"
              >
                ✓
              </div>

              <div class="text-3xl mb-2 group-hover:scale-110 transition-transform">
                {{ loader.icon }}
              </div>
              <div>
                <div class="text-sm font-bold text-white">{{ loader.name }}</div>
                <div class="text-[11px] text-nao-text-dim mt-0.5 leading-snug">{{ loader.description }}</div>
              </div>
              <span
                class="mt-2 text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
                :class="form.loader === loader.id ? 'bg-nao-emerald/20 text-nao-emerald-light' : 'bg-nao-surface-3 text-nao-text-dim'"
              >
                {{ loader.tag }}
              </span>
            </button>
          </div>
        </div>

        <!-- 3. Version Selection -->
        <div v-if="form.loader" class="p-5 rounded-2xl bg-nao-surface-2/40 border border-nao-border/80 space-y-4 animate-[slide-up_0.2s_ease-out]">
          <div class="flex items-center justify-between">
            <label class="label !text-sm !font-bold text-white">3. เวอร์ชันเกม Minecraft</label>
            <label class="flex items-center gap-2 text-xs text-nao-text-muted cursor-pointer hover:text-white transition-colors">
              <input
                v-model="showSnapshots"
                type="checkbox"
                class="w-4 h-4 rounded accent-nao-emerald cursor-pointer"
              />
              <span>แสดง Snapshot / Pre-releases</span>
            </label>
          </div>

          <div v-if="loadingVersions" class="flex items-center gap-3 text-sm text-nao-text-muted py-4 justify-center">
            <div class="w-5 h-5 border-2 border-nao-emerald/30 border-t-nao-emerald rounded-full animate-spin"></div>
            <span>กำลังดึงรายการเวอร์ชันจาก Official API...</span>
          </div>

          <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div class="text-xs text-nao-text-dim mb-1 font-medium">เวอร์ชันหลัก (MC Version)</div>
              <select v-model="form.mcVersion" class="select-field" required>
                <option value="" disabled>-- เลือกเวอร์ชัน Minecraft --</option>
                <option
                  v-for="v in filteredVersions"
                  :key="v.id"
                  :value="v.id"
                >
                  Minecraft {{ v.id }} {{ v.type === 'snapshot' ? '(Snapshot / Beta)' : '(Stable)' }}
                </option>
              </select>
            </div>

            <!-- Loader Specific Build -->
            <div v-if="showLoaderVersion">
              <div class="text-xs text-nao-text-dim mb-1 font-medium">
                {{ form.loader === 'fabric' ? 'Fabric Loader Build' : form.loader === 'neoforge' ? 'NeoForge Build' : 'Forge Build' }}
              </div>
              <div v-if="loadingBuilds" class="flex items-center gap-2 text-xs text-nao-text-muted py-2.5">
                <div class="w-3.5 h-3.5 border-2 border-nao-emerald/30 border-t-nao-emerald rounded-full animate-spin"></div>
                <span>กำลังดึง Builds...</span>
              </div>
              <select v-else v-model="form.loaderVersion" class="select-field">
                <option value="">อัตโนมัติ (แนะนำเวอร์ชันล่าสุด)</option>
                <option
                  v-for="b in loaderBuilds"
                  :key="b.id"
                  :value="b.id"
                >
                  Build: {{ b.id }} {{ b.stable ? '✓ เสถียร' : '(Beta)' }}
                </option>
              </select>
            </div>
          </div>
        </div>

        <!-- 4. RAM & Resources -->
        <div class="p-5 rounded-2xl bg-nao-surface-2/40 border border-nao-border/80 space-y-4">
          <label class="label !text-sm !font-bold text-white flex items-center justify-between">
            <span>4. กำหนดทรัพยากรหน่วยความจำ (RAM)</span>
            <span class="text-xs font-mono text-nao-emerald-light">จัดสรร: {{ form.maxMemory }}</span>
          </label>

          <!-- Quick RAM Preset Buttons -->
          <div class="flex flex-wrap items-center gap-2">
            <button
              v-for="ram in ['2G', '4G', '6G', '8G', '12G', '16G']"
              :key="ram"
              type="button"
              @click="form.maxMemory = ram"
              class="px-3.5 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all cursor-pointer"
              :class="[
                form.maxMemory === ram
                  ? 'bg-nao-emerald text-white shadow-[0_0_12px_rgba(16,185,129,0.4)]'
                  : 'bg-nao-surface-2 border border-nao-border text-nao-text-muted hover:text-white hover:border-slate-500'
              ]"
            >
              {{ ram }}
            </button>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <span class="text-xs text-nao-text-dim block mb-1 font-medium">RAM สูงสุด (-Xmx)</span>
              <select v-model="form.maxMemory" class="select-field">
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
              <span class="text-xs text-nao-text-dim block mb-1 font-medium">RAM เริ่มต้น (-Xms)</span>
              <select v-model="form.minMemory" class="select-field">
                <option value="512M">512 MB</option>
                <option value="1G">1 GB</option>
                <option value="2G">2 GB</option>
                <option value="4G">4 GB</option>
              </select>
            </div>
          </div>
        </div>

        <!-- 5. Advanced Settings (Port & Java) -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label class="label !text-sm !font-bold text-white">5. พอร์ตการเชื่อมต่อ (Port)</label>
            <input
              v-model.number="form.port"
              type="number"
              class="input-field font-mono"
              min="1024"
              max="65535"
              placeholder="25565"
              required
            />
            <p class="text-[11px] text-nao-text-dim mt-1">Minecraft พอร์ตมาตรฐานคือ 25565</p>
          </div>

          <div>
            <label class="label !text-sm !font-bold text-white">Java Path</label>
            <input
              v-model="form.javaPath"
              type="text"
              class="input-field font-mono"
              placeholder="java"
            />
            <p class="text-[11px] text-nao-text-dim mt-1">ใช้ java ค่าเริ่มต้น หรือระบุ path เช่น /usr/bin/java</p>
          </div>
        </div>

        <!-- Submit Buttons -->
        <div class="pt-4 border-t border-nao-border/70 flex items-center justify-end gap-3">
          <NuxtLink to="/" class="btn-secondary !px-5 !py-2.5">
            ยกเลิก
          </NuxtLink>

          <button
            type="submit"
            class="btn-primary !px-8 !py-3 !text-base shadow-[0_4px_20px_rgba(16,185,129,0.35)]"
            :disabled="creating || !form.name || !form.loader || !form.mcVersion"
          >
            <span v-if="creating" class="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
            <span v-else>🚀</span>
            <span class="font-bold">{{ creating ? 'กำลังติดตั้งเซิร์ฟเวอร์...' : 'ยืนยันและสร้างเซิร์ฟเวอร์' }}</span>
          </button>
        </div>

        <!-- Error Alert -->
        <div v-if="error" class="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-center gap-3 text-red-400 text-sm">
          <svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
          <span>{{ error }}</span>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
const api = useApi();
const router = useRouter();

const form = reactive({
  name: '',
  loader: '',
  mcVersion: '',
  loaderVersion: '',
  port: 25565,
  minMemory: '1G',
  maxMemory: '4G',
  javaPath: 'java',
});

const loaders = ref([
  { id: 'vanilla', name: 'Vanilla', description: 'Mojang ดั้งเดิม', tag: 'Official', icon: '🟢' },
  { id: 'paper', name: 'Paper', description: 'Plugin ประสิทธิภาพสูง', tag: 'Plugins', icon: '📄' },
  { id: 'fabric', name: 'Fabric', description: 'Mod น้ำหนักเบา', tag: 'Mods', icon: '🧵' },
  { id: 'forge', name: 'Forge', description: 'Mod ยอดนิยมคลาสสิก', tag: 'Mods', icon: '🔨' },
  { id: 'neoforge', name: 'NeoForge', description: 'Mod ยุคใหม่ 1.20+', tag: 'Mods', icon: '⚡' },
  { id: 'purpur', name: 'Purpur', description: 'Paper ปรับแต่งพิเศษ', tag: 'Plugins', icon: '🟣' },
]);

const versions = ref<any[]>([]);
const loaderBuilds = ref<any[]>([]);
const loadingVersions = ref(false);
const loadingBuilds = ref(false);
const showSnapshots = ref(false);
const creating = ref(false);
const error = ref('');

const showLoaderVersion = computed(() =>
  ['fabric', 'forge', 'neoforge'].includes(form.loader)
);

const filteredVersions = computed(() => {
  if (showSnapshots.value) return versions.value;
  return versions.value.filter((v) => v.type === 'release' || v.stable);
});

const selectLoader = async (loaderId: string) => {
  form.loader = loaderId;
  form.mcVersion = '';
  form.loaderVersion = '';
  versions.value = [];
  loaderBuilds.value = [];

  loadingVersions.value = true;
  try {
    const data = await api.getLoaderVersions(loaderId);
    versions.value = data.versions || [];
    if (filteredVersions.value.length > 0) {
      form.mcVersion = filteredVersions.value[0].id;
      if (showLoaderVersion.value) {
        fetchLoaderBuilds();
      }
    }
  } catch (err: any) {
    error.value = `โหลดเวอร์ชันล้มเหลว: ${err.message}`;
  } finally {
    loadingVersions.value = false;
  }
};

const fetchLoaderBuilds = async () => {
  if (!form.loader || !form.mcVersion || !showLoaderVersion.value) return;
  loadingBuilds.value = true;
  try {
    const data = await api.getLoaderBuilds(form.loader, form.mcVersion);
    loaderBuilds.value = data.builds || [];
  } catch {}
  finally {
    loadingBuilds.value = false;
  }
};

watch(() => form.mcVersion, () => {
  if (showLoaderVersion.value) {
    fetchLoaderBuilds();
  }
});

const handleCreate = async () => {
  error.value = '';
  creating.value = true;
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
      error.value = res.error;
    } else {
      router.push(`/servers/${res.server.id}`);
    }
  } catch (err: any) {
    error.value = err.message || 'เกิดข้อผิดพลาดในการสร้างเซิร์ฟเวอร์';
  } finally {
    creating.value = false;
  }
};
</script>
