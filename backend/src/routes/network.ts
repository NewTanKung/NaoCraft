// ===== NaoCraft Backend — Network & External Connections Route =====

import { Elysia, t } from 'elysia';
import {
  getNetworkStatus,
  getTunnelConfig,
  saveTunnelConfig,
  getTunnels,
  startTunnel,
  stopTunnel,
  getServerConnection,
  generateNginxTemplate,
  generateFirewallCommands,
} from '../services/network-service';

export const networkRoute = new Elysia({ prefix: '/api/network' })
  // 1. Get Network Status (Public IP, LAN, Hostname)
  .get('/status', async () => {
    try {
      const status = await getNetworkStatus();
      return { status: 'ok', data: status };
    } catch (e: any) {
      return { status: 'error', error: e.message };
    }
  })

  // 2. Get Tunnel & Remote Access Config
  .get('/config', async () => {
    try {
      const config = await getTunnelConfig();
      return { status: 'ok', config };
    } catch (e: any) {
      return { status: 'error', error: e.message };
    }
  })

  // 3. Save Tunnel & Remote Access Config
  .put(
    '/config',
    async ({ body }) => {
      try {
        const updated = await saveTunnelConfig(body as any);
        return { status: 'ok', config: updated };
      } catch (e: any) {
        return { status: 'error', error: e.message };
      }
    },
    {
      body: t.Object({
        playitSecret: t.Optional(t.String()),
        ngrokAuthToken: t.Optional(t.String()),
        cloudflareTunnelToken: t.Optional(t.String()),
        panelDomain: t.Optional(t.String()),
        panelSslEnabled: t.Optional(t.Boolean()),
      }),
    }
  )

  // 4. Get active tunnels
  .get('/tunnels', () => {
    return { status: 'ok', tunnels: getTunnels() };
  })

  // 5. Start a new tunnel
  .post(
    '/tunnels/start',
    async ({ body }) => {
      try {
        const tunnel = await startTunnel(body as any);
        return { status: 'ok', tunnel };
      } catch (e: any) {
        return { status: 'error', error: e.message };
      }
    },
    {
      body: t.Object({
        provider: t.Union([t.Literal('playit'), t.Literal('ngrok'), t.Literal('cloudflare')]),
        targetType: t.Union([t.Literal('minecraft'), t.Literal('panel')]),
        targetPort: t.Number(),
        serverId: t.Optional(t.String()),
        serverName: t.Optional(t.String()),
      }),
    }
  )

  // 6. Stop a tunnel
  .post(
    '/tunnels/stop',
    async ({ body }) => {
      try {
        const success = await stopTunnel(body.tunnelId);
        return { status: 'ok', success };
      } catch (e: any) {
        return { status: 'error', error: e.message };
      }
    },
    {
      body: t.Object({
        tunnelId: t.String(),
      }),
    }
  )

  // 7. Get specific server connection info & SRV record
  .get('/servers/:id', async ({ params: { id } }) => {
    const conn = await getServerConnection(id);
    if (!conn) {
      return { status: 'error', error: 'ไม่พบเซิร์ฟเวอร์' };
    }
    return { status: 'ok', connection: conn };
  })

  // 8. Generate Nginx and Firewall deployment templates
  .get('/templates', ({ query }) => {
    const domain = (query.domain as string) || 'panel.yourdomain.com';
    const ssl = query.ssl === 'true' || query.ssl === true;
    const mcPort = parseInt(query.mcPort as string) || 25565;

    const nginx = generateNginxTemplate(domain, ssl);
    const firewall = generateFirewallCommands(mcPort, 80);

    return {
      status: 'ok',
      nginx,
      firewall,
    };
  });
