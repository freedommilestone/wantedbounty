import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { associatedTokenAddress } from "./ata";

const STORAGE_KEY = "wantedbounty:wallet";
const LEGACY_STORAGE_KEY = "wantedbounty:phantom";
const BERI_MINT = import.meta.env.VITE_BERI_MINT?.trim() || "GbYRS9bPStDoDCHtgc4PpuguaMAhux5s3qA2LAgxFXzt";
const TOKEN_PROGRAMS = [
  "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
  "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb",
] as const;

export const PHANTOM_DOWNLOAD_URL = "https://phantom.com/download";
export const METAMASK_DOWNLOAD_URL = "https://metamask.io/download/";

export type WalletKind = "phantom" | "metamask";

export type BeriHoldings =
  | { state: "idle" }
  | { state: "loading" }
  | { state: "unconfigured" }
  | { state: "error"; message: string }
  | { state: "ready"; amount: number; display: string };

interface SolanaPublicKey {
  toString(): string;
  toBase58?: () => string;
}

interface PhantomSolanaProvider {
  isPhantom?: boolean;
  publicKey: SolanaPublicKey | null;
  connect(options?: { onlyIfTrusted?: boolean }): Promise<{ publicKey: SolanaPublicKey }>;
  disconnect(): Promise<void>;
  on(event: "accountChanged", handler: (publicKey: SolanaPublicKey | null) => void): void;
  on(event: "disconnect", handler: () => void): void;
  off(event: "accountChanged", handler: (publicKey: SolanaPublicKey | null) => void): void;
  off(event: "disconnect", handler: () => void): void;
}

interface SolanaAccount {
  address: string;
}

interface SolanaStandardWallet {
  name: string;
  chains: readonly string[];
  accounts: readonly SolanaAccount[];
  features: Record<string, unknown>;
}

interface StandardConnect {
  connect(input?: { silent?: boolean }): Promise<{ accounts: readonly SolanaAccount[] }>;
}

interface StandardDisconnect {
  disconnect(): Promise<void>;
}

interface StandardEvents {
  on(event: "change", listener: (properties: { accounts?: readonly SolanaAccount[] }) => void): () => void;
}

interface WindowEthereum {
  isMetaMask?: boolean;
  isPhantom?: boolean;
  providers?: WindowEthereum[];
}

interface WalletStandardRegisterEvent extends Event {
  detail: (api: { register: (wallet: SolanaStandardWallet) => void }) => void;
}

declare global {
  interface Window {
    phantom?: { solana?: PhantomSolanaProvider };
    solana?: PhantomSolanaProvider;
    ethereum?: WindowEthereum;
  }

  interface WindowEventMap {
    "wallet-standard:register-wallet": WalletStandardRegisterEvent;
  }
}

interface WalletContextValue {
  modalOpen: boolean;
  openModal: () => void;
  closeModal: () => void;
  phantomInstalled: boolean;
  metamaskInstalled: boolean;
  metamaskExtension: boolean;
  wallet: WalletKind | null;
  connectingWallet: WalletKind | null;
  connect: (kind: WalletKind) => Promise<void>;
  disconnect: () => Promise<void>;
  address: string | null;
  status: "idle" | "connecting" | "connected";
  error: string | null;
  holdings: BeriHoldings;
  isHolder: boolean;
  refreshHoldings: () => void;
}

const WalletContext = createContext<WalletContextValue | null>(null);

export function useWallet() {
  const value = useContext(WalletContext);
  if (!value) throw new Error("useWallet must be used within WalletProvider");
  return value;
}

export function isMobileDevice() {
  return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}

export function phantomBrowseUrl() {
  const href = encodeURIComponent(window.location.href);
  const ref = encodeURIComponent(window.location.origin);
  return `https://phantom.app/ul/browse/${href}?ref=${ref}`;
}

export function metamaskBrowseUrl() {
  const target = window.location.href.replace(/^https?:\/\//, "");
  return `https://metamask.app.link/dapp/${target}`;
}

export function shortAddress(address: string) {
  if (address.length <= 10) return address;
  return `${address.slice(0, 4)}…${address.slice(-4)}`;
}

function rpcUrl() {
  const configured = import.meta.env.VITE_SOLANA_RPC_URL?.trim();
  if (configured) return configured;
  const host = typeof window !== "undefined" ? window.location.hostname : "";
  // Local Vite strips the browser Origin header. The live site uses the same-origin proxy in /api.
  if (import.meta.env.DEV || host === "localhost" || host === "127.0.0.1") return "/solana-rpc";
  return "/api/solana-rpc";
}

function readAddress(publicKey: SolanaPublicKey | string | null | undefined): string | null {
  if (!publicKey) return null;
  const value = typeof publicKey === "string" ? publicKey : (publicKey.toBase58?.() ?? publicKey.toString());
  return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(value) ? value : null;
}

function getPhantom(): PhantomSolanaProvider | null {
  const provider = window.phantom?.solana ?? window.solana;
  return provider?.isPhantom ? provider : null;
}

function hasMetaMaskExtension() {
  const ethereum = window.ethereum;
  if (!ethereum || ethereum.isPhantom) return false;
  if (ethereum.isMetaMask) return true;
  return Boolean(ethereum.providers?.some((provider) => provider.isMetaMask && !provider.isPhantom));
}

function isMetaMaskSolana(wallet: SolanaStandardWallet) {
  return wallet.name === "MetaMask" && wallet.chains.some((chain) => chain.startsWith("solana:"));
}

function savedWallet(): WalletKind | null {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    if (value === "phantom" || value === "metamask") return value;
    if (localStorage.getItem(LEGACY_STORAGE_KEY) === "1") return "phantom";
  } catch {
    /* private browsing can block storage */
  }
  return null;
}

function rememberWallet(kind: WalletKind) {
  try {
    localStorage.setItem(STORAGE_KEY, kind);
    localStorage.removeItem(LEGACY_STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

function forgetWallet() {
  try {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(LEGACY_STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

class AppReadyEvent extends Event {
  readonly #api: { register: (wallet: SolanaStandardWallet) => void };

  get detail() {
    return this.#api;
  }

  constructor(api: { register: (wallet: SolanaStandardWallet) => void }) {
    super("wallet-standard:app-ready");
    this.#api = api;
  }
}

function describeError(err: unknown, walletName: string) {
  const code =
    typeof err === "object" && err && "code" in err ? Number((err as { code: unknown }).code) : Number.NaN;
  const message = err instanceof Error ? err.message : "";
  if (code === 4001 || /reject|denied|cancel/i.test(message)) return `${walletName} request was rejected.`;
  if (message) return message;
  return `Couldn't connect ${walletName}.`;
}

async function connectPhantom() {
  const phantom = getPhantom();
  if (!phantom) throw new Error("Phantom isn't installed.");
  const { publicKey } = await phantom.connect();
  const address = readAddress(publicKey);
  if (!address) throw new Error("Phantom didn't share an account.");
  return address;
}

async function connectMetaMask(metamask: SolanaStandardWallet | null) {
  const feature = metamask?.features["standard:connect"] as StandardConnect | undefined;
  if (!feature) {
    if (hasMetaMaskExtension()) throw new Error("Enable Solana in MetaMask, then try again.");
    throw new Error("MetaMask isn't installed.");
  }
  const { accounts } = await feature.connect();
  const address = accounts[0]?.address;
  if (!address) throw new Error("MetaMask didn't share an account.");
  return address;
}

function formatRaw(raw: bigint, decimals: number) {
  const scale = 10n ** BigInt(decimals);
  const whole = raw / scale;
  const fraction = raw % scale;
  const wholeText = whole.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  if (fraction === 0n) return wholeText;
  const fractionText = fraction.toString().padStart(decimals, "0").replace(/0+$/, "");
  return `${wholeText}.${fractionText}`;
}

interface TokenInfo {
  mint?: string;
  tokenAmount?: { amount?: string; decimals?: number };
}

interface ParsedTokenAccount {
  pubkey?: string;
  data?: { parsed?: { info?: TokenInfo } };
  account?: { data?: { parsed?: { info?: TokenInfo } } };
}

async function rpc<T>(method: string, params: unknown[]): Promise<T> {
  let lastError: Error | null = null;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const response = await fetch(rpcUrl(), {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
    });
    if (response.status === 429 || response.status === 503) {
      lastError = new Error(`Solana RPC responded ${response.status}.`);
      await new Promise((resolve) => window.setTimeout(resolve, 500));
      continue;
    }
    if (!response.ok) throw new Error(`Solana RPC responded ${response.status}.`);
    const body = (await response.json()) as { result?: T; error?: { message?: string } };
    if (body.error) throw new Error(body.error.message || "Solana RPC error.");
    return body.result as T;
  }
  throw lastError ?? new Error("Solana RPC error.");
}

interface TokenBalance {
  raw: bigint;
  decimals: number;
}

function balanceFromInfo(info: TokenInfo | undefined): TokenBalance | null {
  if (!info || info.mint !== BERI_MINT || !info.tokenAmount?.amount) return null;
  return {
    raw: BigInt(info.tokenAmount.amount),
    decimals: typeof info.tokenAmount.decimals === "number" ? info.tokenAmount.decimals : 6,
  };
}

async function fetchBeriHoldings(owner: string): Promise<BeriHoldings> {
  if (!BERI_MINT) return { state: "unconfigured" };

  const atas = TOKEN_PROGRAMS.map((programId) => associatedTokenAddress(owner, programId, BERI_MINT));
  const settled = await Promise.allSettled([
    rpc<{ value: (ParsedTokenAccount | null)[] }>("getMultipleAccounts", [atas, { encoding: "jsonParsed" }]),
    rpc<{ value: ParsedTokenAccount[] }>("getTokenAccountsByOwner", [owner, { mint: BERI_MINT }, { encoding: "jsonParsed" }]),
  ]);

  if (settled.every((result) => result.status === "rejected")) {
    const reason = settled.find((result) => result.status === "rejected");
    const error = reason?.status === "rejected" ? reason.reason : null;
    throw error instanceof Error ? error : new Error("Couldn't read token accounts.");
  }

  const balances = new Map<string, TokenBalance>();
  const accounts = settled[0].status === "fulfilled" ? settled[0].value?.value : undefined;
  accounts?.forEach((account, index) => {
    const balance = balanceFromInfo(account?.data?.parsed?.info);
    const address = atas[index];
    if (balance && address) balances.set(address, balance);
  });

  if (settled[1].status === "fulfilled") {
    for (const item of settled[1].value?.value ?? []) {
      const balance = balanceFromInfo(item.account?.data?.parsed?.info);
      if (balance && item.pubkey) balances.set(item.pubkey, balance);
    }
  }

  let raw = 0n;
  let decimals = 6;
  for (const balance of balances.values()) {
    raw += balance.raw;
    decimals = balance.decimals;
  }

  const ui = Number(raw) / 10 ** decimals;
  return {
    state: "ready",
    amount: raw > 0n && ui === 0 ? Number.MIN_VALUE : ui,
    display: formatRaw(raw, decimals),
  };
}

export function WalletProvider({ children }: { children: ReactNode }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [phantom, setPhantom] = useState<PhantomSolanaProvider | null>(null);
  const [metamask, setMetamask] = useState<SolanaStandardWallet | null>(null);
  const [metamaskExtension, setMetamaskExtension] = useState(false);
  const [wallet, setWallet] = useState<WalletKind | null>(null);
  const [connectingWallet, setConnectingWallet] = useState<WalletKind | null>(null);
  const [address, setAddress] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "connecting" | "connected">("idle");
  const [error, setError] = useState<string | null>(null);
  const [holdings, setHoldings] = useState<BeriHoldings>({ state: "idle" });
  const [scanNonce, setScanNonce] = useState(0);
  const walletRef = useRef<WalletKind | null>(null);
  const restoreAttempted = useRef(false);

  const reset = useCallback(() => {
    walletRef.current = null;
    setAddress(null);
    setWallet(null);
    setStatus("idle");
    setHoldings({ state: "idle" });
    forgetWallet();
  }, []);

  useEffect(() => {
    const detect = () => {
      setPhantom(getPhantom());
      setMetamaskExtension(hasMetaMaskExtension());
    };
    detect();
    const id = window.setInterval(detect, 800);
    window.addEventListener("focus", detect);
    return () => {
      window.clearInterval(id);
      window.removeEventListener("focus", detect);
    };
  }, []);

  useEffect(() => {
    const api = {
      register(next: SolanaStandardWallet) {
        if (isMetaMaskSolana(next)) setMetamask(next);
      },
    };
    const onRegister = (event: WalletStandardRegisterEvent) => {
      try {
        event.detail?.(api);
      } catch {
        /* a wallet's register callback threw */
      }
    };
    window.addEventListener("wallet-standard:register-wallet", onRegister);
    window.dispatchEvent(new AppReadyEvent(api));
    return () => window.removeEventListener("wallet-standard:register-wallet", onRegister);
  }, []);

  useEffect(() => {
    const kind = savedWallet();
    if (!kind || restoreAttempted.current) return;
    if (kind === "phantom" && !phantom) return;
    if (kind === "metamask" && !metamask) return;
    restoreAttempted.current = true;

    let cancelled = false;
    (async () => {
      try {
        if (kind === "phantom" && phantom) {
          const { publicKey } = await phantom.connect({ onlyIfTrusted: true });
          const restored = readAddress(publicKey);
          if (cancelled || !restored) return;
          walletRef.current = "phantom";
          setAddress(restored);
          setWallet("phantom");
          setStatus("connected");
          rememberWallet("phantom");
        } else if (kind === "metamask" && metamask) {
          const feature = metamask.features["standard:connect"] as StandardConnect | undefined;
          if (!feature) return;
          const { accounts } = await feature.connect({ silent: true });
          const next = accounts[0]?.address;
          if (cancelled || !next) return;
          walletRef.current = "metamask";
          setAddress(next);
          setWallet("metamask");
          setStatus("connected");
          rememberWallet("metamask");
        }
      } catch {
        if (!cancelled) forgetWallet();
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [phantom, metamask]);

  useEffect(() => {
    if (!phantom || wallet !== "phantom") return;
    const onAccount = (publicKey: SolanaPublicKey | null) => {
      if (walletRef.current !== "phantom") return;
      const next = readAddress(publicKey);
      if (next) setAddress(next);
      else if (!publicKey) reset();
    };
    const onDisconnect = () => {
      if (walletRef.current === "phantom") reset();
    };
    phantom.on("accountChanged", onAccount);
    phantom.on("disconnect", onDisconnect);
    return () => {
      phantom.off("accountChanged", onAccount);
      phantom.off("disconnect", onDisconnect);
    };
  }, [phantom, wallet, reset]);

  useEffect(() => {
    if (!metamask || wallet !== "metamask") return;
    const events = metamask.features["standard:events"] as StandardEvents | undefined;
    if (!events) return;
    return events.on("change", ({ accounts }) => {
      if (walletRef.current !== "metamask") return;
      const next = accounts?.[0]?.address ?? metamask.accounts[0]?.address ?? null;
      if (next) setAddress(next);
      else reset();
    });
  }, [metamask, wallet, reset]);

  useEffect(() => {
    if (!address) {
      setHoldings({ state: "idle" });
      return;
    }
    let cancelled = false;
    setHoldings({ state: "loading" });
    fetchBeriHoldings(address)
      .then((next) => {
        if (!cancelled) setHoldings(next);
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setHoldings({
            state: "error",
            message: err instanceof Error ? err.message : "The Solana network didn't respond.",
          });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [address, scanNonce]);

  const connect = useCallback(
    async (kind: WalletKind) => {
      setError(null);
      setStatus("connecting");
      setConnectingWallet(kind);
      const name = kind === "phantom" ? "Phantom" : "MetaMask";
      try {
        if (walletRef.current && walletRef.current !== kind) {
          const previous = walletRef.current;
          walletRef.current = null;
          if (previous === "phantom") await getPhantom()?.disconnect().catch(() => undefined);
          if (previous === "metamask") {
            const feature = metamask?.features["standard:disconnect"] as StandardDisconnect | undefined;
            await feature?.disconnect().catch(() => undefined);
          }
        }
        const next = kind === "phantom" ? await connectPhantom() : await connectMetaMask(metamask);
        walletRef.current = kind;
        setAddress(next);
        setWallet(kind);
        setStatus("connected");
        rememberWallet(kind);
        setModalOpen(false);
      } catch (err) {
        if (walletRef.current) setStatus("connected");
        else reset();
        setError(describeError(err, name));
      } finally {
        setConnectingWallet(null);
      }
    },
    [metamask, reset],
  );

  const disconnect = useCallback(async () => {
    const kind = walletRef.current;
    walletRef.current = null;
    try {
      if (kind === "phantom") await getPhantom()?.disconnect();
      if (kind === "metamask") {
        const feature = metamask?.features["standard:disconnect"] as StandardDisconnect | undefined;
        await feature?.disconnect();
      }
    } catch {
      /* still clear the local session */
    }
    reset();
  }, [metamask, reset]);

  const value = useMemo<WalletContextValue>(
    () => ({
      modalOpen,
      openModal: () => {
        setError(null);
        setModalOpen(true);
      },
      closeModal: () => setModalOpen(false),
      phantomInstalled: phantom !== null,
      metamaskInstalled: metamask !== null,
      metamaskExtension,
      wallet,
      connectingWallet,
      connect,
      disconnect,
      address,
      status,
      error,
      holdings,
      isHolder: holdings.state === "ready" && holdings.amount > 0,
      refreshHoldings: () => setScanNonce((nonce) => nonce + 1),
    }),
    [
      modalOpen,
      phantom,
      metamask,
      metamaskExtension,
      wallet,
      connectingWallet,
      connect,
      disconnect,
      address,
      status,
      error,
      holdings,
    ],
  );

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}
