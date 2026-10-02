import { readFile, mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { execFileSync } from "node:child_process";

const targets = [
  ["src/index.js", "src__index.js"],
  ["src/dashboard.js", "src__dashboard.js"],
  ["src/question-catalog.js", "src__question-catalog.js"],
  ["src/essay-catalog.js", "src__essay-catalog.js"],
];

const dashboardEnhancement = await readFile("dashboard-navigation.snippet.js", "utf8");
const feedbackBackend = await readFile("feedback-backend.snippet.js", "utf8");
const feedbackAdminActions = await readFile("feedback-admin-actions.json", "utf8");
const analyticsZmanRegistry = JSON.parse(await readFile("analytics-zmanim.json", "utf8"));

if (!Array.isArray(analyticsZmanRegistry.zmanim) || !analyticsZmanRegistry.zmanim.length) {
  throw new Error("analytics-zmanim.json must contain at least one Zman.");
}
const zmanIds = analyticsZmanRegistry.zmanim.map(zman => String(zman.id || ""));
if (zmanIds.some(id => !id) || new Set(zmanIds).size !== zmanIds.length) {
  throw new Error("analytics-zmanim.json contains a blank or duplicate Zman ID.");
}
if (!zmanIds.includes(String(analyticsZmanRegistry.defaultZmanId || ""))) {
  throw new Error("analytics-zmanim.json defaultZmanId must identify a configured Zman.");
}
if (analyticsZmanRegistry.zmanim.length > 1 && analyticsZmanRegistry.zmanim.some(zman => zman.catalogMode === "current-root-catalog")) {
  throw new Error("A second Zman requires Zman-specific analytics catalogs before it can be registered.");
}

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
  if (target === "src/index.js") {
    const marker = "export default {";
    const markerIndex = source.lastIndexOf(marker);
    if (markerIndex < 0) throw new Error("Unexpected Worker source format");
    source = source.slice(0, markerIndex) + "const __BASE_WORKER = {" + source.slice(markerIndex + marker.length);
    const registryMarker = "const ANALYTICS_ZMAN_REGISTRY = null;";
    if (!source.includes(registryMarker)) throw new Error("Analytics Zman registry marker missing from Worker source");
    source = source.replace(registryMarker, "const ANALYTICS_ZMAN_REGISTRY = " + JSON.stringify(analyticsZmanRegistry) + ";");
    source += "\nconst FEEDBACK_ADMIN_ACTIONS = " + feedbackAdminActions.trim() + ";\n" + feedbackBackend;
  }
  if (target === "src/dashboard.js") {
    if (!source.startsWith("export const DASHBOARD_HTML = ")) throw new Error("Unexpected dashboard source format");
    source = source.replace("export const DASHBOARD_HTML = ", "const __DASHBOARD_BASE_HTML = ") + "\n" + dashboardEnhancement;
  }
  if (target === "src/dashboard.js") {
    const probe = source.replace("export const DASHBOARD_HTML = ", "const DASHBOARD_HTML = ");
    const rendered = Function(probe + "\nreturn DASHBOARD_HTML;")();
    for (const required of ['id="dashboard-filters"','id="chaburaRegion"','id="chabura"','id="study-aid-usage"','id="essay-analytics"']) {
      if (!rendered.includes(required)) throw new Error(`Dashboard enhancement missing required marker: ${required}`);
    }
    if (rendered.includes('id="announcements-admin"')) throw new Error("Announcements UI must not live in Analytics.");
  }
  await writeFile(target, source, "utf8");
  execFileSync(process.execPath, ["--check", target], { stdio: "inherit" });
}
console.log("Assembled Worker source files with Zman-aware analytics, dashboard navigation, feedback, and notifications.");
