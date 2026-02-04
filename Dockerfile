FROM node:22-slim

WORKDIR /app

# Install pnpm (pin to 8.x for lockfile compatibility)
RUN corepack enable && corepack prepare pnpm@8 --activate

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

# Create non-root user for security
RUN addgroup --system --gid 1001 app && \
    adduser --system --uid 1001 --ingroup app app && \
    mkdir -p /home/app/.gcp && \
    chown -R app:app /home/app/.gcp

# Use plaintext storage in container (no keychain available)
ENV GCP_PLAINTEXT_STORAGE=true
ENV HOME=/home/app

# Switch to non-root user
USER app

# Run the MCP server
ENTRYPOINT ["node", "packages/calendar-mcp/dist/index.js"]
