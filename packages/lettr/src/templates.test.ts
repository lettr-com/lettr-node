import { describe, it, expect, beforeEach, mock } from "bun:test";
import { Lettr } from "./client";

const mockFetch = mock();
globalThis.fetch = mockFetch as unknown as typeof fetch;

describe("Templates", () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  describe("list", () => {
    it("returns paginated template list", async () => {
      const responseData = {
        templates: [
          {
            id: 1,
            name: "Welcome Email",
            slug: "welcome-email",
            project_id: 5,
            folder_id: 10,
            created_at: "2025-01-15T10:00:00+00:00",
            updated_at: "2025-01-20T14:30:00+00:00",
          },
        ],
        pagination: { total: 42, per_page: 25, current_page: 1, last_page: 2 },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ message: "Templates retrieved successfully.", data: responseData }),
      });

      const client = new Lettr("test-api-key");
      const result = await client.templates.list({ project_id: 5, per_page: 25 });

      expect(result.data).toEqual(responseData);
      expect(result.error).toBeNull();

      const calledUrl = mockFetch.mock.calls[0]![0] as string;
      expect(calledUrl).toContain("project_id=5");
      expect(calledUrl).toContain("per_page=25");
    });
  });

  describe("create", () => {
    it("returns created template with merge tags", async () => {
      const responseData = {
        id: 123,
        name: "Welcome Email",
        slug: "welcome-email",
        project_id: 5,
        folder_id: 10,
        active_version: 1,
        versions_count: 1,
        html: "<p>Hello {{FIRST_NAME}}</p>",
        merge_tags: [{ key: "FIRST_NAME", required: true }],
        created_at: "2026-01-28T12:00:00+00:00",
        updated_at: "2026-01-28T12:00:00+00:00",
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => ({ message: "Template created successfully.", data: responseData }),
      });

      const client = new Lettr("test-api-key");
      const result = await client.templates.create({
        name: "Welcome Email",
        html: "<p>Hello {{FIRST_NAME}}</p>",
        project_id: 5,
      });

      expect(result.data).toEqual(responseData);
      expect(result.error).toBeNull();
    });

    it("returns validation error on 422", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 422,
        json: async () => ({
          message: "Validation failed.",
          error_code: "validation_error",
          errors: { name: ["The name field is required."] },
        }),
      });

      const client = new Lettr("test-api-key");
      const result = await client.templates.create({ name: "" });

      expect(result.data).toBeNull();
      expect(result.error).toEqual({
        type: "validation",
        message: "Validation failed.",
        errors: { name: ["The name field is required."] },
      });
    });
  });

  describe("get", () => {
    it("returns template detail", async () => {
      const responseData = {
        id: 1,
        name: "Welcome Email",
        slug: "welcome-email",
        project_id: 5,
        folder_id: 10,
        active_version: 2,
        versions_count: 3,
        html: "<p>Welcome!</p>",
        json: null,
        created_at: "2025-01-15T10:00:00+00:00",
        updated_at: "2025-01-20T14:30:00+00:00",
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ message: "Template retrieved successfully.", data: responseData }),
      });

      const client = new Lettr("test-api-key");
      const result = await client.templates.get("welcome-email", 5);

      expect(result.data).toEqual(responseData);

      const calledUrl = mockFetch.mock.calls[0]![0] as string;
      expect(calledUrl).toContain("/templates/welcome-email");
      expect(calledUrl).toContain("project_id=5");
    });

    it("returns error on 404", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({
          message: "Template with slug 'nonexistent' was not found.",
          error_code: "not_found",
        }),
      });

      const client = new Lettr("test-api-key");
      const result = await client.templates.get("nonexistent");

      expect(result.data).toBeNull();
      expect(result.error).toEqual({
        type: "api",
        message: "Template with slug 'nonexistent' was not found.",
        error_code: "not_found",
      });
    });
  });

  describe("update", () => {
    it("returns updated template", async () => {
      const responseData = {
        id: 123,
        name: "Updated Welcome Email",
        slug: "welcome-email",
        project_id: 5,
        folder_id: 10,
        active_version: 2,
        versions_count: 2,
        html: "<p>Hello {{NAME}}</p>",
        merge_tags: [{ key: "NAME", required: true }],
        created_at: "2026-01-15T10:00:00+00:00",
        updated_at: "2026-01-28T14:30:00+00:00",
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ message: "Template updated successfully.", data: responseData }),
      });

      const client = new Lettr("test-api-key");
      const result = await client.templates.update("welcome-email", {
        name: "Updated Welcome Email",
        html: "<p>Hello {{NAME}}</p>",
      });

      expect(result.data).toEqual(responseData);
      expect(result.error).toBeNull();

      const [, init] = mockFetch.mock.calls[0]!;
      expect(init.method).toBe("PUT");
    });
  });

  describe("delete", () => {
    it("returns success message", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ message: "Template deleted successfully." }),
      });

      const client = new Lettr("test-api-key");
      const result = await client.templates.delete("welcome-email", 5);

      expect(result.data).toEqual({ message: "Template deleted successfully." });
      expect(result.error).toBeNull();

      const calledUrl = mockFetch.mock.calls[0]![0] as string;
      expect(calledUrl).toContain("/templates/welcome-email");
      expect(calledUrl).toContain("project_id=5");

      const [, init] = mockFetch.mock.calls[0]!;
      expect(init.method).toBe("DELETE");
    });

    it("returns error on 404", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({
          message: "Template with slug 'nonexistent' was not found.",
          error_code: "not_found",
        }),
      });

      const client = new Lettr("test-api-key");
      const result = await client.templates.delete("nonexistent");

      expect(result.data).toBeNull();
      expect(result.error).toEqual({
        type: "api",
        message: "Template with slug 'nonexistent' was not found.",
        error_code: "not_found",
      });
    });
  });

  describe("getMergeTags", () => {
    it("returns merge tags for a template", async () => {
      const responseData = {
        project_id: 5,
        template_slug: "welcome-email",
        version: 2,
        merge_tags: [
          { key: "first_name", required: true },
          { key: "company_name", required: false },
          {
            key: "order_items",
            required: false,
            children: [
              { key: "item_name", type: "text" },
              { key: "item_quantity", type: "number" },
            ],
          },
        ],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ message: "Merge tags retrieved successfully.", data: responseData }),
      });

      const client = new Lettr("test-api-key");
      const result = await client.templates.getMergeTags("welcome-email", {
        version: 2,
        project_id: 5,
      });

      expect(result.data).toEqual(responseData);
      expect(result.error).toBeNull();

      const calledUrl = mockFetch.mock.calls[0]![0] as string;
      expect(calledUrl).toContain("/templates/welcome-email/merge-tags");
      expect(calledUrl).toContain("version=2");
      expect(calledUrl).toContain("project_id=5");
    });
  });

  describe("getHtml", () => {
    it("returns template HTML and merge tags", async () => {
      const responseData = {
        html: "<h1>Hello {{name}}</h1><p>Welcome!</p>",
        merge_tags: [
          { key: "name", name: "name", required: true },
          { key: "company", name: "company", required: false },
        ],
        subject: "Welcome Email",
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ data: responseData }),
      });

      const client = new Lettr("test-api-key");
      const result = await client.templates.getHtml({ project_id: 5, slug: "welcome-email" });

      expect(result.data).toEqual(responseData);
      expect(result.error).toBeNull();

      const calledUrl = mockFetch.mock.calls[0]![0] as string;
      expect(calledUrl).toContain("/templates/html");
      expect(calledUrl).toContain("project_id=5");
      expect(calledUrl).toContain("slug=welcome-email");
    });

    it("returns error on 404", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({
          message: "Template not found.",
          error_code: "not_found",
        }),
      });

      const client = new Lettr("test-api-key");
      const result = await client.templates.getHtml({ project_id: 5, slug: "nonexistent" });

      expect(result.data).toBeNull();
      expect(result.error).toEqual({
        type: "api",
        message: "Template not found.",
        error_code: "not_found",
      });
    });
  });
});
