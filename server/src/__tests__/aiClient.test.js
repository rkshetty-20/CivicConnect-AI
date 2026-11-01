import { test } from 'node:test';
import assert from 'node:assert/strict';
import { computePriorityScore } from '../services/aiClient.js';

// These tests exercise pure AI-scoring logic and need no database or network,
// so they run in CI via `npm test` (node --test).

test('priority score stays within 0-100 for every severity', () => {
  const now = new Date();
  for (const severity of ['low', 'medium', 'high', 'emergency']) {
    const score = computePriorityScore(0, severity, now);
    assert.ok(score >= 0 && score <= 100, `${severity} produced out-of-range score ${score}`);
  }
});

test('priority increases with severity', () => {
  const now = new Date();
  const low = computePriorityScore(0, 'low', now);
  const medium = computePriorityScore(0, 'medium', now);
  const high = computePriorityScore(0, 'high', now);
  const emergency = computePriorityScore(0, 'emergency', now);
  assert.ok(low < medium && medium < high && high < emergency,
    `expected ascending order, got ${low} ${medium} ${high} ${emergency}`);
});

test('community votes raise priority and saturate at +12', () => {
  const now = new Date();
  const base = computePriorityScore(0, 'medium', now);
  const voted = computePriorityScore(5, 'medium', now);
  assert.ok(voted >= base, 'votes should not lower priority');

  const manyVotes = computePriorityScore(10000, 'medium', now);
  const someVotes = computePriorityScore(100, 'medium', now);
  // 100 * 0.4 = 40 -> clamped to 12; both should be capped identically.
  assert.equal(manyVotes, someVotes, 'vote contribution should saturate');
});

test('older complaints nudge priority up slightly but stay capped', () => {
  const fresh = new Date();
  const oneMonthOld = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const freshScore = computePriorityScore(0, 'low', fresh);
  const oldScore = computePriorityScore(0, 'low', oneMonthOld);
  assert.ok(oldScore >= freshScore, 'age should not reduce priority');
  assert.ok(oldScore - freshScore <= 4, 'age contribution is bounded');
});

test('unknown severity falls back to the base floor', () => {
  const score = computePriorityScore(0, 'does-not-exist', new Date());
  assert.ok(score >= 0 && score <= 100, `unexpected score ${score}`);
});
