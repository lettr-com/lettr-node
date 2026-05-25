import type { HttpClient } from "./http";
import type {
  AudienceProperty,
  CreateAudiencePropertyRequest,
  ListAudiencePropertiesData,
  ListAudiencePropertiesParams,
  Result,
  UpdateAudiencePropertyRequest,
} from "./types";

export class AudienceProperties {
  constructor(private http: HttpClient) {}

  async list(
    params?: ListAudiencePropertiesParams
  ): Promise<Result<ListAudiencePropertiesData>> {
    return this.http.request<ListAudiencePropertiesData>(
      "GET",
      "/audience/properties",
      { query: params as Record<string, string | number | undefined> }
    );
  }

  async create(
    data: CreateAudiencePropertyRequest
  ): Promise<Result<AudienceProperty>> {
    return this.http.request<AudienceProperty>(
      "POST",
      "/audience/properties",
      { body: data }
    );
  }

  async get(propertyId: string): Promise<Result<AudienceProperty>> {
    return this.http.request<AudienceProperty>(
      "GET",
      `/audience/properties/${encodeURIComponent(propertyId)}`
    );
  }

  async update(
    propertyId: string,
    data: UpdateAudiencePropertyRequest
  ): Promise<Result<AudienceProperty>> {
    return this.http.request<AudienceProperty>(
      "PATCH",
      `/audience/properties/${encodeURIComponent(propertyId)}`,
      { body: data }
    );
  }

  async delete(propertyId: string): Promise<Result<void>> {
    return this.http.request<void>(
      "DELETE",
      `/audience/properties/${encodeURIComponent(propertyId)}`
    );
  }
}
