import { describe, it, expect, beforeEach, mock } from "bun:test";
import { Lettr } from "./client";

const mockFetch = mock();
globalThis.fetch = mockFetch as unknown as typeof fetch;

describe("Projects", () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  describe("list", () => {
    it("returns paginated project list", async () => {
      const responseData = {
        projects: [
          {
            id: 1,
            name: "My Project",
            emoji: "\u{1F680}",
            team_id: 5,
            created_at: "2025-01-15T10:00:00+00:00",
            updated_at: "2025-01-20T14:30:00+00:00",
          },
        ],
        pagination: { total: 10, per_page: 25, current_page: 1, last_page: 1 },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ message: "Projects retrieved successfully.", data: responseData }),
      });

      const client = new Lettr("test-api-key");
      const result = await client.projects.list({ per_page: 25, page: 1 });

      expect(result.data).toEqual(responseData);
      expect(result.error).toBeNull();

      const calledUrl = mockFetch.mock.calls[0]![0] as string;
      expect(calledUrl).toContain("per_page=25");
      expect(calledUrl).toContain("page=1");
    });

    it("works without params", async () => {
      const responseData = {
        projects: [],
        pagination: { total: 0, per_page: 25, current_page: 1, last_page: 1 },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ message: "Projects retrieved successfully.", data: responseData }),
      });

      const client = new Lettr("test-api-key");
      const result = await client.projects.list();

      expect(result.data).toEqual(responseData);

      const calledUrl = mockFetch.mock.calls[0]![0] as string;
      expect(calledUrl).toBe("https://app.lettr.com/api/projects");
    });

    it("returns api error on 401", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ message: "API key is required." }),
      });

      const client = new Lettr("bad-key");
      const result = await client.projects.list();

      expect(result.data).toBeNull();
      expect(result.error).toEqual({
        type: "api",
        message: "API key is required.",
        error_code: "unauthorized",
      });
    });
  });
});
