import { spawnSync } from "node:child_process";

const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";
const result = spawnSync(
  npmCommand,
  ["pack", "--dry-run", "--json", "--ignore-scripts"],
  {
    cwd: process.cwd(),
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  },
);

if (result.error) {
  fail(`Unable to execute npm pack: ${result.error.message}`);
}

if (result.status !== 0) {
  const detail = result.stderr.trim() || `npm pack exited with status ${result.status}`;
  fail(detail);
}

let report;
try {
  report = JSON.parse(result.stdout);
} catch {
  fail("npm pack did not return valid JSON output.");
}

if (!Array.isArray(report) || report.length !== 1 || !Array.isArray(report[0]?.files)) {
  fail("npm pack returned an unexpected report shape.");
}

const packageReport = report[0];
const paths = packageReport.files.map((entry) => entry.path);
const required = ["package.json", "README.md", "LICENSE", "dist/index.js", "dist/index.d.ts"];

for (const requiredPath of required) {
  if (!paths.includes(requiredPath)) {
    fail(`Package artifact is missing required file: ${requiredPath}`);
  }
}

const allowedRootFiles = new Set(["package.json", "README.md", "LICENSE"]);
const unexpected = paths.filter(
  (path) => !allowedRootFiles.has(path) && !path.startsWith("dist/"),
);

if (unexpected.length > 0) {
  fail(`Package artifact contains unexpected files: ${unexpected.join(", ")}`);
}

const sourceArtifacts = paths.filter(
  (path) =>
    path.startsWith("src/") ||
    path.startsWith("test/") ||
    path.startsWith("scripts/") ||
    path.startsWith("docs/") ||
    path.startsWith(".github/"),
);

if (sourceArtifacts.length > 0) {
  fail(`Package artifact leaks repository-only files: ${sourceArtifacts.join(", ")}`);
}

console.log(
  `Package artifact verified: ${paths.length} files, ${packageReport.size ?? "unknown"} packed bytes.`,
);

function fail(message) {
  console.error(`Package verification failed: ${message}`);
  process.exit(1);
}
