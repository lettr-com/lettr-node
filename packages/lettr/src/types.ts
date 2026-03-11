// ---------- Shared ----------

export type LettrError =
  | { type: "validation"; message: string; errors: Record<string, string[]> }
  | { type: "api"; message: string; error_code: string }
  | { type: "network"; message: string };

export type Result<T> =
  | { data: T; error: null }
  | { data: null; error: LettrError };

// ---------- Emails ----------

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

interface BaseEmailRequest {
  from: string;
  from_name?: string | null;
  to: string[];
  cc?: string[];
  bcc?: string[];
  reply_to?: string | null;
  reply_to_name?: string | null;
  amp_html?: string | null;
  campaign_id?: string;
  project_id?: number;
  template_version?: number;
  tag?: string;
  metadata?: Record<string, string>;
  substitution_data?: Record<string, string>;
  options?: EmailOptions;
  attachments?: Attachment[];
}

export type SendEmailRequest = BaseEmailRequest &
  (
    | { subject: string; html: string; text?: string | null }
    | { subject: string; html?: string | null; text: string }
    | { template_slug: string; subject?: string }
  );

export interface SendEmailResponse {
  request_id: string;
  accepted: number;
  rejected: number;
  message: string;
}

/** @deprecated Use `Result<SendEmailResponse>` instead */
export type SendEmailResult = Result<SendEmailResponse>;

export interface ListEmailsParams {
  per_page?: number;
  cursor?: string;
  recipients?: string;
  from?: string;
  to?: string;
}

export interface EmailEvent {
  event_id: string;
  timestamp: string;
  request_id: string | null;
  message_id: string | null;
  subject: string | null;
  friendly_from: string | null;
  sending_domain: string | null;
  rcpt_to: string | null;
  raw_rcpt_to: string | null;
  recipient_domain: string | null;
  mailbox_provider: string | null;
  mailbox_provider_region: string | null;
  sending_ip: string | null;
  click_tracking: boolean | null;
  open_tracking: boolean | null;
  transactional: boolean | null;
  msg_size: number | null;
  injection_time: string | null;
  rcpt_meta: Record<string, unknown>;
}

export interface EmailEventDetail extends EmailEvent {
  type: string;
  reason: string | null;
  raw_reason: string | null;
  error_code: string | null;
}

export interface ListEmailsResponse {
  results: EmailEvent[];
  total_count: number;
  pagination: {
    next_cursor: string | null;
    per_page: number;
  };
}

export interface GetEmailResponse {
  results: EmailEventDetail[];
  total_count: number;
}

// ---------- Domains ----------

export interface Domain {
  domain: string;
  status: "pending" | "approved" | "blocked";
  status_label: string;
  can_send: boolean;
  cname_status: string | null;
  dkim_status: string | null;
  created_at: string;
  updated_at: string;
}

export interface DomainDetail extends Domain {
  tracking_domain: string | null;
  dns: {
    dkim: {
      selector: string;
      public: string;
    } | null;
  };
}

export interface ListDomainsResponse {
  domains: Domain[];
}

export interface CreateDomainResponse {
  domain: string;
  status: string;
  status_label: string;
  dkim: {
    public: string;
    selector: string;
    headers: string;
  };
}

export interface VerifyDomainResponse {
  domain: string;
  dkim_status: string;
  cname_status: string;
  ownership_verified: string | null;
  dns?: {
    dkim_record: string | null;
    cname_record: string | null;
    dkim_error: string | null;
    cname_error: string | null;
  };
}

// ---------- Templates ----------

export interface Template {
  id: number;
  name: string;
  slug: string;
  project_id: number | null;
  folder_id: number | null;
  created_at: string;
  updated_at: string;
}

export interface TemplateDetail extends Template {
  active_version: number;
  versions_count: number;
  html: string | null;
}

export interface CreateTemplateRequest {
  name: string;
  html?: string;
  json?: string;
  project_id?: number;
  folder_id?: number;
}

export interface UpdateTemplateRequest {
  name?: string;
  html?: string;
  json?: string;
  project_id?: number;
}

export interface ListTemplatesParams {
  project_id?: number;
  per_page?: number;
  page?: number;
}

export interface MergeTag {
  key: string;
  required?: boolean;
  type?: string;
  children?: MergeTag[];
}

export interface ListTemplatesResponse {
  templates: Template[];
  pagination: {
    total: number;
    per_page: number;
    current_page: number;
    last_page: number;
  };
}

export interface CreateTemplateResponse extends TemplateDetail {
  merge_tags: MergeTag[];
}

export interface UpdateTemplateResponse extends TemplateDetail {
  merge_tags: MergeTag[];
}

export interface GetMergeTagsResponse {
  template_slug: string;
  version: number;
  merge_tags: MergeTag[];
}

export interface GetMergeTagsParams {
  project_id?: number;
  version?: number;
}

// ---------- Webhooks ----------

export interface Webhook {
  id: string;
  name: string;
  url: string;
  enabled: boolean;
  event_types: string[] | null;
  auth_type: string;
  has_auth_credentials: boolean;
  last_successful_at: string | null;
  last_failure_at: string | null;
  last_status: string | null;
}

export interface ListWebhooksResponse {
  webhooks: Webhook[];
}

// ---------- Projects ----------

export interface Project {
  id: number;
  name: string;
  emoji: string | null;
  team_id: number;
  created_at: string;
  updated_at: string;
}

export interface ListProjectsParams {
  per_page?: number;
  page?: number;
}

export interface ListProjectsResponse {
  projects: Project[];
  pagination: {
    total: number;
    per_page: number;
    current_page: number;
    last_page: number;
  };
}

// ---------- System ----------

export interface HealthResponse {
  status: string;
  timestamp: string;
}

export interface AuthCheckResponse {
  team_id: number;
  timestamp: string;
}
