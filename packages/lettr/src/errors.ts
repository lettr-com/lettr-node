import type { LettrError } from "./types";

/**
 * Whether an error is "this contact already exists" — the 409 that
 * `audience.contacts.create()` returns when the email is already in the team's
 * audience.
 *
 * ```ts
 * const { data, error } = await client.audience.contacts.create({ email });
 *
 * if (isContactAlreadyExistsError(error)) {
 *   // Client-correctable: update the existing contact instead.
 * }
 * ```
 *
 * This is **not** a retryable failure. The API used to let a duplicate escape
 * as an HTTP 500 with the misleading `send_error` code (it names email
 * delivery, which is not involved); a retry-on-5xx policy would retry it
 * pointlessly. It is now a 409, and 409 must not be retried.
 */
export function isContactAlreadyExistsError(
  error: LettrError | null | undefined
): boolean {
  return (
    error !== null &&
    error !== undefined &&
    error.type === "api" &&
    error.error_code === "resource_already_exists"
  );
}

/**
 * Whether an error is "this key was already used with a different payload"
 * (HTTP 409, `idempotency_key_conflict`).
 *
 * **Never retry this.** Two different emails were sent under one key, which is
 * a bug on the caller's side; the same request will fail identically forever.
 * Use a key that is unique per logical send, or send the payload the key was
 * first used with.
 */
export function isIdempotencyConflictError(
  error: LettrError | null | undefined
): boolean {
  return (
    error !== null &&
    error !== undefined &&
    error.type === "api" &&
    error.error_code === "idempotency_key_conflict"
  );
}

/**
 * Whether an error is "the original send is still processing" (HTTP 409,
 * `idempotency_in_progress`).
 *
 * This one **is** retryable, and must be retried with the *same* key — a fresh
 * key would send a second email. Wait `error.retry_after` seconds first.
 *
 * ```ts
 * const { data, error } = await client.emails.send(email, { idempotencyKey: key });
 *
 * if (isIdempotencyInProgressError(error)) {
 *   await sleep((error.retry_after ?? 1) * 1000);
 *   // retry with the SAME key
 * }
 * ```
 */
export function isIdempotencyInProgressError(
  error: LettrError | null | undefined
): boolean {
  return (
    error !== null &&
    error !== undefined &&
    error.type === "api" &&
    error.error_code === "idempotency_in_progress"
  );
}
