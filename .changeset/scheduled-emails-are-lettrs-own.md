---
"lettr": minor
---

Scheduled emails are Lettr's own objects now (TPL-2621 / #504). A scheduled email can be listed, read and cancelled through its whole life, and the four scheduling methods return the email itself instead of a thin acknowledgement.

**Why any of this changed.** Lettr used to hand a scheduled email straight to SparkPost, so the "scheduled transmission" was the provider's object and the provider's id was the only handle on it. SparkPost retired per-transmission `GET` and `DELETE`, which would have taken reading and cancelling down with them. Lettr now holds the email itself and only passes it to the provider when it comes due — so it can answer questions about it, and can still call it back.

**There are two ids, and picking the wrong one is the mistake to avoid.**

- `request_id` — Lettr's own, prefixed `sch_`. It exists the moment the email is accepted and it is the one that addresses the email: `getScheduled(request_id)`, `cancelScheduled(request_id)`.
- `transmission_id` — the delivery provider's, `null` until the email is actually sent. It is the id that appears on **webhook events**, so it is what you correlate incoming webhooks with. Before the send there is nothing to correlate, which is exactly why it is nullable.

```ts
const { data, error } = await client.emails.schedule({
  from: "hello@example.com",
  to: ["user@example.com"],
  subject: "Your trial ends tomorrow",
  html: "<p>…</p>",
  scheduled_at: new Date(Date.now() + 86_400_000).toISOString(),
});

data?.request_id;      // "sch_01M3…" — store this, it addresses the email
data?.transmission_id; // null — the provider has not seen it yet
data?.state;           // "scheduled"
```

**`schedule()` now resolves to the whole `ScheduledEmail`**, not to a `request_id` plus a message. Everything the old response carried — `request_id`, `accepted`, `rejected` — is still there, alongside the state, the scheduled time, the recipients and the tag, so nothing has to be re-read to confirm what was accepted.

**`cancelScheduled()` returns the email it cancelled.** It used to answer a bare `{ message }`, which told you nothing except that no exception was thrown. Now the cancelled email comes back with `state: "cancelled"` and `accepted` dropped to `0` — enough to log or display the outcome without a follow-up read. Cancelling something already cancelled, or already gone, answers `409 schedule_cancellation_failed`.

```ts
const { data } = await client.emails.cancelScheduled(requestId);
data?.state;    // "cancelled"
data?.accepted; // 0
```

**`listScheduled(params?)` is new.** There was no way to find a scheduled email you had lost the id for; the only handle was whatever your own code had stored at schedule time. Every state is listed, not just the pending ones, so this doubles as the history of what was scheduled:

```ts
const { data } = await client.emails.listScheduled({
  status: "scheduled",
  per_page: 50,
});

data?.scheduled_emails;        // ScheduledEmail[]
data?.pagination.last_page;    // walk further pages with `page`
```

`status` takes one of the five states, `per_page` is 1–100 (default 25) and `page` is 1-based. An unrecognised `status` is a 422, not an empty list, so a typo cannot be misread as "nothing is scheduled".

**`ScheduledEmailState` is a real union** — `"scheduled" | "sending" | "sent" | "cancelled" | "failed"` — where `state` used to be a bare `string`. A `switch` over it is now exhaustive, and `failure_reason` explains the `"failed"` case.

**The window is 5 minutes to 30 days**, up from 3 days. Scheduling further out answers 422 with `scheduled_at: ["The scheduled delivery time must be within the next 30 days."]`.

**Reading a pre-rework id still works.** An old SparkPost transmission id handed out before this change is answered from delivery events in the older, thinner shape — no `request_id` at all. The SDK fills `request_id` in from `transmission_id` on every path that returns a `ScheduledEmail`, so callers key off one field regardless of which era the email comes from. Note that `accepted`, `rejected`, `tag` and `failure_reason` are genuinely absent on that legacy path even though they are typed as always present: an email Lettr never scheduled has no counters to report.

New exported types: `ScheduledEmail`, `ScheduledEmailState`, `ScheduledEmailPagination`, `ListScheduledEmailsParams`, `ListScheduledEmailsResponse`.

**What breaks.** Three return types changed, so the compiler will find every affected call site:

- `schedule()` resolves to `ScheduledEmail` instead of `SendEmailResponse`. `data.request_id`, `data.accepted` and `data.rejected` read the same; `data.message` and `data.replayed` are gone. (`replayed` was always `false` — scheduling takes no idempotency key.)
- `cancelScheduled()` resolves to `ScheduledEmail` instead of `{ message }`. Read `data.state` instead of `data.message`.
- `getScheduled()` resolves to `ScheduledEmail`, which is a superset of the old shape except that `state` is now a union rather than `string`, and `subject` and `transmission_id` are now nullable — honestly so, in both cases.

`ScheduledTransmission` stays exported as a deprecated alias of `ScheduledEmail`, so existing imports keep compiling. `CancelScheduledResponse` also stays exported, deprecated, **at its old `{ message: string }` shape** rather than re-pointed at `ScheduledEmail`: re-aliasing it would silently break the body of any function typed against it, and the name no longer describes what cancelling returns.

**The state union covers the provider's vocabulary too.** Reading back a legacy provider transmission id is answered from delivery events, which report `submitted`, `generating`, `delivered` or `bounced` — none of them Lettr states. `ScheduledEmailState` therefore carries all of them plus `unknown`, so a `switch` over it is honest about what can actually arrive. The five Lettr states are their own type, `ScheduledEmailStatusFilter`, which is what `listScheduled({ status })` takes — the API answers 422 for anything else.
