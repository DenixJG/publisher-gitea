export interface GiteaRepository {
  /**
   * The name of your repository
   */
  name: string;
  /**
   * The owner of your repository (username or organization)
   */
  owner: string;
}

export interface PublisherGiteaConfig {
  /**
   * Details that identify your repository (name and owner)
   */
  repository: GiteaRepository;
  /**
   * API token with permission to upload releases to this repository
   */
  authToken?: string;
  /**
   * The base URL of your Gitea instance (e.g., https://gitea.yourdomain.com)
   */
  baseUrl: string;
  /**
   * Whether or not this release should be tagged as a prerelease
   */
  prerelease?: boolean;
  /**
   * Whether or not this release should be tagged as a draft
   */
  draft?: boolean;
  /**
   * Prepended to the package version to determine the release name (default "v")
   */
  tagPrefix?: string;
  /**
   * Re-upload the new asset if you upload an asset with the same filename
   */
  force?: boolean;
}

export interface GiteaRelease {
  id: number;
  name: string;
  url: string;
  tag_name: string;
  draft: boolean;
  prerelease: boolean;
  assets: GiteaAsset[];
  published_at: string;
}

export interface GiteaAsset {
  id: number;
  uuid: string;
  name: string;
  browser_download_url: string;
  download_count: number;
  size: number;
  created_at: string;
}
