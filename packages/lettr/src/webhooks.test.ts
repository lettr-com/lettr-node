import { describe, it, expect, beforeEach, mock } from "bun:test";
import { Lettr } from "./client";

const mockFetch = mock();
globalThis.fetch = mockFetch as unknown as typeof fetch;

describe("Webhooks", () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  describe("list", () => {
    it("returns list of webhooks", async () => {
      const responseData = {
        webhooks: [
          {
            id: "webhook-abc123",
            name: "Order Notifications",
            url: "https://example.com/webhook",
            enabled: true,
            event_types: ["message.delivery", "message.bounce"],
            auth_type: "basic",
            has_auth_credentials: true,
            last_successful_at: "2024-01-15T10:30:00+00:00",
            last_failure_at: null,
            last_status: "success",
          },
        ],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ message: "Webhooks retrieved successfully.", data: responseData }),
      });

      const client = new Lettr("test-api-key");
      const result = await client.webhooks.list();

      expect(result.data).toEqual(responseData);
      expect(result.error).toBeNull();
    });

    it("returns api error on 401", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ message: "API key is required." }),
      });

      const client = new Lettr("bad-key");
      const result = await client.webhooks.list();

      expect(result.data).toBeNull();
      expect(result.error).toEqual({
        type: "api",
        message: "API key is required.",
        error_code: "unauthorized",
      });
    });
  });

  describe("get", () => {
    it("returns webhook details", async () => {
      const responseData = {
        id: "webhook-abc123",
        name: "Order Notifications",
        url: "https://example.com/webhook",
        enabled: true,
        event_types: ["message.delivery", "message.bounce"],
        auth_type: "basic",
        has_auth_credentials: true,
        last_successful_at: "2024-01-15T10:30:00+00:00",
        last_failure_at: null,
        last_status: "success",
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ message: "Webhook retrieved successfully.", data: responseData }),
      });

      const client = new Lettr("test-api-key");
      const result = await client.webhooks.get("webhook-abc123");

      expect(result.data).toEqual(responseData);
      expect(result.error).toBeNull();

      const calledUrl = mockFetch.mock.calls[0]![0] as string;
      expect(calledUrl).toBe("https://app.lettr.com/api/webhooks/webhook-abc123");
    });

    it("returns error on 404", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({
          message: "Webhook not found.",
          error_code: "not_found",
        }),
      });

      const client = new Lettr("test-api-key");
      const result = await client.webhooks.get("nonexistent");

      expect(result.data).toBeNull();
      expect(result.error).toEqual({
        type: "api",
        message: "Webhook not found.",
        error_code: "not_found",
      });
    });
  });
});
