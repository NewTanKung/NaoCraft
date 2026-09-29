// ===== NaoCraft Backend — Loaders Route =====

import { Elysia } from 'elysia';
import { getVersions, getLoaderBuilds } from '../services/loader-service';
import type { LoaderType } from '../types';

export const loadersRoute = new Elysia({ prefix: '/api/loaders' })
  // GET /api/loaders — List supported loaders
  .get('/', () => {
    return {
      loaders: [
        { id: 'vanilla', name: 'Vanilla', description: 'เซิร์ฟเวอร์แบบดั้งเดิมจาก Mojang', icon: '🟢' },
        { id: 'paper', name: 'Paper', description: 'เซิร์ฟเวอร์ประสิทธิภาพสูง รองรับ Plugin', icon: '📄' },
        { id: 'fabric', name: 'Fabric', description: 'เซิร์ฟเวอร์สำหรับ Mod น้ำหนักเบา', icon: '🧵' },
        { id: 'forge', name: 'Forge', description: 'เซิร์ฟเวอร์สำหรับ Mod ที่ได้รับความนิยมสูงสุด', icon: '🔨' },
        { id: 'neoforge', name: 'NeoForge', description: 'เซิร์ฟเวอร์ Mod ยุคใหม่ สำหรับ 1.20.2+', icon: '⚡' },
        { id: 'purpur', name: 'Purpur', description: 'เซิร์ฟเวอร์ต่อยอดจาก Paper เพิ่มฟีเจอร์เสริม', icon: '🟣' },
      ],
    };
  })

  // GET /api/loaders/:loader/versions — Get MC versions for a loader
  .get('/:loader/versions', async ({ params }) => {
    const loader = params.loader as LoaderType;
    const validLoaders = ['vanilla', 'paper', 'fabric', 'forge', 'neoforge', 'purpur'];
    if (!validLoaders.includes(loader)) {
      return { error: `Loader ไม่รองรับ: ${loader}` };
    }
    const versions = await getVersions(loader);
    return { loader, versions };
  })

  // GET /api/loaders/:loader/builds/:mcVersion — Get loader-specific builds
  .get('/:loader/builds/:mcVersion', async ({ params }) => {
    const loader = params.loader as LoaderType;
    const builds = await getLoaderBuilds(loader, params.mcVersion);
    return { loader, mcVersion: params.mcVersion, builds };
  });
