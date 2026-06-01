import type { Result, LettrError, ErrorCode } from "./types";
import pkg from "../package.json";

/** SDK version reported to the API, sourced from package.json (inlined at build). */
const VERSION = pkg.version;

export interface RequestOptions {
  body?: unknown;
  query?: Record<string, string | number | undefined>;
  /** When false, returns the full response body as T instead of unwrapping body.data */
  unwrap?: boolean;
}

interface ApiValidationError {
  message: string;
  // Both optional: a field-validation 422 carries `errors` (and usually
  // `error_code: "validation_error"`), while a precondition 422 (e.g.
  // `campaign_not_sendable`) carries only `error_code` and no `errors` map.
  error_code?: ErrorCode;
  errors?: Record<string, string[]>;
}

interface ApiError {
  message: string;
  error_code: ErrorCode;
}

export class HttpClient {
  constructor(
    private baseUrl: string,
    private apiKey: string,
    /** Caller identifier appended to the SDK's User-Agent (e.g. "lettr-kit/1.0.5"). */
    private userAgent?: string
  ) {}

  async request<T>(
    method: string,
    path: string,
    options?: RequestOptions
  ): Promise<Result<T>> {
    const shouldUnwrap = options?.unwrap !== false;
    let url = `${this.baseUrl}${path}`;

    if (options?.query) {
      const params = new URLSearchParams();
      for (const [key, value] of Object.entries(options.query)) {
        if (value !== undefined) {
          params.set(key, String(value));
        }
      }
      const qs = params.toString();
      if (qs) url += `?${qs}`;
    }

    const headers: Record<string, string> = {
      Authorization: `Bearer ${this.apiKey}`,
      "User-Agent": this.userAgent
        ? `lettr-node/${VERSION} ${this.userAgent}`
        : `lettr-node/${VERSION}`,
    };

    const init: RequestInit = { method, headers };

    if (options?.body !== undefined) {
      headers["Content-Type"] = "application/json";
      init.body = JSON.stringify(options.body);
    }

    let response: Response;
    try {
      response = await fetch(url, init);
    } catch {
      return {
        data: null,
        error: { type: "network", message: "Failed to connect to Lettr API" },
      };
    }

    if (response.status === 204) {
      return { data: undefined as T, error: null };
    }

    let body: unknown;
    try {
      body = await response.json();
    } catch {
      // Not every response carries valid JSON: gateway 5xx pages, empty error
      // bodies, etc. A malformed success body is a real failure; for error
      // statuses fall through with an empty object so the status-specific
      // handlers below still produce their fallback errors (e.g. 401).
      if (response.ok) {
        return {
          data: null,
          error: {
            type: "api",
            message: "Received a malformed response from the Lettr API",
            error_code: "unknown",
          },
        };
      }
      body = {};
    }

    if (response.ok) {
      if (shouldUnwrap) {
        // Unwrap only a real `{ data: ... }` envelope. A non-object body
        // (null, primitive, array) or a bare resource without a `data` key
        // is returned as-is — and a present-but-null `data` is honored as
        // null rather than falling back to the whole envelope.
        const isEnvelope =
          typeof body === "object" && body !== null && "data" in body;
        const data = isEnvelope ? (body as { data: T }).data : (body as T);
        return { data, error: null };
      }
      return { data: body as T, error: null };
    }

    if (response.status === 422) {
      const errorBody = body as ApiValidationError;
      const error: LettrError = {
        type: "validation",
        message: errorBody.message ?? "Validation failed",
        errors: errorBody.errors ?? {},
        // Only include error_code when the API actually returned one, so
        // result shapes stay identical for 422s that omit it.
        ...(errorBody.error_code ? { error_code: errorBody.error_code } : {}),
      };
      return { data: null, error };
    }

    if (response.status === 401) {
      const error: LettrError = {
        type: "api",
        message: (body as { message?: string }).message ?? "Unauthorized",
        error_code: "unauthorized",
      };
      return { data: null, error };
    }

    const errorBody = body as ApiError;
    const error: LettrError = {
      type: "api",
      message: errorBody.message ?? "Request failed",
      error_code: errorBody.error_code ?? "unknown",
    };
    return { data: null, error };
  }
}
