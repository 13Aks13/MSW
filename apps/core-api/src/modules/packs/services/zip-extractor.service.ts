import { createWriteStream } from "node:fs";
import { mkdir, rm } from "node:fs/promises";
import path from "node:path";
import { pipeline } from "node:stream/promises";
import { BadRequestException, Injectable, Logger } from "@nestjs/common";
import yauzl from "yauzl";

export interface ExtractionLimits {
  maxEntries: number;
  maxUncompressedBytes: number;
  maxDepth: number;
}

export const DEFAULT_ZIP_LIMITS: ExtractionLimits = {
  maxEntries: 200_000,
  maxUncompressedBytes: 4 * 1024 * 1024 * 1024,
  maxDepth: 16,
};

export interface ExtractionResult {
  files: number;
  bytes: number;
}

@Injectable()
export class ZipExtractorService {
  private readonly logger = new Logger(ZipExtractorService.name);

  async extract(
    zipPath: string,
    destination: string,
    limits: ExtractionLimits = DEFAULT_ZIP_LIMITS,
  ): Promise<ExtractionResult> {
    const root = path.resolve(destination);
    await mkdir(root, { recursive: true });

    return new Promise<ExtractionResult>((resolve, reject) => {
      yauzl.open(zipPath, { lazyEntries: true, autoClose: true }, (openError, zipFile) => {
        if (openError || !zipFile) {
          reject(
            new BadRequestException(
              `Cannot open ZIP archive: ${openError?.message ?? "unknown error"}`,
            ),
          );
          return;
        }

        let entries = 0;
        let bytes = 0;
        let settled = false;

        const fail = (error: Error): void => {
          if (settled) {
            return;
          }
          settled = true;
          zipFile.close();
          reject(
            error instanceof BadRequestException
              ? error
              : new BadRequestException(`ZIP extraction failed: ${error.message}`),
          );
        };

        zipFile.on("error", fail);

        zipFile.on("entry", (entry: yauzl.Entry) => {
          void this.processEntry(zipFile, entry, root, limits)
            .then((written) => {
              if (settled) {
                return;
              }
              entries += 1;
              bytes += written;
              if (entries > limits.maxEntries) {
                throw new BadRequestException(
                  `Archive contains more than ${limits.maxEntries} entries`,
                );
              }
              if (bytes > limits.maxUncompressedBytes) {
                throw new BadRequestException(
                  `Archive expands beyond ${Math.round(limits.maxUncompressedBytes / 1024 / 1024)} MB`,
                );
              }
              zipFile.readEntry();
            })
            .catch(fail);
        });

        zipFile.on("end", () => {
          if (settled) {
            return;
          }
          settled = true;
          resolve({ files: entries, bytes });
        });

        zipFile.readEntry();
      });
    });
  }

  private async processEntry(
    zipFile: yauzl.ZipFile,
    entry: yauzl.Entry,
    root: string,
    limits: ExtractionLimits,
  ): Promise<number> {
    const entryName = entry.fileName.replace(/\\/g, "/");

    if (entryName.includes("\0")) {
      throw new BadRequestException("Archive contains a file name with a NUL byte");
    }
    if (entryName.startsWith("/") || /^[a-zA-Z]:/.test(entryName)) {
      throw new BadRequestException(`Archive contains an absolute path: ${entryName}`);
    }
    if (entryName.split("/").some((segment) => segment === "..")) {
      throw new BadRequestException(`Archive contains a path traversal entry: ${entryName}`);
    }
    if (entryName.split("/").filter(Boolean).length > limits.maxDepth) {
      throw new BadRequestException(`Archive path is nested too deeply: ${entryName}`);
    }

    const isDirectory = entryName.endsWith("/");
    const target = path.resolve(root, entryName);
    if (target !== root && !target.startsWith(`${root}${path.sep}`)) {
      throw new BadRequestException(`Archive entry escapes the extraction directory: ${entryName}`);
    }

    if (isDirectory) {
      await mkdir(target, { recursive: true });
      return 0;
    }

    const mode = (entry.externalFileAttributes >>> 16) & 0o170000;
    if (mode === 0o120000) {
      throw new BadRequestException(`Archive contains a symbolic link: ${entryName}`);
    }

    await mkdir(path.dirname(target), { recursive: true });
    const readStream = await this.openReadStream(zipFile, entry);
    await pipeline(readStream, createWriteStream(target, { flags: "wx", mode: 0o640 }));
    return entry.uncompressedSize;
  }

  private openReadStream(
    zipFile: yauzl.ZipFile,
    entry: yauzl.Entry,
  ): Promise<NodeJS.ReadableStream> {
    return new Promise((resolve, reject) => {
      zipFile.openReadStream(entry, (error, stream) => {
        if (error || !stream) {
          reject(error ?? new Error("empty stream"));
        } else {
          resolve(stream);
        }
      });
    });
  }

  async cleanup(directory: string): Promise<void> {
    try {
      await rm(directory, { recursive: true, force: true });
    } catch (error) {
      this.logger.warn(
        `Failed to clean temporary directory ${directory}: ${(error as Error).message}`,
      );
    }
  }
}
