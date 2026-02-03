import { readFile, writeFile, unlink, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import type { TokenStorage, StoredTokens } from '../types.js';

export class PlaintextStorage implements TokenStorage {
  private readonly tokensDir: string;

  constructor(configDir: string) {
    this.tokensDir = join(configDir, 'tokens');
  }

  private tokenPath(accountId: string): string {
    return join(this.tokensDir, `${accountId}.json`);
  }

  async store(accountId: string, tokens: StoredTokens): Promise<void> {
    await mkdir(this.tokensDir, { recursive: true });
    await writeFile(this.tokenPath(accountId), JSON.stringify(tokens), 'utf-8');
  }

  async retrieve(accountId: string): Promise<StoredTokens | null> {
    try {
      const data = await readFile(this.tokenPath(accountId), 'utf-8');
      return JSON.parse(data) as StoredTokens;
    } catch {
      return null;
    }
  }

  async remove(accountId: string): Promise<void> {
    try {
      await unlink(this.tokenPath(accountId));
    } catch {
      // Ignore if file doesn't exist
    }
  }
}
