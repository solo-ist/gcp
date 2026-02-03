import type { OAuth2Client } from 'googleapis-common';

export interface Account {
  id: string;
  email: string;
  name?: string;
  addedAt: string;
}

export interface StoredTokens {
  accessToken: string;
  refreshToken: string;
  expiryDate: number;
}

export interface AccountMetadata {
  id: string;
  email: string;
  name?: string;
  addedAt: string;
}

export interface AccountsFile {
  accounts: AccountMetadata[];
  defaultAccountId?: string;
}

export interface AuthConfig {
  clientId?: string;
  clientSecret?: string;
  credentialsFile?: string;
  scopes: string[];
  configDir?: string;
}

export interface CredentialsFile {
  installed?: {
    client_id: string;
    client_secret: string;
    redirect_uris?: string[];
  };
  web?: {
    client_id: string;
    client_secret: string;
    redirect_uris?: string[];
  };
}

export interface TokenStorage {
  store(accountId: string, tokens: StoredTokens): Promise<void>;
  retrieve(accountId: string): Promise<StoredTokens | null>;
  remove(accountId: string): Promise<void>;
}

export interface TokenManager {
  addAccount(accountId: string): Promise<string>;
  completeAuth(accountId: string, code?: string): Promise<Account>;
  removeAccount(accountId: string): Promise<void>;
  listAccounts(): Promise<Account[]>;
  getAccessToken(accountId: string): Promise<string>;
  getAuthenticatedClient(accountId: string): Promise<OAuth2Client>;
  close(): Promise<void>;
}
