import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { BadRequestException } from '@nestjs/common';
import type { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface.js';

export function resolveUploadDir(): string {
  const dir = path.resolve(process.env.STORAGE_ROOT ?? './storage', 'temp', 'uploads');
  mkdirSync(dir, { recursive: true });
  return dir;
}

export function maxUploadBytes(): number {
  const megabytes = Number(process.env.MAX_UPLOAD_MB ?? 500);
  return (Number.isFinite(megabytes) && megabytes > 0 ? megabytes : 500) * 1024 * 1024;
}

const ALLOWED_MIME_TYPES = new Set([
  'application/zip',
  'application/x-zip-compressed',
  'application/x-zip',
  'multipart/x-zip',
  'application/octet-stream',
]);

export function buildUploadOptions(): MulterOptions {
  return {
    dest: resolveUploadDir(),
    limits: {
      fileSize: maxUploadBytes(),
      files: 1,
    },
    fileFilter: (_request, file, callback) => {
      const extension = path.extname(file.originalname).toLowerCase();
      const mimeAllowed = ALLOWED_MIME_TYPES.has(file.mimetype);
      if (extension !== '.zip') {
        callback(new BadRequestException('Only .zip bundles are accepted'), false);
        return;
      }
      if (!mimeAllowed) {
        callback(
          new BadRequestException(`Unsupported upload MIME type: ${file.mimetype}`),
          false,
        );
        return;
      }
      callback(null, true);
    },
  };
}
