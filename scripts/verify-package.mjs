import { spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";
const nodeCommand = process.execPath;
const typescriptCli = join(process.cwd(), "node_modules", "typescript", "bin", "tsc");

const dryRun = run(npmCommand, [
  "pack",
  "--dry-run",
  "--json",
  "--ignore-scripts",
]);
const dryRunReport = parsePackReport(dryRun.stdout);
verifyPackageShape(dryRunReport);

const tempRoot = mkdtempSync(join(tmpdir(), "openreceipt-package-"));
try {
  const packed = run(npmCommand, [
    "pack",
    "--json",
    "--ignore-scripts",
    "--pack-destination",
    tempRoot,
  ]);
  const packedReport = parsePackReport(packed.stdout);
  verifyPackageShape(packedReport);

  if (typeof packedReport.filename !== "string" || !packedReport.filename.endsWith(".tgz")) {
    fail("npm pack did not report a valid tarball filename.");
  }

  const consumerDir = join(tempRoot, "consumer");
  mkdirSync(consumerDir);
  writeFileSync(
    join(consumerDir, "package.json"),
    JSON.stringify({ private: true, type: "module" }),
  );

  run(
    npmCommand,
    [
      "install",
      "--ignore-scripts",
      "--no-audit",
      "--no-fund",
      join(tempRoot, packedReport.filename),
    ],
    consumerDir,
  );

  run(
    nodeCommand,
    [
      "--input-type=module",
      "--eval",
      [
        'import * as openreceipt from "openreceipt";',
        'for (const name of ["receipt", "layoutReceipt", "createPrintDocument", "encodeEscPos", "sendTcp", "mockPrint", "diagnoseError"]) {',
        '  if (typeof openreceipt[name] !== "function") throw new Error(`Missing package export: ${name}`);',
        "}",
        'const document = openreceipt.receipt().title("My Store").item("Coffee", 2, 30).total("TOTAL", 60).cut().toDocument();',
        'const result = openreceipt.mockPrint(document, { paper: "80mm" });',
        'for (const expected of ["My Store", "Coffee", "TOTAL", "60.00", "[cut]"]) {',
        '  if (!result.preview.includes(expected)) throw new Error(`Installed-package preview is missing: ${expected}`);',
        "}",
        'if (result.layout.paper.id !== "80mm") throw new Error("Installed-package smoke test used the wrong paper profile.");',
      ].join("\n"),
    ],
    consumerDir,
  );

  writeFileSync(
    join(consumerDir, "consumer-smoke.ts"),
    [
      'import { mockPrint, receipt, type MockPrintResult, type ReceiptDocument } from "openreceipt";',
      'const document: ReceiptDocument = receipt().title("Type check").total("TOTAL", 1).toDocument();',
      'const result: MockPrintResult = mockPrint(document, { paper: "58mm" });',
      'const preview: string = result.preview;',
      'const paperId: string = result.layout.paper.id;',
      'void [preview, paperId];',
    ].join("\n"),
  );

  run(
    nodeCommand,
    [
      typescriptCli,
      "--noEmit",
      "--strict",
      "--target",
      "ES2022",
      "--module",
      "NodeNext",
      "--moduleResolution",
      "NodeNext",
      "consumer-smoke.ts",
    ],
    consumerDir,
  );

  console.log(
    `Package artifact verified, importable, and type-checkable: ${packedReport.files.length} files, ${packedReport.size ?? "unknown"} packed bytes.`,
  );
} finally {
  rmSync(tempRoot, { recursive: true, force: true });
}

function run(command, args, cwd = process.cwd()) {
  const result = spawnSync(command, args, {
    cwd,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });

  if (result.error) {
    fail(`Unable to execute ${command}: ${result.error.message}`);
  }

  if (result.status !== 0) {
    const detail = result.stderr.trim() || result.stdout.trim() || `${command} exited with status ${result.status}`;
    fail(detail);
  }

  return result;
}

function parsePackReport(output) {
  let report;
  try {
    report = JSON.parse(output);
  } catch {
    fail("npm pack did not return valid JSON output.");
  }

  if (!Array.isArray(report) || report.length !== 1 || !Array.isArray(report[0]?.files)) {
    fail("npm pack returned an unexpected report shape.");
  }

  return report[0];
}

function verifyPackageShape(packageReport) {
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
}

function fail(message) {
  console.error(`Package verification failed: ${message}`);
  process.exit(1);
}
