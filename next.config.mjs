/** @type {import('next').NextConfig} */
const nextConfig = {
  // Multiple lockfiles exist above this repository on the local machine.
  // Pin tracing/build discovery to Planly instead of letting Next infer C:\Users\Admin.
  outputFileTracingRoot: process.cwd(),
  turbopack: { root: process.cwd() },
};

export default nextConfig;
