import type { SendEmailRequest, SendEmailResult, LettrError } from "./types";

interface ApiSuccessResponse {
  success: true;
  message: string;
  data: {
    request_id: string;
    accepted: number;
    rejected: number;
  };
}

interface ApiValidationErrorResponse {
  success: false;
  message: string;
  errors: Record<string, string[]>;
}

interface ApiErrorResponse {
  success: false;
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

    if (response.ok && body.success) {
      return {
        data: {
          request_id: body.data.request_id,
          accepted: body.data.accepted,
          rejected: body.data.rejected,
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
