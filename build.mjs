import { readFile, mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

const targets = [
  ["src/index.js", "src__index.js"],
  ["src/dashboard.js", "src__dashboard.js"],
  ["src/question-catalog.js", "src__question-catalog.js"],
];

await mkdir("src", { recursive: true });
for (const [target, prefix] of targets) {
  const chunks = [];
  for (let i = 1; ; i++) {
    const file = join("parts", `${prefix}.${String(i).padStart(2,"0")}.part`);
    try { chunks.push(await readFile(file, "utf8")); }
    catch (error) { if (error?.code === "ENOENT") break; throw error; }
  }
  if (!chunks.length) throw new Error(`No source parts found for ${target}`);
  await writeFile(target, chunks.join(""), "utf8");
}
console.log("Assembled Worker source files.");
