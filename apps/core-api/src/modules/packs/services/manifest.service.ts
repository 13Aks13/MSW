import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import { isUuid, type PackDependency, type PackType, parseVersion } from "@mc/shared";
import { BadRequestException, Injectable } from "@nestjs/common";

const MAX_MANIFEST_BYTES = 1024 * 1024;

export interface ParsedManifest {
  name: string;
  uuid: string;
  version: string;
  versionArray: number[];
  type: PackType | null;
  dependencies: PackDependency[];
  raw: Record<string, unknown>;
  packRoot: string;
}

@Injectable()
export class ManifestService {
  /** Find every manifest.json below `root`, skipping node_modules and hidden tool folders. */
  async findManifests(root: string, depth = 0): Promise<string[]> {
    if (depth > 8) {
      return [];
    }
    const entries = await readdir(root, { withFileTypes: true });
    const manifests: string[] = [];

    for (const entry of entries) {
      if (entry.isSymbolicLink()) {
        continue;
      }
      const fullPath = path.join(root, entry.name);
      if (entry.isDirectory()) {
        if (entry.name === "node_modules" || entry.name === "__MACOSX") {
          continue;
        }
        manifests.push(...(await this.findManifests(fullPath, depth + 1)));
      } else if (entry.isFile() && entry.name === "manifest.json") {
        manifests.push(fullPath);
      }
    }

    return manifests;
  }

  async parse(manifestPath: string, _requestedType: PackType): Promise<ParsedManifest> {
    const info = await stat(manifestPath);
    if (info.size > MAX_MANIFEST_BYTES) {
      throw new BadRequestException(`manifest.json is larger than 1 MB: ${manifestPath}`);
    }

    let raw: unknown;
    try {
      raw = JSON.parse(await readFile(manifestPath, "utf8"));
    } catch (error) {
      throw new BadRequestException(`Invalid JSON in ${manifestPath}: ${(error as Error).message}`);
    }

    if (!raw || typeof raw !== "object") {
      throw new BadRequestException(`manifest.json must contain an object: ${manifestPath}`);
    }

    const manifest = raw as {
      header?: { name?: unknown; uuid?: unknown; version?: unknown; description?: unknown };
      modules?: Array<{ type?: unknown }>;
      dependencies?: Array<{ uuid?: unknown; version?: unknown }>;
    };

    const header = manifest.header;
    if (!header || typeof header.name !== "string" || header.name.trim().length === 0) {
      throw new BadRequestException("manifest.json is missing header.name");
    }
    if (typeof header.uuid !== "string" || !isUuid(header.uuid)) {
      throw new BadRequestException("manifest.json header.uuid is not a valid UUID");
    }

    let version: { raw: string; array: number[] };
    try {
      version = parseVersion(header.version);
    } catch (error) {
      throw new BadRequestException((error as Error).message);
    }

    const moduleTypes = (manifest.modules ?? [])
      .map((module) => (typeof module.type === "string" ? module.type.toLowerCase() : ""))
      .filter(Boolean);

    let detectedType: PackType | null = null;
    if (moduleTypes.some((type) => type.startsWith("resources"))) {
      detectedType = "resource";
    }
    if (moduleTypes.includes("data") || moduleTypes.some((type) => type.startsWith("data"))) {
      detectedType = "behavior";
    }

    const dependencies: PackDependency[] = [];
    for (const dependency of manifest.dependencies ?? []) {
      if (typeof dependency.uuid !== "string" || !isUuid(dependency.uuid)) {
        continue;
      }
      let depVersion: number[] | undefined;
      try {
        depVersion = parseVersion(dependency.version).array;
      } catch {
        depVersion = undefined;
      }
      dependencies.push({ uuid: dependency.uuid.toLowerCase(), version: depVersion });
    }

    return {
      name: header.name.trim().slice(0, 255),
      uuid: header.uuid.toLowerCase(),
      version: version.raw,
      versionArray: version.array,
      type: detectedType,
      dependencies,
      raw: manifest as Record<string, unknown>,
      packRoot: path.dirname(manifestPath),
    };
  }
}
