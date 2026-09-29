// ===== NaoCraft Backend — Monitor Route =====

import { Elysia } from 'elysia';
import { getServer } from '../services/server-manager';
import { getSystemStats, getProcessStats } from '../services/monitor-service';

export const monitorRoute = new Elysia({ prefix: '/api' })
  // GET /api/monitor/system — System-wide stats
  .get('/monitor/system', async () => {
    try {
      const stats = await getSystemStats();
      return { stats };
    } catch (err: any) {
      return { error: err.message };
    }
  })

  // GET /api/monitor/server/:id — Per-server process stats
  .get('/monitor/server/:id', async ({ params }) => {
    const server = getServer(params.id);
    if (!server) return { error: 'ไม่พบเซิร์ฟเวอร์' };
    if (!server.pid) return { error: 'เซิร์ฟเวอร์ไม่ได้กำลังทำงาน', stats: null };

    try {
      const stats = await getProcessStats(server.pid);
      return { stats, pid: server.pid };
    } catch (err: any) {
      return { error: err.message };
    }
  });
