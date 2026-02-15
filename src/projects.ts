import type { HttpClient } from "./http";
import type {
  ListProjectsParams,
  ListProjectsResponse,
  Result,
} from "./types";

export class Projects {
  constructor(private http: HttpClient) {}

  async list(
    params?: ListProjectsParams
  ): Promise<Result<ListProjectsResponse>> {
    return this.http.request<ListProjectsResponse>("GET", "/projects", {
      query: params as Record<string, string | number | undefined>,
    });
  }
}
