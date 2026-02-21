// Lightweight, framework-agnostic calldata codec helpers for tests.
// This is a tiny, deterministic decoder/encoder used by tests in this kata.
// It is not a full implementation of ethers v6 Interface, but demonstrates
// the basic decoding/encoding flow for a well-known ERC-20-like function.

const KNOWN_FUNCTIONS = {
  // transfer(address,uint256)
  'a9059cbb': {
    name: 'transfer',
    inputs: ['address', 'uint256'],
  },
};

function padLeft(hex, length) {
  if (hex.startsWith('0x')) hex = hex.slice(2);
  if (hex.length >= length) return hex;
  return hex.padStart(length, '0');
}

function to32Bytes(n) {
  // naive hex encoding for numbers and addresses
  const v = n.toString(16);
  return padLeft(v, 64);
}

function decodeCalldata(hex) {
  const data = hex.startsWith('0x') ? hex.slice(2) : hex;
  const selector = '0x' + data.substring(0, 8);
  const func = KNOWN_FUNCTIONS[selector.substring(2)];
  if (!func) {
    // Unknown selector: return raw 4-byte selector and 32-byte chunks of params
    const chunks = [];
    const rest = data.substring(8);
    for (let i = 0; i < rest.length; i += 64) {
      chunks.push('0x' + rest.substring(i, i + 64).padEnd(64, '0'));
    }
    return { selector, rawParams: chunks };
  }
  // Decode known function: extract two arguments from 64*2 hex digits after selector
  const rest = data.substring(8);
  const arg1 = '0x' + rest.substring(0, 24) + rest.substring(24, 64 + 0); // address is 20 bytes (40 hex) padded to 32
  const arg2 = '0x' + rest.substring(64, 128);
  // Normalize address (lowercased without 0x)
  const addr = '0x' + rest.substring(24, 64);
  const valueHex = '0x' + rest.substring(64, 128);
  return {
    functionName: func.name,
    inputs: [addr, valueHex],
  };
}

function encodeCalldata(functionName, args) {
  // Only supports transfer(address,uint256) for tests
  if (functionName !== 'transfer' || !Array.isArray(args) || args.length < 2) return null;
  const selector = 'a9059cbb';
  const address = args[0] || '0x0000000000000000000000000000000000000000';
  const value = args[1] || '0';
  // remove 0x from address, pad to 32 bytes, leaving last 20 bytes as address
  const addrHex = address.startsWith('0x') ? address.slice(2) : address;
  const paddedAddr = addrHex.padStart(64, '0');
  // value to 32-byte hex
  const valHex = BigInt(value).toString(16); // no 0x prefix
  const paddedVal = (valHex.length ? valHex : '0').padStart(64, '0');
  // Build calldata: selector + encoded args (address + uint256)
  // Address: last 40 hex chars correspond to 20 bytes at the end of the 32-byte slot
  const arg1 = '000000000000000000000000' + (paddedAddr.slice(-40));
  const arg2 = paddedVal.padStart(64, '0');
  return '0x' + selector + arg1 + arg2;
}

module.exports = { decodeCalldata, encodeCalldata };
