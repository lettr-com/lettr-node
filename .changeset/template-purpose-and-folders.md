---
"lettr": minor
---

Template `purpose` and a folder listing (TPL-2454 / TPL-2521 / TPL-2458). Everything is additive — code written against 1.5.0 keeps compiling and sends byte-identical requests.

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

**Template `preparation_status`.** `Template`, `TemplateDetail`, `CreateTemplateResponse` and `UpdateTemplateResponse` carry a `TemplatePreparationStatus` (`"pending" | "ready" | "failed"`). Creating or updating a template defers image migration and HTML rendering to a background job; this says whether the content you sent is the content that will go out. Note it is **not** the same question as "can I send this": after an *update* the previous render stays in place, so a `"pending"` template is still sendable — it is serving the old content.

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

**Note.** `SendEmailResponse` gained a required `replayed` field. Reading a response is unaffected, but code that *constructs* a `SendEmailResponse` literal (a test double, a fake) now has to include it.
