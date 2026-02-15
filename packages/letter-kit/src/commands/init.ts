import { defineCommand } from "citty";
import { createInterface } from "node:readline/promises";
import { writeFile } from "node:fs/promises";
import { resolve } from "node:path";

export const initCommand = defineCommand({
  meta: { name: "init", description: "Create a lettr.json config file" },
  async run() {
    const rl = createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    try {
      const apiKey = await rl.question(
        "API key (or $ENV_VAR to reference an env variable) [default: $LETTR_API_KEY]: "
      );
      const outputDir = await rl.question(
        "Output directory for templates [default: ./emails]: "
      );

      const config = {
        apiKey: apiKey || "$LETTR_API_KEY",
        outputDir: outputDir || "./emails",
      };

      const configPath = resolve(process.cwd(), "lettr.json");
      await writeFile(configPath, JSON.stringify(config, null, 2) + "\n");

      console.log(`Created ${configPath}`);
    } finally {
      rl.close();
    }
  },
});
