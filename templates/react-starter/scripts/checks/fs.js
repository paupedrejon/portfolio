import { existsSync, readFileSync } from "fs";
import { join } from "path";
import { projectRoot } from "../check-core.mjs";

/**
 * @param {string} relativePath
 */
export function fileExists(relativePath) {
  return existsSync(join(projectRoot, relativePath));
}

/**
 * @param {string} relativePath
 */
export function readProjectFile(relativePath) {
  const p = join(projectRoot, relativePath);
  if (!existsSync(p)) return null;
  return readFileSync(p, "utf8");
}

/**
 * @param {string} relativePath
 * @param {RegExp} pattern
 */
export function fileMatches(relativePath, pattern) {
  const content = readProjectFile(relativePath);
  if (content == null) return false;
  return pattern.test(content);
}
