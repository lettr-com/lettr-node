import type { HttpClient } from "./http";
import type {
  ListTemplatesParams,
  ListTemplatesResponse,
  CreateTemplateRequest,
  CreateTemplateResponse,
  TemplateDetail,
  UpdateTemplateRequest,
  UpdateTemplateResponse,
  GetMergeTagsParams,
  GetMergeTagsResponse,
  Result,
} from "./types";

export class Templates {
  constructor(private http: HttpClient) {}

  async list(
    params?: ListTemplatesParams
  ): Promise<Result<ListTemplatesResponse>> {
    return this.http.request<ListTemplatesResponse>("GET", "/templates", {
      query: params as Record<string, string | number | undefined>,
    });
  }

  async create(
    data: CreateTemplateRequest
  ): Promise<Result<CreateTemplateResponse>> {
    return this.http.request<CreateTemplateResponse>("POST", "/templates", {
      body: data,
    });
  }

  async get(
    slug: string,
    projectId?: number
  ): Promise<Result<TemplateDetail>> {
    return this.http.request<TemplateDetail>(
      "GET",
      `/templates/${encodeURIComponent(slug)}`,
      { query: { project_id: projectId } }
    );
  }

  async update(
    slug: string,
    data: UpdateTemplateRequest
  ): Promise<Result<UpdateTemplateResponse>> {
    return this.http.request<UpdateTemplateResponse>(
      "PUT",
      `/templates/${encodeURIComponent(slug)}`,
      { body: data }
    );
  }

  async delete(
    slug: string,
    projectId?: number
  ): Promise<Result<{ message: string }>> {
    return this.http.request<{ message: string }>(
      "DELETE",
      `/templates/${encodeURIComponent(slug)}`,
      { query: { project_id: projectId }, unwrap: false }
    );
  }

  async getMergeTags(
    slug: string,
    params?: GetMergeTagsParams
  ): Promise<Result<GetMergeTagsResponse>> {
    return this.http.request<GetMergeTagsResponse>(
      "GET",
      `/templates/${encodeURIComponent(slug)}/merge-tags`,
      {
        query: params as Record<string, string | number | undefined>,
      }
    );
  }
}
