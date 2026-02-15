import { describe, it, expect, beforeEach, mock } from "bun:test";
import { HttpClient } from "./http";

const mockFetch = mock();
globalThis.fetch = mockFetch as unknown as typeof fetch;

describe("HttpClient", () => {
  const http = new HttpClient("https://api.example.com", "test-key");

  beforeEach(() => {
    mockFetch.mockReset();
  });

  describe("request basics", () => {
    it("sends correct auth headers", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ message: "ok", data: {} }),
      });

      await http.request("GET", "/test");

      expect(mockFetch).toHaveBeenCalledWith("https://api.example.com/test", {
        method: "GET",
        headers: { Authorization: "Bearer test-key" },
      });
    });

    it("sends JSON body with Content-Type header", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ message: "ok", data: { id: 1 } }),
      });

      await http.request("POST", "/test", { body: { name: "foo" } });

      expect(mockFetch).toHaveBeenCalledWith("https://api.example.com/test", {
        method: "POST",
        headers: {
          Authorization: "Bearer test-key",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: "foo" }),
      });
    });

    it("serializes query params", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ message: "ok", data: [] }),
      });

      await http.request("GET", "/test", {
        query: { page: 2, per_page: 10, filter: undefined },
      });

      const calledUrl = mockFetch.mock.calls[0]![0] as string;
      expect(calledUrl).toBe("https://api.example.com/test?page=2&per_page=10");
    });

    it("omits query string when no params defined", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ message: "ok", data: {} }),
      });

      await http.request("GET", "/test", { query: {} });

      const calledUrl = mockFetch.mock.calls[0]![0] as string;
      expect(calledUrl).toBe("https://api.example.com/test");
    });
  });

  describe("success responses", () => {
    it("unwraps envelope data by default", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          message: "Success",
          data: { id: 1, name: "test" },
        }),
      });

      const result = await http.request<{ id: number; name: string }>(
        "GET",
        "/test"
      );

      expect(result.data).toEqual({ id: 1, name: "test" });
      expect(result.error).toBeNull();
    });

    it("returns full body when unwrap is false", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          message: "Deleted",
        }),
      });

      const result = await http.request<{ message: string }>("DELETE", "/test", {
        unwrap: false,
      });

      expect(result.data).toEqual({ message: "Deleted" });
      expect(result.error).toBeNull();
    });

    it("handles 204 no-content responses", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 204,
      });

      const result = await http.request<void>("DELETE", "/test");

      expect(result.data).toBeUndefined();
      expect(result.error).toBeNull();
    });

    it("falls back to full body when no data field", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ status: "ok" }),
      });

      const result = await http.request<{ status: string }>("GET", "/health");

      expect(result.data).toEqual({ status: "ok" });
      expect(result.error).toBeNull();
    });
  });

  describe("error responses", () => {
    it("returns validation error on 422", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 422,
        json: async () => ({
          message: "Validation failed.",
          error_code: "validation_error",
          errors: { name: ["Name is required."] },
        }),
      });

      const result = await http.request("POST", "/test");

      expect(result.data).toBeNull();
      expect(result.error).toEqual({
        type: "validation",
        message: "Validation failed.",
        errors: { name: ["Name is required."] },
      });
    });

    it("returns api error on 401 without error_code", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({
          message: "API key is required.",
        }),
      });

      const result = await http.request("GET", "/test");

      expect(result.data).toBeNull();
      expect(result.error).toEqual({
        type: "api",
        message: "API key is required.",
        error_code: "unauthorized",
      });
    });

    it("returns api error on 400", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({
          message: "Invalid domain.",
          error_code: "invalid_domain",
        }),
      });

      const result = await http.request("POST", "/test");

      expect(result.data).toBeNull();
      expect(result.error).toEqual({
        type: "api",
        message: "Invalid domain.",
        error_code: "invalid_domain",
      });
    });

    it("returns api error on 409", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 409,
        json: async () => ({
          message: "This domain is already registered.",
          error_code: "resource_already_exists",
        }),
      });

      const result = await http.request("POST", "/test");

      expect(result.data).toBeNull();
      expect(result.error).toEqual({
        type: "api",
        message: "This domain is already registered.",
        error_code: "resource_already_exists",
      });
    });

    it("returns api error on 502", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 502,
        json: async () => ({
          message: "Transmission failed.",
          error_code: "transmission_failed",
        }),
      });

      const result = await http.request("POST", "/test");

      expect(result.data).toBeNull();
      expect(result.error).toEqual({
        type: "api",
        message: "Transmission failed.",
        error_code: "transmission_failed",
      });
    });

    it("returns network error when fetch throws", async () => {
      mockFetch.mockRejectedValueOnce(new Error("connection refused"));

      const result = await http.request("GET", "/test");

      expect(result.data).toBeNull();
      expect(result.error).toEqual({
        type: "network",
        message: "Failed to connect to Lettr API",
      });
    });
  });
});
