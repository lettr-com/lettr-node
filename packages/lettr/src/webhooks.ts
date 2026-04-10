import type { HttpClient } from "./http";
import type {
  ListWebhooksResponse,
  Webhook,
  CreateWebhookRequest,
  UpdateWebhookRequest,
  Result,
} from "./types";

export class Webhooks {
  constructor(private http: HttpClient) {}

  async list(): Promise<Result<ListWebhooksResponse>> {
    return this.http.request<ListWebhooksResponse>("GET", "/webhooks");
  }

  async create(data: CreateWebhookRequest): Promise<Result<Webhook>> {
    return this.http.request<Webhook>("POST", "/webhooks", {
      body: data,
    });
  }

  async get(webhookId: string): Promise<Result<Webhook>> {
    return this.http.request<Webhook>(
      "GET",
      `/webhooks/${encodeURIComponent(webhookId)}`
    );
  }

  async update(
    webhookId: string,
    data: UpdateWebhookRequest
  ): Promise<Result<Webhook>> {
    return this.http.request<Webhook>(
      "PUT",
      `/webhooks/${encodeURIComponent(webhookId)}`,
      { body: data }
    );
  }

  async delete(webhookId: string): Promise<Result<{ message: string }>> {
    return this.http.request<{ message: string }>(
      "DELETE",
      `/webhooks/${encodeURIComponent(webhookId)}`,
      { unwrap: false }
    );
  }
}
