import path from "node:path";
import chalk from "chalk";
import logSymbols from "log-symbols";
import {
  PublisherBase,
  PublisherOptions,
} from "@electron-forge/publisher-base";
import { ForgeMakeResult } from "@electron-forge/shared-types";
import { GiteaRelease, PublisherGiteaConfig } from "./Config";
import { Gitea } from "./util/gitea";
import { NoReleaseError } from "./util/no-release-error";

export default class PublisherGitea extends PublisherBase<PublisherGiteaConfig> {
  name = "gitea";

  async publish({
    makeResults,
    setStatusLine,
  }: PublisherOptions): Promise<void> {
    const { config } = this;

    // Group artifacts by version
    const preReleaseArtifacts: {
      [version: string]: ForgeMakeResult[];
    } = {};

    for (const makeResult of makeResults) {
      const version = makeResult.packageJSON.version;

      if (!preReleaseArtifacts[version]) {
        preReleaseArtifacts[version] = [];
      }

      preReleaseArtifacts[version].push(makeResult);
    }

    // Validate the configuration
    if (
      !(
        config.repository &&
        typeof config.repository === "object" &&
        config.repository.owner &&
        config.repository.name
      )
    ) {
      throw new Error(
        'In order to publish to Gitea, you must set the "repository.owner" and "repository.name" properties in your Forge config.'
      );
    }

    if (!config.baseUrl) {
      throw new Error(
        'In order to publish to Gitea, you must set the "baseUrl" property in your Forge config.'
      );
    }

    const gitea = new Gitea(config.authToken, config.baseUrl);

    for (const releaseVersion of Object.keys(preReleaseArtifacts)) {
      let release: GiteaRelease | undefined;
      const artifacts = preReleaseArtifacts[releaseVersion];
      const releaseName = `${config.tagPrefix ?? "v"}${releaseVersion}`;

      setStatusLine(`Searching for release ${releaseName}`);

      try {
        const releases = await gitea.listReleases(
          config.repository.owner,
          config.repository.name
        );

        release = releases.find((r) => r.tag_name === releaseName);

        if (!release) {
          throw new NoReleaseError(404);
        }
      } catch (error) {
        if (!(error instanceof NoReleaseError && error.code === 404)) {
          throw error;
        }

        // Create the release
        release = await gitea.createRelease(
          config.repository.owner,
          config.repository.name,
          {
            tag_name: releaseName,
            name: releaseName,
            draft: config.draft !== false,
            prerelease: config.prerelease === true,
          }
        );
      }

      // Upload the artifacts to the release
      let uploaded = 0;
      const updateUploadStatus = () => {
        setStatusLine(
          `Uploading distributable (${uploaded}/${artifacts.length} to ${releaseName})`
        );
      };
      updateUploadStatus();

      await Promise.all(
        artifacts
          .flatMap((artifact) => artifact.artifacts)
          .map(async (artifactPath) => {
            const done = () => {
              uploaded++;
              updateUploadStatus();
            };

            const artifactName = path.basename(artifactPath);
            const sanitizedArtifactName = Gitea.sanitizeName(artifactName);

            // Check if the asset already exists
            const asset = release?.assets.find(
              (a) => a.name === sanitizedArtifactName
            );

            if (asset && config.force === true) {
              // Delete the existing asset
              await gitea.deleteReleaseAsset(
                config.repository.owner,
                config.repository.name,
                asset.id
              );
            } else {
              done();
            }

            try {
              const uploadedAsset = await gitea.uploadReleaseAsset(
                config.repository.owner,
                config.repository.name,
                release.id,
                artifactPath,
                artifactName
              );

              if (uploadedAsset.name !== sanitizedArtifactName) {
                console.warn(
                  logSymbols.warning,
                  chalk.yellow(
                    `Expected asset name to be '${sanitizedArtifactName}' - got '${uploadedAsset.name}'`
                  )
                );
              }
            } catch (error) {
              console.error(`Error uploading asset '${artifactName}':`, error);
              throw error;
            }

            return done();
          })
      );
    }
  }
}
