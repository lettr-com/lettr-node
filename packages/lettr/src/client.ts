import { HttpClient } from "./http";
import { Emails } from "./emails";
import { Domains } from "./domains";
import { Templates } from "./templates";
import { Webhooks } from "./webhooks";
import { Projects } from "./projects";
import { Audience } from "./audience";
import { Campaigns } from "./campaigns";
import type { HealthResponse, AuthCheckResponse, Result } from "./types";

const BASE_URL = "https://app.lettr.com/api";

export interface LettrOptions {
  /** Caller identifier appended to the SDK's User-Agent (e.g. "lettr-kit/1.0.5"). */
  userAgent?: string;
}

export class Lettr {
  public readonly emails: Emails;
  public readonly domains: Domains;
  public readonly templates: Templates;
  public readonly webhooks: Webhooks;
  public readonly projects: Projects;
  public readonly audience: Audience;
  public readonly campaigns: Campaigns;

  private http: HttpClient;

  constructor(apiKey: string, options?: LettrOptions) {
    this.http = new HttpClient(BASE_URL, apiKey, options?.userAgent);
    this.emails = new Emails(this.http);
    this.domains = new Domains(this.http);
    this.templates = new Templates(this.http);
    this.webhooks = new Webhooks(this.http);
    this.projects = new Projects(this.http);
    this.audience = new Audience(this.http);
    this.campaigns = new Campaigns(this.http);
  }

  async health(): Promise<Result<HealthResponse>> {
    return this.http.request<HealthResponse>("GET", "/health");
  }

  async authCheck(): Promise<Result<AuthCheckResponse>> {
    return this.http.request<AuthCheckResponse>("GET", "/auth/check");
  }
}
