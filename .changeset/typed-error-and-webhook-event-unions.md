---
"lettr": patch
---

Track updated OpenAPI spec: add typed `ErrorCode` and `WebhookEvent` unions mirroring the spec enums, and narrow `LettrError.error_code`, `Webhook.event_types`, `CreateWebhookRequest.events`, and `UpdateWebhookRequest.events` to use them.
