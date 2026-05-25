export { Lettr } from "./client";
export { Emails } from "./emails";
export { Domains } from "./domains";
export { Templates } from "./templates";
export { Webhooks } from "./webhooks";
export { Projects } from "./projects";
export { Audience } from "./audience";
export { AudienceLists } from "./audience-lists";
export { AudienceContacts } from "./audience-contacts";
export { AudienceTopics } from "./audience-topics";
export { AudienceProperties } from "./audience-properties";
export { AudienceSegments } from "./audience-segments";
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
  BulkAudienceContactListsRequest,
  BulkAttachContactsListsData,
  BulkDetachContactsListsData,
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

  // System
  HealthResponse,
  AuthCheckResponse,
} from "./types";
