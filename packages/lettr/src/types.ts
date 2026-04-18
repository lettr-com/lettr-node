// ---------- Shared ----------

// Codes from the OpenAPI `ErrorCode` enum, plus two SDK-synthesized values
// ("unauthorized" for 401s, "unknown" as a fallback) the server doesn't emit.
export type ErrorCode =
  | "validation_error"
  | "invalid_domain"
  | "unconfigured_domain"
  | "send_error"
  | "retrieval_error"
  | "transmission_failed"
  | "resource_already_exists"
  | "not_found"
  | "template_not_found"
  | "insufficient_scope"
  | "schedule_cancellation_failed"
  | "quota_exceeded"
  | "daily_quota_exceeded"
  | "unauthorized"
  | "unknown";

export type LettrError =
  | { type: "validation"; message: string; errors: Record<string, string[]> }
  | { type: "api"; message: string; error_code: ErrorCode }
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
  project_id?: number;
  template_version?: number;
  tag?: string;
  metadata?: Record<string, string>;
  headers?: Record<string, string>;
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

export type ScheduleEmailRequest = SendEmailRequest & {
  scheduled_at: string;
};

export type ScheduledTransmission = GetEmailResponse;

export interface CancelScheduledResponse {
  message: string;
}

// ---------- Sent Emails (GET /emails) ----------

export interface SentEmail {
  event_id: string;
  type: string;
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
  rcpt_meta: Record<string, unknown> | null;
}

export interface ListSentEmailsParams {
  per_page?: number;
  cursor?: string;
  recipients?: string;
  from?: string;
  to?: string;
}

export interface ListSentEmailsResponse {
  events: {
    data: SentEmail[];
    total_count: number;
    from: string;
    to: string;
    pagination: {
      next_cursor: string | null;
      per_page: number;
    };
  };
}

// ---------- Email Events (GET /emails/events) ----------

export interface UserAgentParsed {
  agent_family: string | null;
  device_brand: string | null;
  device_family: string | null;
  os_family: string | null;
  os_version: string | null;
  is_mobile: boolean | null;
  is_proxy: boolean | null;
  is_prefetched: boolean | null;
}

export interface GeoIp {
  country: string | null;
  region: string | null;
  city: string | null;
  latitude: number | null;
  longitude: number | null;
  zip: string | null;
  postal_code: string | null;
}

export interface BaseEmailEvent {
  event_id: string;
  type: string;
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
  rcpt_meta: unknown[] | null;
  campaign_id: string | null;
  template_id: string | null;
  template_version: string | null;
  ip_pool: string | null;
  msg_from: string | null;
  rcpt_type: string | null;
  rcpt_tags: string[] | null;
  amp_enabled: boolean | null;
  delv_method: string | null;
  recv_method: string | null;
  routing_domain: string | null;
  scheduled_time: string | null;
  ab_test_id: string | null;
  ab_test_version: string | null;
}

export interface InjectionEvent extends BaseEmailEvent {
  type: "injection";
  initial_pixel: boolean | null;
}

export interface DeliveryEvent extends BaseEmailEvent {
  type: "delivery";
  queue_time: number | null;
  outbound_tls: string | null;
}

export interface BounceEvent extends BaseEmailEvent {
  type: "bounce";
  bounce_class: number | null;
  error_code: string | null;
  reason: string | null;
  raw_reason: string | null;
  num_retries: number | null;
  device_token: string | null;
}

export interface DelayEvent extends BaseEmailEvent {
  type: "delay";
  reason: string | null;
  raw_reason: string | null;
  error_code: string | null;
  bounce_class: number | null;
  num_retries: number | null;
  queue_time: number | null;
  outbound_tls: string | null;
}

export interface OutOfBandEvent extends BaseEmailEvent {
  type: "out_of_band";
  bounce_class: number | null;
  error_code: string | null;
  reason: string | null;
  raw_reason: string | null;
  device_token: string | null;
}

export interface SpamComplaintEvent extends BaseEmailEvent {
  type: "spam_complaint";
  fbtype: string | null;
  report_by: string | null;
  report_to: string | null;
}

export interface PolicyRejectionEvent extends BaseEmailEvent {
  type: "policy_rejection";
  remote_addr: string | null;
  reason: string | null;
  raw_reason: string | null;
  error_code: string | null;
  bounce_class: number | null;
}

export interface ClickEvent extends BaseEmailEvent {
  type: "click";
  target_link_url: string | null;
  target_link_name: string | null;
  user_agent: string | null;
  user_agent_parsed: UserAgentParsed | null;
  geo_ip: GeoIp | null;
  ip_address: string | null;
}

export interface OpenEvent extends BaseEmailEvent {
  type: "open";
  user_agent: string | null;
  user_agent_parsed: UserAgentParsed | null;
  geo_ip: GeoIp | null;
  ip_address: string | null;
  initial_pixel: boolean | null;
}

export interface InitialOpenEvent extends BaseEmailEvent {
  type: "initial_open";
  user_agent: string | null;
  user_agent_parsed: UserAgentParsed | null;
  geo_ip: GeoIp | null;
  ip_address: string | null;
  initial_pixel: boolean | null;
}

export interface AmpClickEvent extends BaseEmailEvent {
  type: "amp_click";
  target_link_url: string | null;
  target_link_name: string | null;
  user_agent: string | null;
  user_agent_parsed: UserAgentParsed | null;
  geo_ip: GeoIp | null;
  ip_address: string | null;
}

export interface AmpOpenEvent extends BaseEmailEvent {
  type: "amp_open";
  user_agent: string | null;
  user_agent_parsed: UserAgentParsed | null;
  geo_ip: GeoIp | null;
  ip_address: string | null;
  initial_pixel: boolean | null;
}

export interface AmpInitialOpenEvent extends BaseEmailEvent {
  type: "amp_initial_open";
  user_agent: string | null;
  user_agent_parsed: UserAgentParsed | null;
  geo_ip: GeoIp | null;
  ip_address: string | null;
  initial_pixel: boolean | null;
}

export interface GenerationFailureEvent extends BaseEmailEvent {
  type: "generation_failure";
  reason: string | null;
  raw_reason: string | null;
  error_code: string | null;
}

export interface GenerationRejectionEvent extends BaseEmailEvent {
  type: "generation_rejection";
  reason: string | null;
  raw_reason: string | null;
  error_code: string | null;
}

export interface ListUnsubscribeEvent extends BaseEmailEvent {
  type: "list_unsubscribe";
}

export interface LinkUnsubscribeEvent extends BaseEmailEvent {
  type: "link_unsubscribe";
}

export type EmailEvent =
  | InjectionEvent
  | DeliveryEvent
  | BounceEvent
  | DelayEvent
  | OutOfBandEvent
  | SpamComplaintEvent
  | PolicyRejectionEvent
  | ClickEvent
  | OpenEvent
  | InitialOpenEvent
  | AmpClickEvent
  | AmpOpenEvent
  | AmpInitialOpenEvent
  | GenerationFailureEvent
  | GenerationRejectionEvent
  | ListUnsubscribeEvent
  | LinkUnsubscribeEvent;

export interface ListEmailsParams {
  per_page?: number;
  cursor?: string;
  recipients?: string;
  from?: string;
  to?: string;
  events?: string;
  transmissions?: string;
  bounce_classes?: string;
}

export interface ListEmailsResponse {
  events: {
    data: EmailEvent[];
    total_count: number;
    from: string;
    to: string;
    pagination: {
      next_cursor: string | null;
      per_page: number;
    };
  };
}

export interface GetEmailParams {
  from?: string;
  to?: string;
}

export interface GetEmailResponse {
  transmission_id: string;
  state: string;
  scheduled_at: string | null;
  from: string;
  from_name: string | null;
  subject: string;
  recipients: string[];
  num_recipients: number;
  events: EmailEvent[];
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

export interface DnsProvider {
  provider: string;
  provider_label: string;
  nameservers: string[];
  error: string | null;
}

export interface DomainDetail extends Domain {
  dmarc_status: string | null;
  spf_status: string | null;
  is_primary_domain: boolean;
  tracking_domain: string | null;
  dns: {
    dkim: {
      selector: string;
      public: string;
      headers?: string;
    } | null;
  };
  dns_provider: DnsProvider | null;
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
    signing_domain?: string;
  };
}

export interface DmarcValidationResult {
  is_valid: boolean;
  status: string;
  found_at_domain: string | null;
  record: string | null;
  policy: string | null;
  subdomain_policy: string | null;
  error: string | null;
  covered_by_parent_policy: boolean;
}

export interface SpfValidationResult {
  is_valid: boolean;
  status: string;
  record: string | null;
  error: string | null;
  includes_sparkpost: boolean;
}

export interface VerifyDomainResponse {
  domain: string;
  dkim_status: string;
  cname_status: string;
  dmarc_status: string;
  spf_status: string;
  is_primary_domain: boolean;
  ownership_verified: string | null;
  dns?: {
    dkim_record: string | null;
    cname_record: string | null;
    dkim_error: string | null;
    cname_error: string | null;
    dmarc_record: string | null;
    dmarc_error: string | null;
    spf_record: string | null;
    spf_error: string | null;
  };
  dmarc?: DmarcValidationResult;
  spf?: SpfValidationResult;
}

// ---------- Templates ----------

export interface Template {
  id: number;
  name: string;
  slug: string;
  project_id: number;
  folder_id: number;
  created_at: string;
  updated_at: string;
}

export interface TemplateDetail extends Template {
  active_version: number;
  versions_count: number;
  html: string | null;
  json: string | null;
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

export interface CreateTemplateResponse {
  id: number;
  name: string;
  slug: string;
  project_id: number;
  folder_id: number;
  active_version: number;
  merge_tags: MergeTag[];
  created_at: string;
}

export interface UpdateTemplateResponse {
  id: number;
  name: string;
  slug: string;
  project_id: number;
  folder_id: number;
  active_version: number;
  merge_tags: MergeTag[];
  created_at: string;
  updated_at: string;
}

export interface GetMergeTagsResponse {
  project_id: number;
  template_slug: string;
  version: number;
  merge_tags: MergeTag[];
}

export interface GetMergeTagsParams {
  project_id?: number;
  version?: number;
}

export interface GetTemplateHtmlParams {
  project_id: number;
  slug: string;
}

export interface GetTemplateHtmlResponse {
  html: string;
  merge_tags: { key: string; name: string; required: boolean }[];
  subject: string | null;
}

// ---------- Webhooks ----------

export type WebhookEvent =
  | "message.injection"
  | "message.delivery"
  | "message.bounce"
  | "message.delay"
  | "message.out_of_band"
  | "message.spam_complaint"
  | "message.policy_rejection"
  | "engagement.click"
  | "engagement.open"
  | "engagement.initial_open"
  | "engagement.amp_click"
  | "engagement.amp_open"
  | "engagement.amp_initial_open"
  | "generation.generation_failure"
  | "generation.generation_rejection"
  | "unsubscribe.list_unsubscribe"
  | "unsubscribe.link_unsubscribe"
  | "relay.relay_injection"
  | "relay.relay_rejection"
  | "relay.relay_delivery"
  | "relay.relay_tempfail"
  | "relay.relay_permfail";

export interface Webhook {
  id: string;
  name: string;
  url: string;
  enabled: boolean;
  event_types: WebhookEvent[] | null;
  auth_type: string;
  has_auth_credentials: boolean;
  last_successful_at: string | null;
  last_failure_at: string | null;
  last_status: string | null;
}

export interface ListWebhooksResponse {
  webhooks: Webhook[];
}

export interface CreateWebhookRequest {
  name: string;
  url: string;
  auth_type: "none" | "basic" | "oauth2";
  auth_username?: string;
  auth_password?: string;
  oauth_client_id?: string;
  oauth_client_secret?: string;
  oauth_token_url?: string;
  events_mode: "all" | "selected";
  events?: WebhookEvent[];
}

export interface UpdateWebhookRequest {
  name?: string;
  target?: string;
  auth_type?: "none" | "basic" | "oauth2";
  auth_username?: string;
  auth_password?: string;
  oauth_token_url?: string;
  oauth_client_id?: string;
  oauth_client_secret?: string;
  events?: WebhookEvent[];
  active?: boolean;
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
