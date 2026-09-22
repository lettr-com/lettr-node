export { Lettr } from "./client";
export type { LettrOptions } from "./client";
export { Emails } from "./emails";
export { Domains } from "./domains";
export { Templates } from "./templates";
export { Webhooks } from "./webhooks";
export { Projects } from "./projects";
export { Folders } from "./folders";
export { Audience } from "./audience";
export { AudienceLists } from "./audience-lists";
export { AudienceContacts } from "./audience-contacts";
export { AudienceTopics } from "./audience-topics";
export { AudienceProperties } from "./audience-properties";
export { AudienceSegments } from "./audience-segments";
export { Campaigns } from "./campaigns";
export { isContactAlreadyExistsError } from "./errors";
export {
  isIdempotencyConflictError,
  isIdempotencyInProgressError,
} from "./errors";
export {
  isValidIdempotencyKey,
  IDEMPOTENCY_KEY_PATTERN,
} from "./idempotency";
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
  SendEmailOptions,
  ScheduleEmailRequest,
  ScheduledEmail,
  ScheduledEmailState,
  ScheduledEmailStatusFilter,
  ScheduledEmailPagination,
  ListScheduledEmailsParams,
  ListScheduledEmailsResponse,
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
  TemplatePurpose,
  TemplatePreparationStatus,
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

  // Folders
  Folder,
  ListFoldersParams,
  ListFoldersResponse,

  // Audience
  AudiencePagination,
  AudienceContactStatus,
  AudienceList,
  ListAudienceListsParams,
  ListAudienceListsData,
  CreateAudienceListRequest,
  UpdateAudienceListRequest,
  BulkDeleteAudienceListsRequest,
  BulkDeleteAudienceListsData,
  AudienceContact,
  AudienceContactListLink,
  AudienceContactTopicLink,
  ListAudienceContactsParams,
  ListAudienceContactsData,
  DoubleOptInConfig,
  CreateAudienceContactRequest,
  UpdateAudienceContactRequest,
  BulkCreateAudienceContactsRequest,
  BulkCreateAudienceContactsData,
  AudienceTopicSubscriptionState,
  AudienceTopicSubscription,
  BulkAudienceContactRow,
  BulkAudienceContactErrorCode,
  BulkAudienceContactError,
  BulkAudienceContactRef,
  BulkAudienceContactListsRequest,
  BulkAttachContactsListsData,
  BulkDetachContactsListsData,
  BulkAudienceContactTopicsRequest,
  BulkSubscribeContactsTopicsData,
  BulkUnsubscribeContactsTopicsData,
  AudienceTopic,
  AudienceTopicVisibility,
  AudienceTopicDefaultSubscription,
  ListAudienceTopicsParams,
  ListAudienceTopicsData,
  CreateAudienceTopicRequest,
  UpdateAudienceTopicRequest,
  AudienceProperty,
  AudiencePropertyType,
  ListAudiencePropertiesParams,
  ListAudiencePropertiesData,
  CreateAudiencePropertyRequest,
  UpdateAudiencePropertyRequest,
  AudienceSegment,
  SegmentOperator,
  SegmentCondition,
  SegmentConditionGroup,
  SegmentConditionsInput,
  ListAudienceSegmentsParams,
  ListAudienceSegmentsData,
  CreateAudienceSegmentRequest,
  UpdateAudienceSegmentRequest,

  // Campaigns
  CampaignStatus,
  CampaignEventType,
  CampaignStats,
  CampaignPagination,
  CampaignSummary,
  CampaignDetail,
  ListCampaignsParams,
  ListCampaignsData,
  CampaignEvent,
  ListCampaignEventsParams,
  ListCampaignEventsData,
  ScheduleCampaignRequest,
  CampaignActionResponse,

  // System
  HealthResponse,
  AuthCheckResponse,
} from "./types";
