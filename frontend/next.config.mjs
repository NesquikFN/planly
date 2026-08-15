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

  // Proxies /api/* to the backend server-side, so the browser only ever
  // talks to this one origin. Without this, the session cookie is
  // cross-site (frontend and backend are different Railway subdomains),
  // and Safari's Intelligent Tracking Prevention refuses to store a
  // cookie set from a fetch() in that situation — login appears to
  // succeed, but the very next request comes back unauthenticated.
  // Baked in at build time from the same env var the Dockerfile already
  // passes as a build ARG.
  async rewrites() {
    const backendUrl = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000").replace(/\/$/, "");
    return [{ source: "/api/:path*", destination: `${backendUrl}/api/:path*` }];
  },
};

export default nextConfig;
