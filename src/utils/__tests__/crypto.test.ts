import {
  sha256,
  hashPin,
  isValidPin,
  generateSalt,
  PIN_ITERATIONS,
} from '../crypto';

describe('crypto (PIN local)', () => {
  describe('sha256', () => {
    it('matches official test vectors', () => {
      // FIPS 180-4 / NIST vectors
      expect(sha256('')).toBe('e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855');
      expect(sha256('abc')).toBe('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
      expect(
        sha256('abcdbcdecdefdefgefghfghighijhijkijkljklmklmnlmnomnopnopq')
      ).toBe('248d6a61d20638b8e5c026930c3e6039a33ce45964ff2167f6ecedd419db06c1');
    });

    it('is deterministic and length is 64 hex chars', () => {
      expect(sha256('fitness')).toBe(sha256('fitness'));
      expect(sha256('fitness')).toHaveLength(64);
    });

    it('handles UTF-8 multi-byte input', () => {
      expect(sha256('héllo')).toHaveLength(64);
      expect(sha256('héllo')).not.toBe(sha256('hello'));
    });
  });

  describe('isValidPin', () => {
    it('accepts 4-6 digits', () => {
      expect(isValidPin('1234')).toBe(true);
      expect(isValidPin('123456')).toBe(true);
    });

    it('rejects wrong formats', () => {
      expect(isValidPin('123')).toBe(false);
      expect(isValidPin('1234567')).toBe(false);
      expect(isValidPin('12a4')).toBe(false);
      expect(isValidPin('')).toBe(false);
    });
  });

  describe('hashPin', () => {
    it('is deterministic for the same pin + salt', () => {
      expect(hashPin('1234', 'a'.repeat(32))).toBe(hashPin('1234', 'a'.repeat(32)));
    });

    it('differs for different salts (protection rainbow table)', () => {
      expect(hashPin('1234', 'a'.repeat(32))).not.toBe(hashPin('1234', 'b'.repeat(32)));
    });

    it('differs for different pins with same salt', () => {
      expect(hashPin('1234', 'a'.repeat(32))).not.toBe(hashPin('4321', 'a'.repeat(32)));
    });

    it('rejects invalid pins and short salts', () => {
      expect(() => hashPin('12', 'a'.repeat(32))).toThrow();
      expect(() => hashPin('abcd', 'a'.repeat(32))).toThrow();
      expect(() => hashPin('1234', 'short')).toThrow();
    });

    it('respects a custom iteration count', () => {
      expect(hashPin('1234', 'a'.repeat(32), 1)).not.toBe(hashPin('1234', 'a'.repeat(32), 2));
    });

    it('completes default iterations quickly (< 2s)', () => {
      const start = Date.now();
      hashPin('1234', 'c'.repeat(32));
      expect(Date.now() - start).toBeLessThan(2000);
      expect(PIN_ITERATIONS).toBeGreaterThanOrEqual(1000);
    });
  });

  describe('generateSalt', () => {
    it('generates 32-char hex salts, unique', () => {
      const s1 = generateSalt();
      const s2 = generateSalt();
      expect(s1).toMatch(/^[0-9a-f]{32}$/);
      expect(s2).toMatch(/^[0-9a-f]{32}$/);
      expect(s1).not.toBe(s2);
    });
  });
});
