import { defineCommand } from "citty";
import { Lettr } from "lettr";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { loadConfig } from "../config.ts";

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
  },
  async run({ args }) {
    const config = await loadConfig(args["api-key"]);
    const client = new Lettr(config.apiKey);

    const listResult = await client.templates.list();
    if (listResult.error) {
      console.error("Error listing templates:", listResult.error.message);
      process.exit(1);
    }

    const templates = listResult.data.templates;
    if (templates.length === 0) {
      console.log("No templates found.");
      return;
    }

    const outDir = resolve(process.cwd(), config.outputDir);
    await mkdir(outDir, { recursive: true });

    let pulled = 0;
    for (const t of templates) {
      const detail = await client.templates.get(t.slug);
      if (detail.error) {
        console.error(`  Error fetching "${t.slug}":`, detail.error.message);
        continue;
      }

      const html = detail.data.html;
      if (!html) {
        console.error(`  No HTML content for "${t.slug}", skipping.`);
        continue;
      }

      const filePath = resolve(outDir, `${t.slug}.html`);
      await writeFile(filePath, html);
      console.log(`  Pulled ${t.slug} -> ${filePath}`);
      pulled++;
    }

    console.log(`\nDone. Pulled ${pulled}/${templates.length} templates to ${outDir}`);
  },
});
