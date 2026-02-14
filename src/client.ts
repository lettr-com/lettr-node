import { HttpClient } from "./http";
import { Emails } from "./emails";
import { Domains } from "./domains";
import { Templates } from "./templates";
import { Webhooks } from "./webhooks";
import { Projects } from "./projects";
import type { HealthResponse, AuthCheckResponse, Result } from "./types";

const BASE_URL = "https://app.lettr.com/api";

export class Lettr {
  public readonly emails: Emails;
  public readonly domains: Domains;
  public readonly templates: Templates;
  public readonly webhooks: Webhooks;
  public readonly projects: Projects;

  private http: HttpClient;

  constructor(apiKey: string) {
    this.http = new HttpClient(BASE_URL, apiKey);
    this.emails = new Emails(this.http);
    this.domains = new Domains(this.http);
    this.templates = new Templates(this.http);
    this.webhooks = new Webhooks(this.http);
    this.projects = new Projects(this.http);
  }

  async health(): Promise<Result<HealthResponse>> {
    return this.http.request<HealthResponse>("GET", "/health");
  }

  async authCheck(): Promise<Result<AuthCheckResponse>> {
    return this.http.request<AuthCheckResponse>("GET", "/auth/check");
  }
}
