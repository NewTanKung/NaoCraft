// ===== NaoCraft Backend — Loader Service =====
// Fetches versions and downloads server JARs from official APIs

import { mkdir, writeFile } from 'fs/promises';
import { join } from 'path';
import type { LoaderType, LoaderVersionInfo } from '../types';

const USER_AGENT = 'NaoCraft/1.0.0 (minecraft-server-manager)';

// ─── Vanilla ───────────────────────────────────────────────
async function getVanillaVersions(): Promise<LoaderVersionInfo[]> {
  const res = await fetch('https://piston-meta.mojang.com/mc/game/version_manifest_v2.json');
  const data = await res.json() as any;
  return data.versions
    .filter((v: any) => v.type === 'release' || v.type === 'snapshot')
    .map((v: any) => ({
      id: v.id,
      type: v.type,
      stable: v.type === 'release',
      url: v.url,
    }));
}

async function downloadVanillaServer(mcVersion: string, destDir: string): Promise<string> {
  // Step 1: Get version manifest
  const manifestRes = await fetch('https://piston-meta.mojang.com/mc/game/version_manifest_v2.json');
  const manifest = await manifestRes.json() as any;
  const versionInfo = manifest.versions.find((v: any) => v.id === mcVersion);
  if (!versionInfo) throw new Error(`ไม่พบเวอร์ชัน Vanilla: ${mcVersion}`);

  // Step 2: Get version details
  const versionRes = await fetch(versionInfo.url);
  const versionData = await versionRes.json() as any;
  const serverUrl = versionData.downloads?.server?.url;
  if (!serverUrl) throw new Error(`ไม่มีไฟล์ Server สำหรับเวอร์ชัน ${mcVersion}`);

  // Step 3: Download server JAR
  const jarPath = join(destDir, 'server.jar');
  const jarRes = await fetch(serverUrl);
  const jarBuffer = await jarRes.arrayBuffer();
  await writeFile(jarPath, Buffer.from(jarBuffer));

  return jarPath;
}

// ─── Paper ─────────────────────────────────────────────────
async function getPaperVersions(): Promise<LoaderVersionInfo[]> {
  const res = await fetch('https://fill.papermc.io/v3/projects/paper', {
    headers: { 'User-Agent': USER_AGENT },
  });
  const data = await res.json() as any;
  const versionsObj = data.versions || {};
  const list: string[] = [];
  for (const group of Object.keys(versionsObj)) {
    if (Array.isArray(versionsObj[group])) {
      list.push(...versionsObj[group]);
    }
  }
  return list.map((v: string) => ({
    id: v,
    type: v.includes('pre') || v.includes('rc') ? 'snapshot' : 'release',
    stable: !v.includes('pre') && !v.includes('rc'),
  }));
}

async function downloadPaperServer(mcVersion: string, destDir: string): Promise<string> {
  const buildRes = await fetch(
    `https://fill.papermc.io/v3/projects/paper/versions/${mcVersion}/builds/latest`,
    { headers: { 'User-Agent': USER_AGENT } }
  );
  if (!buildRes.ok) throw new Error(`ไม่พบ Build สำหรับ Paper ${mcVersion}`);
  const buildData = await buildRes.json() as any;
  const downloadObj = buildData.downloads?.['server:default'] || Object.values(buildData.downloads || {})[0] as any;
  const downloadUrl = downloadObj?.url;
  if (!downloadUrl) throw new Error(`ไม่พบไฟล์ดาวน์โหลดสำหรับ Paper ${mcVersion}`);

  const jarPath = join(destDir, 'server.jar');
  const jarRes = await fetch(downloadUrl, { headers: { 'User-Agent': USER_AGENT } });
  const jarBuffer = await jarRes.arrayBuffer();
  await writeFile(jarPath, Buffer.from(jarBuffer));

  return jarPath;
}

// ─── Fabric ────────────────────────────────────────────────
async function getFabricGameVersions(): Promise<LoaderVersionInfo[]> {
  const res = await fetch('https://meta.fabricmc.net/v2/versions/game');
  const data = await res.json() as any[];
  return data.map((v: any) => ({
    id: v.version,
    type: v.stable ? 'release' : 'snapshot',
    stable: v.stable,
  }));
}

async function getFabricLoaderVersions(): Promise<LoaderVersionInfo[]> {
  const res = await fetch('https://meta.fabricmc.net/v2/versions/loader');
  const data = await res.json() as any[];
  return data.map((v: any) => ({
    id: v.version,
    stable: v.stable,
  }));
}

async function downloadFabricServer(mcVersion: string, destDir: string, loaderVersion?: string): Promise<string> {
  // Get latest loader version if not specified
  if (!loaderVersion) {
    const loaders = await getFabricLoaderVersions();
    const stableLoader = loaders.find(l => l.stable) || loaders[0];
    loaderVersion = stableLoader.id;
  }

  // Get latest installer version
  const installerRes = await fetch('https://meta.fabricmc.net/v2/versions/installer');
  const installers = await installerRes.json() as any[];
  const latestInstaller = installers[0]?.version;
  if (!latestInstaller) throw new Error('ไม่พบ Fabric Installer');

  // Download the server JAR
  const downloadUrl = `https://meta.fabricmc.net/v2/versions/loader/${mcVersion}/${loaderVersion}/${latestInstaller}/server/jar`;
  const jarPath = join(destDir, 'server.jar');
  const jarRes = await fetch(downloadUrl);
  if (!jarRes.ok) throw new Error(`ดาวน์โหลด Fabric Server ล้มเหลว: ${jarRes.status}`);
  const jarBuffer = await jarRes.arrayBuffer();
  await writeFile(jarPath, Buffer.from(jarBuffer));

  return jarPath;
}

// ─── Forge ─────────────────────────────────────────────────
async function getForgeVersions(): Promise<LoaderVersionInfo[]> {
  const res = await fetch('https://files.minecraftforge.net/net/minecraftforge/forge/promotions_slim.json');
  const data = await res.json() as any;
  const promos = data.promos || {};
  const versions = new Set<string>();

  for (const key of Object.keys(promos)) {
    const mcVersion = key.replace(/-latest$/, '').replace(/-recommended$/, '');
    versions.add(mcVersion);
  }

  return Array.from(versions).reverse().map(v => ({
    id: v,
    type: 'release',
    stable: true,
  }));
}

async function getForgeBuilds(mcVersion: string): Promise<LoaderVersionInfo[]> {
  const res = await fetch('https://files.minecraftforge.net/net/minecraftforge/forge/promotions_slim.json');
  const data = await res.json() as any;
  const promos = data.promos || {};
  const builds: LoaderVersionInfo[] = [];

  const recommended = promos[`${mcVersion}-recommended`];
  const latest = promos[`${mcVersion}-latest`];

  if (recommended) {
    builds.push({ id: `${mcVersion}-${recommended}`, type: 'recommended', stable: true });
  }
  if (latest) {
    builds.push({ id: `${mcVersion}-${latest}`, type: 'latest', stable: false });
  }

  return builds;
}

async function downloadForgeServer(mcVersion: string, destDir: string, forgeVersion?: string): Promise<string> {
  if (!forgeVersion) {
    const builds = await getForgeBuilds(mcVersion);
    if (builds.length === 0) throw new Error(`ไม่พบ Forge สำหรับ MC ${mcVersion}`);
    forgeVersion = builds[0].id; // Use recommended or latest
  }

  // Download installer
  const installerUrl = `https://maven.minecraftforge.net/net/minecraftforge/forge/${forgeVersion}/forge-${forgeVersion}-installer.jar`;
  const installerPath = join(destDir, 'forge-installer.jar');

  const installerRes = await fetch(installerUrl);
  if (!installerRes.ok) throw new Error(`ดาวน์โหลด Forge Installer ล้มเหลว: ${installerRes.status}`);
  const installerBuffer = await installerRes.arrayBuffer();
  await writeFile(installerPath, Buffer.from(installerBuffer));

  // Run installer with --installServer
  const installProcess = Bun.spawn(
    ['java', '-jar', 'forge-installer.jar', '--installServer'],
    { cwd: destDir, stdout: 'pipe', stderr: 'pipe' }
  );
  await installProcess.exited;

  // Clean up installer
  try {
    const { unlink } = await import('fs/promises');
    await unlink(installerPath);
    await unlink(join(destDir, 'forge-installer.jar.log')).catch(() => {});
  } catch {}

  return join(destDir, 'server.jar');
}

// ─── Purpur ────────────────────────────────────────────────
async function getPurpurVersions(): Promise<LoaderVersionInfo[]> {
  const res = await fetch('https://api.purpurmc.org/v2/purpur/');
  const data = await res.json() as any;
  return (data.versions || []).reverse().map((v: string) => ({
    id: v,
    type: 'release',
    stable: true,
  }));
}

async function downloadPurpurServer(mcVersion: string, destDir: string): Promise<string> {
  const downloadUrl = `https://api.purpurmc.org/v2/purpur/${mcVersion}/latest/download`;
  const jarPath = join(destDir, 'server.jar');
  const jarRes = await fetch(downloadUrl);
  if (!jarRes.ok) throw new Error(`ดาวน์โหลด Purpur Server ล้มเหลว: ${jarRes.status}`);
  const jarBuffer = await jarRes.arrayBuffer();
  await writeFile(jarPath, Buffer.from(jarBuffer));

  return jarPath;
}

// ─── NeoForge ──────────────────────────────────────────────
function neoVersionToMc(neoVer: string): string | null {
  const m = neoVer.match(/^(\d+)\.(\d+)/);
  if (!m) return null;
  const major = parseInt(m[1]);
  const minor = parseInt(m[2]);
  if (major === 20) return `1.20.${minor}`;
  if (major === 21) return minor === 0 ? '1.21' : `1.21.${minor}`;
  return `${major}.${minor}`;
}

function mcToNeoPrefix(mcVersion: string): string {
  if (mcVersion === '1.21') return '21.0.';
  if (mcVersion.startsWith('1.21.')) return `21.${mcVersion.slice(5)}.`;
  if (mcVersion.startsWith('1.20.')) return `20.${mcVersion.slice(5)}.`;
  return `${mcVersion}.`;
}

async function getNeoForgeRawVersions(): Promise<string[]> {
  const res = await fetch('https://maven.neoforged.net/api/maven/versions/releases/net/neoforged/neoforge', {
    headers: { 'User-Agent': USER_AGENT },
  });
  const data = await res.json() as any;
  return (data.versions || []) as string[];
}

async function getNeoForgeVersions(): Promise<LoaderVersionInfo[]> {
  const allVersions = await getNeoForgeRawVersions();
  const mcMap = new Map<string, { stable: boolean }>();

  for (const v of allVersions) {
    const mc = neoVersionToMc(v);
    if (!mc || mc.startsWith('0.')) continue;
    const isStable = !v.includes('beta') && !v.includes('alpha');
    if (!mcMap.has(mc)) {
      mcMap.set(mc, { stable: isStable });
    } else if (isStable) {
      mcMap.get(mc)!.stable = true;
    }
  }

  // Sort versions descending
  const sorted = Array.from(mcMap.keys()).sort((a, b) => {
    const aParts = a.split('.').map(Number);
    const bParts = b.split('.').map(Number);
    for (let i = 0; i < Math.max(aParts.length, bParts.length); i++) {
      const diff = (bParts[i] || 0) - (aParts[i] || 0);
      if (diff !== 0) return diff;
    }
    return 0;
  });

  return sorted.map((mc) => ({
    id: mc,
    type: mcMap.get(mc)?.stable ? 'release' : 'snapshot',
    stable: !!mcMap.get(mc)?.stable,
  }));
}

async function getNeoForgeBuilds(mcVersion: string): Promise<LoaderVersionInfo[]> {
  const allVersions = await getNeoForgeRawVersions();
  const prefix = mcToNeoPrefix(mcVersion);
  const matching = allVersions.filter((v) => v.startsWith(prefix));

  return matching.reverse().map((v) => ({
    id: v,
    type: v.includes('beta') || v.includes('alpha') ? 'beta' : 'release',
    stable: !v.includes('beta') && !v.includes('alpha'),
  }));
}

async function downloadNeoForgeServer(mcVersion: string, destDir: string, neoVersion?: string): Promise<string> {
  if (!neoVersion) {
    const builds = await getNeoForgeBuilds(mcVersion);
    if (builds.length === 0) throw new Error(`ไม่พบเวอร์ชัน NeoForge สำหรับ Minecraft ${mcVersion}`);
    neoVersion = builds[0].id;
  }

  const installerUrl = `https://maven.neoforged.net/releases/net/neoforged/neoforge/${neoVersion}/neoforge-${neoVersion}-installer.jar`;
  const installerPath = join(destDir, 'neoforge-installer.jar');

  const installerRes = await fetch(installerUrl, { headers: { 'User-Agent': USER_AGENT } });
  if (!installerRes.ok) throw new Error(`ดาวน์โหลด NeoForge Installer ล้มเหลว: ${installerRes.status}`);
  const installerBuffer = await installerRes.arrayBuffer();
  await writeFile(installerPath, Buffer.from(installerBuffer));

  // Run installer with --installServer
  const installProcess = Bun.spawn(
    ['java', '-jar', 'neoforge-installer.jar', '--installServer'],
    { cwd: destDir, stdout: 'pipe', stderr: 'pipe' }
  );
  await installProcess.exited;

  // Clean up installer
  try {
    const { unlink } = await import('fs/promises');
    await unlink(installerPath).catch(() => {});
    await unlink(join(destDir, 'neoforge-installer.jar.log')).catch(() => {});
  } catch {}

  return join(destDir, 'server.jar');
}

// ─── Public API ────────────────────────────────────────────

/**
 * Get available Minecraft versions for a given loader
 */
export async function getVersions(loader: LoaderType): Promise<LoaderVersionInfo[]> {
  switch (loader) {
    case 'vanilla': return getVanillaVersions();
    case 'paper': return getPaperVersions();
    case 'fabric': return getFabricGameVersions();
    case 'forge': return getForgeVersions();
    case 'neoforge': return getNeoForgeVersions();
    case 'purpur': return getPurpurVersions();
    default: throw new Error(`Loader ไม่รองรับ: ${loader}`);
  }
}

/**
 * Get loader-specific versions (e.g., Fabric loader versions, Forge builds, NeoForge builds)
 */
export async function getLoaderBuilds(loader: LoaderType, mcVersion: string): Promise<LoaderVersionInfo[]> {
  switch (loader) {
    case 'fabric': return getFabricLoaderVersions();
    case 'forge': return getForgeBuilds(mcVersion);
    case 'neoforge': return getNeoForgeBuilds(mcVersion);
    default: return [];
  }
}

/**
 * Download and install server JAR to a given directory
 */
export async function downloadServer(
  loader: LoaderType,
  mcVersion: string,
  destDir: string,
  loaderVersion?: string
): Promise<string> {
  await mkdir(destDir, { recursive: true });

  switch (loader) {
    case 'vanilla': return downloadVanillaServer(mcVersion, destDir);
    case 'paper': return downloadPaperServer(mcVersion, destDir);
    case 'fabric': return downloadFabricServer(mcVersion, destDir, loaderVersion);
    case 'forge': return downloadForgeServer(mcVersion, destDir, loaderVersion);
    case 'neoforge': return downloadNeoForgeServer(mcVersion, destDir, loaderVersion);
    case 'purpur': return downloadPurpurServer(mcVersion, destDir);
    default: throw new Error(`Loader ไม่รองรับ: ${loader}`);
  }
}
