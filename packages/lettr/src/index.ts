export { Lettr } from "./client";
export { Emails } from "./emails";
export { Domains } from "./domains";
export { Templates } from "./templates";
export { Webhooks } from "./webhooks";
export { Projects } from "./projects";
export type {
  // Shared
  LettrError,
  ErrorCode,
  Result,

  // Emails
  Attachment,
  EmailOptions,
  SendEmailRequest,
  SendEmailResponse,
  ScheduleEmailRequest,
  ScheduledTransmission,
  CancelScheduledResponse,
  ListEmailsParams,
  ListEmailsResponse,
  GetEmailParams,
  GetEmailResponse,

  // Sent Emails
  SentEmail,
  ListSentEmailsParams,
  ListSentEmailsResponse,

  // Email Events
  BaseEmailEvent,
  EmailEvent,
  UserAgentParsed,
  GeoIp,
  InjectionEvent,
  DeliveryEvent,
  BounceEvent,
  DelayEvent,
  OutOfBandEvent,
  SpamComplaintEvent,
  PolicyRejectionEvent,
  ClickEvent,
  OpenEvent,
  InitialOpenEvent,
  AmpClickEvent,
  AmpOpenEvent,
  AmpInitialOpenEvent,
  GenerationFailureEvent,
  GenerationRejectionEvent,
  ListUnsubscribeEvent,
  LinkUnsubscribeEvent,

  // Domains
  Domain,
  DomainDetail,
  DnsProvider,
  ListDomainsResponse,
  CreateDomainResponse,
  VerifyDomainResponse,
  DmarcValidationResult,
  SpfValidationResult,

  // Templates
  Template,
  TemplateDetail,
  CreateTemplateRequest,
  UpdateTemplateRequest,
  ListTemplatesParams,
  ListTemplatesResponse,
  CreateTemplateResponse,
  UpdateTemplateResponse,
  MergeTag,
  GetMergeTagsParams,
  GetMergeTagsResponse,
  GetTemplateHtmlParams,
  GetTemplateHtmlResponse,

  // Webhooks
  Webhook,
  WebhookEvent,
  ListWebhooksResponse,
  CreateWebhookRequest,
  UpdateWebhookRequest,

  // Projects
  Project,
  ListProjectsParams,
  ListProjectsResponse,

  // System
  HealthResponse,
  AuthCheckResponse,
} from "./types";
