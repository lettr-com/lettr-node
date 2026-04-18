import type { Result, LettrError, ErrorCode } from "./types";

export interface RequestOptions {
  body?: unknown;
  query?: Record<string, string | number | undefined>;
  /** When false, returns the full response body as T instead of unwrapping body.data */
  unwrap?: boolean;
}

interface ApiValidationError {
  message: string;
  error_code: ErrorCode;
  errors: Record<string, string[]>;
}

interface ApiError {
  message: string;
  error_code: ErrorCode;
}

export class HttpClient {
  constructor(
    private baseUrl: string,
    private apiKey: string
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

    const body = await response.json();

    if (response.ok) {
      if (shouldUnwrap) {
        const data = (body as { data?: T }).data ?? (body as T);
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
