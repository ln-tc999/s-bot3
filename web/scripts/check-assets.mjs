import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

/**
 * Every /public path the source refers to has to exist. `next build` does not
 * check this: a missing image is a 404 at runtime, on a page nobody opened
 * during the build. Cheap to run, and it has already caught one real break.
 */
const walk = (dir) =>
  readdirSync(dir).flatMap((entry) => {
    const path = join(dir, entry);
    return statSync(path).isDirectory() ? walk(path) : [path];
  });

const missing = [];

for (const file of walk("src").filter((f) => /\.tsx?$/.test(f))) {
  const source = readFileSync(file, "utf8");
  for (const [, asset] of source.matchAll(/["'`](\/(?:assets|tokens)\/[^"'`${}]+)["'`]/g)) {
    try {
      statSync(join("public", asset));
    } catch {
      missing.push(`${file} -> ${asset}`);
    }
  }
}

if (missing.length > 0) {
  console.error(`Missing ${missing.length} asset(s):`);
  for (const entry of missing) console.error(`  ${entry}`);
  process.exit(1);
}

console.log("All referenced public assets exist.");
