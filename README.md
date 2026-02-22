# Google Calendar MCP Server

A Model Context Protocol (MCP) server for Google Calendar integration, with OAuth2/PKCE authentication and secure keychain storage.

## Packages

- **@solo-ist/auth** — OAuth2 with PKCE, OS keychain storage, multi-account support
- **@solo-ist/calendar-mcp** — MCP server with Google Calendar tools

## Quick Start

### 1. Set up Google Cloud credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Create a new project or select an existing one
3. Enable the [Google Calendar API](https://console.cloud.google.com/apis/library/calendar-json.googleapis.com)
4. Create OAuth 2.0 credentials (Desktop application type)
5. Add `http://127.0.0.1:3000` as an authorized redirect URI
6. Copy the Client ID and Client Secret

### 2. Configure Claude Desktop

#### Docker (recommended)

Pull the pre-built image and add to your Claude Desktop config (`~/Library/Application Support/Claude/claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "calendar": {
      "command": "docker",
      "args": [
        "run", "-i", "--rm",
        "-p", "3000:3000",
        "-v", "calendar-mcp-data:/home/app/.gcp",
        "-e", "GOOGLE_CLIENT_ID",
        "-e", "GOOGLE_CLIENT_SECRET",
        "ghcr.io/solo-ist/calendar-mcp"
      ],
      "env": {
        "GOOGLE_CLIENT_ID": "your-client-id",
        "GOOGLE_CLIENT_SECRET": "your-client-secret"
      }
    }
  }
}
```

- `-i` enables stdio for MCP communication
- `-p 3000:3000` exposes the OAuth callback port (needed during authentication)
- `-v calendar-mcp-data:/home/app/.gcp` persists tokens across container restarts
- Environment variables are passed through from Claude Desktop

#### From source

```bash
export GOOGLE_CLIENT_ID='your-client-id'
export GOOGLE_CLIENT_SECRET='your-client-secret'
./bin/setup.sh
```

Then add to Claude Desktop config:

```json
{
  "mcpServers": {
    "calendar": {
      "command": "node",
      "args": ["/path/to/gcp/packages/calendar-mcp/dist/index.js"],
      "env": {
        "GOOGLE_CLIENT_ID": "your-client-id",
        "GOOGLE_CLIENT_SECRET": "your-client-secret"
      }
    }
  }
}
```

### 3. Authenticate

Use the `auth_add_account` tool to start the OAuth flow, then complete it with `auth_complete`.

## Available Tools

| Tool | Description |
|------|-------------|
| `list_events` | List calendar events in a date range |
| `get_event` | Get detailed event information by ID |
| `create_event` | Create a new calendar event |
| `delete_event` | Delete an event by ID |
| `find_free_time` | Query free/busy for calendars |

### Auth Tools

| Tool | Description |
|------|-------------|
| `auth_add_account` | Start OAuth flow to add a Google account |
| `auth_complete` | Complete OAuth with authorization code |
| `auth_list_accounts` | List all authenticated accounts |
| `auth_remove_account` | Remove an account |

## Configuration

### Environment Variables

| Variable | Description |
|----------|-------------|
| `GOOGLE_CLIENT_ID` | OAuth client ID (required) |
| `GOOGLE_CLIENT_SECRET` | OAuth client secret (required) |
| `ENABLED_TOOLS` | Comma-separated list of enabled tools (default: read-only) |
| `GCP_PLAINTEXT_STORAGE` | Use plaintext storage instead of keychain (for CI/Docker) |

### Scopes

By default, only read-only tools are enabled. The server requests minimal scopes based on enabled tools:

- Read-only mode: `calendar.events.readonly` + `calendar.freebusy`
- Read-write mode: `calendar.events` + `calendar.freebusy`

## Security

- Refresh tokens stored in OS keychain (macOS `security`, Linux `secret-tool`)
- Access tokens refreshed 5 minutes before expiry
- Plaintext fallback for CI/Docker (enable with `GCP_PLAINTEXT_STORAGE=true`)
- No tokens in logs

## Docker

### Pre-built image

```bash
docker pull ghcr.io/solo-ist/calendar-mcp
```

### Build locally

```bash
docker build -t calendar-mcp .
docker run -i --rm \
  -p 3000:3000 \
  -v calendar-mcp-data:/home/app/.gcp \
  -e GOOGLE_CLIENT_ID='your-client-id' \
  -e GOOGLE_CLIENT_SECRET='your-client-secret' \
  calendar-mcp
```

## Development

```bash
pnpm install
pnpm build
pnpm test
pnpm audit
```
