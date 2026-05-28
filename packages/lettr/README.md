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

## Campaigns

List, retrieve, and act on campaigns under `client.campaigns`:

```typescript
// List sent campaigns
const { data } = await client.campaigns.list({ status: "sent" });
data?.campaigns.forEach((c) => console.log(c.name, c.stats.opens));

// Retrieve a single campaign (includes rendered HTML)
const { data: campaign } = await client.campaigns.get(campaignId);

// Engagement events with cursor-based pagination
const { data: events } = await client.campaigns.listEvents(campaignId, {
  event_type: "open",
  limit: 50,
});
// keep paging while events.next_cursor is non-null

// Dispatch a draft, schedule a future send, or unschedule
await client.campaigns.send(campaignId);
await client.campaigns.schedule(campaignId, {
  scheduled_at: "2026-06-01T09:00:00+00:00",
});
await client.campaigns.unschedule(campaignId);
```

The three action methods (`send` / `schedule` / `unschedule`) resolve to a
`{ message, data? }` wrapper. Guard the optional `data` field — the API may
omit it in a rare post-action race:

```typescript
const { data, error } = await client.campaigns.send(campaignId);
if (error) return handle(error);
console.log(data.message); // always present
if (data.data) console.log(data.data.status); // optional — guard first
```

## License

MIT
