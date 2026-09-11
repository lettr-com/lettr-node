# lettr

## 1.6.0

### Minor Changes

- 054819c: Template `purpose` and a folder listing (TPL-2454 / TPL-2521 / TPL-2458). Everything is additive — code written against 1.5.0 keeps compiling and sends byte-identical requests.

  **`TemplatePurpose`** — a new `"transactional" | "campaign"` union, exported. The two modules do not mix: only campaign templates can be picked by the campaign builder, and only transactional ones can be sent as single emails.

  **Create a marketing template.** `CreateTemplateRequest` takes an optional `purpose`:

  ```ts
  await client.templates.create({
    name: "October Newsletter",
    json: topolJson,
    purpose: "campaign",
  });
  ```

  Omit it and no `purpose` key is sent at all, so the API applies its own default and the request body is unchanged from 1.5.0.

  **`purpose` on every template response** — `Template`, `TemplateDetail`, `CreateTemplateResponse` and `UpdateTemplateResponse`. It is typed as required, not optional, because the API always sends it.

  **Filter the list by module** — `ListTemplatesParams` takes `purpose`. Omitting it still returns both modules.

  **Folders are listable — `client.folders`.** `list(params?)` wraps `GET /folders` and returns `{ folders, pagination }`, each `Folder` carrying `id`, `name`, `project_id`, `purpose`, `templates_count` and timestamps.

  This is what `CreateTemplateRequest["folder_id"]` was missing: nothing in the SDK ever returned a folder id, so a caller either omitted `folder_id` and accepted whichever folder the API picked, or hardcoded an integer read out of an app URL by hand. Now:

  ```ts
  const { data } = await client.folders.list({ purpose: "campaign" });

  await client.templates.create({
    name: "October Newsletter",
    folder_id: data?.folders[0]?.id,
    json: topolJson,
    purpose: "campaign",
  });
  ```

  `ListFoldersParams` takes `project_id`, `purpose`, `per_page` and `page`; without a `project_id` the team's default project is used, the same way `templates.list()` resolves it. Read-only by design: creating, renaming and deleting folders stay in the app, because deleting one moves or deletes the templates inside it.

  New exported types: `TemplatePurpose`, `Folder`, `ListFoldersParams`, `ListFoldersResponse`, and the `Folders` class.

  **`UpdateTemplateRequest` deliberately gains nothing.** `PUT /templates/{slug}` does not accept a `purpose`, and moving a template across modules has to copy its versions and merge tags into the other module's folder — a separate endpoint that does not exist yet. Set the purpose at create time.

  **Template `preparation_status`.** `Template`, `TemplateDetail`, `CreateTemplateResponse` and `UpdateTemplateResponse` carry a `TemplatePreparationStatus` (`"pending" | "ready" | "failed"`). Creating or updating a template defers image migration and HTML rendering to a background job; this says whether the content you sent is the content that will go out. Note it is **not** the same question as "can I send this": after an _update_ the previous render stays in place, so a `"pending"` template is still sendable — it is serving the old content.

  **Filter the template list by folder** — `ListTemplatesParams` takes `folder_id`. One `per_page=100` call reconciles a whole bulk import instead of a detail call per template, each dragging the full HTML payload against the same rate limit. A folder that is not in the resolved project answers **404**, not an empty list, so a typo cannot be misread as "nothing is there yet".

  **Idempotent sends.** `client.emails.send(request, { idempotencyKey })` sends an `Idempotency-Key`; reuse it on a retry and the API returns the original result instead of delivering a second email.

  ```ts
  const { data, error } = await client.emails.send(email, {
    idempotencyKey: "order-confirmation-12345",
  });

  data?.replayed; // true → this replayed an earlier send, no second email went out
  ```

  **You choose the key; the SDK never generates one.** It only works if both attempts use the same value, and the SDK does not retry — one `send()` is one HTTP request — so the retry is yours, and only you know two calls are the same logical send.

  A malformed key (the format is 1–255 characters of `[A-Za-z0-9._-]`) is returned as a validation error **without making a request**, so it costs no round trip. `isValidIdempotencyKey()` and `IDEMPOTENCY_KEY_PATTERN` are exported for callers deriving keys from their own ids.

  Two new error codes, and two guards, because one is safe to retry and the other is not:

  - `isIdempotencyInProgressError(error)` — the original send is still processing. Retry with the **same** key after `error.retry_after` seconds; a fresh key would send a second email.
  - `isIdempotencyConflictError(error)` — that key was used with a different payload. A caller bug; retrying fails forever.

  `LettrError` of type `"api"` gained an optional `retry_after`, populated from the `Retry-After` header.

  New exported types: `TemplatePreparationStatus`, `SendEmailOptions`.

  **Note.** `SendEmailResponse` gained a required `replayed` field. Reading a response is unaffected, but code that _constructs_ a `SendEmailResponse` literal (a test double, a fake) now has to include it.

## 1.5.0

### Minor Changes

- 0d6e2c3: Support the reworked bulk contact import (TPL-2105) and the duplicate-create fix. Everything is additive — code written against 1.4.0 keeps compiling and sends the exact same payloads.

  **Per-contact bulk create.** `bulkCreate()` accepts a second request shape where each contact carries its own `properties`, `list_ids` and `topics`, alongside the original flat `emails` list. `BulkCreateAudienceContactsRequest` is now a union of the two, so TypeScript enforces the API's "exactly one of `emails`/`contacts`" rule at compile time; every payload that was valid before still is.

  Batch-wide `list_ids`, `topics` and `update_existing` are available on both shapes. Batch-wide lists and topics are unioned into every row; a row-level property key or `opt_out` wins over the batch-wide value. `update_existing: true` merges properties (submitted keys overwrite, absent keys are preserved) and allows dropping a subscription.

  New types: `BulkAudienceContactRow`, `AudienceTopicSubscription` and `AudienceTopicSubscriptionState` (`"opt_in" | "opt_out"` — what a request should _do_ with a topic, as opposed to the existing `AudienceTopicDefaultSubscription`, which describes how a topic behaves for new contacts). An `"opt_out"` on a topic whose default is opt-out suppresses the auto-subscription in the same request instead of needing a second call.

  **Bulk create now reports what happened per row.** `BulkCreateAudienceContactsData` gains `updated`, `error_count`, `errors` (`BulkAudienceContactError[]` — `index`, `email`, `error_code`, `error`) and `contacts` (`BulkAudienceContactRef[]` — `id`, `email`, `created`). The ids come back in submission order, so chaining into `bulkAttachLists()` / `bulkSubscribeTopics()` needs no lookup. `created` and `already_existed` keep their exact meaning, and `bulkCreate()` fills the four new fields with empty defaults when the API omits them, so `data.errors.length` is safe against an older API deployment.

  A bulk create can **partially succeed**: rows that fail validation are skipped and returned in `errors` while the rest of the batch commits, and the call still returns HTTP 201. `result.error` is `null` in that case — check `data.errors.length`, not `result.error`.

  Note that `already_existed` and `updated` overlap by design. They answer different questions ("was the address already in the audience?" vs "did this request change the contact?"), so they do not sum to the row count: a contact that already existed and got attached to a list is counted in both.

  `BulkAudienceContactError["error_code"]` is typed `BulkAudienceContactErrorCode | (string & {})` — autocomplete for the seven known codes, but a code added server-side still types.

  **Bulk topic subscribe/unsubscribe** — two new methods on `client.audience.contacts`, mirroring the existing `bulkAttachLists()` / `bulkDetachLists()` pair:

  - `bulkSubscribeTopics({ contact_ids, topic_ids })` → `POST /audience/contacts/topics/bulk`, returns `{ subscribed, already_subscribed, total_pairs }`.
  - `bulkUnsubscribeTopics({ contact_ids, topic_ids })` → `DELETE /audience/contacts/topics/bulk` with a request body, returns `{ unsubscribed, total_pairs }`. Pairs that do not exist are ignored.

  Both process every `contact_ids × topic_ids` combination (up to 1000 × 50).

  **Duplicate contact creates are now a 409, not a 500.** Creating a contact whose email already exists returns `{ type: "api", error_code: "resource_already_exists" }` instead of escaping as an HTTP 500 with the misleading `send_error` code (which names email delivery, not involved here). New exported type guard `isContactAlreadyExistsError(error)` for the check. **If your code retries 5xx, duplicate creates are no longer retried** — a 409 here must not be retried; update the existing contact instead, or use `bulkCreate()` with `update_existing: true`. Any error mapping of yours that names `send_error` for this endpoint should be corrected.

## 1.4.0

### Minor Changes

- 77c7b72: Send a User-Agent header (lettr-node/<version>, with the calling kit appended) on every request

## 1.3.0

### Minor Changes

- 6e5cfc7: Add `/campaigns` routes (list, get, events, send, schedule, unschedule) under `client.campaigns`.

  Additive `LettrError` improvement: validation errors now expose the API's `error_code` (optional `error_code?: ErrorCode` on the `validation` variant). This lets callers discriminate precondition failures — most notably the new `campaign_not_sendable` / `campaign_not_scheduled` returned by the campaign action endpoints, as well as the spec's other 422 codes — without string-matching the `message`. Existing consumers that only read `error.type`, `error.message`, and `error.errors` are unaffected.

## 1.2.0

### Minor Changes

- 7bc26f0: Add /audience routes (lists, contacts, topics, properties, segments) under client.audience

## 1.1.0

### Minor Changes

- 3cb0a95: Webhooks: `UpdateWebhookRequest` now accepts `url` (matching the API and the shape of `CreateWebhookRequest`). The legacy `target` field is marked `@deprecated` but still works — it is translated to `url` on the wire, so existing callers continue to function.

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
