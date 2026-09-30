// ===== NaoCraft Backend — Entry Point =====

import { Elysia } from 'elysia';
import { cors } from '@elysiajs/cors';
import { loadData } from './services/server-manager';
import { serversRoute } from './routes/servers';
import { loadersRoute } from './routes/loaders';
import { consoleRoute } from './routes/console';
import { filesRoute } from './routes/files';
import { monitorRoute } from './routes/monitor';
import { networkRoute } from './routes/network';

const PORT = process.env.PORT || 4000;

// Load persisted server data
await loadData();

const app = new Elysia()
  // CORS for frontend
  .use(cors({
    origin: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }))

  // Health check
  .get('/api/health', () => ({
    status: 'ok',
    name: 'NaoCraft',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  }))

  // Mount routes
  .use(serversRoute)
  .use(loadersRoute)
  .use(consoleRoute)
  .use(filesRoute)
  .use(monitorRoute)
  .use(networkRoute)

  // Start server
  .listen(PORT);

console.log(`
╔══════════════════════════════════════════╗
║         🎮 NaoCraft Server Manager       ║
║──────────────────────────────────────────║
║  Backend running on port ${String(PORT).padEnd(16)}  ║
║  http://localhost:${String(PORT).padEnd(23)}  ║
╚══════════════════════════════════════════╝
`);

export type App = typeof app;
