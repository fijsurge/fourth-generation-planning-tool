#!/usr/bin/env node
/**
 * Increments the patch version in app.json (e.g. 1.0.3 → 1.0.4)
 * and stages the change so it's included in the push.
 */
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const appJsonPath = path.resolve(__dirname, "../app.json");
const appJson = JSON.parse(fs.readFileSync(appJsonPath, "utf8"));

const current = appJson.expo.version || "1.0.0";
const parts = current.split(".").map(Number);
parts[2] = (parts[2] || 0) + 1;
const next = parts.join(".");

appJson.expo.version = next;
fs.writeFileSync(appJsonPath, JSON.stringify(appJson, null, 2) + "\n");

console.log(`[bump-version] ${current} → ${next}`);

// Stage the updated app.json so it's included in the push commit
execSync("git add app.json", { stdio: "inherit" });
