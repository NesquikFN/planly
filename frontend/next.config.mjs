import path from "node:path";
import { fileURLToPath } from "node:url";

// Now that Planly is an npm-workspaces monorepo, the workspace root (where
// package-lock.json lives) is one level up — tracing has to start there or
// the standalone build misses hoisted dependencies from node_modules/.
const frontendDir = path.dirname(fileURLToPath(import.meta.url));
const workspaceRoot = path.join(frontendDir, "..");

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Emits .next/standalone with its own minimal server.js and only the
  // dependencies actually reached — that's what the Dockerfile ships.
  output: "standalone",
  outputFileTracingRoot: workspaceRoot,
  turbopack: { root: workspaceRoot },
};

export default nextConfig;
