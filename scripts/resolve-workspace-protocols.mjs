#!/usr/bin/env node
// Rewrites `workspace:` specifiers in packages/*/package.json to concrete
// version ranges, using the versions declared in sibling workspace packages.
//
// Run this immediately before publishing (e.g. `changeset publish`), not
// during `changeset version` — we want source to keep `workspace:*` and only
// the CI runner's working copy to carry resolved ranges for the tarball.

import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const PACKAGES_DIR = join(REPO_ROOT, "packages");
const DEP_BUCKETS = ["dependencies", "devDependencies", "optionalDependencies", "peerDependencies"];

function readJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

function writeJson(path, data) {
  writeFileSync(path, JSON.stringify(data, null, 2) + "\n");
}

function loadWorkspacePackages() {
  const entries = readdirSync(PACKAGES_DIR);
  const pkgs = [];
  for (const name of entries) {
    const dir = join(PACKAGES_DIR, name);
    if (!statSync(dir).isDirectory()) continue;
    const pkgPath = join(dir, "package.json");
    let pkg;
    try {
      pkg = readJson(pkgPath);
    } catch {
      continue;
    }
    if (!pkg.name) throw new Error(`${pkgPath}: missing "name"`);
    if (!pkg.version) throw new Error(`${pkgPath}: missing "version"`);
    pkgs.push({ path: pkgPath, pkg });
  }
  return pkgs;
}

function resolveSpecifier(spec, targetVersion, bucket) {
  const rest = spec.slice("workspace:".length);
  if (rest === "*") {
    return bucket === "peerDependencies" ? `^${targetVersion}` : targetVersion;
  }
  if (rest === "^") return `^${targetVersion}`;
  if (rest === "~") return `~${targetVersion}`;
  // workspace:<explicit-range>, e.g. workspace:1.2.3 or workspace:^1.2.0
  if (/^[~^]?\d/.test(rest)) return rest;
  throw new Error(`unsupported workspace specifier: "${spec}"`);
}

function main() {
  const pkgs = loadWorkspacePackages();
  const versions = new Map(pkgs.map((p) => [p.pkg.name, p.pkg.version]));

  let rewrites = 0;
  for (const { path, pkg } of pkgs) {
    let changed = false;
    for (const bucket of DEP_BUCKETS) {
      const deps = pkg[bucket];
      if (!deps) continue;
      for (const [name, spec] of Object.entries(deps)) {
        if (typeof spec !== "string" || !spec.startsWith("workspace:")) continue;
        const targetVersion = versions.get(name);
        if (!targetVersion) {
          throw new Error(
            `${path}: "${bucket}.${name}" uses workspace: prefix but "${name}" is not a workspace member`,
          );
        }
        const resolved = resolveSpecifier(spec, targetVersion, bucket);
        deps[name] = resolved;
        changed = true;
        rewrites++;
        console.log(`${pkg.name}: ${bucket}.${name}  ${spec} -> ${resolved}`);
      }
    }
    if (changed) writeJson(path, pkg);
  }
  if (rewrites === 0) console.log("no workspace: specifiers found");
}

main();
