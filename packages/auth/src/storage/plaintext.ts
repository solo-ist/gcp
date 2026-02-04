import { readFile, writeFile, unlink, mkdir, chmod } from 'node:fs/promises';
import { join } from 'node:path';
import type { TokenStorage, StoredTokens } from '../types.js';
import { validateAccountId } from '../validation.js';

export class PlaintextStorage implements TokenStorage {
  private readonly tokensDir: string;

  constructor(configDir: string) {
    this.tokensDir = join(configDir, 'tokens');
  }

  private tokenPath(accountId: string): string {
    return join(this.tokensDir, `${accountId}.json`);
  }

  async store(accountId: string, tokens: StoredTokens): Promise<void> {
    validateAccountId(accountId);
    await mkdir(this.tokensDir, { recursive: true, mode: 0o700 });
    const tokenPath = this.tokenPath(accountId);
    await writeFile(tokenPath, JSON.stringify(tokens), { encoding: 'utf-8', mode: 0o600 });
    // Ensure permissions are set correctly even if file existed
    await chmod(tokenPath, 0o600);
  }

  async retrieve(accountId: string): Promise<StoredTokens | null> {
    validateAccountId(accountId);
    try {
      const data = await readFile(this.tokenPath(accountId), 'utf-8');
      return JSON.parse(data) as StoredTokens;
    } catch {
      return null;
    }
  }

  async remove(accountId: string): Promise<void> {
    validateAccountId(accountId);
    try {
      await unlink(this.tokenPath(accountId));
    } catch {
      // Ignore if file doesn't exist
    }
  }
}
