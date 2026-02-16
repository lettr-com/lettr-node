import type { HttpClient } from "./http";
import type {
  ListDomainsResponse,
  CreateDomainResponse,
  DomainDetail,
  VerifyDomainResponse,
  Result,
} from "./types";

export class Domains {
  constructor(private http: HttpClient) {}

  async list(): Promise<Result<ListDomainsResponse>> {
    return this.http.request<ListDomainsResponse>("GET", "/domains");
  }

  async create(domain: string): Promise<Result<CreateDomainResponse>> {
    return this.http.request<CreateDomainResponse>("POST", "/domains", {
      body: { domain },
    });
  }

  async get(domain: string): Promise<Result<DomainDetail>> {
    return this.http.request<DomainDetail>(
      "GET",
      `/domains/${encodeURIComponent(domain)}`
    );
  }

  async delete(domain: string): Promise<Result<void>> {
    return this.http.request<void>(
      "DELETE",
      `/domains/${encodeURIComponent(domain)}`
    );
  }

  async verify(domain: string): Promise<Result<VerifyDomainResponse>> {
    return this.http.request<VerifyDomainResponse>(
      "POST",
      `/domains/${encodeURIComponent(domain)}/verify`
    );
  }
}
