import type { HttpClient } from "./http";
import type { ListWebhooksResponse, Webhook, Result } from "./types";

export class Webhooks {
  constructor(private http: HttpClient) {}

  async list(): Promise<Result<ListWebhooksResponse>> {
    return this.http.request<ListWebhooksResponse>("GET", "/webhooks");
  }

  async get(webhookId: string): Promise<Result<Webhook>> {
    return this.http.request<Webhook>(
      "GET",
      `/webhooks/${encodeURIComponent(webhookId)}`
    );
  }
}
