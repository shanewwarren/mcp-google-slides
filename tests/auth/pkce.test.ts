/**
 * Unit tests for PKCE (Proof Key for Code Exchange) utilities
 */

import * as crypto from 'crypto';
import {
  generateCodeVerifier,
  generateCodeChallenge,
  generateState,
} from '../../src/auth/pkce.js';

describe('PKCE Utilities', () => {
  describe('generateCodeVerifier', () => {
    test('generates a code verifier', () => {
      const verifier = generateCodeVerifier();
      expect(verifier).toBeTruthy();
      expect(typeof verifier).toBe('string');
    });

    test('generates a verifier with correct length (43 characters)', () => {
      const verifier = generateCodeVerifier();
      // 32 bytes of random data encoded as base64url produces 43 characters
      expect(verifier.length).toBe(43);
    });

    test('generates URL-safe characters only', () => {
      const verifier = generateCodeVerifier();
      // Should only contain A-Z, a-z, 0-9, -, _, ~
      // No +, /, or = (those are replaced/removed in base64url encoding)
      expect(verifier).toMatch(/^[A-Za-z0-9\-_~]+$/);
    });

    test('does not contain base64 padding', () => {
      const verifier = generateCodeVerifier();
      expect(verifier).not.toContain('=');
    });

    test('does not contain + or / characters', () => {
      const verifier = generateCodeVerifier();
      expect(verifier).not.toContain('+');
      expect(verifier).not.toContain('/');
    });

    test('generates different values on each call', () => {
      const verifier1 = generateCodeVerifier();
      const verifier2 = generateCodeVerifier();
      const verifier3 = generateCodeVerifier();

      expect(verifier1).not.toBe(verifier2);
      expect(verifier2).not.toBe(verifier3);
      expect(verifier1).not.toBe(verifier3);
    });

    test('meets RFC 7636 requirements (43-128 characters)', () => {
      const verifier = generateCodeVerifier();
      expect(verifier.length).toBeGreaterThanOrEqual(43);
      expect(verifier.length).toBeLessThanOrEqual(128);
    });
  });

  describe('generateCodeChallenge', () => {
    test('generates a code challenge from a verifier', () => {
      const verifier = generateCodeVerifier();
      const challenge = generateCodeChallenge(verifier);

      expect(challenge).toBeTruthy();
      expect(typeof challenge).toBe('string');
    });

    test('generates a challenge with expected length (43 characters)', () => {
      const verifier = generateCodeVerifier();
      const challenge = generateCodeChallenge(verifier);

      // SHA256 hash (32 bytes) encoded as base64url produces 43 characters
      expect(challenge.length).toBe(43);
    });

    test('generates URL-safe characters only', () => {
      const verifier = generateCodeVerifier();
      const challenge = generateCodeChallenge(verifier);

      expect(challenge).toMatch(/^[A-Za-z0-9\-_~]+$/);
    });

    test('does not contain base64 padding', () => {
      const verifier = generateCodeVerifier();
      const challenge = generateCodeChallenge(verifier);

      expect(challenge).not.toContain('=');
    });

    test('generates the same challenge for the same verifier', () => {
      const verifier = 'test-verifier-12345678901234567890123';
      const challenge1 = generateCodeChallenge(verifier);
      const challenge2 = generateCodeChallenge(verifier);

      expect(challenge1).toBe(challenge2);
    });

    test('generates different challenges for different verifiers', () => {
      const verifier1 = generateCodeVerifier();
      const verifier2 = generateCodeVerifier();

      const challenge1 = generateCodeChallenge(verifier1);
      const challenge2 = generateCodeChallenge(verifier2);

      expect(challenge1).not.toBe(challenge2);
    });

    test('correctly implements SHA256 hashing', () => {
      const verifier = 'test-verifier-12345678901234567890123';
      const challenge = generateCodeChallenge(verifier);

      // Manually compute expected challenge
      const hash = crypto.createHash('sha256').update(verifier).digest();
      const expectedChallenge = Buffer.from(hash)
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');

      expect(challenge).toBe(expectedChallenge);
    });

    test('handles empty string verifier', () => {
      const challenge = generateCodeChallenge('');
      expect(challenge).toBeTruthy();
      expect(challenge.length).toBe(43);
    });

    test('handles very long verifier (128 characters)', () => {
      const longVerifier = 'a'.repeat(128);
      const challenge = generateCodeChallenge(longVerifier);
      expect(challenge).toBeTruthy();
      expect(challenge.length).toBe(43);
    });
  });

  describe('generateState', () => {
    test('generates a state parameter', () => {
      const state = generateState();
      expect(state).toBeTruthy();
      expect(typeof state).toBe('string');
    });

    test('generates a state with correct length (32 characters)', () => {
      const state = generateState();
      // 24 bytes of random data encoded as base64url produces 32 characters
      expect(state.length).toBe(32);
    });

    test('generates URL-safe characters only', () => {
      const state = generateState();
      expect(state).toMatch(/^[A-Za-z0-9\-_~]+$/);
    });

    test('does not contain base64 padding', () => {
      const state = generateState();
      expect(state).not.toContain('=');
    });

    test('does not contain + or / characters', () => {
      const state = generateState();
      expect(state).not.toContain('+');
      expect(state).not.toContain('/');
    });

    test('generates different values on each call', () => {
      const state1 = generateState();
      const state2 = generateState();
      const state3 = generateState();

      expect(state1).not.toBe(state2);
      expect(state2).not.toBe(state3);
      expect(state1).not.toBe(state3);
    });

    test('generates sufficiently random values', () => {
      // Generate multiple states and ensure they are all unique
      const states = new Set<string>();
      const iterations = 100;

      for (let i = 0; i < iterations; i++) {
        states.add(generateState());
      }

      // All states should be unique
      expect(states.size).toBe(iterations);
    });
  });

  describe('Integration: PKCE Flow', () => {
    test('verifier and challenge work together correctly', () => {
      // Simulate the PKCE flow
      const verifier = generateCodeVerifier();
      const challenge = generateCodeChallenge(verifier);

      // Both should be valid
      expect(verifier.length).toBe(43);
      expect(challenge.length).toBe(43);

      // Challenge should be deterministic for the same verifier
      const challenge2 = generateCodeChallenge(verifier);
      expect(challenge).toBe(challenge2);
    });

    test('state generation is independent of verifier', () => {
      const verifier1 = generateCodeVerifier();
      const state1 = generateState();

      const verifier2 = generateCodeVerifier();
      const state2 = generateState();

      // States should be different even if generated in sequence
      expect(state1).not.toBe(state2);

      // States should not be related to verifiers
      expect(state1).not.toBe(verifier1);
      expect(state2).not.toBe(verifier2);
    });
  });
});
