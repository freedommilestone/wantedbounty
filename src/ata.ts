import { ed25519 } from "@noble/curves/ed25519";
import { sha256 } from "@noble/hashes/sha256";

const ALPHABET = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
const PDA_MARKER = new TextEncoder().encode("ProgramDerivedAddress");
const ASSOCIATED_TOKEN_PROGRAM = decodeBase58("ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL");

export function associatedTokenAddress(owner: string, tokenProgram: string, mint: string): string {
  const seeds = [decodeBase58(owner), decodeBase58(tokenProgram), decodeBase58(mint)];
  if (seeds.some((seed) => seed.length !== 32)) throw new Error("Invalid Solana address.");
  return encodeBase58(findProgramAddress(seeds, ASSOCIATED_TOKEN_PROGRAM));
}

function findProgramAddress(seeds: Uint8Array[], programId: Uint8Array): Uint8Array {
  for (let bump = 255; bump >= 0; bump -= 1) {
    const hash = sha256(concat([...seeds, Uint8Array.of(bump), programId, PDA_MARKER]));
    if (!isOnCurve(hash)) return hash;
  }
  throw new Error("Couldn't derive the token account.");
}

function isOnCurve(bytes: Uint8Array): boolean {
  try {
    ed25519.ExtendedPoint.fromHex(bytes);
    return true;
  } catch {
    return false;
  }
}

function concat(parts: Uint8Array[]): Uint8Array {
  const out = new Uint8Array(parts.reduce((total, part) => total + part.length, 0));
  let offset = 0;
  for (const part of parts) {
    out.set(part, offset);
    offset += part.length;
  }
  return out;
}

function decodeBase58(value: string): Uint8Array {
  if (!/^[1-9A-HJ-NP-Za-km-z]+$/.test(value)) throw new Error("Invalid Solana address.");
  const bytes = [0];
  for (const char of value) {
    let carry = ALPHABET.indexOf(char);
    for (let index = 0; index < bytes.length; index += 1) {
      carry += bytes[index] * 58;
      bytes[index] = carry & 0xff;
      carry >>= 8;
    }
    while (carry > 0) {
      bytes.push(carry & 0xff);
      carry >>= 8;
    }
  }
  for (let index = 0; index < value.length && value[index] === "1"; index += 1) bytes.push(0);
  return Uint8Array.from(bytes.reverse());
}

function encodeBase58(bytes: Uint8Array): string {
  let zeroes = 0;
  while (zeroes < bytes.length && bytes[zeroes] === 0) zeroes += 1;
  const digits = [0];
  for (let index = zeroes; index < bytes.length; index += 1) {
    let carry = bytes[index];
    for (let digit = 0; digit < digits.length; digit += 1) {
      carry += digits[digit] << 8;
      digits[digit] = carry % 58;
      carry = Math.floor(carry / 58);
    }
    while (carry > 0) {
      digits.push(carry % 58);
      carry = Math.floor(carry / 58);
    }
  }
  let encoded = "1".repeat(zeroes);
  for (let index = digits.length - 1; index >= 0; index -= 1) encoded += ALPHABET[digits[index]];
  return encoded;
}
