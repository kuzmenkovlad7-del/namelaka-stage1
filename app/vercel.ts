import { defineConfig } from "vercel";

function stripSlash(s: string) {
  return s.replace(/\/+$/, "");
}

export default defineConfig({
  redirects: async () => [
    { source: "/uk", destination: "/ua", permanent: false },
    { source: "/uk/:path*", destination: "/ua/:path*", permanent: false },
  ],

  rewrites: async () => {
    const upstream = process.env.UPSTREAM_URL ? stripSlash(process.env.UPSTREAM_URL) : "";

    const r: { source: string; destination: string }[] = [];

    if (upstream) {
      r.push(
        { source: "/api/:path*", destination: `${upstream}/api/:path*` },
        { source: "/store/:path*", destination: `${upstream}/store/:path*` },
        { source: "/uploads/:path*", destination: `${upstream}/uploads/:path*` },
        { source: "/app/:path*", destination: `${upstream}/app/:path*` },
        { source: "/admin/:path*", destination: `${upstream}/admin/:path*` }
      );
    }

    // SPA fallback
    r.push({ source: "/(.*)", destination: "/index.html" });
    return r;
  },
});
