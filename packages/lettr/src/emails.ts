import type { HttpClient } from "./http";
import type {
  SendEmailRequest,
  SendEmailResponse,
  ListEmailsParams,
  ListEmailsResponse,
  GetEmailResponse,
  Result,
} from "./types";

export class Emails {
  constructor(private http: HttpClient) {}

  async send(request: SendEmailRequest): Promise<Result<SendEmailResponse>> {
    const result = await this.http.request<{
      message: string;
      data: { request_id: string; accepted: number; rejected: number };
    }>("POST", "/emails", { body: request, unwrap: false });

    if (result.error) return result;

    return {
      data: {
        request_id: result.data.data.request_id,
        accepted: result.data.data.accepted,
        rejected: result.data.data.rejected,
        message: result.data.message,
      },
      error: null,
    };
  }

  async list(
    params?: ListEmailsParams
  ): Promise<Result<ListEmailsResponse>> {
    return this.http.request<ListEmailsResponse>("GET", "/emails", {
      query: params as Record<string, string | number | undefined>,
    });
  }

  async get(requestId: string): Promise<Result<GetEmailResponse>> {
    return this.http.request<GetEmailResponse>(
      "GET",
      `/emails/${encodeURIComponent(requestId)}`
    );
  }
}
