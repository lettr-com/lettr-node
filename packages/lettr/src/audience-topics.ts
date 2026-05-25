import type { HttpClient } from "./http";
import type {
  AudienceTopic,
  CreateAudienceTopicRequest,
  ListAudienceTopicsData,
  ListAudienceTopicsParams,
  Result,
  UpdateAudienceTopicRequest,
} from "./types";

export class AudienceTopics {
  constructor(private http: HttpClient) {}

  async list(
    params?: ListAudienceTopicsParams
  ): Promise<Result<ListAudienceTopicsData>> {
    return this.http.request<ListAudienceTopicsData>(
      "GET",
      "/audience/topics",
      { query: params as Record<string, string | number | undefined> }
    );
  }

  async create(
    data: CreateAudienceTopicRequest
  ): Promise<Result<AudienceTopic>> {
    return this.http.request<AudienceTopic>("POST", "/audience/topics", {
      body: data,
    });
  }

  async get(topicId: string): Promise<Result<AudienceTopic>> {
    return this.http.request<AudienceTopic>(
      "GET",
      `/audience/topics/${encodeURIComponent(topicId)}`
    );
  }

  async update(
    topicId: string,
    data: UpdateAudienceTopicRequest
  ): Promise<Result<AudienceTopic>> {
    return this.http.request<AudienceTopic>(
      "PATCH",
      `/audience/topics/${encodeURIComponent(topicId)}`,
      { body: data }
    );
  }

  async delete(topicId: string): Promise<Result<void>> {
    return this.http.request<void>(
      "DELETE",
      `/audience/topics/${encodeURIComponent(topicId)}`
    );
  }
}
