import { describe, it, expect, beforeEach, mock } from "bun:test";
import { Lettr } from "./client";

const mockFetch = mock();
globalThis.fetch = mockFetch as unknown as typeof fetch;

describe("Lettr", () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it("mounts all resource classes", () => {
    const client = new Lettr("test-api-key");
    expect(client.emails).toBeDefined();
    expect(client.domains).toBeDefined();
    expect(client.templates).toBeDefined();
    expect(client.webhooks).toBeDefined();
    expect(client.projects).toBeDefined();
  });

  describe("health", () => {
    it("returns health status", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          message: "Health check passed.",
          data: {
            status: "ok",
            timestamp: "2024-01-15T10:30:00.000Z",
          },
        }),
      });

      const client = new Lettr("test-api-key");
      const result = await client.health();

      expect(result.data).toEqual({
        status: "ok",
        timestamp: "2024-01-15T10:30:00.000Z",
      });
      expect(result.error).toBeNull();

      const calledUrl = mockFetch.mock.calls[0]![0] as string;
      expect(calledUrl).toBe("https://app.lettr.com/api/health");
    });

    it("returns network error on failure", async () => {
      mockFetch.mockRejectedValueOnce(new Error("Network error"));

      const client = new Lettr("test-api-key");
      const result = await client.health();

      expect(result.data).toBeNull();
      expect(result.error).toEqual({
        type: "network",
        message: "Failed to connect to Lettr API",
      });
    });
  });

  describe("authCheck", () => {
    it("returns team info on valid key", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          message: "API key is valid.",
          data: {
            team_id: 123,
            timestamp: "2024-01-15T10:30:00.000Z",
          },
        }),
      });

      const client = new Lettr("test-api-key");
      const result = await client.authCheck();

      expect(result.data).toEqual({
        team_id: 123,
        timestamp: "2024-01-15T10:30:00.000Z",
      });
      expect(result.error).toBeNull();

      const calledUrl = mockFetch.mock.calls[0]![0] as string;
      expect(calledUrl).toBe("https://app.lettr.com/api/auth/check");
    });

    it("returns api error on 401", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ message: "API key is required." }),
      });

      const client = new Lettr("bad-key");
      const result = await client.authCheck();

      expect(result.data).toBeNull();
      expect(result.error).toEqual({
        type: "api",
        message: "API key is required.",
        error_code: "unauthorized",
      });
    });
  });
});
