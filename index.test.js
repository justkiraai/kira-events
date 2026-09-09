/** Executable baseline contract for the documentation audit. */
import test from 'node:test';
import assert from 'node:assert/strict';
import { deliverEvent, DEFAULT_MAX_RETRIES } from './index.js';

test('v1.1 allows five retries after the initial delivery', async () => {
  const attempts = [];
  const result = await deliverEvent({ type: 'invoice.paid' }, async (_, { attempt }) => {
    attempts.push(attempt);
    return { status: 503 };
  });
  assert.equal(DEFAULT_MAX_RETRIES, 5);
  assert.deepEqual(attempts, [1, 2, 3, 4, 5, 6]);
  assert.deepEqual(result, { delivered: false, attempts: 6, status: 503 });
});

test('stops on success and does not retry HTTP 400', async () => {
  assert.deepEqual(await deliverEvent({}, async () => ({ status: 204 })),
    { delivered: true, attempts: 1, status: 204 });
  assert.equal((await deliverEvent({}, async () => ({ status: 400 }))).attempts, 1);
});

test('retries request timeouts, rate limits, and transport errors before recovering', async () => {
  const result = await deliverEvent({}, async (_, { attempt }) => {
    if (attempt === 1) throw new Error('offline transport simulation');
    if (attempt === 2) return { status: 408 };
    return { status: attempt === 3 ? 429 : 200 };
  });
  assert.deepEqual(result, { delivered: true, attempts: 4, status: 200 });
});

test('supports zero retries and validates the retry budget', async () => {
  assert.equal((await deliverEvent({}, async () => ({ status: 500 }), { maxRetries: 0 })).attempts, 1);
  for (const maxRetries of [-1, 1.5, 11, NaN]) {
    await assert.rejects(deliverEvent({}, async () => ({ status: 200 }), { maxRetries }), RangeError);
  }
});
