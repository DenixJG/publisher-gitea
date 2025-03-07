import fs from "fs-extra";
import fetch from "node-fetch";
import mime from "mime-types";
import FormData from "form-data";
import { GiteaAsset, GiteaRelease } from "../Config";

export class Gitea {
  private authToken: string;
  private baseUrl: string;

  constructor(authToken?: string, baseUrl?: string) {
    this.authToken = authToken || process.env.GITEA_TOKEN || "";
    this.baseUrl = baseUrl || "";

    if (!this.authToken) {
      throw new Error(
        "No Gitea authentication token provided. Set one in the publisher config or via the GITEA_TOKEN environment variable."
      );
    }

    if (!this.baseUrl) {
      throw new Error(
        "No Gitea base URL provided. Set one in the publisher config."
      );
    }

    // Remove trailing slash if present
    this.baseUrl = this.baseUrl.replace(/\/$/, "");
  }

  async listReleases(owner: string, repo: string): Promise<GiteaRelease[]> {
    const url = `${this.baseUrl}/api/v1/repos/${owner}/${repo}/releases`;
    const response = await fetch(url, {
      headers: {
        Accept: "application/json",
        Authorization: `token ${this.authToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to list releases: ${response.statusText}`);
    }

    const releases = (await response.json()) as GiteaRelease[];

    return releases;
  }

  async createRelease(
    owner: string,
    repo: string,
    options: {
      tag_name: string;
      name: string;
      draft?: boolean;
      prerelease?: boolean;
    }
  ): Promise<GiteaRelease> {
    const url = `${this.baseUrl}/api/v1/repos/${owner}/${repo}/releases`;
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `token ${this.authToken}`,
      },
      body: JSON.stringify(options),
    });

    if (!response.ok) {
      throw new Error(`Failed to create release: ${response.statusText}`);
    }

    const release = (await response.json()) as GiteaRelease;

    return release;
  }

  async deleteReleaseAsset(
    owner: string,
    repo: string,
    assetId: number
  ): Promise<void> {
    const url = `${this.baseUrl}/api/v1/repos/${owner}/${repo}/releases/assets/${assetId}`;
    const response = await fetch(url, {
      method: "DELETE",
      headers: {
        Authorization: `token ${this.authToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to delete release asset: ${response.statusText}`);
    }
  }

  async uploadReleaseAsset(
    owner: string,
    repo: string,
    releaseId: number,
    filePath: string,
    fileName: string
  ): Promise<GiteaAsset> {
    const url = `${this.baseUrl}/api/v1/repos/${owner}/${repo}/releases/${releaseId}/assets`;

    const fileContent = await fs.readFile(filePath);
    const form = new FormData();

    form.append("attachment", fileContent, {
      filename: fileName,
      contentType: mime.lookup(filePath) || "application/octet-stream",
    });

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `token ${this.authToken}`,
      },
      body: form,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to upload asset: ${errorText}`);
    }

    const asset = (await response.json()) as GiteaAsset;

    return asset;
  }

  static sanitizeName(name: string): string {
    // Gitea allows most characters in asset names, but this sanitization
    // follows GitHub's approach for consistency
    return name.replace(/[^\w.-]/g, "-");
  }
}
