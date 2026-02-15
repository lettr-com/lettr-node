import { defineCommand } from "citty";
import { Lettr } from "lettr";
import { loadConfig } from "../config.ts";

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

    const result = await client.templates.list();
    if (result.error) {
      console.error("Error:", result.error.message);
      process.exit(1);
    }

    if (result.data.templates.length === 0) {
      console.log("No templates found.");
      return;
    }

    console.log("Templates:\n");
    for (const t of result.data.templates) {
      console.log(`  ${t.slug}  —  ${t.name}`);
    }
  },
});
