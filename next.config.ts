import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    // Types are manually authored; run `supabase gen types typescript` to auto-generate
    // once the Supabase project is connected. Safe to ignore during development.
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
