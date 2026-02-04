/**
 * Security validation utilities
 */

const ACCOUNT_ID_PATTERN = /^[a-zA-Z0-9_-]+$/;
const MAX_ACCOUNT_ID_LENGTH = 64;

/**
 * Validates an account ID to prevent path traversal and command injection.
 * Account IDs must be alphanumeric with underscores and hyphens only.
 * @throws Error if the account ID is invalid
 */
export function validateAccountId(accountId: string): void {
  if (!accountId || accountId.length === 0) {
    throw new Error('Account ID is required');
  }
  if (accountId.length > MAX_ACCOUNT_ID_LENGTH) {
    throw new Error(`Account ID must be ${MAX_ACCOUNT_ID_LENGTH} characters or less`);
  }
  if (!ACCOUNT_ID_PATTERN.test(accountId)) {
    throw new Error('Account ID must contain only alphanumeric characters, underscores, and hyphens');
  }
}

/**
 * Checks if a string is a valid account ID without throwing.
 */
export function isValidAccountId(accountId: string): boolean {
  try {
    validateAccountId(accountId);
    return true;
  } catch {
    return false;
  }
}
