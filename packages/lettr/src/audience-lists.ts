import type { HttpClient } from "./http";
import type {
  AudienceList,
  BulkDeleteAudienceListsData,
  BulkDeleteAudienceListsRequest,
  CreateAudienceListRequest,
  ListAudienceListsData,
  ListAudienceListsParams,
  Result,
  UpdateAudienceListRequest,
} from "./types";

export class AudienceLists {
  constructor(private http: HttpClient) {}

  async list(
    params?: ListAudienceListsParams
  ): Promise<Result<ListAudienceListsData>> {
    return this.http.request<ListAudienceListsData>("GET", "/audience/lists", {
      query: params as Record<string, string | number | undefined>,
    });
  }

  async create(
    data: CreateAudienceListRequest
  ): Promise<Result<AudienceList>> {
    return this.http.request<AudienceList>("POST", "/audience/lists", {
      body: data,
    });
  }

  async get(listId: string): Promise<Result<AudienceList>> {
    return this.http.request<AudienceList>(
      "GET",
      `/audience/lists/${encodeURIComponent(listId)}`
    );
  }

  async update(
    listId: string,
    data: UpdateAudienceListRequest
  ): Promise<Result<AudienceList>> {
    return this.http.request<AudienceList>(
      "PATCH",
      `/audience/lists/${encodeURIComponent(listId)}`,
      { body: data }
    );
  }

  async delete(listId: string): Promise<Result<void>> {
    return this.http.request<void>(
      "DELETE",
      `/audience/lists/${encodeURIComponent(listId)}`
    );
  }

  async bulkDelete(
    data: BulkDeleteAudienceListsRequest
  ): Promise<Result<BulkDeleteAudienceListsData>> {
    return this.http.request<BulkDeleteAudienceListsData>(
      "DELETE",
      "/audience/lists/bulk",
      { body: data }
    );
  }
}
