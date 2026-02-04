import { describe, it, expect } from 'vitest';
import { validateAccountId, isValidAccountId } from './validation.js';

describe('validateAccountId', () => {
  it('should accept valid alphanumeric IDs', () => {
    expect(() => validateAccountId('work')).not.toThrow();
    expect(() => validateAccountId('personal')).not.toThrow();
    expect(() => validateAccountId('account123')).not.toThrow();
  });

  it('should accept IDs with underscores and hyphens', () => {
    expect(() => validateAccountId('work_account')).not.toThrow();
    expect(() => validateAccountId('personal-email')).not.toThrow();
    expect(() => validateAccountId('my_work-2024')).not.toThrow();
  });

  it('should reject empty IDs', () => {
    expect(() => validateAccountId('')).toThrow('Account ID is required');
  });

  it('should reject IDs that are too long', () => {
    const longId = 'a'.repeat(65);
    expect(() => validateAccountId(longId)).toThrow('64 characters or less');
  });

  it('should reject path traversal attempts', () => {
    expect(() => validateAccountId('../../../etc/passwd')).toThrow();
    expect(() => validateAccountId('..%2F..%2Fetc')).toThrow();
    expect(() => validateAccountId('foo/../bar')).toThrow();
  });

  it('should reject IDs with special characters', () => {
    expect(() => validateAccountId('user@example.com')).toThrow();
    expect(() => validateAccountId('user name')).toThrow();
    expect(() => validateAccountId('user<script>')).toThrow();
    expect(() => validateAccountId('user;rm -rf')).toThrow();
    expect(() => validateAccountId("user'--")); // SQL injection attempt
  });

  it('should reject IDs with path separators', () => {
    expect(() => validateAccountId('foo/bar')).toThrow();
    expect(() => validateAccountId('foo\\bar')).toThrow();
  });
});

describe('isValidAccountId', () => {
  it('should return true for valid IDs', () => {
    expect(isValidAccountId('work')).toBe(true);
    expect(isValidAccountId('personal_2024')).toBe(true);
    expect(isValidAccountId('my-account')).toBe(true);
  });

  it('should return false for invalid IDs', () => {
    expect(isValidAccountId('')).toBe(false);
    expect(isValidAccountId('../etc/passwd')).toBe(false);
    expect(isValidAccountId('user@example.com')).toBe(false);
  });
});
