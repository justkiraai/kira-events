/** Webhook delivery policy fixture; injected transport keeps tests offline. */
export const DEFAULT_MAX_RETRIES = 5;

/** Deliver an event, retrying transport errors, HTTP 429, and HTTP 5xx. */
export async function deliverEvent(event, send, { maxRetries = DEFAULT_MAX_RETRIES } = {}) {
  if (!Number.isInteger(maxRetries) || maxRetries < 0 || maxRetries > 10) {
    throw new RangeError('maxRetries must be an integer from 0 to 10');
  }
  if (typeof send !== 'function') throw new TypeError('send must be a function');
  for (let attempt = 1; attempt <= maxRetries + 1; attempt += 1) {
    let status = null;
    try {
      status = (await send(event, { attempt })).status;
    } catch {
      // A transport failure has no HTTP status and consumes the same retry budget.
    }
    if (Number.isInteger(status) && status >= 200 && status < 300) {
      return { delivered: true, attempts: attempt, status };
    }
    const isRetryable = status === null || status === 429 || (status >= 500 && status <= 599);
    if (!isRetryable || attempt === maxRetries + 1) {
      return { delivered: false, attempts: attempt, status };
    }
  }
}
