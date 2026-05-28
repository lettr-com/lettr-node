---
"lettr": minor
---

Add `/campaigns` routes (list, get, events, send, schedule, unschedule) under `client.campaigns`.

Additive `LettrError` improvement: validation errors now expose the API's `error_code` (optional `error_code?: ErrorCode` on the `validation` variant). This lets callers discriminate precondition failures — most notably the new `campaign_not_sendable` / `campaign_not_scheduled` returned by the campaign action endpoints, as well as the spec's other 422 codes — without string-matching the `message`. Existing consumers that only read `error.type`, `error.message`, and `error.errors` are unaffected.
