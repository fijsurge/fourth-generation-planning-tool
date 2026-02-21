#!/usr/bin/env node
/**
 * Increments the patch version in app.json (e.g. 1.0.3 → 1.0.4)
 * and stages the change so it's included in the commit.
 *
 * Skips the bump if the version was already changed manually from HEAD
 * (any part — major, minor, or patch). This lets you set an explicit
 * version (e.g. 1.1.0, 2.0.0) and have it committed as-is.
 */
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const appJsonPath = path.resolve(__dirname, "../app.json");
const appJson = JSON.parse(fs.readFileSync(appJsonPath, "utf8"));

const current = appJson.expo.version || "1.0.0";

// Read the version from the last commit (HEAD)
let headVersion = null;
try {
  const headJson = execSync("git show HEAD:app.json", { encoding: "utf8" });
  headVersion = JSON.parse(headJson).expo.version || null;
} catch {
  // No HEAD yet (initial commit) — always bump
}

if (headVersion && headVersion !== current) {
  console.log(
    `[bump-version] Version already set manually (${headVersion} → ${current}), skipping patch bump`
  );
  process.exit(0);
}

const parts = current.split(".").map(Number);
parts[2] = (parts[2] || 0) + 1;
const next = parts.join(".");

appJson.expo.version = next;
fs.writeFileSync(appJsonPath, JSON.stringify(appJson, null, 2) + "\n");

console.log(`[bump-version] ${current} → ${next}`);

// Stage the updated app.json so it's included in the commit
execSync("git add app.json", { stdio: "inherit" });
