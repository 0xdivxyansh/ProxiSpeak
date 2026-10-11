import { Router, Request, Response } from 'express';
import express from 'express';
import fs from 'fs';
import path from 'path';
import { logger } from '../../common/utils/logger';

export const storageRoutes = Router();

const UPLOADS_DIR = path.resolve(process.cwd(), 'uploads');

function getSafeFilePath(relativePath: string): string {
  // Sanitize path to prevent directory traversal
  const normalized = path.normalize(relativePath).replace(/^(\.\.(\/|\\|$))+/, '');
  return path.join(UPLOADS_DIR, normalized);
}

// In-memory fallback if disk write fails
export const inMemoryFiles = new Map<string, { data: Buffer; contentType: string; updatedAt: string }>();

/**
 * PUT /api/v1/storage/upload?path=<storagePath>
 * Handles binary media uploads directly from browser clients in local development
 */
storageRoutes.put(
  '/upload',
  express.raw({ type: () => true, limit: '25mb' }),
  async (req: Request, res: Response): Promise<void> => {
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    res.setHeader('Access-Control-Allow-Origin', '*');
    try {
      const storagePath = req.query.path as string;
      if (!storagePath) {
        res.status(400).json({ success: false, error: 'Missing ?path query parameter' });
        return;
      }

      const contentType = req.header('content-type') || 'audio/mpeg';
      const buffer = req.body as Buffer;

      if (!buffer || buffer.length === 0) {
        res.status(400).json({ success: false, error: 'Upload payload is empty' });
        return;
      }

      // Save to disk
      try {
        const fullPath = getSafeFilePath(storagePath);
        const dir = path.dirname(fullPath);
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
        fs.writeFileSync(fullPath, buffer);
      } catch (fsErr) {
        logger.warn('Could not write uploaded file to disk; using in-memory store', { fsErr });
      }

      // Always save to inMemoryFiles map as well
      inMemoryFiles.set(storagePath, {
        data: buffer,
        contentType,
        updatedAt: new Date().toISOString(),
      });

      logger.info(`Local storage binary upload succeeded for: ${storagePath} (${buffer.length} bytes)`);
      res.status(200).json({ success: true, sizeBytes: buffer.length });
    } catch (err: unknown) {
      logger.error('Error handling local storage binary upload', err);
      res.status(500).json({ success: false, error: 'Failed to save uploaded audio' });
    }
  },
);

/**
 * GET /api/v1/storage/media?path=<storagePath>
 * Serves media files directly to the browser with Range header streaming support
 */
storageRoutes.get('/media', (req: Request, res: Response): void => {
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  res.setHeader('Access-Control-Allow-Origin', '*');

  const storagePath = req.query.path as string;
  if (!storagePath) {
    res.status(400).json({ success: false, error: 'Missing ?path query parameter' });
    return;
  }

  const fullPath = getSafeFilePath(storagePath);

  // If file exists on disk, stream via res.sendFile
  if (fs.existsSync(fullPath)) {
    res.sendFile(fullPath, {
      headers: {
        'Cross-Origin-Resource-Policy': 'cross-origin',
        'Access-Control-Allow-Origin': '*',
      },
    });
    return;
  }

  // Fallback to in-memory store
  const mem = inMemoryFiles.get(storagePath);
  if (mem) {
    res.setHeader('Content-Type', mem.contentType);
    res.setHeader('Content-Length', mem.data.length);
    res.setHeader('Accept-Ranges', 'bytes');
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.send(mem.data);
    return;
  }

  res.status(404).json({ success: false, error: 'Media file not found' });
});
