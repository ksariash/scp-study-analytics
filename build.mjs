import { readFile, mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

const targets = [
  ["src/index.js", "src__index.js"],
  ["src/dashboard.js", "src__dashboard.js"],
  ["src/question-catalog.js", "src__question-catalog.js"],
];

const dashboardEnhancement = await readFile("dashboard-navigation.snippet.js", "utf8");

await mkdir("src", { recursive: true });
for (const [target, prefix] of targets) {
  const chunks = [];
  for (let i = 1; ; i++) {
    const file = join("parts", `${prefix}.${String(i).padStart(2,"0")}.part`);
    try { chunks.push(await readFile(file, "utf8")); }
    catch (error) { if (error?.code === "ENOENT") break; throw error; }
  }
  if (!chunks.length) throw new Error(`No source parts found for ${target}`);
  let source = chunks.join("");
  if (target === "src/dashboard.js") {
    if (!source.startsWith("export const DASHBOARD_HTML = ")) {
      throw new Error("Unexpected dashboard source format");
    }
    source = source.replace(
      "export const DASHBOARD_HTML = ",
      "const __DASHBOARD_BASE_HTML = ",
    ) + "\n" + dashboardEnhancement;
  }
  await writeFile(target, source, "utf8");
}
console.log("Assembled Worker source files with dashboard navigation enhancements.");
