import { describe, it, expect, beforeEach, mock } from "bun:test";
import { Lettr } from "./client";
import type { Webhook } from "./types";

const mockFetch = mock();
globalThis.fetch = mockFetch as unknown as typeof fetch;

const webhookData: Webhook = {
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

describe("Webhooks", () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  describe("list", () => {
    it("returns list of webhooks", async () => {
      const responseData = { webhooks: [webhookData] };

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

  describe("create", () => {
    it("creates a webhook with basic auth", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => ({ message: "Webhook created successfully.", data: webhookData }),
      });

      const client = new Lettr("test-api-key");
      const result = await client.webhooks.create({
        name: "Order Notifications",
        url: "https://example.com/webhook",
        auth_type: "basic",
        auth_username: "user",
        auth_password: "secret",
        events_mode: "selected",
        events: ["message.delivery", "message.bounce"],
      });

      expect(result.data).toEqual(webhookData);
      expect(result.error).toBeNull();

      const calledUrl = mockFetch.mock.calls[0]![0] as string;
      expect(calledUrl).toBe("https://app.lettr.com/api/webhooks");

      const [, init] = mockFetch.mock.calls[0]!;
      expect(init.method).toBe("POST");
      const body = JSON.parse(init.body as string);
      expect(body.name).toBe("Order Notifications");
      expect(body.auth_type).toBe("basic");
      expect(body.events_mode).toBe("selected");
    });

    it("creates a webhook with no auth and all events", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => ({
          message: "Webhook created successfully.",
          data: { ...webhookData, auth_type: "none", has_auth_credentials: false, event_types: null },
        }),
      });

      const client = new Lettr("test-api-key");
      const result = await client.webhooks.create({
        name: "All Events",
        url: "https://example.com/webhook",
        auth_type: "none",
        events_mode: "all",
      });

      expect(result.data!.auth_type).toBe("none");
      expect(result.data!.event_types).toBeNull();
      expect(result.error).toBeNull();
    });

    it("returns validation error on 422", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 422,
        json: async () => ({
          message: "Validation failed.",
          errors: {
            url: ["The url field is required."],
          },
        }),
      });

      const client = new Lettr("test-api-key");
      const result = await client.webhooks.create({
        name: "Bad Webhook",
        url: "",
        auth_type: "none",
        events_mode: "all",
      });

      expect(result.data).toBeNull();
      expect(result.error).toEqual({
        type: "validation",
        message: "Validation failed.",
        errors: { url: ["The url field is required."] },
      });
    });
  });

  describe("get", () => {
    it("returns webhook details", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ message: "Webhook retrieved successfully.", data: webhookData }),
      });

      const client = new Lettr("test-api-key");
      const result = await client.webhooks.get("webhook-abc123");

      expect(result.data).toEqual(webhookData);
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

  describe("update", () => {
    it("updates a webhook", async () => {
      const updatedData = { ...webhookData, name: "Updated Webhook" };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ message: "Webhook updated successfully.", data: updatedData }),
      });

      const client = new Lettr("test-api-key");
      const result = await client.webhooks.update("webhook-abc123", {
        name: "Updated Webhook",
      });

      expect(result.data).toEqual(updatedData);
      expect(result.error).toBeNull();

      const calledUrl = mockFetch.mock.calls[0]![0] as string;
      expect(calledUrl).toBe("https://app.lettr.com/api/webhooks/webhook-abc123");

      const [, init] = mockFetch.mock.calls[0]!;
      expect(init.method).toBe("PUT");
      const body = JSON.parse(init.body as string);
      expect(body.name).toBe("Updated Webhook");
    });

    it("sends new url field to API", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ message: "Webhook updated successfully.", data: webhookData }),
      });

      const client = new Lettr("test-api-key");
      await client.webhooks.update("webhook-abc123", {
        url: "https://new.example.com/hook",
      });

      const [, init] = mockFetch.mock.calls[0]!;
      const body = JSON.parse(init.body as string);
      expect(body.url).toBe("https://new.example.com/hook");
      expect(body.target).toBeUndefined();
    });

    it("translates deprecated target to url", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ message: "Webhook updated successfully.", data: webhookData }),
      });

      const client = new Lettr("test-api-key");
      await client.webhooks.update("webhook-abc123", {
        target: "https://legacy.example.com/hook",
      });

      const [, init] = mockFetch.mock.calls[0]!;
      const body = JSON.parse(init.body as string);
      expect(body.url).toBe("https://legacy.example.com/hook");
      expect(body.target).toBeUndefined();
    });

    it("updates webhook active status", async () => {
      const updatedData = { ...webhookData, enabled: false };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ message: "Webhook updated successfully.", data: updatedData }),
      });

      const client = new Lettr("test-api-key");
      const result = await client.webhooks.update("webhook-abc123", {
        active: false,
      });

      expect(result.data!.enabled).toBe(false);
      expect(result.error).toBeNull();
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
      const result = await client.webhooks.update("nonexistent", { name: "Test" });

      expect(result.data).toBeNull();
      expect(result.error).toEqual({
        type: "api",
        message: "Webhook not found.",
        error_code: "not_found",
      });
    });
  });

  describe("delete", () => {
    it("deletes a webhook", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ message: "Webhook deleted successfully." }),
      });

      const client = new Lettr("test-api-key");
      const result = await client.webhooks.delete("webhook-abc123");

      expect(result.data).toEqual({ message: "Webhook deleted successfully." });
      expect(result.error).toBeNull();

      const calledUrl = mockFetch.mock.calls[0]![0] as string;
      expect(calledUrl).toBe("https://app.lettr.com/api/webhooks/webhook-abc123");

      const [, init] = mockFetch.mock.calls[0]!;
      expect(init.method).toBe("DELETE");
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
      const result = await client.webhooks.delete("nonexistent");

      expect(result.data).toBeNull();
      expect(result.error).toEqual({
        type: "api",
        message: "Webhook not found.",
        error_code: "not_found",
      });
    });
  });
});
