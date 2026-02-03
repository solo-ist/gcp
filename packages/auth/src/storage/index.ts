import { platform } from 'node:os';
import type { TokenStorage } from '../types.js';
import { PlaintextStorage } from './plaintext.js';
import { MacOSKeychainStorage } from './keychain-macos.js';
import { LinuxKeychainStorage } from './keychain-linux.js';

export { PlaintextStorage } from './plaintext.js';
export { MacOSKeychainStorage } from './keychain-macos.js';
export { LinuxKeychainStorage } from './keychain-linux.js';
export type { TokenStorage };

export function createStorage(configDir: string): TokenStorage {
  if (process.env.GCP_PLAINTEXT_STORAGE === 'true') {
    return new PlaintextStorage(configDir);
  }

  const os = platform();
  switch (os) {
    case 'darwin':
      return new MacOSKeychainStorage();
    case 'linux':
      return new LinuxKeychainStorage();
    default:
      console.warn(`No keychain support for ${os}, using plaintext storage`);
      return new PlaintextStorage(configDir);
  }
}
