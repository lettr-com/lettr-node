import { idempotencyKeyError } from "./idempotency";
import type { HttpClient } from "./http";
import type {
  SendEmailRequest,
  SendEmailResponse,
  ScheduleEmailRequest,
  ScheduledEmail,
  ListEmailsParams,
  ListScheduledEmailsParams,
  ListScheduledEmailsResponse,
  ScheduledEmailPagination,
  SendEmailOptions,
  ListEmailsResponse,
  ListSentEmailsParams,
  ListSentEmailsResponse,
  GetEmailParams,
  GetEmailResponse,
  Result,
} from "./types";

/**
 * The wire shape, where `request_id` is optional: a read addressed by a
 * pre-rework SparkPost transmission id is answered from delivery events and
 * has no `request_id` at all.
 */
type ScheduledEmailPayload = Omit<ScheduledEmail, "request_id"> & {
  request_id?: string;
};

/**
 * Guarantee `request_id`, so callers key off one field whichever era the
 * email comes from. On a legacy read the provider's `transmission_id` IS the
 * id that addresses the email, so it is the right thing to fall back to.
 */
function withRequestId(email: ScheduledEmailPayload): ScheduledEmail {
  return {
    ...email,
    // Neither id can realistically be absent — a scheduled email is keyed by
    // one or the other — but the fallback keeps the field a plain `string`.
    request_id: email.request_id ?? email.transmission_id ?? "",
  };
}

export class Emails {
  constructor(private http: HttpClient) {}

  async send(
    request: SendEmailRequest,
    options?: SendEmailOptions
  ): Promise<Result<SendEmailResponse>> {
    let headers: Record<string, string> | undefined;

    if (options?.idempotencyKey !== undefined) {
      const invalid = idempotencyKeyError(options.idempotencyKey);

      // Fail here rather than spend a round trip on a 422 the SDK could see
      // coming.
      if (invalid) return { data: null, error: invalid };

      headers = { "Idempotency-Key": options.idempotencyKey };
    }

    let replayed = false;

    const result = await this.http.request<{
      message: string;
      data: { request_id: string; accepted: number; rejected: number };
    }>("POST", "/emails", {
      body: request,
      unwrap: false,
      headers,
      onResponseHeaders: (h) => {
        replayed = h.get("Idempotency-Replayed")?.toLowerCase() === "true";
      },
    });

    if (result.error) return result;

    return {
      data: {
        request_id: result.data.data.request_id,
        accepted: result.data.data.accepted,
        rejected: result.data.data.rejected,
        message: result.data.message,
        replayed,
      },
      error: null,
    };
  }

  /**
   * Hand an email to Lettr to send later.
   *
   * `scheduled_at` must be between 5 minutes and 30 days out. Lettr holds the
   * email itself and only passes it to the delivery provider when it comes
   * due, which is why it can still be read and cancelled in the meantime.
   *
   * Keep `request_id` (`sch_…`) — it is the id that addresses the email in
   * `getScheduled()` and `cancelScheduled()`. `transmission_id` is the
   * provider's id and stays `null` until the email is actually sent; that is
   * the one **webhook events** carry, so correlate webhooks with it, not with
   * `request_id`.
   *
   * ```ts
   * const { data, error } = await client.emails.schedule({
   *   from: "hello@example.com",
   *   to: ["user@example.com"],
   *   subject: "Your trial ends tomorrow",
   *   html: "<p>…</p>",
   *   scheduled_at: new Date(Date.now() + 86_400_000).toISOString(),
   * });
   * data?.request_id; // "sch_01M3…" — store this
   * ```
   */
  async schedule(
    request: ScheduleEmailRequest
  ): Promise<Result<ScheduledEmail>> {
    const result = await this.http.request<ScheduledEmailPayload>(
      "POST",
      "/emails/scheduled",
      { body: request }
    );

    if (result.error) return result;

    return { data: withRequestId(result.data), error: null };
  }

  /**
   * Read one scheduled email by its `sch_…` `request_id`.
   *
   * Works through the whole life of the email, not just while it is pending:
   * once sent, `state` is `"sent"`, `transmission_id` is populated and
   * `events` fills with delivery events.
   *
   * A pre-rework SparkPost transmission id is still accepted here. The API
   * answers it from delivery events without a `request_id`; the SDK fills that
   * field from `transmission_id`, but `accepted`, `rejected`, `tag` and
   * `failure_reason` are genuinely absent on that path.
   */
  async getScheduled(requestId: string): Promise<Result<ScheduledEmail>> {
    const result = await this.http.request<ScheduledEmailPayload>(
      "GET",
      `/emails/scheduled/${encodeURIComponent(requestId)}`
    );

    if (result.error) return result;

    return { data: withRequestId(result.data), error: null };
  }

  /**
   * Cancel a scheduled email by its `sch_…` `request_id`, and get the
   * cancelled email back — `state` is `"cancelled"` and `accepted` has
   * dropped to 0.
   *
   * Only possible before the email comes due, because cancelling means Lettr
   * never hands it to the provider. Cancelling one that is already cancelled
   * or already gone answers `409 schedule_cancellation_failed`.
   */
  async cancelScheduled(requestId: string): Promise<Result<ScheduledEmail>> {
    const result = await this.http.request<ScheduledEmailPayload>(
      "DELETE",
      `/emails/scheduled/${encodeURIComponent(requestId)}`
    );

    if (result.error) return result;

    return { data: withRequestId(result.data), error: null };
  }

  /**
   * List scheduled emails, newest first, page by page.
   *
   * Every state is listed, not just pending ones, so this doubles as the
   * history of what was scheduled. Filter with `status` to get back only
   * what is still waiting to go out.
   *
   * ```ts
   * const { data } = await client.emails.listScheduled({
   *   status: "scheduled",
   *   per_page: 50,
   * });
   * data?.pagination.last_page; // walk further pages with `page`
   * ```
   */
  async listScheduled(
    params?: ListScheduledEmailsParams
  ): Promise<Result<ListScheduledEmailsResponse>> {
    const result = await this.http.request<{
      scheduled_emails: ScheduledEmailPayload[];
      pagination: ScheduledEmailPagination;
    }>("GET", "/emails/scheduled", {
      query: params as Record<string, string | number | undefined>,
    });

    if (result.error) return result;

    return {
      data: {
        scheduled_emails: result.data.scheduled_emails.map(withRequestId),
        pagination: result.data.pagination,
      },
      error: null,
    };
  }

  async listSent(
    params?: ListSentEmailsParams
  ): Promise<Result<ListSentEmailsResponse>> {
    return this.http.request<ListSentEmailsResponse>("GET", "/emails", {
      query: params as Record<string, string | number | undefined>,
    });
  }

  async list(
    params?: ListEmailsParams
  ): Promise<Result<ListEmailsResponse>> {
    return this.http.request<ListEmailsResponse>("GET", "/emails/events", {
      query: params as Record<string, string | number | undefined>,
    });
  }

  async get(
    requestId: string,
    params?: GetEmailParams
  ): Promise<Result<GetEmailResponse>> {
    return this.http.request<GetEmailResponse>(
      "GET",
      `/emails/${encodeURIComponent(requestId)}`,
      {
        query: params as Record<string, string | number | undefined>,
      }
    );
  }
}
