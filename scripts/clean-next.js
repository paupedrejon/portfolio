/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require("fs");
const path = require("path");

const nextDir = path.join(__dirname, "..", ".next");
try {
  fs.rmSync(nextDir, { recursive: true, force: true });
  console.log("Removed .next");
} catch (e) {
  if (e && e.code !== "ENOENT") throw e;
}
