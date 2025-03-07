# Publisher Gitea

A publisher for Electron Forge that allows you to publish your application's artifacts to Gitea releases.

## Installation

```bash
npm install --save-dev @denixjg/publisher-gitea
```

## Usage

Add the following to your Forge config:

```js
{
  publishers: [
    {
      name: '@denixjg/publisher-gitea',
      config: {
        repository: {
          owner: 'your-username',
          name: 'your-repo-name'
        },
        baseUrl: 'https://gitea.yourdomain.com',
        authToken: 'your-gitea-token',
        draft: true,
        prerelease: false,
        tagPrefix: 'v'
      }
    }
  ]
}
```

## Configuration

| Option | Type | Description | Required |
|--------|------|-------------|-----------|
| `repository.owner` | string | The username or organization that owns the repository | Yes |
| `repository.name` | string | The name of the repository | Yes |
| `baseUrl` | string | The base URL of your Gitea instance | Yes |
| `authToken` | string | API token with permission to upload releases (can also be set via GITEA_TOKEN environment variable) | Yes |
| `draft` | boolean | Whether to create the release as a draft (default: true) | No |
| `prerelease` | boolean | Whether to mark the release as a pre-release (default: false) | No |
| `tagPrefix` | string | String to prepend to the version number for the release tag (default: "v") | No |
| `force` | boolean | Whether to re-upload assets if they already exist (default: false) | No |

## Authentication

You can provide the authentication token in two ways:

1. Via the config object: `authToken: 'your-token'`
2. Via environment variable: `GITEA_TOKEN=your-token`

To create a token in Gitea:
1. Go to Settings > Applications
2. Generate a new token with the `write:repository` scope

## Example

Here's a complete example of how to configure the publisher:

```js
module.exports = {
  publishers: [
    {
      name: '@denixjg/publisher-gitea',
      config: {
        repository: {
          owner: 'acme',
          name: 'electron-app'
        },
        baseUrl: 'https://gitea.acme.com',
        authToken: process.env.GITEA_TOKEN,
        draft: true,
        prerelease: false,
        tagPrefix: 'v',
        force: false
      }
    }
  ]
}
```

## License

MIT
