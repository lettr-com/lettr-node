import type { HttpClient } from "./http";
import type {
  ListFoldersParams,
  ListFoldersResponse,
  Result,
} from "./types";

/**
 * Read-only. Creating, renaming and deleting folders stay in the app, because
 * deleting one moves or deletes the templates inside it.
 */
export class Folders {
  constructor(private http: HttpClient) {}

  async list(params?: ListFoldersParams): Promise<Result<ListFoldersResponse>> {
    return this.http.request<ListFoldersResponse>("GET", "/folders", {
      query: params as Record<string, string | number | undefined>,
    });
  }
}
