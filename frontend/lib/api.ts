// ===== NaoCraft — API Client for Next.js =====

const getBaseUrl = () => {
  if (typeof window !== 'undefined') {
    return process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:4000';
  }
  return process.env.API_BASE || 'http://localhost:4000';
};

const apiFetch = async <T = any>(path: string, options?: RequestInit): Promise<T> => {
  const baseURL = getBaseUrl();
  const res = await fetch(`${baseURL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    cache: 'no-store',
  });
  return res.json();
};

export const api = {
  getBaseUrl,

  // ─── Loaders ─────────────────────────────────
  getLoaders: () => apiFetch('/api/loaders'),
  getLoaderVersions: (loader: string) => apiFetch(`/api/loaders/${loader}/versions`),
  getLoaderBuilds: (loader: string, mcVersion: string) =>
    apiFetch(`/api/loaders/${loader}/builds/${mcVersion}`),

  // ─── Servers ─────────────────────────────────
  getServers: () => apiFetch('/api/servers'),
  getServer: (id: string) => apiFetch(`/api/servers/${id}`),
  createServer: (data: any) =>
    apiFetch('/api/servers', { method: 'POST', body: JSON.stringify(data) }),
  deleteServer: (id: string) =>
    apiFetch(`/api/servers/${id}`, { method: 'DELETE' }),
  updateServer: (id: string, data: any) =>
    apiFetch(`/api/servers/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),

  // ─── Server Control ──────────────────────────
  startServer: (id: string) =>
    apiFetch(`/api/servers/${id}/start`, { method: 'POST' }),
  stopServer: (id: string) =>
    apiFetch(`/api/servers/${id}/stop`, { method: 'POST' }),
  restartServer: (id: string) =>
    apiFetch(`/api/servers/${id}/restart`, { method: 'POST' }),
  sendCommand: (id: string, command: string) =>
    apiFetch(`/api/servers/${id}/command`, {
      method: 'POST',
      body: JSON.stringify({ command }),
    }),
  getLogs: (id: string) => apiFetch(`/api/servers/${id}/logs`),
  getPlayers: (id: string) => apiFetch(`/api/servers/${id}/players`),

  // ─── Config ──────────────────────────────────
  getConfig: (id: string) => apiFetch(`/api/servers/${id}/config`),
  updateConfig: (id: string, config: Record<string, string>) =>
    apiFetch(`/api/servers/${id}/config`, {
      method: 'PUT',
      body: JSON.stringify(config),
    }),

  // ─── Files ───────────────────────────────────
  getFiles: (id: string, path: string = '') =>
    apiFetch(`/api/servers/${id}/files?path=${encodeURIComponent(path)}`),
  readFile: (id: string, path: string) =>
    apiFetch(`/api/servers/${id}/files/read?path=${encodeURIComponent(path)}`),
  writeFile: (id: string, path: string, content: string) =>
    apiFetch(`/api/servers/${id}/files/write`, {
      method: 'PUT',
      body: JSON.stringify({ path, content }),
    }),
  deleteFile: (id: string, path: string) =>
    apiFetch(`/api/servers/${id}/files?path=${encodeURIComponent(path)}`, {
      method: 'DELETE',
    }),
  createDir: (id: string, path: string) =>
    apiFetch(`/api/servers/${id}/files/mkdir`, {
      method: 'POST',
      body: JSON.stringify({ path }),
    }),
  renameFile: (id: string, path: string, newName: string) =>
    apiFetch(`/api/servers/${id}/files/rename`, {
      method: 'POST',
      body: JSON.stringify({ path, newName }),
    }),

  uploadFile: async (id: string, path: string, file: File) => {
    const baseURL = getBaseUrl();
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(
      `${baseURL}/api/servers/${id}/files/upload?path=${encodeURIComponent(path)}`,
      { method: 'POST', body: formData }
    );
    return res.json();
  },

  getDownloadUrl: (id: string, path: string) =>
    `${getBaseUrl()}/api/servers/${id}/files/download?path=${encodeURIComponent(path)}`,
  getExportUrl: (id: string) =>
    `${getBaseUrl()}/api/servers/${id}/export`,

  // ─── Monitor ─────────────────────────────────
  getSystemStats: () => apiFetch('/api/monitor/system'),
  getServerStats: (id: string) => apiFetch(`/api/monitor/server/${id}`),

  // ─── WebSocket ───────────────────────────────
  connectConsole: (id: string): WebSocket => {
    const baseURL = getBaseUrl();
    const wsUrl = baseURL.replace(/^http/, 'ws');
    return new WebSocket(`${wsUrl}/api/console/${id}`);
  },
};
