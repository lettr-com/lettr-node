# lettr

## 1.0.2

### Patch Changes

- 4871c16: Publish stable 1.0.x to npm dist-tag `latest` (previous releases were routed to the `snapshot` tag by CI).

## 1.0.1

### Patch Changes

- ac043fb: Track updated OpenAPI spec: add typed `ErrorCode` and `WebhookEvent` unions mirroring the spec enums, and narrow `LettrError.error_code`, `Webhook.event_types`, `CreateWebhookRequest.events`, and `UpdateWebhookRequest.events` to use them.

## 1.0.0

### Major Changes

- ab28c97: Initial major release

## 0.0.0

### Patch Changes

- fefdb98: Bring the client to full parity with the Lettr OpenAPI spec. Adds scheduled emails (schedule/getScheduled/cancelScheduled), separates listSent (/emails) from list (/emails/events),

## 0.0.0-20260216141848

- Add all missing endpoints.

## 0.0.0-alfa-20260117185227

### Patch Changes

- Success: true is missing in the request. Adaptin to it.

## 0.0.0-alpha-20260116104902

### Patch Changes

- Add new base URL (lettr.com)

## 0.0.0-alpha-20260115173114

### Patch Changes

- Initial release
