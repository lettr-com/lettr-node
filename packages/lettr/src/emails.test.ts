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

describe("Emails", () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  describe("send", () => {
    it("returns data on successful response", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
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
        message: "Email queued for delivery.",
      });
      expect(result.error).toBeNull();
    });

    it("returns validation error on 422 response", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 422,
        json: async () => ({
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
          message: "Failed to send email.",
          error_code: "invalid_domain",
        }),
      });

      const client = new Lettr("test-api-key");
      const result = await client.emails.send(validRequest);

      expect(result.data).toBeNull();
      expect(result.error).toEqual({
        type: "api",
        message: "Failed to send email.",
        error_code: "invalid_domain",
      });
    });

    it("returns api error on 502 response", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 502,
        json: async () => ({
          message: "Email transmission failed.",
          error_code: "transmission_failed",
        }),
      });

      const client = new Lettr("test-api-key");
      const result = await client.emails.send(validRequest);

      expect(result.data).toBeNull();
      expect(result.error).toEqual({
        type: "api",
        message: "Email transmission failed.",
        error_code: "transmission_failed",
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
          message: "Email queued for delivery.",
          data: { request_id: "abc123", accepted: 1, rejected: 0 },
        }),
      });

      const client = new Lettr("my-secret-key");
      await client.emails.send(validRequest);

      expect(mockFetch).toHaveBeenCalledWith(
        "https://app.lettr.com/api/emails",
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

    it("sends template email without subject", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          message: "Email queued for delivery.",
          data: { request_id: "tmpl123", accepted: 1, rejected: 0 },
        }),
      });

      const templateRequest: SendEmailRequest = {
        from: "sender@example.com",
        to: ["recipient@example.com"],
        template_slug: "welcome",
      };

      const client = new Lettr("test-api-key");
      await client.emails.send(templateRequest);

      const body = JSON.parse(mockFetch.mock.calls[0]![1]!.body as string);
      expect(body).not.toHaveProperty("subject");
      expect(body.template_slug).toBe("welcome");
    });

    it("sends template email with subject override", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          message: "Email queued for delivery.",
          data: { request_id: "tmpl456", accepted: 1, rejected: 0 },
        }),
      });

      const templateRequest: SendEmailRequest = {
        from: "sender@example.com",
        to: ["recipient@example.com"],
        template_slug: "welcome",
        subject: "Custom Subject",
      };

      const client = new Lettr("test-api-key");
      await client.emails.send(templateRequest);

      const body = JSON.parse(mockFetch.mock.calls[0]![1]!.body as string);
      expect(body.template_slug).toBe("welcome");
      expect(body.subject).toBe("Custom Subject");
    });

    it("handles request with all optional fields", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          message: "Email queued for delivery.",
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
        message: "Email queued for delivery.",
      });
      expect(result.error).toBeNull();
    });
  });

  describe("list", () => {
    it("returns paginated email list", async () => {
      const responseData = {
        results: [
          {
            event_id: "abc123",
            timestamp: "2024-01-15T10:30:00.000Z",
            request_id: "trans-456",
            message_id: "msg-789",
            subject: "Welcome",
            friendly_from: "sender@example.com",
            sending_domain: "example.com",
            rcpt_to: "recipient@example.com",
            raw_rcpt_to: "recipient@example.com",
            recipient_domain: "example.com",
            mailbox_provider: "gmail",
            mailbox_provider_region: "us",
            sending_ip: "192.168.1.1",
            click_tracking: true,
            open_tracking: true,
            transactional: true,
            msg_size: 1024,
            injection_time: "2024-01-15T10:30:00.000Z",
            rcpt_meta: {},
          },
        ],
        total_count: 1,
        pagination: { next_cursor: null, per_page: 25 },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ message: "Emails retrieved successfully.", data: responseData }),
      });

      const client = new Lettr("test-api-key");
      const result = await client.emails.list({ per_page: 25, recipients: "test@example.com" });

      expect(result.data).toEqual(responseData);
      expect(result.error).toBeNull();

      const calledUrl = mockFetch.mock.calls[0]![0] as string;
      expect(calledUrl).toContain("per_page=25");
      expect(calledUrl).toContain("recipients=test%40example.com");
    });
  });

  describe("get", () => {
    it("returns email events for a request ID", async () => {
      const responseData = {
        results: [
          {
            event_id: "event-123",
            type: "injection",
            timestamp: "2024-01-15T10:30:00.000Z",
            request_id: "trans-456",
            message_id: "msg-789",
            subject: "Welcome to Lettr",
            friendly_from: "sender@example.com",
            sending_domain: "example.com",
            rcpt_to: "recipient@example.com",
            raw_rcpt_to: "recipient@example.com",
            recipient_domain: "example.com",
            mailbox_provider: "gmail",
            mailbox_provider_region: "us",
            sending_ip: "192.168.1.1",
            click_tracking: true,
            open_tracking: true,
            transactional: true,
            msg_size: 1024,
            injection_time: "2024-01-15T10:30:00.000Z",
            reason: null,
            raw_reason: null,
            error_code: null,
            rcpt_meta: {},
          },
        ],
        total_count: 1,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ message: "Email retrieved successfully.", data: responseData }),
      });

      const client = new Lettr("test-api-key");
      const result = await client.emails.get("trans-456");

      expect(result.data).toEqual(responseData);
      expect(result.error).toBeNull();

      const calledUrl = mockFetch.mock.calls[0]![0] as string;
      expect(calledUrl).toBe("https://app.lettr.com/api/emails/trans-456");
    });

    it("returns api error on 404", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({
          message: "Email not found.",
          error_code: "not_found",
        }),
      });

      const client = new Lettr("test-api-key");
      const result = await client.emails.get("nonexistent");

      expect(result.data).toBeNull();
      expect(result.error).toEqual({
        type: "api",
        message: "Email not found.",
        error_code: "not_found",
      });
    });
  });
});
