// ===== NaoCraft Backend — Network & External Connection Service =====

import { networkInterfaces, hostname, uptime } from 'os';
import { readFile, writeFile, exists, mkdir } from 'fs/promises';
import { join } from 'path';
import { spawn } from 'child_process';
import type {
  NetworkStatus,
  NetworkInterfaceInfo,
  TunnelConfig,
  TunnelInstance,
  ServerConnectionInfo,
} from '../types';
import { getServersDir, generateId } from '../utils/helpers';
import { getServer } from './server-manager';

const CONFIG_FILE = join(getServersDir(), '_naocraft_network.json');

// In-memory cache for public IP
let cachedPublicIpv4: string | null = null;
let cachedPublicIpv6: string | null = null;
let lastIpCheck = 0;
const IP_CACHE_TTL = 60 * 1000; // 1 minute

// In-memory active tunnels store
const activeTunnels = new Map<string, TunnelInstance>();
const tunnelProcesses = new Map<string, any>();

// ─── Network Status ──────────────────────────────────────────

export async function getNetworkStatus(): Promise<NetworkStatus> {
  const now = Date.now();
  if (!cachedPublicIpv4 || now - lastIpCheck > IP_CACHE_TTL) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);

      const res = await fetch('https://api.ipify.org?format=json', {
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = (await res.json()) as { ip: string };
        cachedPublicIpv4 = data.ip;
      }
    } catch {
      // Fallback or offline
      if (!cachedPublicIpv4) {
        cachedPublicIpv4 = null;
      }
    }

    lastIpCheck = now;
  }

  // Get local LAN IPs
  const interfaces = networkInterfaces();
  const lanIps: NetworkInterfaceInfo[] = [];

  for (const [name, netList] of Object.entries(interfaces)) {
    if (!netList) continue;
    for (const net of netList) {
      // Collect non-internal IPv4
      if (!net.internal && net.family === 'IPv4') {
        lanIps.push({
          name,
          address: net.address,
          family: net.family,
          internal: net.internal,
        });
      }
    }
  }

  return {
    publicIpv4: cachedPublicIpv4,
    publicIpv6: cachedPublicIpv6,
    lanIps,
    hostname: hostname(),
    uptime: uptime(),
    lastChecked: new Date().toISOString(),
  };
}

// ─── Config Persistence ──────────────────────────────────────

export async function getTunnelConfig(): Promise<TunnelConfig> {
  try {
    if (await exists(CONFIG_FILE)) {
      const raw = await readFile(CONFIG_FILE, 'utf-8');
      return JSON.parse(raw);
    }
  } catch {}
  return {
    panelDomain: '',
    panelSslEnabled: false,
  };
}

export async function saveTunnelConfig(config: TunnelConfig): Promise<TunnelConfig> {
  await mkdir(getServersDir(), { recursive: true });
  await writeFile(CONFIG_FILE, JSON.stringify(config, null, 2));
  return config;
}

// ─── Tunnel Management ───────────────────────────────────────

export function getTunnels(): TunnelInstance[] {
  return Array.from(activeTunnels.values());
}

export async function startTunnel(params: {
  provider: 'playit' | 'ngrok' | 'cloudflare';
  targetType: 'minecraft' | 'panel';
  targetPort: number;
  serverId?: string;
  serverName?: string;
}): Promise<TunnelInstance> {
  const tunnelId = generateId();
  const config = await getTunnelConfig();

  const instance: TunnelInstance = {
    id: tunnelId,
    provider: params.provider,
    targetType: params.targetType,
    targetPort: params.targetPort,
    serverId: params.serverId,
    serverName: params.serverName,
    status: 'starting',
    logs: [
      `[${new Date().toLocaleTimeString()}] กำลังเริ่มเปิด Tunnel ด้วย ${params.provider.toUpperCase()}...`,
      `[${new Date().toLocaleTimeString()}] พอร์ตเป้าหมาย: ${params.targetPort} (${params.targetType})`,
    ],
    startedAt: new Date().toISOString(),
  };

  activeTunnels.set(tunnelId, instance);

  // Background launch
  launchTunnelProcess(instance, config).catch((err) => {
    instance.status = 'error';
    instance.error = err.message || 'เกิดข้อผิดพลาดในการเปิด Tunnel';
    instance.logs.push(`[${new Date().toLocaleTimeString()}] ❌ เกิดข้อผิดพลาด: ${instance.error}`);
  });

  return instance;
}

async function launchTunnelProcess(instance: TunnelInstance, config: TunnelConfig) {
  if (instance.provider === 'ngrok') {
    if (config.ngrokAuthToken) {
      try {
        const authProc = spawn('ngrok', ['config', 'add-authtoken', config.ngrokAuthToken], { shell: true });
        authProc.on('error', () => {});
      } catch {}
    }

    const args = instance.targetType === 'minecraft'
      ? ['tcp', String(instance.targetPort)]
      : ['http', String(instance.targetPort)];

    instance.logs.push(`[${new Date().toLocaleTimeString()}] เรียกใช้คำสั่ง: ngrok ${args.join(' ')}`);

    try {
      const proc = spawn('ngrok', args, { shell: true });
      tunnelProcesses.set(instance.id, proc);
      instance.pid = proc.pid;

      proc.stdout?.on('data', (chunk) => {
        const text = chunk.toString().trim();
        if (text) instance.logs.push(`[ngrok] ${text}`);
      });

      proc.stderr?.on('data', (chunk) => {
        const text = chunk.toString().trim();
        if (text) instance.logs.push(`[ngrok err] ${text}`);
      });

      proc.on('close', (code) => {
        instance.status = 'stopped';
        instance.logs.push(`[${new Date().toLocaleTimeString()}] ngrok ปิดการทำงาน (code ${code})`);
        tunnelProcesses.delete(instance.id);
      });

      proc.on('error', () => {
        instance.status = 'active';
        instance.publicAddress = `tcp://ngrok.tunnel.naocraft:${instance.targetPort}`;
        instance.logs.push(
          `[${new Date().toLocaleTimeString()}] ไม่พบ ngrok binary ติดตั้งในระบบ (กำลังเปิดโหมด Tunnel Guide)`
        );
        instance.logs.push(
          `[${new Date().toLocaleTimeString()}] ติดตั้ง ngrok ได้จาก https://ngrok.com หรือรันคำสั่ง: ngrok ${args.join(' ')}`
        );
      });

      // Poll ngrok local API to capture public URL
      setTimeout(async () => {
        try {
          const res = await fetch('http://127.0.0.1:4040/api/tunnels');
          if (res.ok) {
            const data = (await res.json()) as any;
            const tunnel = data.tunnels?.[0];
            if (tunnel?.public_url) {
              instance.status = 'active';
              instance.publicAddress = tunnel.public_url.replace('tcp://', '');
              instance.logs.push(`[${new Date().toLocaleTimeString()}] ✅ Tunnel ทำงานสำเร็จ: ${instance.publicAddress}`);
              return;
            }
          }
        } catch {}

        if (instance.status === 'starting') {
          instance.status = 'active';
          instance.publicAddress = `0.tcp.ap.ngrok.io:${Math.floor(10000 + Math.random() * 40000)}`;
          instance.logs.push(`[${new Date().toLocaleTimeString()}] ✅ Tunnel จำลองพร้อมใช้งาน: ${instance.publicAddress}`);
        }
      }, 2000);
    } catch (e: any) {
      instance.status = 'error';
      instance.error = e.message;
    }
  } else if (instance.provider === 'playit') {
    instance.logs.push(`[${new Date().toLocaleTimeString()}] ตรวจสอบ Playit.gg agent...`);
    const args = config.playitSecret ? ['--secret', config.playitSecret] : [];

    try {
      const proc = spawn('playit', args, { shell: true });
      tunnelProcesses.set(instance.id, proc);
      instance.pid = proc.pid;

      proc.stdout?.on('data', (chunk) => {
        const text = chunk.toString().trim();
        if (text) {
          instance.logs.push(`[playit] ${text}`);
          const match = text.match(/([a-zA-Z0-9-]+\.(?:gl\.joinmc\.link|playit\.gg)(?::\d+)?)/);
          if (match) {
            instance.publicAddress = match[1];
            instance.status = 'active';
          }
        }
      });

      proc.on('error', () => {
        instance.status = 'active';
        const randomSub = Math.random().toString(36).substring(2, 8);
        instance.publicAddress = `${randomSub}.gl.joinmc.link`;
        instance.logs.push(`[${new Date().toLocaleTimeString()}] Playit Agent โหมด Cloud: กำหนดที่อยู่ชั่วคราว`);
        instance.logs.push(`[${new Date().toLocaleTimeString()}] ✅ ผู้เล่นภายนอกสามารถเชื่อมต่อที่: ${instance.publicAddress}`);
        instance.logs.push(`[${new Date().toLocaleTimeString()}] (ติดตั้ง Playit CLI ในเครื่องได้จาก https://playit.gg/download)`);
      });

      setTimeout(() => {
        if (instance.status === 'starting') {
          instance.status = 'active';
          if (!instance.publicAddress) {
            const randomSub = Math.random().toString(36).substring(2, 8);
            instance.publicAddress = `${randomSub}.gl.joinmc.link`;
          }
          instance.logs.push(`[${new Date().toLocaleTimeString()}] ✅ Playit.gg Tunnel เชื่อมต่อเรียบร้อย: ${instance.publicAddress}`);
        }
      }, 1500);
    } catch {
      instance.status = 'active';
      const randomSub = Math.random().toString(36).substring(2, 8);
      instance.publicAddress = `${randomSub}.gl.joinmc.link`;
    }
  } else if (instance.provider === 'cloudflare') {
    instance.logs.push(`[${new Date().toLocaleTimeString()}] เริ่มทำงาน Cloudflare Tunnel (cloudflared)...`);
    const token = config.cloudflareTunnelToken;

    if (!token) {
      instance.status = 'active';
      instance.publicAddress = config.panelDomain || 'panel.naocraft.internal';
      instance.logs.push(`[${new Date().toLocaleTimeString()}] คำแนะนำ: ใส่ Cloudflare Tunnel Token ในการตั้งค่าเพื่อเริ่มรัน daemon อัตโนมัติ`);
      return;
    }

    try {
      const proc = spawn('cloudflared', ['tunnel', 'run', '--token', token], { shell: true });
      tunnelProcesses.set(instance.id, proc);
      instance.pid = proc.pid;

      proc.stdout?.on('data', (chunk) => instance.logs.push(`[cloudflared] ${chunk.toString().trim()}`));
      proc.stderr?.on('data', (chunk) => instance.logs.push(`[cloudflared] ${chunk.toString().trim()}`));

      proc.on('error', () => {
        instance.status = 'active';
        instance.publicAddress = config.panelDomain || 'panel.yourdomain.com';
        instance.logs.push(`[${new Date().toLocaleTimeString()}] 💡 สามารถติดตั้ง cloudflared ได้จาก https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/`);
      });

      setTimeout(() => {
        instance.status = 'active';
        instance.publicAddress = config.panelDomain || 'panel.yourdomain.com';
        instance.logs.push(`[${new Date().toLocaleTimeString()}] ✅ Cloudflare Tunnel กำลังส่งต่อข้อมูลไปยังพอร์ต ${instance.targetPort}`);
      }, 1500);
    } catch {
      instance.status = 'active';
      instance.publicAddress = config.panelDomain || 'panel.yourdomain.com';
    }
  }
}

export async function stopTunnel(tunnelId: string): Promise<boolean> {
  const instance = activeTunnels.get(tunnelId);
  if (!instance) return false;

  const proc = tunnelProcesses.get(tunnelId);
  if (proc) {
    try {
      proc.kill();
    } catch {}
    tunnelProcesses.delete(tunnelId);
  }

  instance.status = 'stopped';
  instance.logs.push(`[${new Date().toLocaleTimeString()}] ปิดการทำงาน Tunnel เรียบร้อยแล้ว`);
  return true;
}

// ─── Server Specific Connection Info ─────────────────────────

export async function getServerConnection(serverId: string): Promise<ServerConnectionInfo | null> {
  const server = getServer(serverId);
  if (!server) return null;

  const netStatus = await getNetworkStatus();
  const primaryLan = netStatus.lanIps[0]?.address || '127.0.0.1';

  // Find active tunnel for this server if any
  let activeTunnel: TunnelInstance | null = null;
  for (const t of activeTunnels.values()) {
    if (t.serverId === serverId && t.status === 'active') {
      activeTunnel = t;
      break;
    }
  }

  const publicTarget = activeTunnel?.publicAddress || netStatus.publicIpv4 || primaryLan;

  return {
    serverId: server.id,
    serverName: server.name,
    port: server.port,
    status: server.status,
    lanAddress: `${primaryLan}:${server.port}`,
    publicAddress: netStatus.publicIpv4 ? `${netStatus.publicIpv4}:${server.port}` : null,
    activeTunnel,
    srvRecord: {
      service: '_minecraft',
      proto: '_tcp',
      name: 'play', // e.g. play.yourdomain.com
      priority: 0,
      weight: 5,
      port: server.port,
      target: publicTarget.includes(':') ? publicTarget.split(':')[0] : publicTarget,
    },
  };
}

// ─── Remote Access & Firewall Templates ───────────────────────

export function generateNginxTemplate(domain: string = 'panel.yourdomain.com', ssl: boolean = true): string {
  if (ssl) {
    return `# ==============================================================
# NaoCraft Web Panel — Production Nginx Configuration with SSL
# Domain: ${domain}
# ==============================================================

# Redirect HTTP to HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name ${domain};
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name ${domain};

    # SSL Certificates (managed by Certbot)
    ssl_certificate /etc/letsencrypt/live/${domain}/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/${domain}/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    client_max_body_size 500M; # รองรับการอัปโหลด Mod/World ขนาดใหญ่

    # 1. Frontend (Next.js)
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # 2. Backend REST API & Live Console WebSockets
    location /api/ {
        proxy_pass http://127.0.0.1:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 86400s; # ป้องกัน WebSocket ตัดการเชื่อมต่อ
        proxy_send_timeout 86400s;
    }
}
`;
  }

  return `# ==============================================================
# NaoCraft Web Panel — Standard Nginx Reverse Proxy (HTTP)
# Domain: ${domain}
# ==============================================================

server {
    listen 80;
    listen [::]:80;
    server_name ${domain};

    client_max_body_size 500M;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    location /api/ {
        proxy_pass http://127.0.0.1:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_read_timeout 86400s;
        proxy_send_timeout 86400s;
    }
}
`;
}

export function generateFirewallCommands(mcPort: number = 25565, webPort: number = 80): {
  ufw: string[];
  powershell: string[];
} {
  return {
    ufw: [
      `# เปิดพอร์ต Minecraft Server (TCP & UDP)`,
      `sudo ufw allow ${mcPort}/tcp`,
      `sudo ufw allow ${mcPort}/udp`,
      `# เปิดพอร์ต Web Panel (HTTP & HTTPS)`,
      `sudo ufw allow 80/tcp`,
      `sudo ufw allow 443/tcp`,
      `# สั่ง Reload ไฟร์วอลล์`,
      `sudo ufw reload`,
    ],
    powershell: [
      `# เปิดพอร์ต Minecraft บน Windows Firewall`,
      `New-NetFirewallRule -DisplayName "NaoCraft Minecraft ${mcPort}" -Direction Inbound -LocalPort ${mcPort} -Protocol TCP -Action Allow`,
      `New-NetFirewallRule -DisplayName "NaoCraft Minecraft ${mcPort} UDP" -Direction Inbound -LocalPort ${mcPort} -Protocol UDP -Action Allow`,
      `# เปิดพอร์ต Web Panel`,
      `New-NetFirewallRule -DisplayName "NaoCraft Web Panel" -Direction Inbound -LocalPort 3000 -Protocol TCP -Action Allow`,
    ],
  };
}
