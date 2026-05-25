import { describe, it, expect, beforeEach, mock } from "bun:test";
import { Lettr } from "./client";
import type {
  AudienceContact,
  AudienceList,
  AudienceProperty,
  AudienceSegment,
  AudienceTopic,
  AudiencePagination,
} from "./types";

const mockFetch = mock();
globalThis.fetch = mockFetch as unknown as typeof fetch;

const pagination: AudiencePagination = {
  total: 1,
  per_page: 20,
  current_page: 1,
  last_page: 1,
};

const listData: AudienceList = {
  id: "0193e6a8-1f3a-7c2a-b9e2-1aa1d2e5d3f0",
  name: "Newsletter subscribers",
  contacts_count: 12,
};

const contactData: AudienceContact = {
  id: "0193e6b0-9c1d-7d4f-a8f1-cef9a1b2d3e4",
  email: "jane@example.com",
  status: "subscribed",
  properties: { first_name: "Jane" },
  created_at: "2024-01-15T10:30:00Z",
  lists: [],
  topics: [],
};

const topicData: AudienceTopic = {
  id: "0193e6c0-1111-7c2a-b9e2-1aa1d2e5d3f0",
  name: "Product updates",
  description: null,
  default_subscription: "opt_in",
  visibility: "private",
  contacts_count: 0,
  created_at: "2024-01-15T10:30:00Z",
};

const propertyData: AudienceProperty = {
  id: "0193e6d0-2222-7c2a-b9e2-1aa1d2e5d3f0",
  name: "first_name",
  type: "string",
  fallback_value: "Friend",
  created_at: "2024-01-15T10:30:00Z",
};

const segmentData: AudienceSegment = {
  id: "0193e6e0-3333-7c2a-b9e2-1aa1d2e5d3f0",
  name: "Engaged subscribers",
  list_id: null,
  list_name: null,
  condition_groups: [
    {
      conditions: [{ field: "email", operator: "contains", value: "@example.com" }],
    },
  ],
  cached_contacts_count: 0,
  created_at: "2024-01-15T10:30:00Z",
};

describe("Audience.Lists", () => {
  beforeEach(() => mockFetch.mockReset());

  it("lists with pagination params", async () => {
    const responseData = { lists: [listData], pagination };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ message: "Lists retrieved.", data: responseData }),
    });

    const client = new Lettr("test-api-key");
    const result = await client.audience.lists.list({ page: 1, per_page: 20 });

    expect(result.data).toEqual(responseData);
    expect(result.error).toBeNull();
    const calledUrl = mockFetch.mock.calls[0]![0] as string;
    expect(calledUrl).toBe(
      "https://app.lettr.com/api/audience/lists?page=1&per_page=20"
    );
  });

  it("returns api error on 401", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: async () => ({ message: "API key is required." }),
    });

    const client = new Lettr("bad-key");
    const result = await client.audience.lists.list();

    expect(result.data).toBeNull();
    expect(result.error).toEqual({
      type: "api",
      message: "API key is required.",
      error_code: "unauthorized",
    });
  });

  it("creates a list", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 201,
      json: async () => ({ message: "Created.", data: listData }),
    });

    const client = new Lettr("test-api-key");
    const result = await client.audience.lists.create({ name: "Newsletter subscribers" });

    expect(result.data).toEqual(listData);
    const [, init] = mockFetch.mock.calls[0]!;
    expect(init.method).toBe("POST");
    const body = JSON.parse(init.body as string);
    expect(body.name).toBe("Newsletter subscribers");
  });

  it("returns validation error on create 422", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 422,
      json: async () => ({
        message: "Validation failed.",
        errors: { name: ["The name field is required."] },
      }),
    });

    const client = new Lettr("test-api-key");
    const result = await client.audience.lists.create({ name: "" });

    expect(result.data).toBeNull();
    expect(result.error).toEqual({
      type: "validation",
      message: "Validation failed.",
      errors: { name: ["The name field is required."] },
    });
  });

  it("gets a list", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ message: "Retrieved.", data: listData }),
    });

    const client = new Lettr("test-api-key");
    const result = await client.audience.lists.get(listData.id);

    expect(result.data).toEqual(listData);
    const calledUrl = mockFetch.mock.calls[0]![0] as string;
    expect(calledUrl).toBe(
      `https://app.lettr.com/api/audience/lists/${listData.id}`
    );
  });

  it("updates a list with PATCH", async () => {
    const updated = { ...listData, name: "Renamed" };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ message: "Updated.", data: updated }),
    });

    const client = new Lettr("test-api-key");
    const result = await client.audience.lists.update(listData.id, { name: "Renamed" });

    expect(result.data).toEqual(updated);
    const [, init] = mockFetch.mock.calls[0]!;
    expect(init.method).toBe("PATCH");
  });

  it("deletes a list returning 204", async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, status: 204, json: async () => ({}) });

    const client = new Lettr("test-api-key");
    const result = await client.audience.lists.delete(listData.id);

    expect(result.data).toBeUndefined();
    expect(result.error).toBeNull();
    const [, init] = mockFetch.mock.calls[0]!;
    expect(init.method).toBe("DELETE");
  });

  it("returns 404 on delete", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      json: async () => ({ message: "List not found.", error_code: "not_found" }),
    });

    const client = new Lettr("test-api-key");
    const result = await client.audience.lists.delete("nonexistent");

    expect(result.data).toBeNull();
    expect(result.error).toEqual({
      type: "api",
      message: "List not found.",
      error_code: "not_found",
    });
  });

  it("bulk deletes lists", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ message: "Deleted.", data: { deleted: 2 } }),
    });

    const client = new Lettr("test-api-key");
    const result = await client.audience.lists.bulkDelete({
      list_ids: [listData.id, "0193e6a8-2a4b-7d1c-a3f5-2bb2e3f6e4a1"],
    });

    expect(result.data).toEqual({ deleted: 2 });
    const calledUrl = mockFetch.mock.calls[0]![0] as string;
    expect(calledUrl).toBe("https://app.lettr.com/api/audience/lists/bulk");
    const [, init] = mockFetch.mock.calls[0]!;
    expect(init.method).toBe("DELETE");
    const body = JSON.parse(init.body as string);
    expect(body.list_ids).toHaveLength(2);
  });
});

describe("Audience.Contacts", () => {
  beforeEach(() => mockFetch.mockReset());

  it("lists contacts with filters", async () => {
    const responseData = { contacts: [contactData], pagination };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ message: "Retrieved.", data: responseData }),
    });

    const client = new Lettr("test-api-key");
    const result = await client.audience.contacts.list({
      search: "jane",
      status: "subscribed",
      list_id: listData.id,
    });

    expect(result.data).toEqual(responseData);
    const calledUrl = mockFetch.mock.calls[0]![0] as string;
    expect(calledUrl).toContain("search=jane");
    expect(calledUrl).toContain("status=subscribed");
    expect(calledUrl).toContain(`list_id=${listData.id}`);
  });

  it("creates a contact", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 201,
      json: async () => ({ message: "Created.", data: contactData }),
    });

    const client = new Lettr("test-api-key");
    const result = await client.audience.contacts.create({
      email: "jane@example.com",
      list_id: listData.id,
      properties: { first_name: "Jane" },
    });

    expect(result.data).toEqual(contactData);
    const body = JSON.parse(mockFetch.mock.calls[0]![1].body as string);
    expect(body.email).toBe("jane@example.com");
    expect(body.list_id).toBe(listData.id);
  });

  it("creates a contact with double opt-in", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 201,
      json: async () => ({
        message: "Created.",
        data: { ...contactData, status: "unverified" },
      }),
    });

    const client = new Lettr("test-api-key");
    const result = await client.audience.contacts.create({
      email: "jane@example.com",
      double_opt_in: {
        from: "no-reply@example.com",
        subject: "Confirm subscription",
        template_slug: "double-opt-in",
        redirect_url: "https://example.com/confirmed",
      },
    });

    expect(result.data!.status).toBe("unverified");
    const body = JSON.parse(mockFetch.mock.calls[0]![1].body as string);
    expect(body.double_opt_in.template_slug).toBe("double-opt-in");
  });

  it("bulk creates contacts", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 201,
      json: async () => ({
        message: "Created.",
        data: { created: 2, already_existed: 0 },
      }),
    });

    const client = new Lettr("test-api-key");
    const result = await client.audience.contacts.bulkCreate({
      emails: ["jane@example.com", "joe@example.com"],
    });

    expect(result.data).toEqual({ created: 2, already_existed: 0 });
    const calledUrl = mockFetch.mock.calls[0]![0] as string;
    expect(calledUrl).toBe("https://app.lettr.com/api/audience/contacts/bulk");
  });

  it("updates a contact with PATCH", async () => {
    const updated = { ...contactData, status: "unsubscribed" as const };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ message: "Updated.", data: updated }),
    });

    const client = new Lettr("test-api-key");
    const result = await client.audience.contacts.update(contactData.id, {
      status: "unsubscribed",
    });

    expect(result.data!.status).toBe("unsubscribed");
    const [, init] = mockFetch.mock.calls[0]!;
    expect(init.method).toBe("PATCH");
  });

  it("returns 404 when updating missing contact", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      json: async () => ({ message: "Contact not found.", error_code: "not_found" }),
    });

    const client = new Lettr("test-api-key");
    const result = await client.audience.contacts.update("nonexistent", { email: "x@y.com" });

    expect(result.data).toBeNull();
    expect(result.error).toEqual({
      type: "api",
      message: "Contact not found.",
      error_code: "not_found",
    });
  });

  it("attaches contact to list (message-only response)", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 201,
      json: async () => ({ message: "Contact attached to list." }),
    });

    const client = new Lettr("test-api-key");
    const result = await client.audience.contacts.attachList(
      contactData.id,
      listData.id
    );

    expect(result.data).toEqual({ message: "Contact attached to list." });
    const calledUrl = mockFetch.mock.calls[0]![0] as string;
    expect(calledUrl).toBe(
      `https://app.lettr.com/api/audience/contacts/${contactData.id}/lists/${listData.id}`
    );
    const [, init] = mockFetch.mock.calls[0]!;
    expect(init.method).toBe("POST");
  });

  it("detaches contact from list (204)", async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, status: 204, json: async () => ({}) });

    const client = new Lettr("test-api-key");
    const result = await client.audience.contacts.detachList(
      contactData.id,
      listData.id
    );

    expect(result.data).toBeUndefined();
    expect(result.error).toBeNull();
  });

  it("bulk attaches contacts to lists", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        message: "Attached.",
        data: { attached: 2, already_attached: 0, total_pairs: 2 },
      }),
    });

    const client = new Lettr("test-api-key");
    const result = await client.audience.contacts.bulkAttachLists({
      contact_ids: [contactData.id],
      list_ids: [listData.id, "0193e6a8-2a4b-7d1c-a3f5-2bb2e3f6e4a1"],
    });

    expect(result.data).toEqual({ attached: 2, already_attached: 0, total_pairs: 2 });
    const [, init] = mockFetch.mock.calls[0]!;
    expect(init.method).toBe("POST");
  });

  it("bulk detaches contacts from lists", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        message: "Detached.",
        data: { detached: 1, not_present: 1, total_pairs: 2 },
      }),
    });

    const client = new Lettr("test-api-key");
    const result = await client.audience.contacts.bulkDetachLists({
      contact_ids: [contactData.id],
      list_ids: [listData.id, "0193e6a8-2a4b-7d1c-a3f5-2bb2e3f6e4a1"],
    });

    expect(result.data).toEqual({ detached: 1, not_present: 1, total_pairs: 2 });
    const [, init] = mockFetch.mock.calls[0]!;
    expect(init.method).toBe("DELETE");
  });

  it("subscribes contact to topic", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 201,
      json: async () => ({ message: "Contact subscribed to topic." }),
    });

    const client = new Lettr("test-api-key");
    const result = await client.audience.contacts.subscribeTopic(
      contactData.id,
      topicData.id
    );

    expect(result.data).toEqual({ message: "Contact subscribed to topic." });
  });

  it("unsubscribes contact from topic (204)", async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, status: 204, json: async () => ({}) });

    const client = new Lettr("test-api-key");
    const result = await client.audience.contacts.unsubscribeTopic(
      contactData.id,
      topicData.id
    );

    expect(result.data).toBeUndefined();
    expect(result.error).toBeNull();
  });
});

describe("Audience.Topics", () => {
  beforeEach(() => mockFetch.mockReset());

  it("lists topics", async () => {
    const responseData = { topics: [topicData], pagination };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ message: "Retrieved.", data: responseData }),
    });

    const client = new Lettr("test-api-key");
    const result = await client.audience.topics.list();

    expect(result.data).toEqual(responseData);
  });

  it("creates a topic", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 201,
      json: async () => ({ message: "Created.", data: topicData }),
    });

    const client = new Lettr("test-api-key");
    const result = await client.audience.topics.create({
      name: "Product updates",
      default_subscription: "opt_in",
    });

    expect(result.data).toEqual(topicData);
  });

  it("gets, updates with PATCH, deletes a topic", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ message: "Retrieved.", data: topicData }),
    });
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ message: "Updated.", data: { ...topicData, name: "Renamed" } }),
    });
    mockFetch.mockResolvedValueOnce({ ok: true, status: 204, json: async () => ({}) });

    const client = new Lettr("test-api-key");
    expect((await client.audience.topics.get(topicData.id)).data).toEqual(topicData);

    const updated = await client.audience.topics.update(topicData.id, { name: "Renamed" });
    expect(updated.data!.name).toBe("Renamed");
    expect(mockFetch.mock.calls[1]![1].method).toBe("PATCH");

    const del = await client.audience.topics.delete(topicData.id);
    expect(del.data).toBeUndefined();
    expect(del.error).toBeNull();
  });
});

describe("Audience.Properties", () => {
  beforeEach(() => mockFetch.mockReset());

  it("lists properties", async () => {
    const responseData = { properties: [propertyData], pagination };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ message: "Retrieved.", data: responseData }),
    });

    const client = new Lettr("test-api-key");
    const result = await client.audience.properties.list();

    expect(result.data).toEqual(responseData);
  });

  it("creates a property", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 201,
      json: async () => ({ message: "Created.", data: propertyData }),
    });

    const client = new Lettr("test-api-key");
    const result = await client.audience.properties.create({
      name: "first_name",
      type: "string",
      fallback_value: "Friend",
    });

    expect(result.data).toEqual(propertyData);
  });

  it("returns 422 on invalid property name", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 422,
      json: async () => ({
        message: "Validation failed.",
        errors: { name: ["The name format is invalid."] },
      }),
    });

    const client = new Lettr("test-api-key");
    const result = await client.audience.properties.create({
      name: "InvalidName",
      type: "string",
    });

    expect(result.data).toBeNull();
    expect(result.error).toEqual({
      type: "validation",
      message: "Validation failed.",
      errors: { name: ["The name format is invalid."] },
    });
  });

  it("updates fallback_value with PATCH and deletes", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        message: "Updated.",
        data: { ...propertyData, fallback_value: "Hi" },
      }),
    });
    mockFetch.mockResolvedValueOnce({ ok: true, status: 204, json: async () => ({}) });

    const client = new Lettr("test-api-key");
    const updated = await client.audience.properties.update(propertyData.id, {
      fallback_value: "Hi",
    });
    expect(updated.data!.fallback_value).toBe("Hi");
    expect(mockFetch.mock.calls[0]![1].method).toBe("PATCH");

    const del = await client.audience.properties.delete(propertyData.id);
    expect(del.data).toBeUndefined();
  });
});

describe("Audience.Segments", () => {
  beforeEach(() => mockFetch.mockReset());

  it("lists segments filtered by list_id", async () => {
    const responseData = { segments: [segmentData], pagination };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ message: "Retrieved.", data: responseData }),
    });

    const client = new Lettr("test-api-key");
    const result = await client.audience.segments.list({ list_id: listData.id });

    expect(result.data).toEqual(responseData);
    const calledUrl = mockFetch.mock.calls[0]![0] as string;
    expect(calledUrl).toContain(`list_id=${listData.id}`);
  });

  it("creates a segment with conditions", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 201,
      json: async () => ({ message: "Created.", data: segmentData }),
    });

    const client = new Lettr("test-api-key");
    const result = await client.audience.segments.create({
      name: "Engaged subscribers",
      conditions: {
        groups: [
          {
            conditions: [
              { field: "email", operator: "contains", value: "@example.com" },
            ],
          },
        ],
      },
    });

    expect(result.data).toEqual(segmentData);
    const body = JSON.parse(mockFetch.mock.calls[0]![1].body as string);
    expect(body.conditions.groups[0].conditions[0].operator).toBe("contains");
  });

  it("gets, updates with PATCH, deletes a segment", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ message: "Retrieved.", data: segmentData }),
    });
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        message: "Updated.",
        data: { ...segmentData, name: "Renamed" },
      }),
    });
    mockFetch.mockResolvedValueOnce({ ok: true, status: 204, json: async () => ({}) });

    const client = new Lettr("test-api-key");
    expect((await client.audience.segments.get(segmentData.id)).data).toEqual(segmentData);

    const updated = await client.audience.segments.update(segmentData.id, {
      name: "Renamed",
    });
    expect(updated.data!.name).toBe("Renamed");
    expect(mockFetch.mock.calls[1]![1].method).toBe("PATCH");

    const del = await client.audience.segments.delete(segmentData.id);
    expect(del.data).toBeUndefined();
    expect(del.error).toBeNull();
  });

  it("returns 404 on missing segment", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      json: async () => ({ message: "Segment not found.", error_code: "not_found" }),
    });

    const client = new Lettr("test-api-key");
    const result = await client.audience.segments.get("nonexistent");

    expect(result.data).toBeNull();
    expect(result.error).toEqual({
      type: "api",
      message: "Segment not found.",
      error_code: "not_found",
    });
  });
});
