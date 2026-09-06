# Kira Events

Kira Events is a small webhook delivery policy library. This dependency-free local fixture models the retry contract; it does not send network requests itself.

## Version 1.1 behavior

`deliverEvent(event, send, { maxRetries })` calls an injected async transport returning `{ status }`. The default `maxRetries` is **5 retries after the initial attempt**, for **6 total attempts**. HTTP 2xx succeeds immediately. HTTP 429, HTTP 5xx, and thrown transport errors are retried immediately until the budget is exhausted. Other HTTP statuses stop immediately. The result is `{ delivered, attempts, status }`; transport errors use `status: null`.

`maxRetries` accepts integers from 0 through 10. Zero means one initial attempt with no retries. The callback receives the event and `{ attempt }`, numbered from 1. This fixture has no persistence, backoff, signing, or background worker.

```js
import { deliverEvent } from './index.js';
const result = await deliverEvent({ type: 'invoice.paid' }, async () => ({ status: 204 }));
// { delivered: true, attempts: 1, status: 204 }
```

Run `npm test` with Node.js 20 or later. No installation or build is needed.
