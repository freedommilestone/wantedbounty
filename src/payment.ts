import { associatedTokenAddress, decodeBase58 } from "./ata";

/** Wallet that receives the poster fee. */
export const TREASURY_ADDRESS =
  (import.meta.env?.VITE_TREASURY_ADDRESS as string | undefined)?.trim() || "3CQ2GbBy1ks8kyEpa89TV9b3LaC17FBhwR2iZUzVw4pP";

/** Poster fee, in whole BERI. */
export const POSTER_FEE = 500;

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

export interface BeriTransfer {
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

/** Token-2022 mints with a transfer fee require the expected fee to be stated in the instruction. */
function transferCheckedWithFeeData(raw: bigint, decimals: number, fee: bigint): Uint8Array {
  const data = new Uint8Array(19);
  data[0] = 26; // TransferFeeExtension
  data[1] = 1; // TransferCheckedWithFee
  const view = new DataView(data.buffer);
  view.setBigUint64(2, raw, true);
  data[10] = decimals;
  view.setBigUint64(11, fee, true);
  return data;
}

interface FeeSchedule {
  epoch?: number | string;
  maximumFee?: number | string;
  transferFeeBasisPoints?: number | string;
}

function transferFee(raw: bigint, config: { newerTransferFee?: FeeSchedule; olderTransferFee?: FeeSchedule }, epoch: number): bigint {
  const newer = config.newerTransferFee;
  const schedule = newer && epoch >= Number(newer.epoch ?? 0) ? newer : (config.olderTransferFee ?? newer);
  if (!schedule) return 0n;
  const basisPoints = BigInt(schedule.transferFeeBasisPoints ?? 0);
  if (basisPoints === 0n) return 0n;
  const maximum = BigInt(schedule.maximumFee ?? 0);
  const fee = (raw * basisPoints + 9999n) / 10000n;
  return fee > maximum ? maximum : fee;
}

/**
 * Builds a BERI transfer from `owner` to the treasury's associated token account.
 * Works for both the classic token program and Token-2022.
 */
export async function buildBeriTransfer(
  rpc: RpcCall,
  options: { owner: string; mint: string; amount: number; treasury?: string },
): Promise<BeriTransfer> {
  const { owner, mint, amount } = options;
  const treasury = options.treasury ?? TREASURY_ADDRESS;

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
    if (!info?.tokenAmount?.amount || info.state === "frozen") continue;
    const raw = BigInt(info.tokenAmount.amount);
    decimals = info.tokenAmount.decimals ?? decimals;
    total += raw;
    if (!source || raw > source.raw) source = { pubkey: item.pubkey, program: item.account.owner, raw, decimals };
  }

  const needed = BigInt(amount) * 10n ** BigInt(decimals);
  if (!source || total < needed) throw new Error(`You need at least ${amount} BERI to pay for a poster.`);
  if (source.raw < needed) {
    throw new Error(`Your BERI is split across accounts. Move ${amount} BERI into one token account and try again.`);
  }

  const mintInfo = await rpc<{
    value: {
      data?: {
        parsed?: {
          info?: { extensions?: { extension?: string; state?: { newerTransferFee?: FeeSchedule; olderTransferFee?: FeeSchedule } }[] };
        };
      };
    } | null;
  }>("getAccountInfo", [mint, { encoding: "jsonParsed" }]);
  const feeConfig = mintInfo.value?.data?.parsed?.info?.extensions?.find((entry) => entry.extension === "transferFeeConfig");
  let fee: bigint | null = null;
  if (feeConfig) {
    const { epoch } = await rpc<{ epoch: number }>("getEpochInfo", []);
    fee = transferFee(needed, feeConfig.state ?? {}, epoch);
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
    data: fee === null ? transferCheckedData(needed, decimals) : transferCheckedWithFeeData(needed, decimals, fee),
  });

  return {
    transaction: compileTransaction(owner, instructions, blockhash.value.blockhash),
    createsTreasuryAccount,
  };
}
