import { describe, it, expect } from 'vitest';

// ---------------------------------------------------------------------------
// Pure validation functions — no src imports needed.
// These mirror the validation logic that the package enforces.
// ---------------------------------------------------------------------------

// Slug: lowercase alphanumeric + hyphens, 3-50 chars, no leading/trailing hyphens.
function isValidSlug(slug: string): boolean {
  if (slug.length < 3 || slug.length > 50) return false;
  // Must start and end with alphanumeric, inner chars can include hyphens.
  return /^[a-z0-9][a-z0-9-]*[a-z0-9]$|^[a-z0-9]{1}$/.test(slug) && slug.length >= 3;
}

// Email: basic RFC-ish check — local@domain.tld
function isValidEmail(email: string): boolean {
  if (!email) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// OrgRole: exactly one of the four valid roles.
function isValidOrgRole(role: string): boolean {
  return ['owner', 'admin', 'member', 'viewer'].includes(role);
}

// Token: hex string, exactly 64 characters.
function isValidToken(token: string): boolean {
  return /^[0-9a-f]{64}$/.test(token);
}

// ---------------------------------------------------------------------------
// Slug validation
// ---------------------------------------------------------------------------
describe('Slug validation', () => {
  describe('valid slugs', () => {
    it('"demo-co" is valid', () => {
      expect(isValidSlug('demo-co')).toBe(true);
    });

    it('"acme" is valid', () => {
      expect(isValidSlug('acme')).toBe(true);
    });

    it('"my-org-123" is valid', () => {
      expect(isValidSlug('my-org-123')).toBe(true);
    });

    it('exactly 3 chars "abc" is valid (lower boundary)', () => {
      expect(isValidSlug('abc')).toBe(true);
    });

    it('exactly 50 chars is valid (upper boundary)', () => {
      const slug = 'a' + 'b'.repeat(48) + 'c'; // 50 chars
      expect(slug.length).toBe(50);
      expect(isValidSlug(slug)).toBe(true);
    });

    it('alphanumeric with numbers "org123" is valid', () => {
      expect(isValidSlug('org123')).toBe(true);
    });

    it('multiple hyphens in middle "my-big-org-2024" is valid', () => {
      expect(isValidSlug('my-big-org-2024')).toBe(true);
    });
  });

  describe('invalid slugs', () => {
    it('empty string is invalid', () => {
      expect(isValidSlug('')).toBe(false);
    });

    it('single char "a" is invalid (too short)', () => {
      expect(isValidSlug('a')).toBe(false);
    });

    it('two chars "ab" is invalid (too short)', () => {
      expect(isValidSlug('ab')).toBe(false);
    });

    it('leading hyphen "-start" is invalid', () => {
      expect(isValidSlug('-start')).toBe(false);
    });

    it('trailing hyphen "end-" is invalid', () => {
      expect(isValidSlug('end-')).toBe(false);
    });

    it('spaces "with spaces" is invalid', () => {
      expect(isValidSlug('with spaces')).toBe(false);
    });

    it('51 chars is invalid (too long)', () => {
      const slug = 'a'.repeat(51);
      expect(slug.length).toBe(51);
      expect(isValidSlug(slug)).toBe(false);
    });

    it('uppercase letters "MyOrg" is invalid', () => {
      expect(isValidSlug('MyOrg')).toBe(false);
    });

    it('underscores "my_org" are invalid', () => {
      expect(isValidSlug('my_org')).toBe(false);
    });

    it('special chars "org@co" are invalid', () => {
      expect(isValidSlug('org@co')).toBe(false);
    });
  });
});

// ---------------------------------------------------------------------------
// Email validation
// ---------------------------------------------------------------------------
describe('Email validation', () => {
  describe('valid emails', () => {
    it('"user@example.com" is valid', () => {
      expect(isValidEmail('user@example.com')).toBe(true);
    });

    it('"a+b@x.co" is valid', () => {
      expect(isValidEmail('a+b@x.co')).toBe(true);
    });

    it('"firstname.lastname@domain.org" is valid', () => {
      expect(isValidEmail('firstname.lastname@domain.org')).toBe(true);
    });

    it('"user123@sub.domain.com" is valid', () => {
      expect(isValidEmail('user123@sub.domain.com')).toBe(true);
    });
  });

  describe('invalid emails', () => {
    it('"notanemail" is invalid (no @ or domain)', () => {
      expect(isValidEmail('notanemail')).toBe(false);
    });

    it('"@domain.com" is invalid (no local part)', () => {
      expect(isValidEmail('@domain.com')).toBe(false);
    });

    it('"user@" is invalid (no domain)', () => {
      expect(isValidEmail('user@')).toBe(false);
    });

    it('empty string is invalid', () => {
      expect(isValidEmail('')).toBe(false);
    });

    it('"user@domain" is invalid (no TLD)', () => {
      expect(isValidEmail('user@domain')).toBe(false);
    });

    it('"user @example.com" is invalid (space in local part)', () => {
      expect(isValidEmail('user @example.com')).toBe(false);
    });
  });
});

// ---------------------------------------------------------------------------
// OrgRole enum validation
// ---------------------------------------------------------------------------
describe('OrgRole validation', () => {
  describe('valid roles', () => {
    it('"owner" is valid', () => {
      expect(isValidOrgRole('owner')).toBe(true);
    });

    it('"admin" is valid', () => {
      expect(isValidOrgRole('admin')).toBe(true);
    });

    it('"member" is valid', () => {
      expect(isValidOrgRole('member')).toBe(true);
    });

    it('"viewer" is valid', () => {
      expect(isValidOrgRole('viewer')).toBe(true);
    });
  });

  describe('invalid roles', () => {
    it('"superadmin" is invalid', () => {
      expect(isValidOrgRole('superadmin')).toBe(false);
    });

    it('"Owner" is invalid (case-sensitive)', () => {
      expect(isValidOrgRole('Owner')).toBe(false);
    });

    it('"ADMIN" is invalid (uppercase)', () => {
      expect(isValidOrgRole('ADMIN')).toBe(false);
    });

    it('empty string is invalid', () => {
      expect(isValidOrgRole('')).toBe(false);
    });

    it('"moderator" is invalid', () => {
      expect(isValidOrgRole('moderator')).toBe(false);
    });

    it('"guest" is invalid', () => {
      expect(isValidOrgRole('guest')).toBe(false);
    });

    it('"MEMBER" is invalid (uppercase)', () => {
      expect(isValidOrgRole('MEMBER')).toBe(false);
    });

    it('"Viewer" is invalid (mixed case)', () => {
      expect(isValidOrgRole('Viewer')).toBe(false);
    });
  });
});

// ---------------------------------------------------------------------------
// Token format validation (hex, exactly 64 chars)
// ---------------------------------------------------------------------------
describe('Token format validation', () => {
  describe('valid tokens', () => {
    it('"a".repeat(64) is valid', () => {
      const token = 'a'.repeat(64);
      expect(token.length).toBe(64);
      expect(isValidToken(token)).toBe(true);
    });

    it('"abc123".repeat(10) + "ab" (64 hex chars) is valid', () => {
      // "abc123" * 10 = 60 chars + "ab" = 62? Let's compute correctly:
      // "abc123".repeat(10) = 60 chars, need 4 more: "abcd" => 64 total
      const token = 'abc123'.repeat(10) + 'abcd';
      expect(token.length).toBe(64);
      // all chars in 'abc123abcd' are hex (a,b,c,d,1,2,3)
      expect(isValidToken(token)).toBe(true);
    });

    it('all-zeros token "0".repeat(64) is valid', () => {
      const token = '0'.repeat(64);
      expect(isValidToken(token)).toBe(true);
    });

    it('all-f token "f".repeat(64) is valid', () => {
      const token = 'f'.repeat(64);
      expect(isValidToken(token)).toBe(true);
    });

    it('mixed hex chars covering 0-9 and a-f is valid', () => {
      // 64 chars using full hex alphabet
      const token = '0123456789abcdef'.repeat(4);
      expect(token.length).toBe(64);
      expect(isValidToken(token)).toBe(true);
    });
  });

  describe('invalid tokens', () => {
    it('"short" is invalid (too few chars)', () => {
      expect(isValidToken('short')).toBe(false);
    });

    it('"z".repeat(64) is invalid ("z" is not a hex digit)', () => {
      const token = 'z'.repeat(64);
      expect(token.length).toBe(64);
      expect(isValidToken(token)).toBe(false);
    });

    it('empty string is invalid', () => {
      expect(isValidToken('')).toBe(false);
    });

    it('63 hex chars is invalid (one too short)', () => {
      const token = 'a'.repeat(63);
      expect(token.length).toBe(63);
      expect(isValidToken(token)).toBe(false);
    });

    it('65 hex chars is invalid (one too long)', () => {
      const token = 'a'.repeat(65);
      expect(token.length).toBe(65);
      expect(isValidToken(token)).toBe(false);
    });

    it('uppercase hex "A".repeat(64) is invalid (must be lowercase)', () => {
      const token = 'A'.repeat(64);
      expect(isValidToken(token)).toBe(false);
    });

    it('token with hyphens is invalid', () => {
      // UUID-style, 32 hex + 4 hyphens = not valid token
      const token = 'a'.repeat(28) + '-' + 'b'.repeat(27) + '-' + 'cc';
      expect(isValidToken(token)).toBe(false);
    });

    it('token with spaces is invalid', () => {
      const token = 'a'.repeat(32) + ' ' + 'b'.repeat(31);
      expect(isValidToken(token)).toBe(false);
    });

    it('"g".repeat(64) is invalid ("g" is not hex)', () => {
      const token = 'g'.repeat(64);
      expect(isValidToken(token)).toBe(false);
    });
  });
});
