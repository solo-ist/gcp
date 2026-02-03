import { homedir } from 'node:os';
import { join } from 'node:path';

export const DEFAULT_CONFIG_DIR = join(homedir(), '.gcp');
export const ACCOUNTS_FILE = 'accounts.json';
export const CREDENTIALS_FILE = 'credentials.json';
export const REDIRECT_URI = 'http://127.0.0.1:3000';
export const KEYCHAIN_SERVICE = 'solo-ist-gcp';

// Refresh token 5 minutes before expiry
export const TOKEN_REFRESH_BUFFER_MS = 5 * 60 * 1000;
