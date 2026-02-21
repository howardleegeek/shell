// Calldata encode/decode utilities using ethers v6
// The utilities support decoding with an ABI (best effort) and encoding by function signature.
// - decodeCalldata(hex, abiJson) -> { functionName?: string; inputs?: any[]; selector?: string; raw?: string; }
// - encodeCalldata(abiJson, functionSignature, args[]) -> string
import { Interface, AbiFunctionFragment, BigNumber, keccak256, toUtf8Bytes, AbiCoder } from 'ethers'

export type DecodeResult = {
  functionName?: string
  inputs?: any[]
  selector?: string
  raw?: string
  error?: string
}

// Build a map of selector -> function fragment for quick lookup
function buildFunctionMap(abi: any[]): Array<{ name: string; inputs: { name: string; type: string }[]; selector: string; fragment: AbiFunctionFragment }> {
  const map: Array<{ name: string; inputs: { name: string; type: string }[]; selector: string; fragment: AbiFunctionFragment }> = []
  if (!abi) return map
  // Build a temporary interface to assist with type extraction
  const fakeIface = new Interface(abi as any)
  // Iterate through abi to extract function fragments
  for (const f of abi) {
    if (f.type !== 'function') continue
    const inputs: any[] = f.inputs || []
    const signature = `${f.name}(${inputs.map(i => i.type).join(',')})`
    // Compute selector (first 4 bytes of keccak256 of signature)
    // In ethers v6, keccak256 and toUtf8Bytes are available.
    let selector = ''
    try {
      const hash = keccak256(toUtf8Bytes(signature))
      selector = hash.substring(0, 10) // 0x + 8 hex chars
    } catch {
      // fallback: try to rely on Interface parsing if available
      try {
        const frag = fakeIface.getFunction(signature)
        selector = frag ? frag.format() : ''
      } catch {
        selector = ''
      }
    }
    map.push({ name: f.name, inputs, selector, fragment: fakeIface.getFunction(signature) as AbiFunctionFragment })
  }
  return map
}

export function decodeCalldata(hex: string, abiJson?: any[]): DecodeResult {
  try {
    const data = hex.startsWith('0x') ? hex : '0x' + hex
    const selector = data.substring(0, 10)

    if (!abiJson || !Array.isArray(abiJson) || abiJson.length === 0) {
      return { selector, raw: data }
    }

    const funcMap = buildFunctionMap(abiJson)
    // Try to match by selector
    const match = funcMap.find(m => m.selector === selector)
    if (!match) {
      // Unknown selector; return raw payload
      return { selector, raw: data }
    }
    const types = (match.inputs || []).map((i: any) => i.type)
    // Payload is after the first 4 bytes
    const payload = '0x' + data.slice(10).replace(/^0x/, '')
    // Use AbiCoder to decode
    const coder = new AbiCoder()
    const decoded = coder.decode(types, payload) as any[]
    // Normalize BigNumber to string for easier testing
    const normalized = decoded.map(v => (BigNumber.isBigNumber(v) ? v.toString() : v))
    return { functionName: match.name, inputs: normalized, selector }
  } catch (err: any) {
    return { error: err?.message ?? String(err) }
  }
}

export function encodeCalldata(abiJson: any[], functionName: string, args: any[]): string {
  if (!abiJson || !Array.isArray(abiJson)) throw new Error('Invalid ABI')
  // Find function fragment by name
  const f = abiJson.find((fi: any) => fi.type === 'function' && fi.name === functionName)
  if (!f) throw new Error(`Function ${functionName} not found in ABI`)
  const inputs = f.inputs || []
  const signature = `${f.name}(${inputs.map((i: any) => i.type).join(',')})`
  const iface = new Interface(abiJson as any)
  return iface.encodeFunctionData(signature, args)
}

// Simple helper to fetch 4-byte selector for a given input hex using 4byte.directory (optional feature)
export async function lookupSelector(selector: string): Promise<string | undefined> {
  try {
    const url = `https://www.4byte.directory/api/v1/signatures/?hex_signature=${selector}`
    const res = await fetch(url)
    if (!res.ok) return undefined
    const json = await res.json()
    const results = json?.results as Array<{ text_signature?: string }>
    if (Array.isArray(results) && results.length > 0) {
      return results[0].text_signature
    }
  } catch {
    // ignore network errors
  }
  return undefined
}
