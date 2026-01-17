import type { SendEmailRequest, SendEmailResult, LettrError } from "./types";

interface ApiSuccessResponse {
  message: string;
  data: {
    request_id: string;
    accepted: number;
    rejected: number;
  };
}

interface ApiValidationErrorResponse {
  message: string;
  errors: Record<string, string[]>;
}

interface ApiErrorResponse {
  message: string;
  errors: string[];
}

type ApiResponse =
  | ApiSuccessResponse
  | ApiValidationErrorResponse
  | ApiErrorResponse;

export class Emails {
  constructor(
    private baseUrl: string,
    private apiKey: string
  ) {}

  async send(request: SendEmailRequest): Promise<SendEmailResult> {
    let response: Response;

    try {
      response = await fetch(`${this.baseUrl}/emails`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(request),
      });
    } catch {
      return {
        data: null,
        error: { type: "network", message: "Failed to connect to Lettr API" },
      };
    }

    const body = (await response.json()) as ApiResponse;

    if (response.ok) {
      const successBody = body as ApiSuccessResponse;
      return {
        data: {
          request_id: successBody.data.request_id,
          accepted: successBody.data.accepted,
          rejected: successBody.data.rejected,
          message: successBody.message,
        },
        error: null,
      };
    }

    if (response.status === 422) {
      const errorBody = body as ApiValidationErrorResponse;
      const error: LettrError = {
        type: "validation",
        message: errorBody.message ?? "Validation failed",
        errors: errorBody.errors ?? {},
      };
      return { data: null, error };
    }

    const errorBody = body as ApiErrorResponse;
    const error: LettrError = {
      type: "api",
      message: errorBody.message ?? "Request failed",
      errors: errorBody.errors ?? [],
    };
    return { data: null, error };
  }
}
