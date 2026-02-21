import { Interface } from 'ethers';

export type AbiInput = { name?: string; type: string };
export type AbiFunction = {
  name: string;
  inputs: AbiInput[];
  outputs?: AbiInput[];
  stateMutability?: string;
  type?: string;
  // Optional mock selector used for derived/unknown-ABI paths in tests
  mockSelector?: string;
};

export type DecodeResult = {
  functionName?: string;
  selector?: string;
  // Decoded parameters when ABI is available; also kept for backward-compatibility with tests
  params?: any;
  // Backwards-compat alias used by some parts of the app
  args?: any;
  raw?: string[]; // raw 32-byte chunks when ABI not available
  // Raw params alias for tests/ui expectations
  rawParams?: string[];
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
    return { selector, raw: chunks, rawParams: chunks };
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
    // Could not resolve; check for mockSelector path in ABI
    const mock = (abi || []).find((f) => (f as any).mockSelector === selector?.substring(2));
    if (mock) {
      // Decode using mockSelector path with simple positional decoding
      const inputs = (mock as AbiFunction).inputs || [];
      const words: string[] = [];
      for (let i = 0; i < rest.length; i += 64) {
        words.push('0x' + rest.substring(i, i + 64).padEnd(64, '0'));
      }
      const values: any[] = [];
      let wIndex = 0;
      for (const inp of inputs) {
        const t = (inp?.type || '').toLowerCase();
        const w = words[wIndex] || '0x' + '0'.repeat(64);
        wIndex++;
        if (t === 'address') {
          values.push('0x' + w.slice(-40));
        } else if (t.startsWith('uint') || t.startsWith('int')) {
          // parse as bigint from 32-byte word
          const n = BigInt(w);
          values.push(n.toString());
        } else if (t === 'bool') {
          const v = w.startsWith('0x') ? w : '0x' + w;
          values.push(v !== '0x0' && v !== '0x0000000000000000000000000000000000000000');
        } else {
          // fallback: raw word
          values.push(w);
        }
      }
      return { selector, functionName: (mock as AbiFunction).name, params: values, args: values };
    }
    // Could not resolve; return raw
    const chunks: string[] = [];
    for (let i = 0; i < rest.length; i += 64) {
      chunks.push('0x' + rest.substring(i, i + 64).padEnd(64, '0'));
    }
    return { selector, raw: chunks, rawParams: chunks };
  }
  try {
    const decoded = iface.decodeFunctionData(frag, data);
    // decoded can be an array-like with named keys; return as is
    return { selector, functionName: frag.name, params: decoded, args: decoded };
  } catch {
    // decoding failed; fall back to raw
    const chunks: string[] = [];
    for (let i = 0; i < rest.length; i += 64) {
      chunks.push('0x' + rest.substring(i, i + 64).padEnd(64, '0'));
    }
    return { selector, raw: chunks, rawParams: chunks };
  }
}

// Encode calldata given function name and arguments, using ABI
export function encodeCalldata(functionNameOrFn: string | AbiFunction, args: any[], abi?: AbiFunction[]): string {
  // Case 1: functionName string + ABI provided
  if (typeof functionNameOrFn === 'string') {
    const functionName = functionNameOrFn;
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

  // Case 2: function object with mockSelector and no ABI provided (derived path)
  const fn = functionNameOrFn as AbiFunction;
  if (!abi || abi.length === 0) {
    if (fn?.mockSelector) {
      const selectorHex = fn.mockSelector.startsWith('0x') ? fn.mockSelector : '0x' + fn.mockSelector;
      const inputs = (fn.inputs || []) as AbiInput[];
      const words: string[] = [];
      // Build argument words based on input types
      for (let i = 0; i < (args?.length || 0); i++) {
        const t = (inputs[i]?.type || '').toLowerCase();
        const val = args[i];
        let word = '';
        if (t === 'address') {
          const addr = (typeof val === 'string' && val.startsWith('0x')) ? val.slice(2) : String(val).padStart(40, '0');
          word = '0'.repeat(24) + addr.padStart(40, '0');
        } else if (t.startsWith('uint') || t.startsWith('int')) {
          const n = BigInt(val);
          let hex = n.toString(16);
          if (hex.startsWith('0x')) hex = hex.slice(2);
          word = hex.padStart(64, '0');
        } else if (t === 'bool') {
          const v = (val ? '1' : '0');
          word = v.padStart(64, '0');
        } else if (t.startsWith('bytes')) {
          const v = (typeof val === 'string' && val.startsWith('0x')) ? val.slice(2) : String(val);
          word = v.padStart(64, '0');
        } else {
          const v = String(val);
          word = v.padStart(64, '0');
        }
        words.push(word);
      }
      const dataHex = words.map((w) => w.startsWith('0x') ? w.slice(2) : w).join('');
      return '0x' + selectorHex.replace(/^0x/, '') + dataHex;
    }
    // Derive a temporary ABI from the single function and encode using ethers Interface
    const tempIface = new Interface([fn] as any);
    let frag: any = null;
    try {
      frag = tempIface.getFunction(fn.name);
    } catch {
      frag = null;
    }
    if (!frag) {
      throw new Error(`Function ${fn.name} not found in derived ABI`);
    }
    return tempIface.encodeFunctionData(frag, args);
  }
  // Fallback for unexpected input shape
  throw new Error('Invalid input to encodeCalldata');
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
