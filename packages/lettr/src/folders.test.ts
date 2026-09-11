import { describe, it, expect, beforeEach, mock } from "bun:test";
import { Lettr } from "./client";

const mockFetch = mock();
globalThis.fetch = mockFetch as unknown as typeof fetch;

const folder = (id: number, name: string, purpose: "transactional" | "campaign") => ({
  id,
  name,
  project_id: 5,
  purpose,
  templates_count: 3,
  created_at: "2026-01-15T10:00:00+00:00",
  updated_at: "2026-01-20T14:30:00+00:00",
});

describe("Folders", () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  describe("list", () => {
    it("returns paginated folder list", async () => {
      const responseData = {
        folders: [folder(10, "Emails", "transactional"), folder(11, "Campaigns", "campaign")],
        pagination: { total: 2, per_page: 25, current_page: 1, last_page: 1 },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ message: "Folders retrieved successfully.", data: responseData }),
      });

      const client = new Lettr("test-api-key");
      const result = await client.folders.list({ project_id: 5 });

      expect(result.data).toEqual(responseData);
      expect(result.error).toBeNull();

      // The whole point: an id a caller can pass as `folder_id` on create.
      expect(result.data?.folders[0]!.id).toBe(10);
      expect(result.data?.folders[1]!.purpose).toBe("campaign");

      const calledUrl = mockFetch.mock.calls[0]![0] as string;
      expect(calledUrl).toContain("/folders");
      expect(calledUrl).toContain("project_id=5");
    });

    it("works without params", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          message: "Folders retrieved successfully.",
          data: {
            folders: [],
            pagination: { total: 0, per_page: 25, current_page: 1, last_page: 1 },
          },
        }),
      });

      const client = new Lettr("test-api-key");
      await client.folders.list();

      const calledUrl = mockFetch.mock.calls[0]![0] as string;
      expect(calledUrl).toBe("https://app.lettr.com/api/folders");
    });

    it("filters by purpose", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          message: "Folders retrieved successfully.",
          data: {
            folders: [folder(11, "Campaigns", "campaign")],
            pagination: { total: 1, per_page: 25, current_page: 1, last_page: 1 },
          },
        }),
      });

      const client = new Lettr("test-api-key");
      const result = await client.folders.list({ purpose: "campaign", per_page: 50 });

      expect(result.data?.folders.every((f) => f.purpose === "campaign")).toBe(true);

      const calledUrl = mockFetch.mock.calls[0]![0] as string;
      expect(calledUrl).toContain("purpose=campaign");
      expect(calledUrl).toContain("per_page=50");
    });

    it("returns a validation error on an unknown purpose", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 422,
        json: async () => ({
          message: "Validation failed.",
          error_code: "validation_error",
          errors: { purpose: ["The purpose must be either transactional or campaign."] },
        }),
      });

      const client = new Lettr("test-api-key");
      // Cast: the union makes this unrepresentable in TypeScript, which is the
      // point — this only covers a value reaching the SDK from untyped JS.
      const result = await client.folders.list({ purpose: "newsletter" as never });

      expect(result.data).toBeNull();
      expect(result.error).toEqual({
        type: "validation",
        message: "Validation failed.",
        errors: { purpose: ["The purpose must be either transactional or campaign."] },
        error_code: "validation_error",
      });
    });

    it("returns api error on 404 when the project is not the team's", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({
          message: "Project with ID '999' was not found or you don't have access to it.",
          error_code: "not_found",
        }),
      });

      const client = new Lettr("test-api-key");
      const result = await client.folders.list({ project_id: 999 });

      expect(result.data).toBeNull();
      expect(result.error).toEqual({
        type: "api",
        message: "Project with ID '999' was not found or you don't have access to it.",
        error_code: "not_found",
      });
    });
  });
});
