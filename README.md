# Lettr Node.js SDK

Official Node.js SDK and CLI tools for the [Lettr](https://lettr.com) transactional email service.

## Packages

| Package | Description |
| --- | --- |
| [`lettr`](./packages/lettr) | Core SDK — type-safe API client for sending emails, managing domains, templates, and webhooks |
| [`lettr-kit`](./packages/lettr-kit) | CLI tool for managing Lettr email templates locally |

## Quick Start

### Install

```bash
npm install lettr
# or
bun add lettr
```

### Send an Email

```typescript
import { Lettr } from "lettr";

const client = new Lettr("lttr_your_api_key");

const { data, error } = await client.emails.send({
  from: "sender@example.com",
  to: ["recipient@example.com"],
  subject: "Welcome!",
  html: "<h1>Hello!</h1>",
});
```

### Send with a Template

When using a template, `subject` is optional — the template's subject is used by default. You can pass `subject` to override it.

```typescript
// Subject defined by the template
const { data, error } = await client.emails.send({
  from: "sender@example.com",
  to: ["recipient@example.com"],
  template_slug: "welcome",
  substitution_data: { name: "John" },
});

// Override the template's subject
const { data, error } = await client.emails.send({
  from: "sender@example.com",
  to: ["recipient@example.com"],
  template_slug: "welcome",
  subject: "Custom Subject",
  substitution_data: { name: "John" },
});
```

### Error Handling

All methods return a `Result<T>` with discriminated `data` and `error` fields:

```typescript
const { data, error } = await client.emails.send({ ... });

if (error) {
  // error.type is "validation" | "api" | "network"
  console.error(error.message);
  return;
}

console.log(data.request_id);
```

## API Reference

```typescript
const client = new Lettr("lttr_...");

// Emails
client.emails.send(request)
client.emails.list(params?)
client.emails.get(requestId)

// Domains
client.domains.list()
client.domains.create(domain)
client.domains.get(domain)
client.domains.delete(domain)
client.domains.verify(domain)

// Templates
client.templates.list(params?)
client.templates.create(data)
client.templates.get(slug, projectId?)
client.templates.update(slug, data)
client.templates.delete(slug, projectId?)
client.templates.getMergeTags(slug, params?)

// Webhooks
client.webhooks.list()
client.webhooks.get(webhookId)

// Projects
client.projects.list(params?)

// System
client.health()
client.authCheck()
```

## CLI (`lettr-kit`)

```bash
npm install -g lettr-kit
# or
bunx lettr-kit
```

```bash
lettr-kit init          # Interactive setup — creates lettr.json
lettr-kit list          # List all templates with sync status
lettr-kit pull          # Pull templates as HTML files
lettr-kit pull --all    # Pull all templates without prompting
```

## Development

This is a monorepo using Bun workspaces.

```bash
bun install
bun run build
bun run test
```

## License

MIT
