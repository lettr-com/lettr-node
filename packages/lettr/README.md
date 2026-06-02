# Lettr Node.js SDK

Official Node.js SDK for the [Lettr](https://lettr.com) transactional email API. Type-safe client that returns a `Result` (`{ data, error }`) instead of throwing — covers emails, templates, domains, webhooks, audience, and campaigns.

## Installation

```bash
npm install lettr
# or: pnpm add lettr / yarn add lettr / bun add lettr
```

## Usage

```typescript
import { Lettr } from "lettr";

const client = new Lettr(process.env.LETTR_API_KEY!);

const { data, error } = await client.emails.send({
  from: "sender@example.com",
  to: ["recipient@example.com"],
  subject: "Welcome!",
  html: "<p>Hello!</p>",
});

if (error) {
  // error.type is "validation" | "api" | "network"
  console.error(error.message);
} else {
  console.log(data.request_id);
}
```

Every method returns a `Result<T>` — destructure `{ data, error }` and handle `error` before reading `data`. The SDK never throws for API or network failures.

## Documentation

Full guides for every resource, with complete request/response details, live in the docs:

📚 **[docs.lettr.com/quickstart/nodejs](https://docs.lettr.com/quickstart/nodejs/introduction)**

| Topic | Guide |
|-|-|
| Install, client, the Result pattern | [Installation](https://docs.lettr.com/quickstart/nodejs/installation) |
| HTML, text, templates, attachments, scheduling, errors | [Sending Emails](https://docs.lettr.com/quickstart/nodejs/sending-emails) |
| Manage Lettr templates & merge tags | [Templates](https://docs.lettr.com/quickstart/nodejs/templates) |
| Add, verify, and manage sending domains | [Domains](https://docs.lettr.com/quickstart/nodejs/domains) |
| Webhook endpoints for delivery & engagement events | [Webhooks](https://docs.lettr.com/quickstart/nodejs/webhooks) |
| Lists, contacts, topics, properties, segments | [Audience](https://docs.lettr.com/quickstart/nodejs/audience) |
| List, send, and schedule campaigns | [Campaigns](https://docs.lettr.com/quickstart/nodejs/campaigns) |
| Endpoint reference (params & schemas) | [API Reference](https://docs.lettr.com/api-reference/introduction) |

## License

MIT
