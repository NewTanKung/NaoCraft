// ===== NaoCraft Backend — Files Route =====

import { Elysia } from 'elysia';
import { readFile, stat } from 'fs/promises';
import { join, basename } from 'path';
import { getServer } from '../services/server-manager';
import {
  listServerFiles,
  readServerFile,
  writeServerFile,
  uploadFile,
  deleteServerFile,
  createDirectory,
  getFileDownloadPath,
  exportServerAsZip,
  renameServerFile,
} from '../services/file-service';

export const filesRoute = new Elysia({ prefix: '/api/servers' })
  // GET /api/servers/:id/files?path= — List files
  .get('/:id/files', async ({ params, query }) => {
    const server = getServer(params.id);
    if (!server) return { error: 'ไม่พบเซิร์ฟเวอร์' };

    try {
      const subPath = (query as any).path || '';
      const files = await listServerFiles(server.path, subPath);
      return { files, currentPath: subPath };
    } catch (err: any) {
      return { error: err.message };
    }
  })

  // GET /api/servers/:id/files/read?path= — Read file content
  .get('/:id/files/read', async ({ params, query }) => {
    const server = getServer(params.id);
    if (!server) return { error: 'ไม่พบเซิร์ฟเวอร์' };

    try {
      const filePath = (query as any).path || '';
      const content = await readServerFile(server.path, filePath);
      return { content, path: filePath };
    } catch (err: any) {
      return { error: err.message };
    }
  })

  // PUT /api/servers/:id/files/write — Write file content
  .put('/:id/files/write', async ({ params, body }) => {
    const server = getServer(params.id);
    if (!server) return { error: 'ไม่พบเซิร์ฟเวอร์' };

    try {
      const { path: filePath, content } = body as { path: string; content: string };
      await writeServerFile(server.path, filePath, content);
      return { success: true };
    } catch (err: any) {
      return { error: err.message };
    }
  })

  // POST /api/servers/:id/files/upload — Upload file
  .post('/:id/files/upload', async ({ params, body, query }) => {
    const server = getServer(params.id);
    if (!server) return { error: 'ไม่พบเซิร์ฟเวอร์' };

    try {
      const destPath = (query as any).path || '';
      const formData = body as any;
      const file = formData.file;

      if (!file) return { error: 'ไม่พบไฟล์' };

      const fileInfo = await uploadFile(server.path, destPath, file);
      return { success: true, file: fileInfo };
    } catch (err: any) {
      return { error: err.message };
    }
  })

  // DELETE /api/servers/:id/files?path= — Delete file/directory
  .delete('/:id/files', async ({ params, query }) => {
    const server = getServer(params.id);
    if (!server) return { error: 'ไม่พบเซิร์ฟเวอร์' };

    try {
      const filePath = (query as any).path || '';
      if (!filePath) return { error: 'กรุณาระบุ path' };
      await deleteServerFile(server.path, filePath);
      return { success: true };
    } catch (err: any) {
      return { error: err.message };
    }
  })

  // POST /api/servers/:id/files/mkdir — Create directory
  .post('/:id/files/mkdir', async ({ params, body }) => {
    const server = getServer(params.id);
    if (!server) return { error: 'ไม่พบเซิร์ฟเวอร์' };

    try {
      const { path: dirPath } = body as { path: string };
      await createDirectory(server.path, dirPath);
      return { success: true };
    } catch (err: any) {
      return { error: err.message };
    }
  })

  // POST /api/servers/:id/files/rename — Rename file/directory
  .post('/:id/files/rename', async ({ params, body }) => {
    const server = getServer(params.id);
    if (!server) return { error: 'ไม่พบเซิร์ฟเวอร์' };

    try {
      const { path: oldPath, newName } = body as { path: string; newName: string };
      await renameServerFile(server.path, oldPath, newName);
      return { success: true };
    } catch (err: any) {
      return { error: err.message };
    }
  })

  // GET /api/servers/:id/files/download?path= — Download file
  .get('/:id/files/download', async ({ params, query }) => {
    const server = getServer(params.id);
    if (!server) return { error: 'ไม่พบเซิร์ฟเวอร์' };

    try {
      const filePath = (query as any).path || '';
      const { fullPath, fileName } = getFileDownloadPath(server.path, filePath);
      const fileContent = await readFile(fullPath);
      const fileStat = await stat(fullPath);

      return new Response(fileContent, {
        headers: {
          'Content-Type': 'application/octet-stream',
          'Content-Disposition': `attachment; filename="${fileName}"`,
          'Content-Length': String(fileStat.size),
        },
      });
    } catch (err: any) {
      return { error: err.message };
    }
  })

  // GET /api/servers/:id/export — Export server as ZIP
  .get('/:id/export', async ({ params }) => {
    const server = getServer(params.id);
    if (!server) return { error: 'ไม่พบเซิร์ฟเวอร์' };

    try {
      const zipPath = await exportServerAsZip(server.path);
      const zipContent = await readFile(zipPath);
      const zipStat = await stat(zipPath);
      const zipName = basename(zipPath);

      // Clean up the zip file after sending
      import('fs/promises').then(fs => fs.unlink(zipPath).catch(() => {}));

      return new Response(zipContent, {
        headers: {
          'Content-Type': 'application/zip',
          'Content-Disposition': `attachment; filename="${zipName}"`,
          'Content-Length': String(zipStat.size),
        },
      });
    } catch (err: any) {
      return { error: err.message };
    }
  });
