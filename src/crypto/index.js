// QNTMEX Wallet - Crypto Utilities
// Ported from walletqntmex.com V6 HTML wallet

import * as Crypto from 'expo-crypto';
import { Buffer } from 'buffer';

// ── BASE58 ───────────────────────────────────────────────
const BASE58_ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';

export function base58Encode(bytes) {
  let num = BigInt('0x' + Buffer.from(bytes).toString('hex'));
  let result = '';
  while (num > 0n) {
    result = BASE58_ALPHABET[Number(num % 58n)] + result;
    num = num / 58n;
  }
  for (const b of bytes) {
    if (b !== 0) break;
    result = '1' + result;
  }
  return result;
}

export function base58Decode(str) {
  let num = 0n;
  for (const c of str) {
    const idx = BASE58_ALPHABET.indexOf(c);
    if (idx < 0) throw new Error('Invalid base58 char: ' + c);
    num = num * 58n + BigInt(idx);
  }
  let hex = num.toString(16);
  if (hex.length % 2) hex = '0' + hex;
  const bytes = Buffer.from(hex, 'hex');
  const leading = [...str].filter(c => c === '1').length;
  return Buffer.concat([Buffer.alloc(leading), bytes]);
}

async function sha256Bytes(data) {
  const digest = await Crypto.digest(Crypto.CryptoDigestAlgorithm.SHA256, data);
  return new Uint8Array(digest);
}

async function sha256Hex(data) {
  const bytes = typeof data === 'string' ? Buffer.from(data, 'hex') : data;
  return Buffer.from(await sha256Bytes(bytes)).toString('hex');
}

export async function base58CheckEncode(payloadHex) {
  const payload = Buffer.from(payloadHex, 'hex');
  const h1 = await sha256Bytes(payload);
  const h2 = await sha256Bytes(h1);
  const checksum = h2.slice(0, 4);
  return base58Encode(Buffer.concat([payload, checksum]));
}

// ── BECH32 (BTC segwit) ───────────────────────────────────
function bech32Polymod(values) {
  const GEN = [0x3b6a57b2, 0x26508e6d, 0x1ea119fa, 0x3d4233dd, 0x2a1462b3];
  let chk = 1;
  for (const v of values) {
    const b = chk >> 25;
    chk = ((chk & 0x1ffffff) << 5) ^ v;
    for (let i = 0; i < 5; i++) if ((b >> i) & 1) chk ^= GEN[i];
  }
  return chk;
}
function bech32HrpExpand(hrp) {
  const r = [];
  for (const c of hrp) r.push(c.charCodeAt(0) >> 5);
  r.push(0);
  for (const c of hrp) r.push(c.charCodeAt(0) & 31);
  return r;
}
function bech32CreateChecksum(hrp, data) {
  const values = [...bech32HrpExpand(hrp), ...data];
  const polymod = bech32Polymod([...values, 0, 0, 0, 0, 0, 0]) ^ 1;
  return [0,1,2,3,4,5].map(i => (polymod >> 5*(5-i)) & 31);
}
function convertBits(data, from, to, pad = true) {
  let acc = 0, bits = 0;
  const result = [];
  const maxv = (1 << to) - 1;
  for (const v of data) {
    acc = (acc << from) | v;
    bits += from;
    while (bits >= to) { bits -= to; result.push((acc >> bits) & maxv); }
  }
  if (pad && bits > 0) result.push((acc << (to - bits)) & maxv);
  return result;
}
const BECH32_CHARSET = 'qpzry9x8gf2tvdw0s3jn54khce6mua7l';
export function bech32Encode(hrp, data) {
  const combined = [...data, ...bech32CreateChecksum(hrp, data)];
  return hrp + '1' + combined.map(d => BECH32_CHARSET[d]).join('');
}

// ── RIPEMD-160 ───────────────────────────────────────────
export function ripemd160(msg) {
  // Full RIPEMD-160 implementation
  function rotl(x, n) { return (x << n) | (x >>> 32 - n); }
  function f(j, x, y, z) {
    if (j < 16) return x ^ y ^ z;
    if (j < 32) return (x & y) | ((~x) & z);
    if (j < 48) return (x | (~y)) ^ z;
    if (j < 64) return (x & z) | (y & (~z));
    return x ^ (y | (~z));
  }
  function K(j) { if (j < 16) return 0; if (j < 32) return 0x5a827999; if (j < 48) return 0x6ed9eba1; if (j < 64) return 0x8f1bbcdc; return 0xa953fd4e; }
  function KK(j) { if (j < 16) return 0x50a28be6; if (j < 32) return 0x5c4dd124; if (j < 48) return 0x6d703ef3; if (j < 64) return 0x7a6d76e9; return 0; }
  const RL = [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,7,4,13,1,10,6,15,3,12,0,9,5,2,14,11,8,3,10,14,4,9,15,8,1,2,7,0,6,13,11,5,12,1,9,11,10,0,8,12,4,13,3,7,15,14,5,6,2,4,0,5,9,7,12,2,10,14,1,3,8,11,6,15,13];
  const RR = [5,14,7,0,9,2,11,4,13,6,15,8,1,10,3,12,6,11,3,7,0,13,5,10,14,15,8,12,4,9,1,2,15,5,1,3,7,14,6,9,11,8,12,2,10,0,4,13,8,6,4,1,3,11,15,0,5,12,2,13,9,7,10,14,12,15,10,4,1,5,8,7,6,2,13,14,0,3,9,11];
  const SL = [11,14,15,12,5,8,7,9,11,13,14,15,6,7,9,8,7,6,8,13,11,9,7,15,7,12,15,9,11,7,13,12,11,13,6,7,14,9,13,15,14,8,13,6,5,12,7,5,11,12,14,15,14,15,9,8,9,14,5,6,8,6,5,12,9,15,5,11,6,8,13,12,5,12,13,14,11,8,5,6];
  const SR = [8,9,9,11,13,15,15,5,7,7,8,11,14,14,12,6,9,13,15,7,12,8,9,11,7,7,12,7,6,15,13,11,9,7,15,11,8,6,6,14,12,13,5,14,13,13,7,5,15,5,8,11,14,14,6,14,6,9,12,9,12,5,15,8,8,5,12,9,12,5,14,6,8,13,6,5,15,13,11,11];
  const bytes = typeof msg === 'string' ? Buffer.from(msg, 'hex') : msg;
  const len = bytes.length;
  const bitLen = len * 8;
  const padded = [...bytes, 0x80];
  while (padded.length % 64 !== 56) padded.push(0);
  for (let i = 0; i < 8; i++) padded.push((bitLen / Math.pow(2, i * 8)) & 0xff);
  let h0 = 0x67452301, h1 = 0xefcdab89, h2 = 0x98badcfe, h3 = 0x10325476, h4 = 0xc3d2e1f0;
  for (let block = 0; block < padded.length; block += 64) {
    const X = [];
    for (let i = 0; i < 16; i++) {
      X.push(padded[block+i*4] | (padded[block+i*4+1]<<8) | (padded[block+i*4+2]<<16) | (padded[block+i*4+3]<<24));
    }
    let [al, bl, cl, dl, el] = [h0, h1, h2, h3, h4];
    let [ar, br, cr, dr, er] = [h0, h1, h2, h3, h4];
    for (let j = 0; j < 80; j++) {
      let T = (al + f(j,bl,cl,dl) + X[RL[j]] + K(j)) | 0;
      T = (rotl(T, SL[j]) + el) | 0; al=el; el=dl; dl=rotl(cl,10)|0; cl=bl; bl=T;
      T = (ar + f(79-j,br,cr,dr) + X[RR[j]] + KK(j)) | 0;
      T = (rotl(T, SR[j]) + er) | 0; ar=er; er=dr; dr=rotl(cr,10)|0; cr=br; br=T;
    }
    const T = (h1 + cl + dr) | 0;
    h1 = (h2 + dl + er) | 0; h2 = (h3 + el + ar) | 0; h3 = (h4 + al + br) | 0; h4 = (h0 + bl + cr) | 0; h0 = T;
  }
  const result = Buffer.alloc(20);
  [h0, h1, h2, h3, h4].forEach((h, i) => {
    result[i*4] = h & 0xff; result[i*4+1] = (h>>8) & 0xff; result[i*4+2] = (h>>16) & 0xff; result[i*4+3] = (h>>24) & 0xff;
  });
  return result;
}

// ── HMAC-SHA512 ───────────────────────────────────────────
async function hmacSha512(key, data) {
  const keyBytes = typeof key === 'string' ? Buffer.from(key) : key;
  const dataBytes = typeof data === 'string' ? Buffer.from(data) : data;
  // Use SubtleCrypto via global if available
  if (typeof globalThis !== 'undefined' && globalThis.crypto && globalThis.crypto.subtle) {
    const k = await globalThis.crypto.subtle.importKey('raw', keyBytes, { name: 'HMAC', hash: 'SHA-512' }, false, ['sign']);
    const sig = await globalThis.crypto.subtle.sign('HMAC', k, dataBytes);
    return new Uint8Array(sig);
  }
  // Fallback: manual HMAC-SHA512 using Web Crypto polyfill
  throw new Error('HMAC-SHA512 not available');
}

// ── SLIP-0010 Ed25519 derivation (Solana) ─────────────────
async function slip10DeriveEd25519(seed, path) {
  const I = await hmacSha512(Buffer.from('ed25519 seed'), seed);
  let key = I.slice(0, 32);
  let chainCode = I.slice(32);
  for (const seg of path) {
    const idx = seg | 0x80000000;
    const data = Buffer.concat([Buffer.alloc(1), key, Buffer.from([idx>>>24, (idx>>>16)&0xff, (idx>>>8)&0xff, idx&0xff])]);
    const derived = await hmacSha512(chainCode, data);
    key = derived.slice(0, 32);
    chainCode = derived.slice(32);
  }
  return key;
}

// ── MAIN: Derive all wallet addresses ────────────────────
export async function deriveAllAddresses(mnemonic) {
  const { ethers } = await import('ethers');
  
  // ETH & BSC — m/44'/60'/0'/0/0
  const ethWallet = ethers.HDNodeWallet.fromPhrase(mnemonic, undefined, "m/44'/60'/0'/0/0");
  const ethAddr  = ethWallet.address;
  const ethPriv  = ethWallet.privateKey;

  // BTC — m/84'/0'/0'/0/0 (native segwit / bech32)
  const btcNode  = ethers.HDNodeWallet.fromPhrase(mnemonic, undefined, "m/84'/0'/0'/0/0");
  const btcPub   = Buffer.from(btcNode.publicKey.slice(2), 'hex'); // compressed 33 bytes
  // P2WPKH: hash160(pubkey) -> bech32 bc1q...
  const pubHash  = await sha256Bytes(btcPub);
  const hash160  = ripemd160(Buffer.from(pubHash));
  const witnessProgram = convertBits([...hash160], 8, 5);
  const btcAddr  = bech32Encode('bc', [0, ...witnessProgram]);
  const btcPriv  = btcNode.privateKey.slice(2); // hex without 0x

  // SOL — SLIP-0010 m/44'/501'/0'/0'
  const mnemonicObj = await import('bip39');
  const seed = await mnemonicObj.mnemonicToSeed(mnemonic);
  const solKey = await slip10DeriveEd25519(seed.slice(0, 64), [44, 501, 0, 0]);
  const nacl = (await import('tweetnacl')).default;
  const solKp = nacl.sign.keyPair.fromSeed(solKey);
  const solAddr = base58Encode(Buffer.from(solKp.publicKey));

  // TRX — m/44'/195'/0'/0/0
  const trxNode = ethers.HDNodeWallet.fromPhrase(mnemonic, undefined, "m/44'/195'/0'/0/0");
  const trxPub  = Buffer.from(trxNode.publicKey.slice(2), 'hex'); // 64-byte uncompressed would be needed
  // TRX address: keccak256 of uncompressed pub key (last 20 bytes), prefix 41, base58check
  const trxFull = Buffer.from(trxNode.publicKey.slice(2), 'hex'); // compressed
  // We need uncompressed: use ethers utils
  const trxUncomp = ethers.SigningKey.computePublicKey(trxNode.publicKey, false).slice(4); // remove 04 prefix
  const trxKeccak = ethers.keccak256('0x' + trxUncomp).slice(-40); // last 20 bytes
  const trxAddr = await base58CheckEncode('41' + trxKeccak);
  const trxPriv = trxNode.privateKey.slice(2);

  return {
    addrs: {
      ETH: ethAddr,
      BTC: btcAddr,
      SOL: solAddr,
      BSC: ethAddr, // same as ETH
      TRX: trxAddr,
    },
    privs: {
      ETH: ethPriv,
      BTC: btcPriv,
      BSC: ethPriv,
      TRX: trxPriv,
      SOL: solKp.secretKey.slice(0, 32), // 32-byte seed
    }
  };
}

// ── AES-GCM PIN Encryption (matches web wallet) ──────────
async function pinToKey(pin, salt = 'qntmex_salt_2026') {
  const enc = new TextEncoder();
  const keyMaterial = await globalThis.crypto.subtle.importKey(
    'raw', enc.encode(pin), { name: 'PBKDF2' }, false, ['deriveBits', 'deriveKey']
  );
  return globalThis.crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: enc.encode(salt), iterations: 100000, hash: 'SHA-256' },
    keyMaterial, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']
  );
}

export async function encryptData(obj, pin) {
  const key = await pinToKey(pin);
  const iv = globalThis.crypto.getRandomValues(new Uint8Array(12));
  const enc = new TextEncoder();
  const ciphertext = await globalThis.crypto.subtle.encrypt(
    { name: 'AES-GCM', iv }, key, enc.encode(JSON.stringify(obj))
  );
  return {
    iv: Buffer.from(iv).toString('base64'),
    data: Buffer.from(ciphertext).toString('base64'),
    v: 2
  };
}

export async function decryptData(stored, pin) {
  // Multi-variant fallback matching web wallet
  const variants = [
    async () => {
      const key = await pinToKey(pin, 'qntmex_salt_2026');
      const iv = Buffer.from(stored.iv, 'base64');
      const data = Buffer.from(stored.data, 'base64');
      const dec = await globalThis.crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, data);
      return JSON.parse(new TextDecoder().decode(dec));
    },
    async () => {
      const key = await pinToKey(pin, 'qntmex_v2');
      const iv = Buffer.from(stored.iv, 'base64');
      const data = Buffer.from(stored.data, 'base64');
      const dec = await globalThis.crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, data);
      return JSON.parse(new TextDecoder().decode(dec));
    },
  ];
  for (const fn of variants) {
    try { return await fn(); } catch (_) {}
  }
  throw new Error('Decryption failed');
}
