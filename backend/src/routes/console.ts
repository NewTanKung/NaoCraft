// ===== NaoCraft Backend — Console WebSocket Route =====

import { Elysia } from 'elysia';
import { registerWsClient, unregisterWsClient, sendCommand, getServerLogs } from '../services/server-manager';

export const consoleRoute = new Elysia({ prefix: '/api' })
  .ws('/console/:id', {
    open(ws) {
      const serverId = (ws.data as any).params.id;
      registerWsClient(serverId, ws);

      // Send existing logs
      const logs = getServerLogs(serverId);
      for (const log of logs.slice(-100)) {
        ws.send(JSON.stringify({
          type: 'log',
          message: log,
          timestamp: new Date().toISOString(),
          serverId,
        }));
      }
    },

    message(ws, message) {
      const serverId = (ws.data as any).params.id;
      try {
        const data = typeof message === 'string' ? JSON.parse(message) : message;
        if (data.command) {
          sendCommand(serverId, data.command);
        }
      } catch {
        // Try as plain text command
        if (typeof message === 'string') {
          sendCommand(serverId, message);
        }
      }
    },

    close(ws) {
      const serverId = (ws.data as any).params.id;
      unregisterWsClient(serverId, ws);
    },
  });
