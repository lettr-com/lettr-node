import type { HttpClient } from "./http";
import type {
  CampaignActionResponse,
  CampaignDetail,
  ListCampaignEventsData,
  ListCampaignEventsParams,
  ListCampaignsData,
  ListCampaignsParams,
  Result,
  ScheduleCampaignRequest,
} from "./types";

// `encodeURIComponent("")` returns "", which would collapse e.g.
// `/campaigns/${id}/send` to `/campaigns//send` (or to the list endpoint for
// GETs). Fail fast at the SDK boundary with a validation Result rather than
// letting the malformed URL hit the API.
function missingCampaignId<T>(): Result<T> {
  return {
    data: null,
    error: {
      type: "validation",
      message: "campaignId is required.",
      errors: { campaignId: ["campaignId is required."] },
    },
  };
}

export class Campaigns {
  constructor(private http: HttpClient) {}

  async list(
    params?: ListCampaignsParams
  ): Promise<Result<ListCampaignsData>> {
    return this.http.request<ListCampaignsData>("GET", "/campaigns", {
      query: params as Record<string, string | number | undefined>,
    });
  }

  async get(campaignId: string): Promise<Result<CampaignDetail>> {
    if (!campaignId) return missingCampaignId<CampaignDetail>();
    return this.http.request<CampaignDetail>(
      "GET",
      `/campaigns/${encodeURIComponent(campaignId)}`
    );
  }

  async listEvents(
    campaignId: string,
    params?: ListCampaignEventsParams
  ): Promise<Result<ListCampaignEventsData>> {
    if (!campaignId) return missingCampaignId<ListCampaignEventsData>();
    return this.http.request<ListCampaignEventsData>(
      "GET",
      `/campaigns/${encodeURIComponent(campaignId)}/events`,
      { query: params as Record<string, string | number | undefined> }
    );
  }

  /**
   * Dispatch a draft campaign immediately.
   *
   * Resolves to `Result<CampaignActionResponse>`. The response wrapper carries
   * `message` (always present) and `data` (the updated campaign, **optional** —
   * the API omits it in the rare race where the campaign cannot be re-read
   * immediately after the send). Guard with `if (result.data?.data)` before
   * touching campaign fields; do NOT chain `result.data!.data!.status`.
   *
   * ```ts
   * const { data, error } = await client.campaigns.send(id);
   * if (error) return handle(error);
   * console.log(data.message);                      // always present
   * if (data.data) console.log(data.data.status);   // optional — guard first
   * ```
   */
  async send(campaignId: string): Promise<Result<CampaignActionResponse>> {
    if (!campaignId) return missingCampaignId<CampaignActionResponse>();
    return this.http.request<CampaignActionResponse>(
      "POST",
      `/campaigns/${encodeURIComponent(campaignId)}/send`,
      { unwrap: false }
    );
  }

  /**
   * Schedule (or reschedule) a campaign for future delivery.
   *
   * Resolves to `Result<CampaignActionResponse>`; see {@link Campaigns.send}
   * for the optional-`data` guard pattern.
   */
  async schedule(
    campaignId: string,
    data: ScheduleCampaignRequest
  ): Promise<Result<CampaignActionResponse>> {
    if (!campaignId) return missingCampaignId<CampaignActionResponse>();
    return this.http.request<CampaignActionResponse>(
      "POST",
      `/campaigns/${encodeURIComponent(campaignId)}/schedule`,
      { body: data, unwrap: false }
    );
  }

  /**
   * Cancel a scheduled send, returning the campaign to draft.
   *
   * Resolves to `Result<CampaignActionResponse>`; see {@link Campaigns.send}
   * for the optional-`data` guard pattern.
   */
  async unschedule(
    campaignId: string
  ): Promise<Result<CampaignActionResponse>> {
    if (!campaignId) return missingCampaignId<CampaignActionResponse>();
    return this.http.request<CampaignActionResponse>(
      "POST",
      `/campaigns/${encodeURIComponent(campaignId)}/unschedule`,
      { unwrap: false }
    );
  }
}
