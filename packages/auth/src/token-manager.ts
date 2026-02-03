import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { createServer, type Server as HttpServer } from 'node:http';
import { URL } from 'node:url';
import { google } from 'googleapis';
import type { OAuth2Client } from 'googleapis-common';
import type {
  Account,
  AccountsFile,
  AccountMetadata,
  AuthConfig,
  CredentialsFile,
  TokenManager,
  TokenStorage,
  StoredTokens,
} from './types.js';
import { createStorage } from './storage/index.js';
import {
  DEFAULT_CONFIG_DIR,
  ACCOUNTS_FILE,
  CREDENTIALS_FILE,
  REDIRECT_URI,
  TOKEN_REFRESH_BUFFER_MS,
} from './constants.js';

class TokenManagerImpl implements TokenManager {
  private readonly oauth2Client: OAuth2Client;
  private readonly storage: TokenStorage;
  private readonly configDir: string;
  private readonly scopes: string[];
  private readonly clientId: string;
  private readonly clientSecret: string;
  private pendingAuths: Map<string, { client: OAuth2Client; server?: HttpServer; code?: string }> = new Map();

  constructor(config: AuthConfig, credentials: { clientId: string; clientSecret: string }) {
    this.configDir = config.configDir ?? DEFAULT_CONFIG_DIR;
    this.scopes = config.scopes;
    this.storage = createStorage(this.configDir);
    this.clientId = credentials.clientId;
    this.clientSecret = credentials.clientSecret;

    this.oauth2Client = new google.auth.OAuth2(
      this.clientId,
      this.clientSecret,
      REDIRECT_URI
    );
  }

  private accountsPath(): string {
    return join(this.configDir, ACCOUNTS_FILE);
  }

  private async readAccountsFile(): Promise<AccountsFile> {
    try {
      const data = await readFile(this.accountsPath(), 'utf-8');
      return JSON.parse(data) as AccountsFile;
    } catch {
      return { accounts: [] };
    }
  }

  private async writeAccountsFile(file: AccountsFile): Promise<void> {
    await mkdir(this.configDir, { recursive: true });
    await writeFile(this.accountsPath(), JSON.stringify(file, null, 2), 'utf-8');
  }

  async addAccount(accountId: string): Promise<string> {
    // Clean up any existing pending auth for this account
    const existing = this.pendingAuths.get(accountId);
    if (existing?.server) {
      existing.server.close();
    }

    // Start local callback server
    const server = createServer((req, res) => {
      const url = new URL(req.url ?? '/', `http://127.0.0.1:3000`);
      const code = url.searchParams.get('code');
      const error = url.searchParams.get('error');

      if (error) {
        res.writeHead(400, { 'Content-Type': 'text/html' });
        res.end(`<html><body><h1>Authorization Failed</h1><p>${error}</p></body></html>`);
      } else if (code) {
        const pending = this.pendingAuths.get(accountId);
        if (pending) {
          pending.code = code;
        }
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(`<html><body><h1>Authorization Successful</h1><p>You can close this window.</p></body></html>`);
      } else {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(`<html><body><h1>Waiting for authorization...</h1></body></html>`);
      }
    });

    await new Promise<void>((resolve) => {
      server.listen(3000, '127.0.0.1', () => resolve());
    });

    const client = new google.auth.OAuth2(
      this.clientId,
      this.clientSecret,
      REDIRECT_URI
    );

    const authUrl = client.generateAuthUrl({
      access_type: 'offline',
      scope: this.scopes,
      prompt: 'consent',
    });

    this.pendingAuths.set(accountId, { client, server });
    return authUrl;
  }

  async completeAuth(accountId: string, code?: string): Promise<Account> {
    const pending = this.pendingAuths.get(accountId);
    if (!pending) {
      throw new Error(`No pending auth for account: ${accountId}`);
    }

    // Use provided code or code from callback server
    const authCode = code ?? pending.code;
    if (!authCode) {
      throw new Error('No authorization code received. Please visit the auth URL first.');
    }

    // Clear the code so it can't be reused
    pending.code = undefined;

    // Shut down callback server
    if (pending.server) {
      pending.server.close();
      pending.server = undefined;
    }

    let tokens;
    try {
      const response = await pending.client.getToken(authCode);
      tokens = response.tokens;
    } catch (e: any) {
      throw new Error(`Token exchange failed: ${e.message}`);
    }

    if (!tokens.refresh_token) {
      throw new Error('No refresh token received. Please try again.');
    }

    pending.client.setCredentials(tokens);

    // Get user info
    let userInfo;
    try {
      const oauth2 = google.oauth2({ version: 'v2', auth: pending.client });
      const response = await oauth2.userinfo.get();
      userInfo = response.data;
    } catch (e: any) {
      throw new Error(`Failed to get user info: ${e.message}`);
    }

    const storedTokens: StoredTokens = {
      accessToken: tokens.access_token!,
      refreshToken: tokens.refresh_token,
      expiryDate: tokens.expiry_date ?? Date.now() + 3600 * 1000,
    };

    await this.storage.store(accountId, storedTokens);

    const account: AccountMetadata = {
      id: accountId,
      email: userInfo.email ?? accountId,
      name: userInfo.name ?? undefined,
      addedAt: new Date().toISOString(),
    };

    const accountsFile = await this.readAccountsFile();
    const existingIndex = accountsFile.accounts.findIndex(a => a.id === accountId);
    if (existingIndex >= 0) {
      accountsFile.accounts[existingIndex] = account;
    } else {
      accountsFile.accounts.push(account);
    }
    if (!accountsFile.defaultAccountId) {
      accountsFile.defaultAccountId = accountId;
    }
    await this.writeAccountsFile(accountsFile);

    this.pendingAuths.delete(accountId);

    return {
      id: account.id,
      email: account.email,
      name: account.name,
      addedAt: account.addedAt,
    };
  }

  async removeAccount(accountId: string): Promise<void> {
    await this.storage.remove(accountId);

    const accountsFile = await this.readAccountsFile();
    accountsFile.accounts = accountsFile.accounts.filter(a => a.id !== accountId);
    if (accountsFile.defaultAccountId === accountId) {
      accountsFile.defaultAccountId = accountsFile.accounts[0]?.id;
    }
    await this.writeAccountsFile(accountsFile);
  }

  async listAccounts(): Promise<Account[]> {
    const accountsFile = await this.readAccountsFile();
    return accountsFile.accounts.map(a => ({
      id: a.id,
      email: a.email,
      name: a.name,
      addedAt: a.addedAt,
    }));
  }

  async getAccessToken(accountId: string): Promise<string> {
    const tokens = await this.storage.retrieve(accountId);
    if (!tokens) {
      throw new Error(`No tokens found for account: ${accountId}`);
    }

    // Check if token needs refresh (5 min buffer)
    if (tokens.expiryDate - Date.now() < TOKEN_REFRESH_BUFFER_MS) {
      return this.refreshAccessToken(accountId, tokens);
    }

    return tokens.accessToken;
  }

  private async refreshAccessToken(accountId: string, tokens: StoredTokens): Promise<string> {
    const client = new google.auth.OAuth2(
      this.clientId,
      this.clientSecret,
      REDIRECT_URI
    );

    client.setCredentials({ refresh_token: tokens.refreshToken });

    const { credentials } = await client.refreshAccessToken();

    const updatedTokens: StoredTokens = {
      accessToken: credentials.access_token!,
      refreshToken: tokens.refreshToken,
      expiryDate: credentials.expiry_date ?? Date.now() + 3600 * 1000,
    };

    await this.storage.store(accountId, updatedTokens);
    return updatedTokens.accessToken;
  }

  async getAuthenticatedClient(accountId: string): Promise<OAuth2Client> {
    const tokens = await this.storage.retrieve(accountId);
    if (!tokens) {
      throw new Error(`No tokens found for account: ${accountId}`);
    }

    const client = new google.auth.OAuth2(
      this.clientId,
      this.clientSecret,
      REDIRECT_URI
    );

    // Refresh if needed
    let accessToken = tokens.accessToken;
    let expiryDate = tokens.expiryDate;

    if (tokens.expiryDate - Date.now() < TOKEN_REFRESH_BUFFER_MS) {
      accessToken = await this.refreshAccessToken(accountId, tokens);
      const refreshedTokens = await this.storage.retrieve(accountId);
      expiryDate = refreshedTokens?.expiryDate ?? Date.now() + 3600 * 1000;
    }

    client.setCredentials({
      access_token: accessToken,
      refresh_token: tokens.refreshToken,
      expiry_date: expiryDate,
    });

    return client;
  }

  async close(): Promise<void> {
    for (const pending of this.pendingAuths.values()) {
      if (pending.server) {
        pending.server.close();
      }
    }
    this.pendingAuths.clear();
  }
}

async function loadCredentials(config: AuthConfig): Promise<{ clientId: string; clientSecret: string }> {
  // Use provided credentials if available
  if (config.clientId && config.clientSecret) {
    return { clientId: config.clientId, clientSecret: config.clientSecret };
  }

  // Load from credentials file
  const configDir = config.configDir ?? DEFAULT_CONFIG_DIR;
  const credentialsPath = config.credentialsFile ?? join(configDir, CREDENTIALS_FILE);

  try {
    const data = await readFile(credentialsPath, 'utf-8');
    const creds = JSON.parse(data) as CredentialsFile;

    const installed = creds.installed ?? creds.web;
    if (!installed) {
      throw new Error('Invalid credentials file format: missing "installed" or "web" key');
    }

    return {
      clientId: installed.client_id,
      clientSecret: installed.client_secret,
    };
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      throw new Error(
        `Credentials not found. Either set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET env vars, ` +
        `or place credentials.json at ${credentialsPath}`
      );
    }
    throw error;
  }
}

export async function createTokenManager(config: AuthConfig): Promise<TokenManager> {
  const credentials = await loadCredentials(config);
  return new TokenManagerImpl(config, credentials);
}
