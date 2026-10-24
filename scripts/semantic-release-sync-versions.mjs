import { syncPackageVersions } from "./sync-package-versions.mjs";

export async function prepare(_pluginConfig, { nextRelease, logger }) {
  if (!nextRelease?.version) {
    throw new Error("semantic-release did not provide nextRelease.version");
  }

  await syncPackageVersions(nextRelease.version, { logger });
}
