import { readFile, mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

const targets = [
  ["src/index.js", "src__index.js"],
  ["src/dashboard.js", "src__dashboard.js"],
  ["src/question-catalog.js", "src__question-catalog.js"],
  ["src/essay-catalog.js", "src__essay-catalog.js"],
];

const dashboardEnhancement = await readFile("dashboard-navigation.snippet.js", "utf8");
const feedbackBackend = await readFile("feedback-backend.snippet.js", "utf8");
const feedbackAdminActions = await readFile("feedback-admin-actions.json", "utf8");
const analyticsCohortRegistry = JSON.parse(await readFile("analytics-cohorts.json", "utf8"));

if (!Array.isArray(analyticsCohortRegistry.cohorts) || !analyticsCohortRegistry.cohorts.length) {
  throw new Error("analytics-cohorts.json must contain at least one cohort.");
}
const cohortKeys = analyticsCohortRegistry.cohorts.map(cohort => String(cohort.analyticsKey || ""));
if (cohortKeys.some(key => !key) || new Set(cohortKeys).size !== cohortKeys.length) {
  throw new Error("analytics-cohorts.json contains a blank or duplicate analyticsKey.");
}
if (!cohortKeys.includes(String(analyticsCohortRegistry.defaultAnalyticsKey || ""))) {
  throw new Error("analytics-cohorts.json defaultAnalyticsKey must identify a configured cohort.");
}
if (analyticsCohortRegistry.cohorts.length > 1 && analyticsCohortRegistry.cohorts.some(cohort => cohort.catalogMode === "current-root-catalog")) {
  throw new Error("A second cohort requires cohort-specific analytics catalogs before it can be registered.");
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
    const registryMarker = "const ANALYTICS_COHORT_REGISTRY = null;";
    if (!source.includes(registryMarker)) throw new Error("Analytics cohort registry marker missing from Worker source");
    source = source.replace(registryMarker, "const ANALYTICS_COHORT_REGISTRY = " + JSON.stringify(analyticsCohortRegistry) + ";");
    source += "\nconst FEEDBACK_ADMIN_ACTIONS = " + feedbackAdminActions.trim() + ";\n" + feedbackBackend;
  }
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
console.log("Assembled Worker source files with dashboard navigation and content feedback enhancements.");
