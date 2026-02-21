import { Interface } from 'ethers';

export type AbiInput = { name?: string; type: string };
export type AbiFunction = {
  name: string;
  inputs: AbiInput[];
  outputs?: AbiInput[];
  stateMutability?: string;
  type?: string;
};

export type DecodeResult = {
  functionName?: string;
  selector?: string;
  args?: any;
  raw?: string[]; // raw 32-byte chunks when ABI not available
};

// Decode calldata using optional ABI
export function decodeCalldata(calldataHex: string, abi?: AbiFunction[]): DecodeResult {
  if (!calldataHex) return {};
  const data = calldataHex.startsWith('0x') ? calldataHex : '0x' + calldataHex;
  const selector = data.substring(0, 10); // 4 bytes
  const rest = data.substring(10);

  if (!abi || abi.length === 0) {
    // Fallback: show raw 32-byte chunks
    const chunks: string[] = [];
    for (let i = 0; i < rest.length; i += 64) {
      chunks.push('0x' + rest.substring(i, i + 64).padEnd(64, '0'));
    }
    return { selector, raw: chunks };
  }

  // Build interface
  const iface = new Interface(abi as any);
  // Try to resolve function by selector
  let frag: any = null;
  try {
    frag = iface.getFunction(selector);
  } catch {
    frag = null;
  }
  if (!frag) {
    // Could not resolve; return raw
    const chunks: string[] = [];
    for (let i = 0; i < rest.length; i += 64) {
      chunks.push('0x' + rest.substring(i, i + 64).padEnd(64, '0'));
    }
    return { selector, raw: chunks };
  }
  try {
    const decoded = iface.decodeFunctionData(frag, data);
    // decoded can be an array-like with named keys; return as is
    return { selector, functionName: frag.name, args: decoded };
  } catch {
    // decoding failed; fall back to raw
    const chunks: string[] = [];
    for (let i = 0; i < rest.length; i += 64) {
      chunks.push('0x' + rest.substring(i, i + 64).padEnd(64, '0'));
    }
    return { selector, raw: chunks };
  }
}

// Encode calldata given function name and arguments, using ABI
export function encodeCalldata(functionName: string, args: any[], abi?: AbiFunction[]): string {
  if (!abi || abi.length === 0) {
    throw new Error('ABI is required to encode calldata');
  }
  const iface = new Interface(abi as any);
  // Resolve function fragment by name
  let frag: any = null;
  try {
    frag = iface.getFunction(functionName);
  } catch {
    frag = null;
  }
  if (!frag) {
    const candidate = (abi as any[]).find((f) => f.name === functionName);
    if (candidate) frag = iface.getFunction(candidate.name);
  }
  if (!frag) {
    throw new Error(`Function ${functionName} not found in ABI`);
  }
  return iface.encodeFunctionData(frag, args);
}

// Very small 4-byte selector lookup helper (optional)
export async function lookup4byte(selector: string): Promise<string[]> {
  const s = selector.startsWith('0x') ? selector : '0x' + selector;
  try {
    const res = await fetch(`https://www.4byte.directory/api/v1/signatures/?hex_signature=${s}`);
    if (!res.ok) return [];
    const json = await res.json();
    return (json?.results || []).map((r: any) => r.text_signature).filter(Boolean);
  } catch {
    return [];
  }
}
