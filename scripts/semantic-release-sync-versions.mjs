import { syncPackageVersions } from "./sync-package-versions.mjs";

export async function prepare(_pluginConfig, { nextRelease, logger, options }) {
  if (!nextRelease?.version) {
    throw new Error("semantic-release did not provide nextRelease.version");
  }

  if (options?.dryRun) {
    logger.log(`  dry run: would sync package versions to ${nextRelease.version}`);
    return;
  }

  await syncPackageVersions(nextRelease.version, { logger });
}
