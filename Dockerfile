FROM node:22-slim

WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy package files
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* ./
COPY packages/auth/package.json ./packages/auth/
COPY packages/calendar-mcp/package.json ./packages/calendar-mcp/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source files
COPY tsconfig.base.json ./
COPY packages/auth/ ./packages/auth/
COPY packages/calendar-mcp/ ./packages/calendar-mcp/

# Build packages
RUN pnpm build

# Use plaintext storage in container (no keychain available)
ENV GCP_PLAINTEXT_STORAGE=true

# Run the MCP server
ENTRYPOINT ["node", "packages/calendar-mcp/dist/index.js"]
