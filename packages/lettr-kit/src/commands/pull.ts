import { defineCommand } from "citty";
import { Lettr } from "lettr";
import type { Template } from "lettr";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import pc from "picocolors";
import * as p from "@clack/prompts";
import { loadConfig } from "../config.ts";
import { handleError } from "../utils/ui.ts";

export const pullCommand = defineCommand({
  meta: {
    name: "pull",
    description: "Pull templates from the Lettr API to local files",
  },
  args: {
    "api-key": {
      type: "string",
      description: "Lettr API key (overrides config and env)",
    },
    all: {
      type: "boolean",
      description: "Pull all templates without prompting",
      default: false,
    },
  },
  async run({ args }) {
    const config = await loadConfig(args["api-key"]);
    const client = new Lettr(config.apiKey);

    const s = p.spinner();
    s.start("Fetching template list");

    const listResult = await client.templates.list();
    if (listResult.error) {
      s.stop("Failed to fetch templates");
      handleError(listResult.error);
      process.exit(1);
    }

    const allTemplates = listResult.data.templates;
    s.stop(`Found ${allTemplates.length} template${allTemplates.length === 1 ? "" : "s"}`);

    if (allTemplates.length === 0) {
      p.log.info("No templates found.");
      return;
    }

    let selected: Template[];

    if (args.all) {
      selected = allTemplates;
    } else {
      const choices = await p.multiselect({
        message: "Select templates to pull",
        options: allTemplates.map((t) => ({
          value: t,
          label: t.slug,
          hint: t.name,
        })),
        required: true,
      });

      if (p.isCancel(choices)) {
        p.cancel("Cancelled.");
        process.exit(0);
      }

      selected = choices;
    }

    const outDir = resolve(process.cwd(), config.outputDir);
    await mkdir(outDir, { recursive: true });

    s.start(`Pulling ${selected.length} template${selected.length === 1 ? "" : "s"}`);

    let pulled = 0;
    let failed = 0;

    for (const t of selected) {
      const detail = await client.templates.get(t.slug);
      if (detail.error) {
        failed++;
        p.log.error(`${pc.red("✗")} ${t.slug} — ${detail.error.message}`);
        continue;
      }

      const html = detail.data.html;
      if (!html) {
        failed++;
        p.log.warn(`${pc.yellow("⚠")} ${t.slug} — no HTML content, skipped`);
        continue;
      }

      const filePath = resolve(outDir, `${t.slug}.html`);
      await writeFile(filePath, html);
      pulled++;
    }

    s.stop("Done");

    p.log.success(
      `Pulled ${pc.green(String(pulled))}/${selected.length} templates to ${pc.dim(outDir)}` +
        (failed > 0 ? ` (${pc.red(String(failed))} failed)` : "")
    );
  },
});
