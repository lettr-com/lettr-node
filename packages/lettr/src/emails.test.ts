import { describe, it, expect, beforeEach, mock } from "bun:test";
import { Lettr } from "./client";
import type { SendEmailRequest, ListEmailsResponse, GetEmailResponse } from "./types";

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
        metadata: { user_id: "123" },
        headers: { "X-Custom-ID": "abc-123" },
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

      const body = JSON.parse(mockFetch.mock.calls[0]![1]!.body as string);
      expect(body.headers).toEqual({ "X-Custom-ID": "abc-123" });
    });

    it("sends email with tag field", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          message: "Email queued for delivery.",
          data: { request_id: "tag123", accepted: 1, rejected: 0 },
        }),
      });

      const request: SendEmailRequest = {
        from: "sender@example.com",
        to: ["recipient@example.com"],
        subject: "Tagged",
        html: "<p>Hello</p>",
        tag: "onboarding",
      };

      const client = new Lettr("test-api-key");
      await client.emails.send(request);

      const body = JSON.parse(mockFetch.mock.calls[0]![1]!.body as string);
      expect(body.tag).toBe("onboarding");
    });

    it("sends email with amp_html", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          message: "Email queued for delivery.",
          data: { request_id: "amp123", accepted: 1, rejected: 0 },
        }),
      });

      const request: SendEmailRequest = {
        from: "sender@example.com",
        to: ["recipient@example.com"],
        subject: "AMP Email",
        html: "<p>Fallback</p>",
        amp_html: "<!doctype html><html amp4email>...</html>",
      };

      const client = new Lettr("test-api-key");
      await client.emails.send(request);

      const body = JSON.parse(mockFetch.mock.calls[0]![1]!.body as string);
      expect(body.amp_html).toBe("<!doctype html><html amp4email>...</html>");
    });

    it("sends email with inline_css and perform_substitutions options", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          message: "Email queued for delivery.",
          data: { request_id: "opts123", accepted: 1, rejected: 0 },
        }),
      });

      const request: SendEmailRequest = {
        from: "sender@example.com",
        to: ["recipient@example.com"],
        subject: "Options Test",
        html: "<p>Hello</p>",
        options: {
          inline_css: true,
          perform_substitutions: false,
        },
      };

      const client = new Lettr("test-api-key");
      await client.emails.send(request);

      const body = JSON.parse(mockFetch.mock.calls[0]![1]!.body as string);
      expect(body.options.inline_css).toBe(true);
      expect(body.options.perform_substitutions).toBe(false);
    });

    it("sends email with template_version and project_id", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          message: "Email queued for delivery.",
          data: { request_id: "ver123", accepted: 1, rejected: 0 },
        }),
      });

      const request: SendEmailRequest = {
        from: "sender@example.com",
        to: ["recipient@example.com"],
        template_slug: "welcome",
        template_version: 3,
        project_id: 42,
      };

      const client = new Lettr("test-api-key");
      await client.emails.send(request);

      const body = JSON.parse(mockFetch.mock.calls[0]![1]!.body as string);
      expect(body.template_slug).toBe("welcome");
      expect(body.template_version).toBe(3);
      expect(body.project_id).toBe(42);
    });

    it("sends email with multiple attachments", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          message: "Email queued for delivery.",
          data: { request_id: "att123", accepted: 1, rejected: 0 },
        }),
      });

      const request: SendEmailRequest = {
        from: "sender@example.com",
        to: ["recipient@example.com"],
        subject: "With Attachments",
        html: "<p>See attached</p>",
        attachments: [
          { name: "report.pdf", type: "application/pdf", data: "cGRmZGF0YQ==" },
          { name: "image.png", type: "image/png", data: "aW1hZ2VkYXRh" },
        ],
      };

      const client = new Lettr("test-api-key");
      await client.emails.send(request);

      const body = JSON.parse(mockFetch.mock.calls[0]![1]!.body as string);
      expect(body.attachments).toHaveLength(2);
      expect(body.attachments[0].name).toBe("report.pdf");
      expect(body.attachments[1].name).toBe("image.png");
    });
  });

  describe("schedule", () => {
    it("schedules an email successfully", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => ({
          message: "Email scheduled for delivery.",
          data: {
            request_id: "sched123",
            accepted: 1,
            rejected: 0,
          },
        }),
      });

      const client = new Lettr("test-api-key");
      const result = await client.emails.schedule({
        ...validRequest,
        scheduled_at: "2026-04-01T10:00:00Z",
      });

      expect(result.data).toEqual({
        request_id: "sched123",
        accepted: 1,
        rejected: 0,
        message: "Email scheduled for delivery.",
      });
      expect(result.error).toBeNull();

      const calledUrl = mockFetch.mock.calls[0]![0] as string;
      expect(calledUrl).toBe("https://app.lettr.com/api/emails/scheduled");

      const body = JSON.parse(mockFetch.mock.calls[0]![1]!.body as string);
      expect(body.scheduled_at).toBe("2026-04-01T10:00:00Z");
    });

    it("returns validation error on 422", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 422,
        json: async () => ({
          message: "Validation failed.",
          errors: {
            scheduled_at: ["Must be at least 5 minutes in the future."],
          },
        }),
      });

      const client = new Lettr("test-api-key");
      const result = await client.emails.schedule({
        ...validRequest,
        scheduled_at: "2020-01-01T00:00:00Z",
      });

      expect(result.data).toBeNull();
      expect(result.error).toEqual({
        type: "validation",
        message: "Validation failed.",
        errors: {
          scheduled_at: ["Must be at least 5 minutes in the future."],
        },
      });
    });
  });

  describe("getScheduled", () => {
    it("returns scheduled transmission details", async () => {
      const responseData = {
        transmission_id: "sched123",
        state: "submitted",
        scheduled_at: "2026-04-01T10:00:00+00:00",
        from: "sender@example.com",
        from_name: "Sender Name",
        subject: "Scheduled Email",
        recipients: ["recipient@example.com"],
        num_recipients: 1,
        events: [],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ message: "Scheduled transmission retrieved.", data: responseData }),
      });

      const client = new Lettr("test-api-key");
      const result = await client.emails.getScheduled("sched123");

      expect(result.data).toEqual(responseData);
      expect(result.error).toBeNull();

      const calledUrl = mockFetch.mock.calls[0]![0] as string;
      expect(calledUrl).toBe("https://app.lettr.com/api/emails/scheduled/sched123");
    });

    it("returns error on 404", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({
          message: "Scheduled transmission not found.",
          error_code: "not_found",
        }),
      });

      const client = new Lettr("test-api-key");
      const result = await client.emails.getScheduled("nonexistent");

      expect(result.data).toBeNull();
      expect(result.error).toEqual({
        type: "api",
        message: "Scheduled transmission not found.",
        error_code: "not_found",
      });
    });
  });

  describe("cancelScheduled", () => {
    it("cancels a scheduled email", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ message: "Scheduled transmission cancelled successfully." }),
      });

      const client = new Lettr("test-api-key");
      const result = await client.emails.cancelScheduled("sched123");

      expect(result.data).toEqual({ message: "Scheduled transmission cancelled successfully." });
      expect(result.error).toBeNull();

      const calledUrl = mockFetch.mock.calls[0]![0] as string;
      expect(calledUrl).toBe("https://app.lettr.com/api/emails/scheduled/sched123");

      const [, init] = mockFetch.mock.calls[0]!;
      expect(init.method).toBe("DELETE");
    });

    it("returns error on 404", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({
          message: "Scheduled transmission not found.",
          error_code: "not_found",
        }),
      });

      const client = new Lettr("test-api-key");
      const result = await client.emails.cancelScheduled("nonexistent");

      expect(result.data).toBeNull();
      expect(result.error).toEqual({
        type: "api",
        message: "Scheduled transmission not found.",
        error_code: "not_found",
      });
    });
  });

  describe("listSent", () => {
    it("returns paginated sent emails", async () => {
      const responseData = {
        events: {
          data: [
            {
              event_id: "abc123",
              type: "injection",
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
              rcpt_meta: null,
            },
          ],
          total_count: 1,
          from: "2024-01-01T00:00:00Z",
          to: "2024-01-31T23:59:59Z",
          pagination: { next_cursor: null, per_page: 25 },
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ message: "Emails retrieved.", data: responseData }),
      });

      const client = new Lettr("test-api-key");
      const result = await client.emails.listSent({ per_page: 25 });

      expect(result.data).toEqual(responseData);
      expect(result.error).toBeNull();

      const calledUrl = mockFetch.mock.calls[0]![0] as string;
      expect(calledUrl).toContain("/emails?");
      expect(calledUrl).toContain("per_page=25");
      expect(calledUrl).not.toContain("/emails/events");
    });

    it("passes filter params", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          message: "Emails retrieved.",
          data: {
            events: { data: [], total_count: 0, from: "", to: "", pagination: { next_cursor: null, per_page: 25 } },
          },
        }),
      });

      const client = new Lettr("test-api-key");
      await client.emails.listSent({ recipients: "test@example.com", from: "2024-01-01", to: "2024-01-31" });

      const calledUrl = mockFetch.mock.calls[0]![0] as string;
      expect(calledUrl).toContain("recipients=test%40example.com");
      expect(calledUrl).toContain("from=2024-01-01");
      expect(calledUrl).toContain("to=2024-01-31");
    });
  });

  describe("list", () => {
    it("calls correct endpoint path", async () => {
      const responseData = {
        events: {
          data: [],
          total_count: 0,
          from: "2024-01-01T00:00:00Z",
          to: "2024-01-31T23:59:59Z",
          pagination: { next_cursor: null, per_page: 25 },
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ message: "Events retrieved.", data: responseData }),
      });

      const client = new Lettr("test-api-key");
      await client.emails.list();

      const calledUrl = mockFetch.mock.calls[0]![0] as string;
      expect(calledUrl).toBe("https://app.lettr.com/api/emails/events");
    });

    it("returns paginated email events", async () => {
      const responseData = {
        events: {
          data: [
            {
              event_id: "abc123",
              type: "injection",
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
              rcpt_meta: [],
            },
          ],
          total_count: 1,
          from: "2024-01-01T00:00:00Z",
          to: "2024-01-31T23:59:59Z",
          pagination: { next_cursor: null, per_page: 25 },
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ message: "Events retrieved.", data: responseData }),
      });

      const client = new Lettr("test-api-key");
      const result = await client.emails.list({ per_page: 25, recipients: "test@example.com" });

      expect(result.data).toEqual(responseData as unknown as ListEmailsResponse);
      expect(result.error).toBeNull();

      const calledUrl = mockFetch.mock.calls[0]![0] as string;
      expect(calledUrl).toContain("per_page=25");
      expect(calledUrl).toContain("recipients=test%40example.com");
    });

    it("passes events filter param", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          message: "Events retrieved.",
          data: {
            events: { data: [], total_count: 0, from: "", to: "", pagination: { next_cursor: null, per_page: 25 } },
          },
        }),
      });

      const client = new Lettr("test-api-key");
      await client.emails.list({ events: "delivery,bounce" });

      const calledUrl = mockFetch.mock.calls[0]![0] as string;
      expect(calledUrl).toContain("events=delivery%2Cbounce");
    });

    it("passes transmissions filter param", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          message: "Events retrieved.",
          data: {
            events: { data: [], total_count: 0, from: "", to: "", pagination: { next_cursor: null, per_page: 25 } },
          },
        }),
      });

      const client = new Lettr("test-api-key");
      await client.emails.list({ transmissions: "trans-123" });

      const calledUrl = mockFetch.mock.calls[0]![0] as string;
      expect(calledUrl).toContain("transmissions=trans-123");
    });

    it("passes bounce_classes filter param", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          message: "Events retrieved.",
          data: {
            events: { data: [], total_count: 0, from: "", to: "", pagination: { next_cursor: null, per_page: 25 } },
          },
        }),
      });

      const client = new Lettr("test-api-key");
      await client.emails.list({ bounce_classes: "10,25" });

      const calledUrl = mockFetch.mock.calls[0]![0] as string;
      expect(calledUrl).toContain("bounce_classes=10%2C25");
    });

    it("passes date range params", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          message: "Events retrieved.",
          data: {
            events: { data: [], total_count: 0, from: "", to: "", pagination: { next_cursor: null, per_page: 25 } },
          },
        }),
      });

      const client = new Lettr("test-api-key");
      await client.emails.list({ from: "2024-01-01", to: "2024-01-31" });

      const calledUrl = mockFetch.mock.calls[0]![0] as string;
      expect(calledUrl).toContain("from=2024-01-01");
      expect(calledUrl).toContain("to=2024-01-31");
    });

    it("passes cursor for pagination", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          message: "Events retrieved.",
          data: {
            events: { data: [], total_count: 0, from: "", to: "", pagination: { next_cursor: null, per_page: 25 } },
          },
        }),
      });

      const client = new Lettr("test-api-key");
      await client.emails.list({ cursor: "eyJpZCI6MTIzfQ==" });

      const calledUrl = mockFetch.mock.calls[0]![0] as string;
      expect(calledUrl).toContain("cursor=eyJpZCI6MTIzfQ%3D%3D");
    });
  });

  describe("get", () => {
    it("returns email detail for a request ID", async () => {
      const responseData = {
        transmission_id: "trans-456",
        state: "delivered",
        scheduled_at: null,
        from: "sender@example.com",
        from_name: null,
        subject: "Welcome to Lettr",
        recipients: ["recipient@example.com"],
        num_recipients: 1,
        events: [
          {
            event_id: "event-123",
            type: "delivery",
            timestamp: "2024-01-15T10:31:00.000Z",
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
            rcpt_meta: [],
            campaign_id: null,
            template_id: null,
            template_version: null,
            ip_pool: "default",
            msg_from: null,
            rcpt_type: null,
            rcpt_tags: null,
            amp_enabled: null,
            delv_method: "esmtp",
            recv_method: "rest",
            routing_domain: "gmail.com",
            scheduled_time: null,
            ab_test_id: null,
            ab_test_version: null,
            queue_time: 500,
            outbound_tls: "TLSv1.2",
          },
        ],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ message: "Email retrieved successfully.", data: responseData }),
      });

      const client = new Lettr("test-api-key");
      const result = await client.emails.get("trans-456");

      expect(result.data).toEqual(responseData as unknown as GetEmailResponse);
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

    it("passes from and to date params", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          message: "Email retrieved.",
          data: {
            transmission_id: "trans-456",
            state: "delivered",
            scheduled_at: null,
            from: "sender@example.com",
            from_name: null,
            subject: "Test",
            recipients: ["recipient@example.com"],
            num_recipients: 1,
            events: [],
          },
        }),
      });

      const client = new Lettr("test-api-key");
      await client.emails.get("trans-456", { from: "2024-01-01", to: "2024-01-31" });

      const calledUrl = mockFetch.mock.calls[0]![0] as string;
      expect(calledUrl).toContain("/emails/trans-456");
      expect(calledUrl).toContain("from=2024-01-01");
      expect(calledUrl).toContain("to=2024-01-31");
    });

    it("encodes special characters in request ID", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          message: "Email retrieved.",
          data: {
            transmission_id: "id/with/slashes",
            state: "delivered",
            scheduled_at: null,
            from: "sender@example.com",
            from_name: null,
            subject: "Test",
            recipients: [],
            num_recipients: 0,
            events: [],
          },
        }),
      });

      const client = new Lettr("test-api-key");
      await client.emails.get("id/with/slashes");

      const calledUrl = mockFetch.mock.calls[0]![0] as string;
      expect(calledUrl).toContain("/emails/id%2Fwith%2Fslashes");
    });
  });
});
