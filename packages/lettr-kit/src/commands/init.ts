import { defineCommand } from "citty";
import { writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import pc from "picocolors";
import * as p from "@clack/prompts";
import { Lettr } from "lettr";

export const initCommand = defineCommand({
  meta: { name: "init", description: "Create a lettr.json config file" },
  async run() {
    p.intro(pc.bold("lettr-kit setup"));

    const apiKey = await p.text({
      message: "API key",
      placeholder: "$LETTR_API_KEY",
      defaultValue: "$LETTR_API_KEY",
      validate(value) {
        if (!value) return undefined;
        if (value.startsWith("$")) return undefined;
        if (!value.startsWith("lttr_")) {
          return 'API key should start with "lttr_" or use $ENV_VAR syntax';
        }
      },
    });

    if (p.isCancel(apiKey)) {
      p.cancel("Setup cancelled.");
      process.exit(0);
    }

    const outputDir = await p.text({
      message: "Output directory for templates",
      placeholder: "./emails",
      defaultValue: "./emails",
    });

    if (p.isCancel(outputDir)) {
      p.cancel("Setup cancelled.");
      process.exit(0);
    }

    // Test connection if a real key was provided
    const resolvedKey = apiKey.startsWith("$")
      ? process.env[apiKey.slice(1)]
      : apiKey;

    if (resolvedKey) {
      const s = p.spinner();
      s.start("Testing connection");
      const client = new Lettr(resolvedKey);
      const result = await client.authCheck();
      if (result.error) {
        s.stop("Connection failed");
        p.log.warn(
          `Could not verify API key: ${pc.dim(result.error.message)}`
        );
      } else {
        s.stop("Connection verified");
      }
    }

    const config = {
      apiKey: apiKey || "$LETTR_API_KEY",
      outputDir: outputDir || "./emails",
    };

    const configPath = resolve(process.cwd(), "lettr.json");
    await writeFile(configPath, JSON.stringify(config, null, 2) + "\n");

    p.outro(`Created ${pc.dim(configPath)}`);
  },
});
