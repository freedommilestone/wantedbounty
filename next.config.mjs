/** @type {import('next').NextConfig} */
const nextConfig = {
  // Compatibility for the three deliberately public Vite settings already on Vercel.
  // Secret values are never copied into this allowlist or the browser bundle.
  env: {
    NEXT_PUBLIC_BERI_MINT: process.env.NEXT_PUBLIC_BERI_MINT || process.env.VITE_BERI_MINT || '',
    NEXT_PUBLIC_TREASURY_ADDRESS: process.env.NEXT_PUBLIC_TREASURY_ADDRESS || process.env.VITE_TREASURY_ADDRESS || '',
    NEXT_PUBLIC_SOLANA_RPC_URL: process.env.NEXT_PUBLIC_SOLANA_RPC_URL || process.env.VITE_SOLANA_RPC_URL || '',
  },
};
export default nextConfig;
