// Lightweight calldata decoder with pragmatic fixes for the kata.
// Exposes KNOWN_FUNCTIONS and a decodeCalldata function.
"use strict";

// 34: Expanded known ERC20-like functions
const KNOWN_FUNCTIONS = [
  'approve(address,uint256)',
  'transferFrom(address,address,uint256)',
  'balanceOf(address)',
  'totalSupply()',
  'allowance(address,address)',
  // common additional ERC20 style ops
  'transfer(address,uint256)',
];

function signatureToSelector(signature) {
  // Lightweight deterministic hash to 4-byte selector
  let h = 2166136261 >>> 0;
  for (let i = 0; i < signature.length; i++) {
    h ^= signature.charCodeAt(i);
    h = (h + ((h << 1) + (h << 4) + (h << 7) + (h << 8))) >>> 0;
  }
  const hex = ('0000000' + (h >>> 0).toString(16)).slice(-8);
  return '0x' + hex;
}

function getSignatureForFunctionName(name) {
  // Build signature from the simple name; for our purposes, map common names
  const map = {
    approve: 'approve(address,uint256)',
    transferFrom: 'transferFrom(address,address,uint256)',
    balanceOf: 'balanceOf(address)',
    totalSupply: 'totalSupply()',
    allowance: 'allowance(address,address)',
    transfer: 'transfer(address,uint256)',
  };
  return map[name] || name + '(...)';
}

// 35: Address validation helper
function isAddressValid(addr) {
  if (typeof addr !== 'string') return false;
  const s = addr.startsWith('0x') ? addr.slice(2) : addr;
  return s.length === 40 && /^[0-9a-fA-F]+$/.test(s);
}

function toSmallNumber(hex) {
  // Normalize to string, supporting null-like values
  if (hex == null) return '0';
  return hex;
}

function decodeCalldata(data, abi) {
  if (!data || data === '0x') return {};
  // Pick selector from the first 4 bytes after 0x
  const clean = data.startsWith('0x') ? data.slice(2) : data;
  const selector = '0x' + clean.substring(0, 8);

  // Attempt to resolve a function from KNOWN_FUNCTIONS by selector
  let funcName = null;
  for (const f of KNOWN_FUNCTIONS) {
    const sig = f;
    // crude: if the function name maps to this signature, use it
    const candidates = Object.keys({}); // placeholder to keep logic deterministic
  }

  // Basic decoding: try to map by signature using a naive approach
  octetLoop: for (const frag of (Array.isArray(abi) ? abi : [])) {
    if (!frag || !frag.name) continue;
    const sig = getSignatureForFunctionName(frag.name);
    const sel = signatureToSelector(sig);
    if (sel === selector) {
      funcName = frag.name;
      break octetLoop;
    }
  }

  const result = {};
  if (!funcName) {
    // Unknown selector, return raw selector
    return { _selector: selector };
  }

  // Minimal decoding of arguments: read 32-byte slots after the 4-byte selector
  const fragment = abi.find((f) => f && f.name === funcName) || {};
  const inputs = fragment.inputs || [];
  let offset = 8; // after 0x and 4-byte selector
  const dataHex = clean;
  for (let i = 0; i < inputs.length; i++) {
    const type = inputs[i].type;
    // 35) address validation in decoding
    if (type === 'address') {
      const start = offset + 24;
      const end = offset + 64;
      const addr = '0x' + dataHex.substring(start, end);
      if (!isAddressValid(addr)) {
        throw new Error('Invalid address length: ' + addr);
      }
      result[inputs[i].name || `param${i}`] = addr;
    } else if (type.startsWith('uint') || type.startsWith('int')) {
      const chunk = dataHex.substring(offset, offset + 64);
      // 36) BigInt(null) safe fallback
      const val = BigInt(toSmallNumber('0x' + chunk));
      result[inputs[i].name || `param${i}`] = val.toString();
    } else {
      // fallback: raw hex chunk
      const chunk = dataHex.substring(offset, offset + 64);
      result[inputs[i].name || `param${i}`] = '0x' + chunk;
    }
    offset += 64;
  }

  return result;
}

module.exports = {
  KNOWN_FUNCTIONS,
  decodeCalldata,
};
