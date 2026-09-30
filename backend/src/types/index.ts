// ===== NaoCraft Backend — Types =====

export interface ServerInstance {
  id: string;
  name: string;
  loader: LoaderType;
  mcVersion: string;
  loaderVersion?: string;
  port: number;
  status: ServerStatus;
  pid?: number;
  path: string;
  createdAt: string;
  maxMemory: string;   // e.g. "2G"
  minMemory: string;   // e.g. "1G"
  javaPath: string;
}

export type LoaderType = 'vanilla' | 'paper' | 'fabric' | 'forge' | 'neoforge' | 'purpur';
export type ServerStatus = 'stopped' | 'starting' | 'running' | 'stopping';

export interface ServerConfig {
  [key: string]: string;
}

export interface CreateServerRequest {
  name: string;
  loader: LoaderType;
  mcVersion: string;
  loaderVersion?: string;
  port: number;
  maxMemory?: string;
  minMemory?: string;
  javaPath?: string;
}

export interface ConsoleMessage {
  type: 'log' | 'command' | 'error' | 'info';
  message: string;
  timestamp: string;
  serverId: string;
}

export interface SystemStats {
  cpuUsage: number;
  memoryTotal: number;
  memoryUsed: number;
  memoryFree: number;
  uptime: number;
}

export interface ServerProcess {
  process: any; // Bun.Subprocess
  logs: string[];
  onlinePlayerCount: number;
  players: string[];
}

export interface LoaderVersionInfo {
  id: string;
  type?: string;       // release / snapshot
  stable?: boolean;
}

export interface FileInfo {
  name: string;
  path: string;
  isDirectory: boolean;
  size: number;
  modifiedAt: string;
}

// ─── Network & External Connection Types ───────────────────

export interface NetworkInterfaceInfo {
  name: string;
  address: string;
  family: string;
  internal: boolean;
}

export interface NetworkStatus {
  publicIpv4: string | null;
  publicIpv6: string | null;
  lanIps: NetworkInterfaceInfo[];
  hostname: string;
  uptime: number;
  lastChecked: string;
}

export interface TunnelConfig {
  playitSecret?: string;
  ngrokAuthToken?: string;
  cloudflareTunnelToken?: string;
  panelDomain?: string;
  panelSslEnabled?: boolean;
}

export interface TunnelInstance {
  id: string;
  provider: 'playit' | 'ngrok' | 'cloudflare';
  targetType: 'minecraft' | 'panel';
  serverId?: string;
  serverName?: string;
  targetPort: number;
  status: 'stopped' | 'starting' | 'active' | 'error';
  publicAddress?: string;
  logs: string[];
  startedAt?: string;
  error?: string;
  pid?: number;
}

export interface ServerConnectionInfo {
  serverId: string;
  serverName: string;
  port: number;
  status: ServerStatus;
  lanAddress: string;
  publicAddress: string | null;
  activeTunnel?: TunnelInstance | null;
  srvRecord: {
    service: string;
    proto: string;
    name: string;
    priority: number;
    weight: number;
    port: number;
    target: string;
  };
}
