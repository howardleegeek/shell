// Public calldata codec API re-exporting wrappers around the internal utils.
// This file provides a stable API expected by the frontend components and tests.

import { decodeCalldata as decodeCalldataImpl, encodeCalldata as encodeCalldataImpl, lookupSelector } from '../utils/calldata'

export type AbiFunction = {
  name: string
  inputs?: { name?: string; type: string }[]
  type?: string
}

type DecodeImpl = {
  functionName?: string
  inputs?: any[]
  selector?: string
  raw?: string
  error?: string
}

// Decode calldata using optional ABI. Normalize to the frontend-friendly shape.
// Returns { functionName, args, selector } on success, or { raw/selector/error } on failure.
export function decodeCalldata(hex: string, abiJson?: any[]): { functionName?: string; args?: any[]; selector?: string; raw?: string; error?: string } {
  const res: DecodeImpl = decodeCalldataImpl(hex, abiJson)
  if (res?.functionName) {
    // Normalize to the shape used by the UI/tests: functionName + args
    return {
      functionName: res.functionName,
      args: res.inputs,
      selector: res.selector,
    }
  }
  // If no functionName, forward the rest as-is for error/unknown cases
  return {
    selector: res?.selector,
    raw: res?.raw,
    error: res?.error,
  }
}

// Encode calldata given function name, args, and ABI. The wrapper accepts
// (functionName, args, abi) to match tests and existing UI code.
export function encodeCalldata(functionName: string, args: any[], abiJson?: any[]): string {
  return encodeCalldataImpl(abiJson as any, functionName, args)
}

// 4-byte selector lookup helper (wrapper around the internal lookupSelector).
// Returns an array of possible signatures/snippets for the given selector.
export async function lookup4byte(selector: string): Promise<string[]> {
  const signature = await (async () => {
    try {
      const s = await lookupSelector(selector)
      return s ? [s] : []
    } catch {
      return []
    }
  })()
  return signature
}
