import { execSync } from "node:child_process";

/**
 * Remark plugin that injects a `lastModified` frontmatter value derived from
 * the file's last git commit date. Falls back silently when the file is not
 * tracked by git (e.g. a brand new, uncommitted post).
 */
export function remarkModifiedTime() {
  return function (_tree, file) {
    const filepath = file.history[0];
    if (!filepath) return;
    try {
      const result = execSync(
        `git log -1 --pretty="format:%cI" -- "${filepath}"`,
        {
          encoding: "utf-8",
          stdio: ["ignore", "pipe", "ignore"],
        },
      ).trim();
      if (result && file.data?.astro?.frontmatter) {
        file.data.astro.frontmatter.lastModified = result;
      }
    } catch {
      // Not a git repo or file untracked; leave lastModified unset.
    }
  };
}
