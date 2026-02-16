import { defineCommand } from "citty";
import { Lettr } from "lettr";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import pc from "picocolors";
import * as p from "@clack/prompts";
import { loadConfig } from "../config.ts";
import { table, handleError } from "../utils/ui.ts";

export const listCommand = defineCommand({
  meta: { name: "list", description: "List templates from the Lettr API" },
  args: {
    "api-key": {
      type: "string",
      description: "Lettr API key (overrides config and env)",
    },
  },
  async run({ args }) {
    const config = await loadConfig(args["api-key"]);
    const client = new Lettr(config.apiKey);

    const s = p.spinner();
    s.start("Fetching templates");

    const result = await client.templates.list();

    if (result.error) {
      s.stop("Failed to fetch templates");
      handleError(result.error);
      process.exit(1);
    }

    const templates = result.data.templates;
    s.stop(`Found ${templates.length} template${templates.length === 1 ? "" : "s"}`);

    if (templates.length === 0) {
      p.log.info("No templates found.");
      return;
    }

    const outDir = resolve(process.cwd(), config.outputDir);

    const rows = templates.map((t) => {
      const localPath = resolve(outDir, `${t.slug}.html`);
      const synced = existsSync(localPath);
      const status = synced
        ? pc.green("● synced")
        : pc.dim("○ not pulled");
      const updated = new Date(t.updated_at).toLocaleDateString();

      return [t.slug, t.name, updated, status];
    });

    const output = table(["Slug", "Name", "Updated", "Status"], rows);
    p.log.message(output);

    const { pagination } = result.data;
    if (pagination.last_page > 1) {
      p.log.info(
        pc.dim(
          `Page ${pagination.current_page}/${pagination.last_page} (${pagination.total} total)`
        )
      );
    }
  },
});
