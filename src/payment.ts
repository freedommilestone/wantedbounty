import { associatedTokenAddress, decodeBase58 } from "./ata";

/** Wallet that receives the poster fee. */
export const TREASURY_ADDRESS =
  (import.meta.env?.VITE_TREASURY_ADDRESS as string | undefined)?.trim() || "3CQ2GbBy1ks8kyEpa89TV9b3LaC17FBhwR2iZUzVw4pP";

/** Fixed fee in whole USD stablecoin units, on Solana mainnet. */
export const POSTER_FEE = 5;
// Canonical mainnet mints: https://solana.com/docs/payments/how-payments-work
export const PAYMENT_TOKENS = {
  USDC: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
  USDT: "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB",
} as const;
export type PaymentToken = keyof typeof PAYMENT_TOKENS | "SOL";
export interface SolQuote { lamports: number; usdPrice: number; expiresAt: number; }
const TOKEN_PROGRAM = "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA";

const SYSTEM_PROGRAM = "11111111111111111111111111111111";
const ASSOCIATED_TOKEN_PROGRAM = "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL";

export type RpcCall = <T>(method: string, params: unknown[]) => Promise<T>;

interface AccountMeta {
  key: string;
  signer: boolean;
  writable: boolean;
}

interface Instruction {
  programId: string;
  keys: AccountMeta[];
  data: Uint8Array;
}

interface ParsedTokenAccount {
  pubkey: string;
  account: {
    owner: string;
    data?: { parsed?: { info?: { state?: string; tokenAmount?: { amount?: string; decimals?: number } } } };
  };
}

export interface PosterTransfer {
  /** Serialized transaction with empty signature slots, ready for a wallet to sign. */
  transaction: Uint8Array;
  createsTreasuryAccount: boolean;
}

function shortvec(value: number): number[] {
  const out: number[] = [];
  let rest = value;
  for (;;) {
    const byte = rest & 0x7f;
    rest >>= 7;
    if (rest === 0) {
      out.push(byte);
      return out;
    }
    out.push(byte | 0x80);
  }
}

function concat(parts: ArrayLike<number>[]): Uint8Array {
  const out = new Uint8Array(parts.reduce((total, part) => total + part.length, 0));
  let offset = 0;
  for (const part of parts) {
    out.set(part, offset);
    offset += part.length;
  }
  return out;
}

function key32(address: string): Uint8Array {
  const bytes = decodeBase58(address);
  if (bytes.length !== 32) throw new Error("Invalid Solana address.");
  return bytes;
}

/** Serializes a legacy transaction message and wraps it with empty signatures. */
function compileTransaction(payer: string, instructions: Instruction[], blockhash: string): Uint8Array {
  const metas = new Map<string, AccountMeta>();
  const touch = (key: string, signer: boolean, writable: boolean) => {
    const existing = metas.get(key);
    if (existing) {
      existing.signer ||= signer;
      existing.writable ||= writable;
    } else {
      metas.set(key, { key, signer, writable });
    }
  };

  touch(payer, true, true);
  for (const instruction of instructions) {
    for (const meta of instruction.keys) touch(meta.key, meta.signer, meta.writable);
    touch(instruction.programId, false, false);
  }

  const rank = (meta: AccountMeta) => (meta.signer ? (meta.writable ? 0 : 1) : meta.writable ? 2 : 3);
  const ordered = [...metas.values()]
    .map((meta, index) => ({ meta, index }))
    .sort((a, b) => rank(a.meta) - rank(b.meta) || a.index - b.index)
    .map(({ meta }) => meta);

  const indexOf = new Map(ordered.map((meta, index) => [meta.key, index]));
  const signers = ordered.filter((meta) => meta.signer).length;
  const readonlySigned = ordered.filter((meta) => meta.signer && !meta.writable).length;
  const readonlyUnsigned = ordered.filter((meta) => !meta.signer && !meta.writable).length;

  const message = concat([
    [signers, readonlySigned, readonlyUnsigned],
    shortvec(ordered.length),
    ...ordered.map((meta) => key32(meta.key)),
    key32(blockhash),
    shortvec(instructions.length),
    ...instructions.map((instruction) =>
      concat([
        [indexOf.get(instruction.programId) as number],
        shortvec(instruction.keys.length),
        instruction.keys.map((meta) => indexOf.get(meta.key) as number),
        shortvec(instruction.data.length),
        instruction.data,
      ]),
    ),
  ]);

  return concat([shortvec(signers), new Uint8Array(64 * signers), message]);
}

function transferCheckedData(raw: bigint, decimals: number): Uint8Array {
  const data = new Uint8Array(10);
  data[0] = 12; // TransferChecked
  new DataView(data.buffer).setBigUint64(1, raw, true);
  data[9] = decimals;
  return data;
}

/** Builds a fixed-price payment using only the supported mainnet stablecoins. */
export async function buildPosterPayment(
  rpc: RpcCall,
  options: { owner: string; token: PaymentToken; quote?: SolQuote; orderId?: string },
): Promise<PosterTransfer> {
  const { owner, token } = options;
  if (options.orderId && !/^[a-f0-9-]{36}$/.test(options.orderId)) throw new Error("Invalid poster order.");
  const memo: Instruction[] = options.orderId ? [{
    programId: "MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr",
    keys: [{ key: owner, signer: true, writable: false }],
    data: new TextEncoder().encode(`wanted:${options.orderId}`),
  }] : [];
  if (token === "SOL") {
    const quote = options.quote;
    if (!quote || !Number.isSafeInteger(quote.lamports) || quote.lamports <= 0 ||
        !Number.isFinite(quote.usdPrice) || quote.usdPrice <= 0 ||
        quote.lamports !== Math.ceil(POSTER_FEE / quote.usdPrice * 1e9) ||
        !Number.isFinite(quote.expiresAt) || quote.expiresAt <= Date.now() ||
        quote.expiresAt > Date.now() + 65000) {
      throw new Error("SOL quote expired or invalid. Refresh the quote before paying.");
    }
    const blockhash = await rpc<{ value: { blockhash: string } }>("getLatestBlockhash", [{ commitment: "confirmed" }]);
    if (quote.expiresAt <= Date.now()) throw new Error("SOL quote expired. Refresh before paying.");
    const data = new Uint8Array(12);
    const view = new DataView(data.buffer);
    view.setUint32(0, 2, true); // SystemProgram.Transfer
    view.setBigUint64(4, BigInt(quote.lamports), true);
    return {
      transaction: compileTransaction(owner, [{
        programId: SYSTEM_PROGRAM,
        keys: [{ key: owner, signer: true, writable: true }, { key: TREASURY_ADDRESS, signer: false, writable: true }],
        data,
      }, ...memo], blockhash.value.blockhash),
      createsTreasuryAccount: false,
    };
  }
  if (!Object.prototype.hasOwnProperty.call(PAYMENT_TOKENS, token)) {
    throw new Error("Choose USDC or USDT.");
  }
  const mint = PAYMENT_TOKENS[token];
  const amount = POSTER_FEE;
  const treasury = TREASURY_ADDRESS;
  const holdings = await rpc<{ value: ParsedTokenAccount[] }>("getTokenAccountsByOwner", [
    owner,
    { mint },
    { encoding: "jsonParsed" },
  ]);

  let source: { pubkey: string; program: string; raw: bigint; decimals: number } | null = null;
  let total = 0n;
  let decimals = 6;
  for (const item of holdings.value ?? []) {
    const info = item.account.data?.parsed?.info;
    if (!info?.tokenAmount?.amount || info.state === "frozen" || item.account.owner !== TOKEN_PROGRAM || info.tokenAmount.decimals !== 6) continue;
    const raw = BigInt(info.tokenAmount.amount);
    decimals = info.tokenAmount.decimals ?? decimals;
    total += raw;
    if (!source || raw > source.raw) source = { pubkey: item.pubkey, program: item.account.owner, raw, decimals };
  }

  const needed = BigInt(amount) * 10n ** BigInt(decimals);
  if (!source || total < needed) throw new Error(`You need at least ${amount} ${token} to pay for a poster.`);
  if (source.raw < needed) {
    throw new Error(`Your ${token} is split across accounts. Move ${amount} ${token} into one token account and try again.`);
  }

  const program = source.program;
  const destination = associatedTokenAddress(treasury, program, mint);
  const destinationInfo = await rpc<{ value: unknown | null }>("getAccountInfo", [
    destination,
    { encoding: "base64", dataSlice: { offset: 0, length: 0 } },
  ]);
  const createsTreasuryAccount = !destinationInfo.value;

  const blockhash = await rpc<{ value: { blockhash: string } }>("getLatestBlockhash", [{ commitment: "confirmed" }]);

  const instructions: Instruction[] = [];
  if (createsTreasuryAccount) {
    instructions.push({
      programId: ASSOCIATED_TOKEN_PROGRAM,
      keys: [
        { key: owner, signer: true, writable: true },
        { key: destination, signer: false, writable: true },
        { key: treasury, signer: false, writable: false },
        { key: mint, signer: false, writable: false },
        { key: SYSTEM_PROGRAM, signer: false, writable: false },
        { key: program, signer: false, writable: false },
      ],
      data: Uint8Array.of(1), // CreateIdempotent
    });
  }
  instructions.push({
    programId: program,
    keys: [
      { key: source.pubkey, signer: false, writable: true },
      { key: mint, signer: false, writable: false },
      { key: destination, signer: false, writable: true },
      { key: owner, signer: true, writable: false },
    ],
    data: transferCheckedData(needed, decimals),
  });

  return {
    transaction: compileTransaction(owner, [...instructions, ...memo], blockhash.value.blockhash),
    createsTreasuryAccount,
  };
}
