import type { NextConfig } from 'next'

// A static export: every page is known at build time, so `out/` drops on any static host with no
// runtime. Two consequences are the host's to carry, and the README lists them: it must serve
// `/privacy` from `privacy.html` — the path every installed build opens — and it sends the security
// headers, since an export ignores `headers()`.
const nextConfig: NextConfig = {
  output: 'export',
  images: { unoptimized: true },
  reactStrictMode: true,
  poweredByHeader: false,
}

export default nextConfig
