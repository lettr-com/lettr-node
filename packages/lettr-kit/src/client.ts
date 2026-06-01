import { Lettr } from "lettr";
import pkg from "../package.json";

/** CLI identifier reported to the API via User-Agent, sourced from package.json (inlined at build). */
const USER_AGENT = `lettr-kit/${pkg.version}`;

/** Build a Lettr SDK client that identifies itself as the lettr-kit CLI. */
export function createClient(apiKey: string): Lettr {
  return new Lettr(apiKey, { userAgent: USER_AGENT });
}
