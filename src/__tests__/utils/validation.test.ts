import { describe, it, expect } from 'vitest';
import {
  validateInputIsObject,
  validateString,
  validateMessage,
  validateId,
  validateKey,
  validatePositiveInt,
  validateOptionalPositiveInt,
} from '../../utils/validation.js';

describe('validateInputIsObject', () => {
  it('returns true for plain objects', () => {
    expect(validateInputIsObject({})).toBe(true);
    expect(validateInputIsObject({ a: 1 })).toBe(true);
  });

  it('returns false for arrays', () => {
    expect(validateInputIsObject([])).toBe(false);
    expect(validateInputIsObject([1, 2])).toBe(false);
  });

  it('returns false for null and undefined', () => {
    expect(validateInputIsObject(null)).toBe(false);
    expect(validateInputIsObject(undefined)).toBe(false);
  });

  it('returns false for primitives', () => {
    expect(validateInputIsObject('string')).toBe(false);
    expect(validateInputIsObject(42)).toBe(false);
    expect(validateInputIsObject(true)).toBe(false);
  });
});

describe('validateString', () => {
  it('accepts a valid string', () => {
    const result = validateString('hello', 'field', 100);
    expect(result.valid).toBe(true);
    expect(result.value).toBe('hello');
    expect(result.error).toBe('');
  });

  it('trims whitespace', () => {
    const result = validateString('  hello  ', 'field', 100);
    expect(result.valid).toBe(true);
    expect(result.value).toBe('hello');
  });

  it('rejects non-string types', () => {
    expect(validateString(42, 'field', 100).valid).toBe(false);
    expect(validateString(null, 'field', 100).valid).toBe(false);
    expect(validateString(undefined, 'field', 100).valid).toBe(false);
    expect(validateString(true, 'field', 100).valid).toBe(false);
  });

  it('rejects empty strings after trimming', () => {
    const result = validateString('   ', 'field', 100);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('must not be empty');
  });

  it('rejects strings exceeding max length', () => {
    const result = validateString('a'.repeat(11), 'field', 10);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('exceeds maximum length');
  });

  it('accepts strings at exact max length', () => {
    const result = validateString('a'.repeat(10), 'field', 10);
    expect(result.valid).toBe(true);
  });

  it('rejects strings with control characters', () => {
    const result = validateString('hello\x00world', 'field', 100);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('control characters');
  });

  it('allows newlines and tabs (common whitespace)', () => {
    const result = validateString('hello\nworld\ttab', 'field', 100);
    expect(result.valid).toBe(true);
  });

  it('includes field name in error messages', () => {
    const result = validateString(42, 'myField', 100);
    expect(result.error).toContain('myField');
  });
});

describe('validateMessage', () => {
  it('validates with 100,000 char limit', () => {
    const result = validateMessage('a'.repeat(100_000));
    expect(result.valid).toBe(true);
  });

  it('rejects messages exceeding limit', () => {
    const result = validateMessage('a'.repeat(100_001));
    expect(result.valid).toBe(false);
    expect(result.error).toContain('100000');
  });
});

describe('validateId', () => {
  it('validates with 256 char limit', () => {
    const result = validateId('abc-123', 'sessionId');
    expect(result.valid).toBe(true);
    expect(result.value).toBe('abc-123');
  });

  it('rejects IDs exceeding 256 chars', () => {
    const result = validateId('a'.repeat(257), 'sessionId');
    expect(result.valid).toBe(false);
  });

  it('uses provided field name in errors', () => {
    const result = validateId(42, 'taskId');
    expect(result.error).toContain('taskId');
  });
});

describe('validateKey', () => {
  it('validates with 256 char limit', () => {
    const result = validateKey('my-key');
    expect(result.valid).toBe(true);
    expect(result.value).toBe('my-key');
  });

  it('rejects keys exceeding 256 chars', () => {
    const result = validateKey('a'.repeat(257));
    expect(result.valid).toBe(false);
  });

  it('uses "key" as the field name', () => {
    const result = validateKey(42);
    expect(result.error).toContain('key');
  });
});

describe('validatePositiveInt', () => {
  it('accepts positive integers', () => {
    const result = validatePositiveInt(1, 'count');
    expect(result.valid).toBe(true);
    expect(result.value).toBe(1);
  });

  it('accepts large positive integers', () => {
    const result = validatePositiveInt(999, 'count');
    expect(result.valid).toBe(true);
    expect(result.value).toBe(999);
  });

  it('rejects zero', () => {
    const result = validatePositiveInt(0, 'count');
    expect(result.valid).toBe(false);
  });

  it('rejects negative numbers', () => {
    const result = validatePositiveInt(-5, 'count');
    expect(result.valid).toBe(false);
  });

  it('rejects floats', () => {
    const result = validatePositiveInt(1.5, 'count');
    expect(result.valid).toBe(false);
  });

  it('rejects null and undefined', () => {
    expect(validatePositiveInt(null, 'count').valid).toBe(false);
    expect(validatePositiveInt(undefined, 'count').valid).toBe(false);
    expect(validatePositiveInt(null, 'count').error).toContain('required');
  });

  it('rejects non-numbers', () => {
    expect(validatePositiveInt('5', 'count').valid).toBe(false);
  });
});

describe('validateOptionalPositiveInt', () => {
  it('returns default value for null/undefined', () => {
    const result = validateOptionalPositiveInt(undefined, 'limit', 50);
    expect(result.valid).toBe(true);
    expect(result.value).toBe(50);
  });

  it('returns default value for null', () => {
    const result = validateOptionalPositiveInt(null, 'limit', 50);
    expect(result.valid).toBe(true);
    expect(result.value).toBe(50);
  });

  it('accepts valid positive integers', () => {
    const result = validateOptionalPositiveInt(10, 'limit', 50);
    expect(result.valid).toBe(true);
    expect(result.value).toBe(10);
  });

  it('rejects invalid values', () => {
    expect(validateOptionalPositiveInt(0, 'limit', 50).valid).toBe(false);
    expect(validateOptionalPositiveInt(-1, 'limit', 50).valid).toBe(false);
    expect(validateOptionalPositiveInt(1.5, 'limit', 50).valid).toBe(false);
    expect(validateOptionalPositiveInt('5', 'limit', 50).valid).toBe(false);
  });
});
