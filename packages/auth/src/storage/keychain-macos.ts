import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import type { TokenStorage, StoredTokens } from '../types.js';
import { KEYCHAIN_SERVICE } from '../constants.js';
import { validateAccountId } from '../validation.js';

const execFileAsync = promisify(execFile);

export class MacOSKeychainStorage implements TokenStorage {
  async store(accountId: string, tokens: StoredTokens): Promise<void> {
    validateAccountId(accountId);
    const password = JSON.stringify(tokens);
    // Delete existing entry first (ignore errors if it doesn't exist)
    try {
      await execFileAsync('security', [
        'delete-generic-password',
        '-s', KEYCHAIN_SERVICE,
        '-a', accountId,
      ]);
    } catch {
      // Ignore - entry might not exist
    }
    await execFileAsync('security', [
      'add-generic-password',
      '-s', KEYCHAIN_SERVICE,
      '-a', accountId,
      '-w', password,
    ]);
  }

  async retrieve(accountId: string): Promise<StoredTokens | null> {
    validateAccountId(accountId);
    try {
      const { stdout } = await execFileAsync('security', [
        'find-generic-password',
        '-s', KEYCHAIN_SERVICE,
        '-a', accountId,
        '-w',
      ]);
      return JSON.parse(stdout.trim()) as StoredTokens;
    } catch {
      return null;
    }
  }

  async remove(accountId: string): Promise<void> {
    validateAccountId(accountId);
    try {
      await execFileAsync('security', [
        'delete-generic-password',
        '-s', KEYCHAIN_SERVICE,
        '-a', accountId,
      ]);
    } catch {
      // Ignore if entry doesn't exist
    }
  }
}
