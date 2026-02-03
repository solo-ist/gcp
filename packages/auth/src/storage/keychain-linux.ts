import { spawn } from 'node:child_process';
import type { TokenStorage, StoredTokens } from '../types.js';
import { KEYCHAIN_SERVICE } from '../constants.js';

function execWithInput(command: string, args: string[], input?: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const proc = spawn(command, args);
    let stdout = '';
    let stderr = '';

    proc.stdout.on('data', (data) => { stdout += data; });
    proc.stderr.on('data', (data) => { stderr += data; });

    proc.on('close', (code) => {
      if (code === 0) {
        resolve(stdout);
      } else {
        reject(new Error(stderr || `Process exited with code ${code}`));
      }
    });

    proc.on('error', reject);

    if (input) {
      proc.stdin.write(input);
      proc.stdin.end();
    }
  });
}

export class LinuxKeychainStorage implements TokenStorage {
  async store(accountId: string, tokens: StoredTokens): Promise<void> {
    const password = JSON.stringify(tokens);
    await execWithInput('secret-tool', [
      'store',
      '--label', `${KEYCHAIN_SERVICE}: ${accountId}`,
      'service', KEYCHAIN_SERVICE,
      'account', accountId,
    ], password);
  }

  async retrieve(accountId: string): Promise<StoredTokens | null> {
    try {
      const stdout = await execWithInput('secret-tool', [
        'lookup',
        'service', KEYCHAIN_SERVICE,
        'account', accountId,
      ]);
      return JSON.parse(stdout.trim()) as StoredTokens;
    } catch {
      return null;
    }
  }

  async remove(accountId: string): Promise<void> {
    try {
      await execWithInput('secret-tool', [
        'clear',
        'service', KEYCHAIN_SERVICE,
        'account', accountId,
      ]);
    } catch {
      // Ignore if entry doesn't exist
    }
  }
}
