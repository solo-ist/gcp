#!/usr/bin/env node
import { createServer } from './server.js';

async function main() {
  try {
    const { server, transport } = await createServer();
    await server.connect(transport);

    // Handle shutdown gracefully
    process.on('SIGINT', async () => {
      await server.close();
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      await server.close();
      process.exit(0);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

main();
