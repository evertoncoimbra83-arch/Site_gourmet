import fs from "fs";
import path from "path";
import { execSync } from "child_process";

const root = process.cwd();
const pkg = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));

let commit = "";
try {
  commit = execSync("git rev-parse HEAD", { stdio: ["ignore", "pipe", "ignore"] }).toString().trim();
} catch (e) {
  // If git fails, use build timestamp as fallback
  commit = `build-${Date.now()}`;
}

const buildInfo = {
  version: pkg.version || "1.0.0",
  commit: commit,
  builtAt: new Date().toISOString(),
};

// 1. Write client/public/version.json
const publicDir = path.join(root, "client", "public");
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}
fs.writeFileSync(
  path.join(publicDir, "version.json"),
  JSON.stringify(buildInfo, null, 2),
  "utf8"
);

// 2. Write client/src/build-info.ts
const srcDir = path.join(root, "client", "src");
if (!fs.existsSync(srcDir)) {
  fs.mkdirSync(srcDir, { recursive: true });
}
fs.writeFileSync(
  path.join(srcDir, "build-info.ts"),
  `// Generated dynamically during build. Do not commit or edit manually.
export const BUILD_INFO = ${JSON.stringify(buildInfo, null, 2)};
`,
  "utf8"
);

// 3. Write dist/public/version.json if dist/public exists (for production instant access)
const distPublicDir = path.join(root, "dist", "public");
if (fs.existsSync(distPublicDir)) {
  fs.writeFileSync(
    path.join(distPublicDir, "version.json"),
    JSON.stringify(buildInfo, null, 2),
    "utf8"
  );
}

console.log("✅ Version and build-info generated:", buildInfo);
