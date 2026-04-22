---
"lettr": minor
---

Webhooks: `UpdateWebhookRequest` now accepts `url` (matching the API and the shape of `CreateWebhookRequest`). The legacy `target` field is marked `@deprecated` but still works — it is translated to `url` on the wire, so existing callers continue to function.
