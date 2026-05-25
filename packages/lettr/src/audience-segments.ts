import type { HttpClient } from "./http";
import type {
  AudienceSegment,
  CreateAudienceSegmentRequest,
  ListAudienceSegmentsData,
  ListAudienceSegmentsParams,
  Result,
  UpdateAudienceSegmentRequest,
} from "./types";

export class AudienceSegments {
  constructor(private http: HttpClient) {}

  async list(
    params?: ListAudienceSegmentsParams
  ): Promise<Result<ListAudienceSegmentsData>> {
    return this.http.request<ListAudienceSegmentsData>(
      "GET",
      "/audience/segments",
      { query: params as Record<string, string | number | undefined> }
    );
  }

  async create(
    data: CreateAudienceSegmentRequest
  ): Promise<Result<AudienceSegment>> {
    return this.http.request<AudienceSegment>("POST", "/audience/segments", {
      body: data,
    });
  }

  async get(segmentId: string): Promise<Result<AudienceSegment>> {
    return this.http.request<AudienceSegment>(
      "GET",
      `/audience/segments/${encodeURIComponent(segmentId)}`
    );
  }

  async update(
    segmentId: string,
    data: UpdateAudienceSegmentRequest
  ): Promise<Result<AudienceSegment>> {
    return this.http.request<AudienceSegment>(
      "PATCH",
      `/audience/segments/${encodeURIComponent(segmentId)}`,
      { body: data }
    );
  }

  async delete(segmentId: string): Promise<Result<void>> {
    return this.http.request<void>(
      "DELETE",
      `/audience/segments/${encodeURIComponent(segmentId)}`
    );
  }
}
