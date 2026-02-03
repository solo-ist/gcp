import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { rm, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { PlaintextStorage } from './plaintext.js';
import type { StoredTokens } from '../types.js';

describe('PlaintextStorage', () => {
  let testDir: string;
  let storage: PlaintextStorage;

  beforeEach(async () => {
    testDir = join(tmpdir(), `gcp-test-${Date.now()}`);
    await mkdir(testDir, { recursive: true });
    storage = new PlaintextStorage(testDir);
  });

  afterEach(async () => {
    await rm(testDir, { recursive: true, force: true });
  });

  it('should store and retrieve tokens', async () => {
    const tokens: StoredTokens = {
      accessToken: 'access-123',
      refreshToken: 'refresh-456',
      expiryDate: Date.now() + 3600000,
    };

    await storage.store('test-account', tokens);
    const retrieved = await storage.retrieve('test-account');

    expect(retrieved).toEqual(tokens);
  });

  it('should return null for non-existent account', async () => {
    const retrieved = await storage.retrieve('non-existent');
    expect(retrieved).toBeNull();
  });

  it('should remove tokens', async () => {
    const tokens: StoredTokens = {
      accessToken: 'access-123',
      refreshToken: 'refresh-456',
      expiryDate: Date.now() + 3600000,
    };

    await storage.store('test-account', tokens);
    await storage.remove('test-account');
    const retrieved = await storage.retrieve('test-account');

    expect(retrieved).toBeNull();
  });

  it('should not throw when removing non-existent account', async () => {
    await expect(storage.remove('non-existent')).resolves.toBeUndefined();
  });
});
