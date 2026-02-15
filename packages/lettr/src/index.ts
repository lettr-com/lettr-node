export { Lettr } from "./client";
export { Emails } from "./emails";
export { Domains } from "./domains";
export { Templates } from "./templates";
export { Webhooks } from "./webhooks";
export { Projects } from "./projects";
export type {
  // Shared
  LettrError,
  Result,

  // Emails
  Attachment,
  EmailOptions,
  SendEmailRequest,
  SendEmailResponse,
  SendEmailResult,
  ListEmailsParams,
  ListEmailsResponse,
  EmailEvent,
  EmailEventDetail,
  GetEmailResponse,

  // Domains
  Domain,
  DomainDetail,
  ListDomainsResponse,
  CreateDomainResponse,
  VerifyDomainResponse,

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

  // Webhooks
  Webhook,
  ListWebhooksResponse,

  // Projects
  Project,
  ListProjectsParams,
  ListProjectsResponse,

  // System
  HealthResponse,
  AuthCheckResponse,
} from "./types";
