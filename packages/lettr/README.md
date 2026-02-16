# Lettr Node.js SDK

Official Node.js SDK for the [Lettr](https://lettr.com) transactional email API.

## Installation

```bash
bun install lettr
```

## Usage

```typescript
import { Lettr } from "lettr";

const client = new Lettr("your-api-key");

const { data, error } = await client.emails.send({
  from: "sender@example.com",
  to: ["recipient@example.com"],
  subject: "Welcome!",
  html: "<p>Hello!</p>",
});

if (error) {
  console.error(error.message);
} else {
  console.log(data.request_id);
}
```

## License

MIT
