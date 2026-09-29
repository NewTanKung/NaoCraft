// ===== NaoCraft Backend — Server Manager Service =====
// Manages Minecraft server instances: create, start, stop, restart, delete

import { mkdir, readFile, writeFile, rm, exists } from 'fs/promises';
import { join } from 'path';
import type { ServerInstance, ServerProcess, CreateServerRequest, ConsoleMessage } from '../types';
import { generateId, getServersDir, parseServerProperties, serializeServerProperties } from '../utils/helpers';
import { downloadServer } from './loader-service';

// In-memory store
const servers = new Map<string, ServerInstance>();
const processes = new Map<string, ServerProcess>();
const wsClients = new Map<string, Set<any>>(); // serverId -> Set of WebSocket clients

const DATA_FILE = join(getServersDir(), '_naocraft_data.json');

// ─── Persistence ───────────────────────────────────────────

async function saveData() {
  const dir = getServersDir();
  await mkdir(dir, { recursive: true });
  const data = Array.from(servers.values()).map(s => ({
    ...s,
    status: 'stopped' as const, // Always save as stopped
    pid: undefined,
  }));
  await writeFile(DATA_FILE, JSON.stringify(data, null, 2));
}

export async function loadData() {
  try {
    if (await exists(DATA_FILE)) {
      const raw = await readFile(DATA_FILE, 'utf-8');
      const data = JSON.parse(raw) as ServerInstance[];
      for (const server of data) {
        server.status = 'stopped';
        server.pid = undefined;
        servers.set(server.id, server);
      }
      console.log(`[NaoCraft] โหลดข้อมูลเซิร์ฟเวอร์ ${data.length} รายการ`);
    }
  } catch (err) {
    console.error('[NaoCraft] โหลดข้อมูลล้มเหลว:', err);
  }
}

// ─── WebSocket Broadcasting ────────────────────────────────

export function registerWsClient(serverId: string, ws: any) {
  if (!wsClients.has(serverId)) {
    wsClients.set(serverId, new Set());
  }
  wsClients.get(serverId)!.add(ws);
}

export function unregisterWsClient(serverId: string, ws: any) {
  wsClients.get(serverId)?.delete(ws);
}

function broadcast(serverId: string, message: ConsoleMessage) {
  const clients = wsClients.get(serverId);
  if (!clients) return;
  const data = JSON.stringify(message);
  for (const ws of clients) {
    try {
      ws.send(data);
    } catch {
      clients.delete(ws);
    }
  }
}

// ─── Server CRUD ───────────────────────────────────────────

export function getAllServers(): ServerInstance[] {
  return Array.from(servers.values());
}

export function getServer(id: string): ServerInstance | undefined {
  return servers.get(id);
}

export async function createServer(req: CreateServerRequest): Promise<ServerInstance> {
  const id = generateId();
  const serverPath = join(getServersDir(), id);

  await mkdir(serverPath, { recursive: true });

  // Broadcast status
  broadcast(id, {
    type: 'info',
    message: `กำลังดาวน์โหลด ${req.loader} เวอร์ชัน ${req.mcVersion}...`,
    timestamp: new Date().toISOString(),
    serverId: id,
  });

  // Download server JAR
  await downloadServer(req.loader, req.mcVersion, serverPath, req.loaderVersion);

  // Accept EULA
  await writeFile(join(serverPath, 'eula.txt'), 'eula=true\n');

  // For Forge/NeoForge, write memory options to user_jvm_args.txt
  if (req.loader === 'forge' || req.loader === 'neoforge') {
    await writeFile(
      join(serverPath, 'user_jvm_args.txt'),
      `# Java memory options configured by NaoCraft\n-Xms${req.minMemory || '1G'}\n-Xmx${req.maxMemory || '2G'}\n`
    );
  }

  // Create default server.properties
  const defaultProps: Record<string, string> = {
    'server-port': String(req.port),
    'motd': `\\u00a7b${req.name} \\u00a7r- Powered by NaoCraft`,
    'max-players': '20',
    'online-mode': 'true',
    'difficulty': 'normal',
    'gamemode': 'survival',
    'view-distance': '10',
    'spawn-protection': '16',
    'enable-command-block': 'false',
    'pvp': 'true',
    'level-name': 'world',
  };
  await writeFile(join(serverPath, 'server.properties'), serializeServerProperties(defaultProps));

  const server: ServerInstance = {
    id,
    name: req.name,
    loader: req.loader,
    mcVersion: req.mcVersion,
    loaderVersion: req.loaderVersion,
    port: req.port,
    status: 'stopped',
    path: serverPath,
    createdAt: new Date().toISOString(),
    maxMemory: req.maxMemory || '2G',
    minMemory: req.minMemory || '1G',
    javaPath: req.javaPath || 'java',
  };

  servers.set(id, server);
  await saveData();

  return server;
}

export async function deleteServer(id: string): Promise<void> {
  const server = servers.get(id);
  if (!server) throw new Error('ไม่พบเซิร์ฟเวอร์');
  if (server.status === 'running') {
    await stopServer(id);
  }
  await rm(server.path, { recursive: true, force: true });
  servers.delete(id);
  await saveData();
}

export async function updateServer(id: string, updates: Partial<ServerInstance>): Promise<ServerInstance> {
  const server = servers.get(id);
  if (!server) throw new Error('ไม่พบเซิร์ฟเวอร์');

  Object.assign(server, updates);
  servers.set(id, server);
  await saveData();

  return server;
}

// ─── Server Process Control ────────────────────────────────

export async function startServer(id: string): Promise<void> {
  const server = servers.get(id);
  if (!server) throw new Error('ไม่พบเซิร์ฟเวอร์');
  if (server.status === 'running') throw new Error('เซิร์ฟเวอร์กำลังทำงานอยู่แล้ว');

  server.status = 'starting';

  // Determine the startup command based on loader
  let args: string[];

  if (server.loader === 'forge' || server.loader === 'neoforge') {
    // Forge / NeoForge uses run.sh (Linux) or run.bat (Windows)
    const forgeArgsPath = join(server.path, 'user_jvm_args.txt');
    const hasForgeArgs = await exists(forgeArgsPath);

    if (hasForgeArgs) {
      const isWin = process.platform === 'win32';
      args = isWin ? ['cmd.exe', '/c', 'run.bat'] : ['/bin/bash', 'run.sh'];
    } else {
      // Older Forge / Fallback
      args = [
        server.javaPath,
        `-Xmx${server.maxMemory}`,
        `-Xms${server.minMemory}`,
        '-jar', 'server.jar',
        'nogui',
      ];
    }
  } else {
    args = [
      server.javaPath,
      `-Xmx${server.maxMemory}`,
      `-Xms${server.minMemory}`,
      '-jar', 'server.jar',
      'nogui',
    ];
  }

  try {
    const proc = Bun.spawn(args, {
      cwd: server.path,
      stdin: 'pipe',
      stdout: 'pipe',
      stderr: 'pipe',
    });

    const serverProcess: ServerProcess = {
      process: proc,
      logs: [],
      onlinePlayerCount: 0,
      players: [],
    };

    processes.set(id, serverProcess);
    server.pid = proc.pid;
    server.status = 'running';
    await saveData();

    // Read stdout
    const readStream = async (stream: ReadableStream<Uint8Array>, type: 'log' | 'error') => {
      const reader = stream.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.trim()) {
              const msg: ConsoleMessage = {
                type,
                message: line,
                timestamp: new Date().toISOString(),
                serverId: id,
              };
              serverProcess.logs.push(line);
              // Keep last 1000 lines
              if (serverProcess.logs.length > 1000) {
                serverProcess.logs.shift();
              }

              // Parse player join/leave
              if (line.includes('joined the game')) {
                const match = line.match(/(\w+) joined the game/);
                if (match) {
                  serverProcess.players.push(match[1]);
                  serverProcess.onlinePlayerCount = serverProcess.players.length;
                }
              }
              if (line.includes('left the game')) {
                const match = line.match(/(\w+) left the game/);
                if (match) {
                  serverProcess.players = serverProcess.players.filter(p => p !== match[1]);
                  serverProcess.onlinePlayerCount = serverProcess.players.length;
                }
              }

              broadcast(id, msg);
            }
          }
        }
      } catch {}
    };

    if (proc.stdout) readStream(proc.stdout, 'log');
    if (proc.stderr) readStream(proc.stderr, 'error');

    // Handle process exit
    proc.exited.then(() => {
      server.status = 'stopped';
      server.pid = undefined;
      processes.delete(id);
      broadcast(id, {
        type: 'info',
        message: '🛑 เซิร์ฟเวอร์หยุดทำงานแล้ว',
        timestamp: new Date().toISOString(),
        serverId: id,
      });
      saveData();
    });

    broadcast(id, {
      type: 'info',
      message: '🚀 กำลังเริ่มเซิร์ฟเวอร์...',
      timestamp: new Date().toISOString(),
      serverId: id,
    });
  } catch (err: any) {
    server.status = 'stopped';
    throw new Error(`เริ่มเซิร์ฟเวอร์ล้มเหลว: ${err.message}`);
  }
}

export async function stopServer(id: string): Promise<void> {
  const server = servers.get(id);
  if (!server) throw new Error('ไม่พบเซิร์ฟเวอร์');

  const proc = processes.get(id);
  if (!proc) throw new Error('ไม่พบ Process ที่กำลังทำงาน');

  server.status = 'stopping';

  try {
    // Send 'stop' command to Minecraft server stdin
    const writer = proc.process.stdin.getWriter();
    await writer.write(new TextEncoder().encode('stop\n'));
    writer.releaseLock();

    // Wait for graceful shutdown (max 30 seconds)
    const timeout = setTimeout(() => {
      try {
        proc.process.kill();
      } catch {}
    }, 30000);

    await proc.process.exited;
    clearTimeout(timeout);
  } catch {
    // Force kill if graceful shutdown fails
    try {
      proc.process.kill();
    } catch {}
  }

  server.status = 'stopped';
  server.pid = undefined;
  processes.delete(id);
  await saveData();
}

export async function restartServer(id: string): Promise<void> {
  await stopServer(id);
  // Wait a moment for port to be released
  await new Promise(resolve => setTimeout(resolve, 2000));
  await startServer(id);
}

export function sendCommand(id: string, command: string): void {
  const proc = processes.get(id);
  if (!proc) throw new Error('เซิร์ฟเวอร์ไม่ได้กำลังทำงาน');

  try {
    const writer = proc.process.stdin.getWriter();
    writer.write(new TextEncoder().encode(command + '\n'));
    writer.releaseLock();

    broadcast(id, {
      type: 'command',
      message: `> ${command}`,
      timestamp: new Date().toISOString(),
      serverId: id,
    });
  } catch (err: any) {
    throw new Error(`ส่งคำสั่งล้มเหลว: ${err.message}`);
  }
}

export function getServerLogs(id: string): string[] {
  return processes.get(id)?.logs || [];
}

export function getServerPlayers(id: string): { count: number; names: string[] } {
  const proc = processes.get(id);
  return {
    count: proc?.onlinePlayerCount || 0,
    names: proc?.players || [],
  };
}

// ─── Config Management ────────────────────────────────────

export async function getServerConfig(id: string): Promise<Record<string, string>> {
  const server = servers.get(id);
  if (!server) throw new Error('ไม่พบเซิร์ฟเวอร์');

  const propsPath = join(server.path, 'server.properties');
  try {
    const content = await readFile(propsPath, 'utf-8');
    return parseServerProperties(content);
  } catch {
    return {};
  }
}

export async function updateServerConfig(id: string, config: Record<string, string>): Promise<Record<string, string>> {
  const server = servers.get(id);
  if (!server) throw new Error('ไม่พบเซิร์ฟเวอร์');

  const propsPath = join(server.path, 'server.properties');

  // Read existing, merge, write back
  let existing: Record<string, string> = {};
  try {
    const content = await readFile(propsPath, 'utf-8');
    existing = parseServerProperties(content);
  } catch {}

  const merged = { ...existing, ...config };
  await writeFile(propsPath, serializeServerProperties(merged));

  // Update port in server instance if changed
  if (config['server-port']) {
    server.port = parseInt(config['server-port']);
    await saveData();
  }

  return merged;
}
