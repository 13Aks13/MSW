#!/usr/bin/env node
import { readFile, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = dirname(dirname(fileURLToPath(import.meta.url)));
const packageFiles = [
  "package.json",
  "apps/core-api/package.json",
  "apps/web-app/package.json",
  "apps/worker/package.json",
  "packages/shared/package.json",
];

function assertVersion(version) {
  if (!version) {
    throw new Error("A semantic version is required");
  }

  if (!/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/.test(version)) {
    throw new Error(`Invalid semantic version: ${version}`);
  }
}

export async function syncPackageVersions(version, options = {}) {
  const { root = rootDir, logger = console } = options;
  assertVersion(version);

  for (const relativePath of packageFiles) {
    const filePath = join(root, relativePath);
    const source = await readFile(filePath, "utf8");
    const currentVersion = JSON.parse(source).version;
    const updated = source.replace(/("version"\s*:\s*")[^"]*(")/, (_match, before, after) => {
      return `${before}${version}${after}`;
    });

    if (updated === source) {
      continue;
    }

    const parsed = JSON.parse(updated);
    if (parsed.version !== version) {
      throw new Error(`Failed to update the top-level version in ${relativePath}`);
    }

    await writeFile(filePath, updated);
    logger.log(`  ${relativePath}: ${currentVersion} -> ${version}`);
  }

  logger.log(`Synced package versions to ${version}`);
}

export async function checkPackageVersions(options = {}) {
  const { root = rootDir, logger = console } = options;
  const rootVersion = JSON.parse(await readFile(join(root, "package.json"), "utf8")).version;
  assertVersion(rootVersion);

  const mismatches = [];

  for (const relativePath of packageFiles) {
    const source = await readFile(join(root, relativePath), "utf8");
    const currentVersion = JSON.parse(source).version;
    if (currentVersion !== rootVersion) {
      mismatches.push(`${relativePath}: ${currentVersion} (expected ${rootVersion})`);
    }
  }

  if (mismatches.length > 0) {
    for (const mismatch of mismatches) {
      logger.error(`  ${mismatch}`);
    }
    throw new Error(`Package versions do not match ${rootVersion}`);
  }

  logger.log(`All package versions match ${rootVersion}`);
}

const isMain =
  process.argv[1] !== undefined && resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isMain) {
  const argument = process.argv[2];

  try {
    if (argument === "--check") {
      await checkPackageVersions();
    } else {
      const rootVersion = JSON.parse(await readFile(join(rootDir, "package.json"), "utf8")).version;
      await syncPackageVersions(argument ?? rootVersion);
    }
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  }
}
