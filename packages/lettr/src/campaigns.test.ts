import { describe, it, expect, beforeEach, mock } from "bun:test";
import { Lettr } from "./client";
import type {
  CampaignDetail,
  CampaignEvent,
  CampaignPagination,
  CampaignStats,
  CampaignSummary,
} from "./types";

const mockFetch = mock();
globalThis.fetch = mockFetch as unknown as typeof fetch;

const stats: CampaignStats = {
  injections: 124,
  deliveries: 120,
  bounces: 4,
  spam_complaints: 0,
  opens: 80,
  unique_opens: 65,
  clicks: 30,
  unique_clicks: 22,
  unsubscribes: 1,
};

const summary: CampaignSummary = {
  id: "0193e6a8-1f3a-7c2a-b9e2-1aa1d2e5d3f0",
  name: "Spring Sale",
  subject: "Spring is here",
  from_email: "news@example.com",
  from_name: "Example",
  reply_to: null,
  status: "sent",
  scheduled_at: null,
  total_recipients: 124,
  sent_count: 124,
  sent_at: "2026-05-01T09:05:00+00:00",
  created_at: "2026-05-01T09:00:00+00:00",
  stats,
};

const detail: CampaignDetail = {
  ...summary,
  html_content: "<h1>Spring is here</h1>",
};

const pagination: CampaignPagination = {
  total: 1,
  per_page: 20,
  current_page: 1,
  last_page: 1,
};

const event: CampaignEvent = {
  event_id: "92356829",
  event_type: "open",
  email: "jane@example.com",
  timestamp: "2026-05-01T12:30:00+00:00",
  bounce_class: null,
  reason: null,
  target_link_url: null,
  user_agent: "Mozilla/5.0",
};

describe("Campaigns", () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  describe("list", () => {
    it("lists with pagination and status filter", async () => {
      const responseData = { campaigns: [summary], pagination };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          message: "Campaigns retrieved successfully.",
          data: responseData,
        }),
      });

      const client = new Lettr("test-api-key");
      const result = await client.campaigns.list({
        page: 1,
        per_page: 20,
        status: "sent",
      });

      expect(result.data).toEqual(responseData);
      expect(result.error).toBeNull();

      const calledUrl = mockFetch.mock.calls[0]![0] as string;
      expect(calledUrl).toBe(
        "https://app.lettr.com/api/campaigns?page=1&per_page=20&status=sent"
      );
    });

    it("lists without params", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          message: "Campaigns retrieved successfully.",
          data: { campaigns: [], pagination },
        }),
      });

      const client = new Lettr("test-api-key");
      const result = await client.campaigns.list();

      expect(result.data!.campaigns).toEqual([]);
      expect(result.error).toBeNull();

      const calledUrl = mockFetch.mock.calls[0]![0] as string;
      expect(calledUrl).toBe("https://app.lettr.com/api/campaigns");
    });

    it("returns api error on 401", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ message: "API key is required." }),
      });

      const client = new Lettr("bad-key");
      const result = await client.campaigns.list();

      expect(result.data).toBeNull();
      expect(result.error).toEqual({
        type: "api",
        message: "API key is required.",
        error_code: "unauthorized",
      });
    });
  });

  describe("get", () => {
    it("returns campaign detail with html content", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          message: "Campaign retrieved successfully.",
          data: detail,
        }),
      });

      const client = new Lettr("test-api-key");
      const result = await client.campaigns.get(summary.id);

      expect(result.data).toEqual(detail);
      expect(result.data!.html_content).toBe("<h1>Spring is here</h1>");
      expect(result.error).toBeNull();

      const calledUrl = mockFetch.mock.calls[0]![0] as string;
      expect(calledUrl).toBe(
        `https://app.lettr.com/api/campaigns/${summary.id}`
      );
    });

    it("returns error on 404", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({
          message: "Campaign not found.",
          error_code: "not_found",
        }),
      });

      const client = new Lettr("test-api-key");
      const result = await client.campaigns.get("nonexistent");

      expect(result.data).toBeNull();
      expect(result.error).toEqual({
        type: "api",
        message: "Campaign not found.",
        error_code: "not_found",
      });
    });
  });

  describe("listEvents", () => {
    it("lists events with filters and cursor", async () => {
      const responseData = { events: [event], next_cursor: "next-page-cursor" };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          message: "Campaign events retrieved successfully.",
          data: responseData,
        }),
      });

      const client = new Lettr("test-api-key");
      const result = await client.campaigns.listEvents(summary.id, {
        event_type: "open",
        limit: 25,
        cursor: "prev-cursor",
      });

      expect(result.data).toEqual(responseData);
      expect(result.error).toBeNull();

      const calledUrl = mockFetch.mock.calls[0]![0] as string;
      expect(calledUrl).toBe(
        `https://app.lettr.com/api/campaigns/${summary.id}/events?event_type=open&limit=25&cursor=prev-cursor`
      );
    });

    it("returns null next_cursor on the last page", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          message: "Campaign events retrieved successfully.",
          data: { events: [event], next_cursor: null },
        }),
      });

      const client = new Lettr("test-api-key");
      const result = await client.campaigns.listEvents(summary.id);

      expect(result.data!.next_cursor).toBeNull();
      expect(result.error).toBeNull();

      const calledUrl = mockFetch.mock.calls[0]![0] as string;
      expect(calledUrl).toBe(
        `https://app.lettr.com/api/campaigns/${summary.id}/events`
      );
    });
  });

  describe("send", () => {
    it("sends a campaign and returns the message wrapper", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 202,
        json: async () => ({
          message: "Campaign scheduled for delivery.",
          data: { ...summary, status: "preparing" },
        }),
      });

      const client = new Lettr("test-api-key");
      const result = await client.campaigns.send(summary.id);

      expect(result.error).toBeNull();
      expect(result.data!.message).toBe("Campaign scheduled for delivery.");
      expect(result.data!.data!.status).toBe("preparing");

      const calledUrl = mockFetch.mock.calls[0]![0] as string;
      expect(calledUrl).toBe(
        `https://app.lettr.com/api/campaigns/${summary.id}/send`
      );

      const [, init] = mockFetch.mock.calls[0]!;
      expect(init.method).toBe("POST");
      expect(init.body).toBeUndefined();
    });

    it("preserves the message when data is omitted", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 202,
        json: async () => ({ message: "Campaign scheduled for delivery." }),
      });

      const client = new Lettr("test-api-key");
      const result = await client.campaigns.send(summary.id);

      expect(result.error).toBeNull();
      expect(result.data!.message).toBe("Campaign scheduled for delivery.");
      expect(result.data!.data).toBeUndefined();
    });

    it("surfaces a precondition failure (422) with its error_code", async () => {
      // The API returns 422 with an `error_code` (campaign_not_sendable) and no
      // field `errors`. HttpClient maps every 422 to a validation error, but the
      // `error_code` is preserved so callers can discriminate precondition cases
      // without string-matching the message.
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 422,
        json: async () => ({
          message: "Campaign can only be sent from draft status.",
          error_code: "campaign_not_sendable",
        }),
      });

      const client = new Lettr("test-api-key");
      const result = await client.campaigns.send(summary.id);

      expect(result.data).toBeNull();
      expect(result.error).toEqual({
        type: "validation",
        message: "Campaign can only be sent from draft status.",
        errors: {},
        error_code: "campaign_not_sendable",
      });
    });
  });

  describe("schedule", () => {
    it("schedules a campaign with a future time", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          message: "Campaign scheduled.",
          data: {
            ...summary,
            status: "scheduled",
            scheduled_at: "2026-06-01T09:00:00+00:00",
          },
        }),
      });

      const client = new Lettr("test-api-key");
      const result = await client.campaigns.schedule(summary.id, {
        scheduled_at: "2026-06-01T09:00:00+00:00",
      });

      expect(result.error).toBeNull();
      expect(result.data!.data!.status).toBe("scheduled");

      const calledUrl = mockFetch.mock.calls[0]![0] as string;
      expect(calledUrl).toBe(
        `https://app.lettr.com/api/campaigns/${summary.id}/schedule`
      );

      const [, init] = mockFetch.mock.calls[0]!;
      expect(init.method).toBe("POST");
      const body = JSON.parse(init.body as string);
      expect(body.scheduled_at).toBe("2026-06-01T09:00:00+00:00");
    });

    it("returns validation error on a past date", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 422,
        json: async () => ({
          message: "Validation failed.",
          error_code: "validation_error",
          errors: {
            scheduled_at: ["The scheduled delivery time must be in the future."],
          },
        }),
      });

      const client = new Lettr("test-api-key");
      const result = await client.campaigns.schedule(summary.id, {
        scheduled_at: "2020-01-01T00:00:00+00:00",
      });

      expect(result.data).toBeNull();
      expect(result.error).toEqual({
        type: "validation",
        message: "Validation failed.",
        errors: {
          scheduled_at: ["The scheduled delivery time must be in the future."],
        },
        error_code: "validation_error",
      });
    });
  });

  describe("unschedule", () => {
    it("unschedules a campaign", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          message: "Campaign unscheduled.",
          data: { ...summary, status: "draft", scheduled_at: null },
        }),
      });

      const client = new Lettr("test-api-key");
      const result = await client.campaigns.unschedule(summary.id);

      expect(result.error).toBeNull();
      expect(result.data!.message).toBe("Campaign unscheduled.");
      expect(result.data!.data!.status).toBe("draft");

      const calledUrl = mockFetch.mock.calls[0]![0] as string;
      expect(calledUrl).toBe(
        `https://app.lettr.com/api/campaigns/${summary.id}/unschedule`
      );

      const [, init] = mockFetch.mock.calls[0]!;
      expect(init.method).toBe("POST");
      expect(init.body).toBeUndefined();
    });

    it("surfaces a precondition failure (422) with its error_code", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 422,
        json: async () => ({
          message: "Only scheduled campaigns can be unscheduled.",
          error_code: "campaign_not_scheduled",
        }),
      });

      const client = new Lettr("test-api-key");
      const result = await client.campaigns.unschedule(summary.id);

      expect(result.data).toBeNull();
      expect(result.error).toEqual({
        type: "validation",
        message: "Only scheduled campaigns can be unscheduled.",
        errors: {},
        error_code: "campaign_not_scheduled",
      });
    });
  });

  describe("empty campaignId guard", () => {
    it("rejects empty id at the SDK boundary without hitting the network", async () => {
      const client = new Lettr("test-api-key");

      const get = await client.campaigns.get("");
      const events = await client.campaigns.listEvents("");
      const send = await client.campaigns.send("");
      const sched = await client.campaigns.schedule("", {
        scheduled_at: "2026-06-01T09:00:00+00:00",
      });
      const unsched = await client.campaigns.unschedule("");

      for (const result of [get, events, send, sched, unsched]) {
        expect(result.data).toBeNull();
        expect(result.error).toEqual({
          type: "validation",
          message: "campaignId is required.",
          errors: { campaignId: ["campaignId is required."] },
        });
      }
      expect(mockFetch).not.toHaveBeenCalled();
    });
  });
});
