export interface Attachment {
  name: string;
  type: string;
  data: string;
}

export interface EmailOptions {
  click_tracking?: boolean;
  open_tracking?: boolean;
  transactional?: boolean;
  inline_css?: boolean;
  perform_substitutions?: boolean;
}

export interface SendEmailRequest {
  from: string;
  from_name?: string | null;
  subject: string;
  to: string[];
  cc?: string[];
  bcc?: string[];
  reply_to?: string | null;
  reply_to_name?: string | null;
  html?: string | null;
  text?: string | null;
  amp_html?: string | null;
  campaign_id?: string;
  metadata?: Record<string, string>;
  substitution_data?: Record<string, string>;
  options?: EmailOptions;
  attachments?: Attachment[];
}

export interface SendEmailResponse {
  request_id: string;
  accepted: number;
  rejected: number;
}

export type LettrError =
  | { type: "validation"; message: string; errors: Record<string, string[]> }
  | { type: "api"; message: string; errors: string[] }
  | { type: "network"; message: string };

export type SendEmailResult =
  | { data: SendEmailResponse; error: null }
  | { data: null; error: LettrError };
