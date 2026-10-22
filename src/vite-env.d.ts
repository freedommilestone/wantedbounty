/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_BERI_MINT?: string;
  readonly VITE_SOLANA_RPC_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
