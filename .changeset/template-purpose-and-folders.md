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
