import { describe, it, expect, beforeEach, mock } from "bun:test";
import { Lettr } from "./client";
import type { SendEmailRequest } from "./types";

const mockFetch = mock();

globalThis.fetch = mockFetch as unknown as typeof fetch;

const validRequest: SendEmailRequest = {
  from: "sender@example.com",
  to: ["recipient@example.com"],
  subject: "Test Email",
  html: "<p>Hello</p>",
};

describe("Lettr", () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  describe("emails.send", () => {
    it("returns data on successful response", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          message: "Email queued for delivery.",
          data: {
            request_id: "abc123",
            accepted: 1,
            rejected: 0,
          },
        }),
      });

      const client = new Lettr("test-api-key");
      const result = await client.emails.send(validRequest);

      expect(result.data).toEqual({
        request_id: "abc123",
        accepted: 1,
        rejected: 0,
      });
      expect(result.error).toBeNull();
    });

    it("returns validation error on 422 response", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 422,
        json: async () => ({
          success: false,
          message: "Validation failed.",
          errors: {
            from: ["The sender email address is required."],
            to: ["At least one recipient is required."],
          },
        }),
      });

      const client = new Lettr("test-api-key");
      const result = await client.emails.send(validRequest);

      expect(result.data).toBeNull();
      expect(result.error).toEqual({
        type: "validation",
        message: "Validation failed.",
        errors: {
          from: ["The sender email address is required."],
          to: ["At least one recipient is required."],
        },
      });
    });

    it("returns api error on 400 response", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({
          success: false,
          message: "Failed to send email.",
          errors: ["Invalid sender domain"],
        }),
      });

      const client = new Lettr("test-api-key");
      const result = await client.emails.send(validRequest);

      expect(result.data).toBeNull();
      expect(result.error).toEqual({
        type: "api",
        message: "Failed to send email.",
        errors: ["Invalid sender domain"],
      });
    });

    it("returns api error on 502 response", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 502,
        json: async () => ({
          success: false,
          message: "Email transmission failed.",
          errors: ["Upstream provider error"],
        }),
      });

      const client = new Lettr("test-api-key");
      const result = await client.emails.send(validRequest);

      expect(result.data).toBeNull();
      expect(result.error).toEqual({
        type: "api",
        message: "Email transmission failed.",
        errors: ["Upstream provider error"],
      });
    });

    it("returns network error when fetch fails", async () => {
      mockFetch.mockRejectedValueOnce(new Error("Network error"));

      const client = new Lettr("test-api-key");
      const result = await client.emails.send(validRequest);

      expect(result.data).toBeNull();
      expect(result.error).toEqual({
        type: "network",
        message: "Failed to connect to Lettr API",
      });
    });

    it("sends correct headers and body", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          data: { request_id: "abc123", accepted: 1, rejected: 0 },
        }),
      });

      const client = new Lettr("my-secret-key");
      await client.emails.send(validRequest);

      expect(mockFetch).toHaveBeenCalledWith(
        "https://app.uselettr.com/api/emails",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer my-secret-key",
          },
          body: JSON.stringify(validRequest),
        }
      );
    });

    it("handles request with all optional fields", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          data: { request_id: "xyz789", accepted: 3, rejected: 1 },
        }),
      });

      const fullRequest: SendEmailRequest = {
        from: "sender@example.com",
        from_name: "Sender Name",
        to: ["user1@example.com", "user2@example.com"],
        cc: ["cc@example.com"],
        bcc: ["bcc@example.com"],
        subject: "Full Test",
        html: "<h1>Hello</h1>",
        text: "Hello",
        reply_to: "reply@example.com",
        reply_to_name: "Reply Name",
        campaign_id: "test-campaign",
        metadata: { user_id: "123" },
        substitution_data: { name: "John" },
        options: {
          click_tracking: true,
          open_tracking: false,
          transactional: true,
        },
        attachments: [
          {
            name: "test.pdf",
            type: "application/pdf",
            data: "base64data",
          },
        ],
      };

      const client = new Lettr("test-api-key");
      const result = await client.emails.send(fullRequest);

      expect(result.data).toEqual({
        request_id: "xyz789",
        accepted: 3,
        rejected: 1,
      });
      expect(result.error).toBeNull();
    });
  });
});
