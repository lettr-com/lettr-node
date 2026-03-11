import pc from "picocolors";
import * as p from "@clack/prompts";
import type { LettrError } from "lettr";

export function table(headers: string[], rows: string[][]): string {
  const cols = headers.length;
  const widths = new Array<number>(cols);

  for (let i = 0; i < cols; i++) {
    widths[i] = headers[i]!.length;
  }
  for (const row of rows) {
    for (let i = 0; i < cols; i++) {
      const len = stripAnsi(row[i] ?? "").length;
      if (len > widths[i]!) widths[i] = len;
    }
  }

  const pad = (str: string, width: number) => {
    const visible = stripAnsi(str).length;
    return str + " ".repeat(Math.max(0, width - visible));
  };

  const sep = "─";
  const lines: string[] = [];

  // header
  const headerLine = headers
    .map((h, i) => pc.bold(pad(h, widths[i]!)))
    .join("  ");
  lines.push(headerLine);

  // separator
  const sepLine = widths.map((w) => sep.repeat(w!)).join("──");
  lines.push(pc.dim(sepLine));

  // rows
  for (const row of rows) {
    const rowLine = row.map((cell, i) => pad(cell, widths[i]!)).join("  ");
    lines.push(rowLine);
  }

  return lines.join("\n");
}

export function handleError(error: LettrError): void {
  if (error.type === "validation") {
    p.log.error(pc.red(error.message));
    for (const [field, messages] of Object.entries(error.errors)) {
      for (const msg of messages) {
        p.log.warn(`  ${pc.dim(field)}: ${msg}`);
      }
    }
  } else if (error.type === "api") {
    p.log.error(`${pc.red(error.message)} ${pc.dim(`(${error.error_code})`)}`);
  } else {
    p.log.error(pc.red(error.message));
  }
}

function stripAnsi(str: string): string {
  // eslint-disable-next-line no-control-regex
  return str.replace(/\x1b\[[0-9;]*m/g, "");
}
