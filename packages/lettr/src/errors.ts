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
