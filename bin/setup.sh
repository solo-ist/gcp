#!/bin/bash
set -e

echo "=== Google Calendar MCP Server Setup ==="
echo ""

# Check for required environment variables
if [ -z "$GOOGLE_CLIENT_ID" ] || [ -z "$GOOGLE_CLIENT_SECRET" ]; then
    echo "Before running this script, you need to set up OAuth credentials:"
    echo ""
    echo "1. Go to https://console.cloud.google.com/apis/credentials"
    echo "2. Create a new project (or select an existing one)"
    echo "3. Enable the Google Calendar API:"
    echo "   https://console.cloud.google.com/apis/library/calendar-json.googleapis.com"
    echo "4. Create OAuth 2.0 credentials:"
    echo "   - Application type: Desktop app"
    echo "   - Name: Calendar MCP (or any name)"
    echo "5. Copy the Client ID and Client Secret"
    echo ""
    echo "Then run:"
    echo "  export GOOGLE_CLIENT_ID='your-client-id'"
    echo "  export GOOGLE_CLIENT_SECRET='your-client-secret'"
    echo "  ./bin/setup.sh"
    echo ""
    exit 1
fi

# Install dependencies
echo "Installing dependencies..."
pnpm install

# Build packages
echo "Building packages..."
pnpm build

echo ""
echo "=== Setup Complete ==="
echo ""
echo "To add a Google account, start the MCP server and use the auth_add_account tool."
echo ""
echo "For Claude Desktop, add this to your config:"
echo ""
cat << EOF
{
  "mcpServers": {
    "calendar": {
      "command": "node",
      "args": ["$(pwd)/packages/calendar-mcp/dist/index.js"],
      "env": {
        "GOOGLE_CLIENT_ID": "$GOOGLE_CLIENT_ID",
        "GOOGLE_CLIENT_SECRET": "$GOOGLE_CLIENT_SECRET"
      }
    }
  }
}
EOF
echo ""
