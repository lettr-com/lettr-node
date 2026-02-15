import { describe, it, expect, beforeEach, mock } from "bun:test";
import { Lettr } from "./client";
import type { Domain, DomainDetail } from "./types";

const mockFetch = mock();
globalThis.fetch = mockFetch as unknown as typeof fetch;

describe("Domains", () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  describe("list", () => {
    it("returns list of domains", async () => {
      const responseData = {
        domains: [
          {
            domain: "example.com",
            status: "approved" as const,
            status_label: "Approved",
            can_send: true,
            cname_status: "valid",
            dkim_status: "valid",
            created_at: "2024-01-15T10:30:00+00:00",
            updated_at: "2024-01-16T14:45:00+00:00",
          } satisfies Domain,
        ],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ message: "Domains retrieved successfully.", data: responseData }),
      });

      const client = new Lettr("test-api-key");
      const result = await client.domains.list();

      expect(result.data).toEqual(responseData);
      expect(result.error).toBeNull();
    });
  });

  describe("create", () => {
    it("returns created domain with DKIM info", async () => {
      const responseData = {
        domain: "example.com",
        status: "pending",
        status_label: "Pending Review",
        dkim: {
          public: "MIGfMA0GCSqGSIb3DQEBA...",
          selector: "scph0123",
          headers: "from:to:subject:date",
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => ({ message: "Domain created successfully.", data: responseData }),
      });

      const client = new Lettr("test-api-key");
      const result = await client.domains.create("example.com");

      expect(result.data).toEqual(responseData);
      expect(result.error).toBeNull();

      const [, init] = mockFetch.mock.calls[0]!;
      expect(JSON.parse(init.body as string)).toEqual({ domain: "example.com" });
    });

    it("returns error on 409 conflict", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 409,
        json: async () => ({
          message: "This domain is already registered.",
          error_code: "resource_already_exists",
        }),
      });

      const client = new Lettr("test-api-key");
      const result = await client.domains.create("example.com");

      expect(result.data).toBeNull();
      expect(result.error).toEqual({
        type: "api",
        message: "This domain is already registered.",
        error_code: "resource_already_exists",
      });
    });
  });

  describe("get", () => {
    it("returns domain detail with DNS records", async () => {
      const responseData: DomainDetail = {
        domain: "example.com",
        status: "approved",
        status_label: "Approved",
        can_send: true,
        cname_status: "valid",
        dkim_status: "valid",
        tracking_domain: "tracking.example.com",
        dns: {
          dkim: {
            selector: "scph0123",
            public: "MIGfMA0GCSqGSIb3DQEBA...",
          },
        },
        created_at: "2024-01-15T10:30:00+00:00",
        updated_at: "2024-01-16T14:45:00+00:00",
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ message: "Domain retrieved successfully.", data: responseData }),
      });

      const client = new Lettr("test-api-key");
      const result = await client.domains.get("example.com");

      expect(result.data).toEqual(responseData);
      expect(result.error).toBeNull();
    });

    it("returns error on 404", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({
          message: "Domain not found.",
          error_code: "not_found",
        }),
      });

      const client = new Lettr("test-api-key");
      const result = await client.domains.get("nonexistent.com");

      expect(result.data).toBeNull();
      expect(result.error).toEqual({
        type: "api",
        message: "Domain not found.",
        error_code: "not_found",
      });
    });
  });

  describe("delete", () => {
    it("returns void on 204 success", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 204,
      });

      const client = new Lettr("test-api-key");
      const result = await client.domains.delete("example.com");

      expect(result.data).toBeUndefined();
      expect(result.error).toBeNull();

      const calledUrl = mockFetch.mock.calls[0]![0] as string;
      expect(calledUrl).toBe("https://app.lettr.com/api/domains/example.com");

      const [, init] = mockFetch.mock.calls[0]!;
      expect(init.method).toBe("DELETE");
    });

    it("returns error on 404", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({
          message: "Domain not found.",
          error_code: "not_found",
        }),
      });

      const client = new Lettr("test-api-key");
      const result = await client.domains.delete("nonexistent.com");

      expect(result.data).toBeNull();
      expect(result.error).toEqual({
        type: "api",
        message: "Domain not found.",
        error_code: "not_found",
      });
    });
  });

  describe("verify", () => {
    it("returns verification results", async () => {
      const responseData = {
        domain: "example.com",
        dkim_status: "valid",
        cname_status: "valid",
        ownership_verified: "true",
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ message: "Domain verification completed.", data: responseData }),
      });

      const client = new Lettr("test-api-key");
      const result = await client.domains.verify("example.com");

      expect(result.data).toEqual(responseData);
      expect(result.error).toBeNull();

      const calledUrl = mockFetch.mock.calls[0]![0] as string;
      expect(calledUrl).toBe("https://app.lettr.com/api/domains/example.com/verify");

      const [, init] = mockFetch.mock.calls[0]!;
      expect(init.method).toBe("POST");
    });

    it("returns unverified status", async () => {
      const responseData = {
        domain: "example.com",
        dkim_status: "unverified",
        cname_status: "unverified",
        ownership_verified: null,
        dns: {
          dkim_record: null,
          cname_record: null,
          dkim_error: "DKIM record not found",
          cname_error: "CNAME record not found",
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ message: "Domain verification completed.", data: responseData }),
      });

      const client = new Lettr("test-api-key");
      const result = await client.domains.verify("example.com");

      expect(result.data).toEqual(responseData);
      expect(result.error).toBeNull();
    });
  });
});
