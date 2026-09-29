// ===== NaoCraft Backend — File Service =====
// Handles file management: list, upload, download, delete, export

import { readdir, stat, readFile, writeFile, unlink, mkdir, rm, exists } from 'fs/promises';
import { join, relative, basename, extname } from 'path';
import { createWriteStream, createReadStream } from 'fs';
import type { FileInfo } from '../types';
import { listDirectory } from '../utils/helpers';

/**
 * Get server directory path, validating it exists
 */
function getServerFilePath(serverPath: string, relativePath: string): string {
  const fullPath = join(serverPath, relativePath);
  // Security: prevent directory traversal
  const resolved = join(serverPath, relativePath);
  if (!resolved.startsWith(serverPath)) {
    throw new Error('ไม่อนุญาตให้เข้าถึงไฟล์นอกโฟลเดอร์เซิร์ฟเวอร์');
  }
  return resolved;
}

/**
 * List files in a server subdirectory
 */
export async function listServerFiles(serverPath: string, subPath: string = ''): Promise<FileInfo[]> {
  const targetPath = subPath ? getServerFilePath(serverPath, subPath) : serverPath;
  return listDirectory(targetPath);
}

/**
 * Read a file's content
 */
export async function readServerFile(serverPath: string, filePath: string): Promise<string> {
  const fullPath = getServerFilePath(serverPath, filePath);
  return readFile(fullPath, 'utf-8');
}

/**
 * Write content to a file
 */
export async function writeServerFile(serverPath: string, filePath: string, content: string): Promise<void> {
  const fullPath = getServerFilePath(serverPath, filePath);
  const dir = join(fullPath, '..');
  await mkdir(dir, { recursive: true });
  await writeFile(fullPath, content, 'utf-8');
}

/**
 * Upload a file to server directory
 */
export async function uploadFile(serverPath: string, destSubPath: string, file: File): Promise<FileInfo> {
  const destDir = destSubPath ? getServerFilePath(serverPath, destSubPath) : serverPath;
  await mkdir(destDir, { recursive: true });

  const fullPath = join(destDir, file.name);
  const buffer = await file.arrayBuffer();
  await writeFile(fullPath, Buffer.from(buffer));

  const stats = await stat(fullPath);
  return {
    name: file.name,
    path: relative(serverPath, fullPath),
    isDirectory: false,
    size: stats.size,
    modifiedAt: stats.mtime.toISOString(),
  };
}

/**
 * Delete a file or directory
 */
export async function deleteServerFile(serverPath: string, filePath: string): Promise<void> {
  const fullPath = getServerFilePath(serverPath, filePath);
  const stats = await stat(fullPath);

  if (stats.isDirectory()) {
    await rm(fullPath, { recursive: true, force: true });
  } else {
    await unlink(fullPath);
  }
}

/**
 * Create a new directory
 */
export async function createDirectory(serverPath: string, dirPath: string): Promise<void> {
  const fullPath = getServerFilePath(serverPath, dirPath);
  await mkdir(fullPath, { recursive: true });
}

/**
 * Get file for download (returns file path and name)
 */
export function getFileDownloadPath(serverPath: string, filePath: string): { fullPath: string; fileName: string } {
  const fullPath = getServerFilePath(serverPath, filePath);
  return {
    fullPath,
    fileName: basename(fullPath),
  };
}

/**
 * Export server as ZIP archive
 */
export async function exportServerAsZip(serverPath: string): Promise<string> {
  const archiver = (await import('archiver')).default;
  const zipPath = join(serverPath, '..', `${basename(serverPath)}_backup.zip`);

  return new Promise((resolve, reject) => {
    const output = createWriteStream(zipPath);
    const archive = archiver('zip', { zlib: { level: 6 } });

    output.on('close', () => resolve(zipPath));
    archive.on('error', (err: Error) => reject(err));

    archive.pipe(output);
    archive.directory(serverPath, basename(serverPath));
    archive.finalize();
  });
}

/**
 * Rename a file or directory
 */
export async function renameServerFile(serverPath: string, oldPath: string, newName: string): Promise<void> {
  const fullOldPath = getServerFilePath(serverPath, oldPath);
  const dir = join(fullOldPath, '..');
  const fullNewPath = join(dir, newName);

  const { rename } = await import('fs/promises');
  await rename(fullOldPath, fullNewPath);
}
