import { describe, test, expect, afterAll } from "bun:test";
import { Lettr } from "./index";

const API_KEY = process.env.LETTR_API_KEY;

describe.skipIf(!API_KEY)("e2e", () => {
  const client = new Lettr(API_KEY!);

  // ─── Health & Auth ──────────────────────────────────────────────

  describe("health & auth", () => {
    test("health()", async () => {
      const { data, error } = await client.health();
      expect(error).toBeNull();
      expect(data).not.toBeNull();
      expect(data!.status).toBeString();
      expect(data!.timestamp).toBeString();
    });

    test("authCheck()", async () => {
      const { data, error } = await client.authCheck();
      expect(error).toBeNull();
      expect(data).not.toBeNull();
      expect(data!.team_id).toBeNumber();
      expect(data!.timestamp).toBeString();
    });
  });

  // ─── Emails ─────────────────────────────────────────────────────

  describe("emails", () => {
    let existingRequestId: string;

    test("send()", async () => {
      const { data, error } = await client.emails.send({
        from: "test@testmail.lettr.cz",
        subject: `E2E test email ${Date.now()}`,
        to: ["test@testmail.lettr.cz"],
        html: "<h1>E2E Test</h1><p>Sent from e2e.test.ts</p>",
      });
      expect(error).toBeNull();
      expect(data).not.toBeNull();
      expect(data!.request_id).toBeString();
      expect(data!.accepted).toBeNumber();
      expect(data!.rejected).toBeNumber();
      expect(data!.message).toBeString();
    });

    test("list()", async () => {
      const { data, error } = await client.emails.list({ per_page: 5 });
      expect(error).toBeNull();
      expect(data).not.toBeNull();
      expect(Array.isArray(data!.results)).toBe(true);
      expect(data!.total_count).toBeNumber();
      expect(data!.pagination).toBeDefined();
      expect(data!.pagination.per_page).toBeNumber();
      if (data!.results.length > 0 && data!.results[0].request_id) {
        existingRequestId = data!.results[0].request_id;
      }
    });

    test("get(requestId)", async () => {
      if (!existingRequestId) return; // skip if no emails with request_id exist
      const { data, error } = await client.emails.get(existingRequestId);
      expect(error).toBeNull();
      expect(data).not.toBeNull();
      expect(Array.isArray(data!.results)).toBe(true);
      expect(data!.total_count).toBeNumber();
    });
  });

  // ─── Domains ────────────────────────────────────────────────────

  describe("domains", () => {
    let firstDomain: string;

    test("list()", async () => {
      const { data, error } = await client.domains.list();
      expect(error).toBeNull();
      expect(data).not.toBeNull();
      expect(Array.isArray(data!.domains)).toBe(true);
      if (data!.domains.length > 0) {
        firstDomain = data!.domains[0].domain;
      }
    });

    test("get(domain)", async () => {
      if (!firstDomain) return; // skip if no domains exist
      const { data, error } = await client.domains.get(firstDomain);
      expect(error).toBeNull();
      expect(data).not.toBeNull();
      expect(data!.domain).toBe(firstDomain);
      expect(data!.status).toBeString();
      expect(data!.created_at).toBeString();
    });
  });

  // ─── Templates (lifecycle) ─────────────────────────────────────

  describe("templates lifecycle", () => {
    const uniqueName = `E2E Test Template ${Date.now()}`;
    let slug: string;

    test("create()", async () => {
      const { data, error } = await client.templates.create({
        name: uniqueName,
        html: "<h1>Hello {{name}}</h1>",
      });
      expect(error).toBeNull();
      expect(data).not.toBeNull();
      expect(data!.slug).toBeString();
      expect(data!.name).toBe(uniqueName);
      expect(data!.id).toBeNumber();
      slug = data!.slug;
    });

    test("get(slug)", async () => {
      expect(slug).toBeDefined();
      const { data, error } = await client.templates.get(slug);
      expect(error).toBeNull();
      expect(data).not.toBeNull();
      expect(data!.slug).toBe(slug);
      expect(data!.name).toBe(uniqueName);
    });

    test("list() includes created template", async () => {
      const { data, error } = await client.templates.list();
      expect(error).toBeNull();
      expect(data).not.toBeNull();
      expect(Array.isArray(data!.templates)).toBe(true);
      expect(data!.pagination).toBeDefined();
      const found = data!.templates.some((t) => t.slug === slug);
      expect(found).toBe(true);
    });

    test("update(slug)", async () => {
      expect(slug).toBeDefined();
      const { data, error } = await client.templates.update(slug, {
        name: `${uniqueName} (updated)`,
        html: "<h1>Hello {{name}}!</h1><p>Updated.</p>",
      });
      expect(error).toBeNull();
      expect(data).not.toBeNull();
      expect(data!.name).toBe(`${uniqueName} (updated)`);
    });

    test("getMergeTags(slug)", async () => {
      expect(slug).toBeDefined();
      const { data, error } = await client.templates.getMergeTags(slug);
      expect(error).toBeNull();
      expect(data).not.toBeNull();
      expect(data!.template_slug).toBe(slug);
      expect(Array.isArray(data!.merge_tags)).toBe(true);
    });

    afterAll(async () => {
      if (slug) {
        await client.templates.delete(slug);
      }
    });
  });

  // ─── Webhooks ───────────────────────────────────────────────────

  describe("webhooks", () => {
    let firstWebhookId: string;

    test("list()", async () => {
      const { data, error } = await client.webhooks.list();
      expect(error).toBeNull();
      expect(data).not.toBeNull();
      expect(Array.isArray(data!.webhooks)).toBe(true);
      if (data!.webhooks.length > 0) {
        firstWebhookId = data!.webhooks[0].id;
      }
    });

    test("get(id)", async () => {
      if (!firstWebhookId) return; // skip if no webhooks exist
      const { data, error } = await client.webhooks.get(firstWebhookId);
      expect(error).toBeNull();
      expect(data).not.toBeNull();
      expect(data!.id).toBe(firstWebhookId);
      expect(data!.name).toBeString();
      expect(data!.url).toBeString();
    });
  });

  // ─── Projects ───────────────────────────────────────────────────

  describe("projects", () => {
    test("list()", async () => {
      const { data, error } = await client.projects.list();
      expect(error).toBeNull();
      expect(data).not.toBeNull();
      expect(Array.isArray(data!.projects)).toBe(true);
      expect(data!.pagination).toBeDefined();
      expect(data!.pagination.total).toBeNumber();
      expect(data!.pagination.per_page).toBeNumber();
    });
  });
});
