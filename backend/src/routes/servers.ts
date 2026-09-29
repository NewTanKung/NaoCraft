// ===== NaoCraft Backend — Servers Route =====

import { Elysia } from 'elysia';
import {
  getAllServers,
  getServer,
  createServer,
  deleteServer,
  updateServer,
  startServer,
  stopServer,
  restartServer,
  sendCommand,
  getServerLogs,
  getServerPlayers,
  getServerConfig,
  updateServerConfig,
} from '../services/server-manager';
import type { CreateServerRequest } from '../types';

export const serversRoute = new Elysia({ prefix: '/api/servers' })
  // GET /api/servers — List all servers
  .get('/', () => {
    return { servers: getAllServers() };
  })

  // GET /api/servers/:id — Get server details
  .get('/:id', ({ params }) => {
    const server = getServer(params.id);
    if (!server) return { error: 'ไม่พบเซิร์ฟเวอร์' };
    return { server };
  })

  // POST /api/servers — Create new server
  .post('/', async ({ body }) => {
    try {
      const req = body as CreateServerRequest;
      const server = await createServer(req);
      return { server };
    } catch (err: any) {
      return { error: err.message };
    }
  })

  // DELETE /api/servers/:id — Delete a server
  .delete('/:id', async ({ params }) => {
    try {
      await deleteServer(params.id);
      return { success: true };
    } catch (err: any) {
      return { error: err.message };
    }
  })

  // PATCH /api/servers/:id — Update server settings
  .patch('/:id', async ({ params, body }) => {
    try {
      const server = await updateServer(params.id, body as any);
      return { server };
    } catch (err: any) {
      return { error: err.message };
    }
  })

  // ─── Server Control ─────────────────────────────────────

  // POST /api/servers/:id/start
  .post('/:id/start', async ({ params }) => {
    try {
      await startServer(params.id);
      return { success: true, message: 'กำลังเริ่มเซิร์ฟเวอร์...' };
    } catch (err: any) {
      return { error: err.message };
    }
  })

  // POST /api/servers/:id/stop
  .post('/:id/stop', async ({ params }) => {
    try {
      await stopServer(params.id);
      return { success: true, message: 'เซิร์ฟเวอร์หยุดทำงานแล้ว' };
    } catch (err: any) {
      return { error: err.message };
    }
  })

  // POST /api/servers/:id/restart
  .post('/:id/restart', async ({ params }) => {
    try {
      await restartServer(params.id);
      return { success: true, message: 'กำลังรีสตาร์ทเซิร์ฟเวอร์...' };
    } catch (err: any) {
      return { error: err.message };
    }
  })

  // POST /api/servers/:id/command — Send console command
  .post('/:id/command', ({ params, body }) => {
    try {
      const { command } = body as { command: string };
      sendCommand(params.id, command);
      return { success: true };
    } catch (err: any) {
      return { error: err.message };
    }
  })

  // GET /api/servers/:id/logs — Get recent console logs
  .get('/:id/logs', ({ params }) => {
    return { logs: getServerLogs(params.id) };
  })

  // GET /api/servers/:id/players — Get online players
  .get('/:id/players', ({ params }) => {
    return getServerPlayers(params.id);
  })

  // ─── Config Management ──────────────────────────────────

  // GET /api/servers/:id/config — Get server.properties
  .get('/:id/config', async ({ params }) => {
    try {
      const config = await getServerConfig(params.id);
      return { config };
    } catch (err: any) {
      return { error: err.message };
    }
  })

  // PUT /api/servers/:id/config — Update server.properties
  .put('/:id/config', async ({ params, body }) => {
    try {
      const config = await updateServerConfig(params.id, body as Record<string, string>);
      return { config };
    } catch (err: any) {
      return { error: err.message };
    }
  });
