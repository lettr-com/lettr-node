import { idempotencyKeyError } from "./idempotency";
import type { HttpClient } from "./http";
import type {
  SendEmailRequest,
  SendEmailResponse,
  ScheduleEmailRequest,
  ScheduledTransmission,
  CancelScheduledResponse,
  ListEmailsParams,
  SendEmailOptions,
  ListEmailsResponse,
  ListSentEmailsParams,
  ListSentEmailsResponse,
  GetEmailParams,
  GetEmailResponse,
  Result,
} from "./types";

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

  async schedule(
    request: ScheduleEmailRequest
  ): Promise<Result<SendEmailResponse>> {
    const result = await this.http.request<{
      message: string;
      data: { request_id: string; accepted: number; rejected: number };
    }>("POST", "/emails/scheduled", { body: request, unwrap: false });

    if (result.error) return result;

    return {
      data: {
        request_id: result.data.data.request_id,
        accepted: result.data.data.accepted,
        rejected: result.data.data.rejected,
        message: result.data.message,
        // Scheduling is a different endpoint and takes no idempotency key,
        // so it can never be a replay.
        replayed: false,
      },
      error: null,
    };
  }

  async getScheduled(
    transmissionId: string
  ): Promise<Result<ScheduledTransmission>> {
    return this.http.request<ScheduledTransmission>(
      "GET",
      `/emails/scheduled/${encodeURIComponent(transmissionId)}`
    );
  }

  async cancelScheduled(
    transmissionId: string
  ): Promise<Result<CancelScheduledResponse>> {
    return this.http.request<CancelScheduledResponse>(
      "DELETE",
      `/emails/scheduled/${encodeURIComponent(transmissionId)}`,
      { unwrap: false }
    );
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
