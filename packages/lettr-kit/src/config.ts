import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

export interface LettrConfig {
  apiKey: string;
  outputDir: string;
}

interface RawConfig {
  apiKey?: string;
  outputDir?: string;
}

export async function loadConfig(flagApiKey?: string): Promise<LettrConfig> {
  const configPath = resolve(process.cwd(), "lettr.json");

  let raw: RawConfig = {};
  try {
    const content = await readFile(configPath, "utf-8");
    raw = JSON.parse(content) as RawConfig;
  } catch {
    // No config file — that's fine, we'll use defaults/flags/env
  }

  const apiKey = resolveApiKey(flagApiKey, raw.apiKey);
  if (!apiKey) {
    throw new Error(
      "Missing API key. Provide --api-key, set apiKey in lettr.json, or set LETTR_API_KEY env var."
    );
  }

  return {
    apiKey,
    outputDir: raw.outputDir ?? "./emails",
  };
}

function resolveApiKey(
  flag?: string,
  configValue?: string
): string | undefined {
  // 1. CLI flag takes priority
  if (flag) return flag;

  // 2. Config value — supports $ENV_VAR syntax
  if (configValue) {
    if (configValue.startsWith("$")) {
      const envName = configValue.slice(1);
      return process.env[envName];
    }
    return configValue;
  }

  // 3. Default env var
  return process.env["LETTR_API_KEY"];
}
