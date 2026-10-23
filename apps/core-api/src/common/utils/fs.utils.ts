import { Logger } from '@nestjs/common';
import { readdir, stat } from 'node:fs/promises';
import path from 'node:path';

const logger = new Logger('fs-utils');

export async function dirSize(dir: string): Promise<number> {
  let total = 0;
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return 0;
  }
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      total += await dirSize(fullPath);
    } else if (entry.isFile()) {
      try {
        total += (await stat(fullPath)).size;
      } catch {
        // File disappeared while walking; ignore.
      }
    }
  }
  return total;
}

export async function pathExists(target: string): Promise<boolean> {
  try {
    await stat(target);
    return true;
  } catch {
    return false;
  }
}

export function logAndRethrow(error: unknown, context: string): never {
  logger.error(context, error instanceof Error ? error.stack : String(error));
  throw error;
}
