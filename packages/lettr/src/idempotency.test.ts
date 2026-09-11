import { describe, it, expect, beforeEach, mock } from "bun:test";
import { Lettr } from "./client";
import {
  isIdempotencyConflictError,
  isIdempotencyInProgressError,
} from "./errors";
import { isValidIdempotencyKey } from "./idempotency";

const mockFetch = mock();
globalThis.fetch = mockFetch as unknown as typeof fetch;

const email = {
  from: "sender@example.com",
  to: ["recipient@example.com"],
  subject: "Hello",
  html: "<p>Hi</p>",
};

function respond(
  body: unknown,
  { status = 200, headers = {} as Record<string, string> } = {}
) {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: new Headers(headers),
    json: async () => body,
  };
}

const accepted = {
  message: "Email queued for delivery.",
  data: { request_id: "req-1", accepted: 1, rejected: 0 },
};

describe("idempotency", () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  describe("sending the key", () => {
    it("puts the key in the header, never in the body", async () => {
      mockFetch.mockResolvedValueOnce(respond(accepted, { status: 201 }));

      const client = new Lettr("test-api-key");
      await client.emails.send(email, { idempotencyKey: "order-12345" });

      const [, init] = mockFetch.mock.calls[0]!;
      expect(init.headers["Idempotency-Key"]).toBe("order-12345");
      expect(JSON.parse(init.body as string)).not.toHaveProperty(
        "idempotency_key"
      );
    });

    // The compatibility guarantee: a caller that says nothing about
    // idempotency sends the exact request it sent before this existed.
    it("sends no header when no key is given", async () => {
      mockFetch.mockResolvedValueOnce(respond(accepted, { status: 201 }));

      const client = new Lettr("test-api-key");
      await client.emails.send(email);

      const [, init] = mockFetch.mock.calls[0]!;
      expect(init.headers).not.toHaveProperty("Idempotency-Key");
    });

    // Fail here rather than spend a round trip on a 422 the SDK can see coming.
    it("rejects a malformed key without making a request", async () => {
      const client = new Lettr("test-api-key");
      const result = await client.emails.send(email, {
        idempotencyKey: "order 12345",
      });

      expect(mockFetch).not.toHaveBeenCalled();
      expect(result.data).toBeNull();
      expect(result.error).toEqual({
        type: "validation",
        message: "Validation failed.",
        errors: {
          "Idempotency-Key": [
            "Use 1 to 255 letters, digits, periods, underscores or hyphens.",
          ],
        },
        error_code: "validation_error",
      });
    });

    it("validates the documented format", () => {
      expect(isValidIdempotencyKey("order-confirmation-12345")).toBe(true);
      expect(isValidIdempotencyKey("a.b_c-1")).toBe(true);
      expect(isValidIdempotencyKey("")).toBe(false);
      expect(isValidIdempotencyKey("order 123")).toBe(false);
      expect(isValidIdempotencyKey("order/123")).toBe(false);
      expect(isValidIdempotencyKey("order-č")).toBe(false);
      expect(isValidIdempotencyKey("a".repeat(255))).toBe(true);
      expect(isValidIdempotencyKey("a".repeat(256))).toBe(false);
    });
  });

  describe("reading the answer", () => {
    it("marks a replayed send, which is still a success", async () => {
      mockFetch.mockResolvedValueOnce(
        respond(accepted, {
          status: 200,
          headers: { "Idempotency-Replayed": "true" },
        })
      );

      const client = new Lettr("test-api-key");
      const result = await client.emails.send(email, {
        idempotencyKey: "order-12345",
      });

      // No second email went out, but nothing failed either.
      expect(result.error).toBeNull();
      expect(result.data?.replayed).toBe(true);
      expect(result.data?.accepted).toBe(1);
    });

    it("does not mark a normal send as replayed", async () => {
      mockFetch.mockResolvedValueOnce(respond(accepted, { status: 201 }));

      const client = new Lettr("test-api-key");
      const result = await client.emails.send(email);

      expect(result.data?.replayed).toBe(false);
    });

    it("reads the replay header case-insensitively", async () => {
      mockFetch.mockResolvedValueOnce(
        respond(accepted, {
          status: 200,
          headers: { "idempotency-replayed": "TRUE" },
        })
      );

      const client = new Lettr("test-api-key");
      const result = await client.emails.send(email, {
        idempotencyKey: "order-12345",
      });

      expect(result.data?.replayed).toBe(true);
    });
  });

  describe("the two conflicts", () => {
    // The whole reason the SDK has to tell 409s apart: one is safe to retry
    // with the same key and the other will fail forever.
    it("surfaces an in-progress conflict with Retry-After", async () => {
      mockFetch.mockResolvedValueOnce(
        respond(
          {
            message:
              "A request with this Idempotency-Key is still processing. Retry with the same key.",
            error_code: "idempotency_in_progress",
          },
          { status: 409, headers: { "Retry-After": "3" } }
        )
      );

      const client = new Lettr("test-api-key");
      const { error } = await client.emails.send(email, {
        idempotencyKey: "order-12345",
      });

      expect(isIdempotencyInProgressError(error)).toBe(true);
      expect(isIdempotencyConflictError(error)).toBe(false);
      expect(error).toMatchObject({
        type: "api",
        error_code: "idempotency_in_progress",
        retry_after: 3,
      });
    });

    it("surfaces a payload conflict, which carries no Retry-After", async () => {
      mockFetch.mockResolvedValueOnce(
        respond(
          {
            message:
              "This Idempotency-Key was already used with a different request payload.",
            error_code: "idempotency_key_conflict",
          },
          { status: 409 }
        )
      );

      const client = new Lettr("test-api-key");
      const { error } = await client.emails.send(email, {
        idempotencyKey: "order-12345",
      });

      expect(isIdempotencyConflictError(error)).toBe(true);
      expect(isIdempotencyInProgressError(error)).toBe(false);
      // Nothing to wait for — retrying produces the same 409 forever.
      expect(error).not.toHaveProperty("retry_after");
    });

    it("leaves an unrelated 409 alone", async () => {
      mockFetch.mockResolvedValueOnce(
        respond(
          {
            message: "A contact with this email already exists.",
            error_code: "resource_already_exists",
          },
          { status: 409 }
        )
      );

      const client = new Lettr("test-api-key");
      const { error } = await client.emails.send(email);

      expect(isIdempotencyConflictError(error)).toBe(false);
      expect(isIdempotencyInProgressError(error)).toBe(false);
    });
  });
});
