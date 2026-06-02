# Lettr Node.js SDK

Official Node.js SDK and CLI tools for the [Lettr](https://lettr.com) transactional email service.

## Packages

| Package | Description |
| --- | --- |
| [`lettr`](./packages/lettr) | Core SDK — type-safe API client for emails, templates, domains, webhooks, audience, and campaigns |
| [`lettr-kit`](./packages/lettr-kit) | CLI tool for managing Lettr email templates locally |

## Quick Start

```bash
npm install lettr
```

```typescript
import { Lettr } from "lettr";

const client = new Lettr(process.env.LETTR_API_KEY!);

const { data, error } = await client.emails.send({
  from: "sender@example.com",
  to: ["recipient@example.com"],
  subject: "Welcome!",
  html: "<h1>Hello!</h1>",
});

if (error) {
  console.error(error.message); // error.type: "validation" | "api" | "network"
} else {
  console.log(data.request_id);
}
```

Every method returns a `Result<T>` (`{ data, error }`) — the SDK never throws for API or network failures.

## Documentation

📚 **[docs.lettr.com/quickstart/nodejs](https://docs.lettr.com/quickstart/nodejs/introduction)** — full guides for sending, templates, domains, webhooks, audience, and campaigns, plus the [API reference](https://docs.lettr.com/api-reference/introduction).

## CLI (`lettr-kit`)

```bash
npm install -g lettr-kit

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
