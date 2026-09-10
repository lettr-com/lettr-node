import { describe, it, expect, beforeEach, mock } from "bun:test";
import { Lettr } from "./client";

const mockFetch = mock();
globalThis.fetch = mockFetch as unknown as typeof fetch;

function respond(body: unknown, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: new Headers(),
    json: async () => body,
  };
}

const template = (
  slug: string,
  preparation_status: "pending" | "ready" | "failed"
) => ({
  id: 1,
  name: slug,
  slug,
  project_id: 5,
  folder_id: 10,
  purpose: "transactional" as const,
  preparation_status,
  created_at: "2026-01-15T10:00:00+00:00",
  updated_at: "2026-01-20T14:30:00+00:00",
});

describe("preparation status and the folder filter", () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it("reports the preparation status of every row", async () => {
    mockFetch.mockResolvedValueOnce(
      respond({
        message: "Templates retrieved successfully.",
        data: {
          templates: [
            template("ready-one", "ready"),
            template("still-working", "pending"),
            template("gave-up", "failed"),
          ],
          pagination: {
            total: 3,
            per_page: 25,
            current_page: 1,
            last_page: 1,
          },
        },
      })
    );

    const client = new Lettr("test-api-key");
    const { data } = await client.templates.list();

    // One list call is the point: a bulk import reconciles every template
    // here instead of a detail call each, all dragging the full HTML payload.
    expect(data?.templates.map((t) => t.preparation_status)).toEqual([
      "ready",
      "pending",
      "failed",
    ]);
  });

  it("reports the status a create came back with", async () => {
    mockFetch.mockResolvedValueOnce(
      respond(
        {
          message: "Template created successfully.",
          data: {
            id: 123,
            name: "Welcome Email",
            slug: "welcome-email",
            project_id: 5,
            folder_id: 10,
            purpose: "transactional",
            // A JSON import has no HTML until the background job renders it.
            preparation_status: "pending",
            active_version: 1,
            merge_tags: [],
            created_at: "2026-01-28T12:00:00+00:00",
          },
        },
        201
      )
    );

    const client = new Lettr("test-api-key");
    const { data } = await client.templates.create({
      name: "Welcome Email",
      json: "{}",
    });

    expect(data?.preparation_status).toBe("pending");
  });

  it("filters the list by folder", async () => {
    mockFetch.mockResolvedValueOnce(
      respond({
        message: "Templates retrieved successfully.",
        data: {
          templates: [],
          pagination: { total: 0, per_page: 100, current_page: 1, last_page: 1 },
        },
      })
    );

    const client = new Lettr("test-api-key");
    await client.templates.list({ folder_id: 10, per_page: 100 });

    const calledUrl = mockFetch.mock.calls[0]![0] as string;
    expect(calledUrl).toContain("folder_id=10");
    expect(calledUrl).toContain("per_page=100");
  });

  it("omits folder_id from the query when unset", async () => {
    mockFetch.mockResolvedValueOnce(
      respond({
        message: "Templates retrieved successfully.",
        data: {
          templates: [],
          pagination: { total: 0, per_page: 25, current_page: 1, last_page: 1 },
        },
      })
    );

    const client = new Lettr("test-api-key");
    await client.templates.list({ project_id: 5 });

    const calledUrl = mockFetch.mock.calls[0]![0] as string;
    expect(calledUrl).not.toContain("folder_id");
  });

  // A folder outside the resolved project is a 404, not an empty list — a
  // bulk run that typos the id must not read it as "nothing arrived".
  it("surfaces an unknown folder as a 404", async () => {
    mockFetch.mockResolvedValueOnce(
      respond(
        {
          message:
            "Folder with ID '999' was not found in the specified project.",
          error_code: "not_found",
        },
        404
      )
    );

    const client = new Lettr("test-api-key");
    const { data, error } = await client.templates.list({ folder_id: 999 });

    expect(data).toBeNull();
    expect(error).toEqual({
      type: "api",
      message: "Folder with ID '999' was not found in the specified project.",
      error_code: "not_found",
    });
  });
});
