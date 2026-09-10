import type { LettrError } from "./types";

/** The format the API accepts: 1–255 characters of letters, digits, `.`, `_`, `-`. */
export const IDEMPOTENCY_KEY_PATTERN = /^[A-Za-z0-9._-]{1,255}$/;

/**
 * Whether a string is a usable idempotency key.
 *
 * Exported so callers deriving keys from their own ids (an order number, a job
 * id) can check before sending rather than discovering it as a 422.
 */
export function isValidIdempotencyKey(key: string): boolean {
  return IDEMPOTENCY_KEY_PATTERN.test(key);
}

/**
 * A validation error for a malformed key, or null when it is fine.
 *
 * Shaped like an API validation error so `send()` can return it without the
 * caller having to handle a second error shape — from the outside a bad key
 * looks exactly like the 422 the API would have sent, minus the round trip.
 */
export function idempotencyKeyError(key: string): LettrError | null {
  if (isValidIdempotencyKey(key)) return null;

  return {
    type: "validation",
    message: "Validation failed.",
    errors: {
      "Idempotency-Key": [
        "Use 1 to 255 letters, digits, periods, underscores or hyphens.",
      ],
    },
    error_code: "validation_error",
  };
}
