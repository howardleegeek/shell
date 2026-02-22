'use strict';

function parseJson(value, label) {
  try {
    return JSON.parse(value);
  } catch (error) {
    throw new Error(`Invalid ${label}: ${error instanceof Error ? error.message : String(error)}`);
  }
}

function normalizeAbi(abi) {
  if (!Array.isArray(abi)) {
    throw new Error('ABI must be an array');
  }

  return abi.filter((entry) => entry && typeof entry === 'object' && typeof entry.type === 'string');
}

function importAbiFromJson(text) {
  const parsed = parseJson(text, 'ABI JSON');
  return normalizeAbi(parsed);
}

function extractAbiFromCompilerOutput(textOrObject) {
  const output = typeof textOrObject === 'string' ? parseJson(textOrObject, 'compiler output') : textOrObject;

  if (Array.isArray(output?.abi)) {
    return normalizeAbi(output.abi);
  }

  if (Array.isArray(output?.output?.abi)) {
    return normalizeAbi(output.output.abi);
  }

  if (output?.contracts && typeof output.contracts === 'object') {
    for (const sourceFile of Object.values(output.contracts)) {
      if (!sourceFile || typeof sourceFile !== 'object') {
        continue;
      }

      for (const contractArtifact of Object.values(sourceFile)) {
        if (Array.isArray(contractArtifact?.abi)) {
          return normalizeAbi(contractArtifact.abi);
        }
      }
    }
  }

  throw new Error('No ABI found in compiler output');
}

function getSignature(entry) {
  const inputTypes = (entry.inputs || []).map((item) => item.type || 'unknown').join(',');
  return `${entry.name || 'anonymous'}(${inputTypes})`;
}

function summarizeEntry(entry) {
  return {
    name: entry.name || 'anonymous',
    signature: getSignature(entry),
    inputs: entry.inputs || [],
    outputs: entry.outputs || [],
    stateMutability: entry.stateMutability || 'nonpayable',
    type: entry.type,
  };
}

function groupAbiEntries(abi) {
  const entries = normalizeAbi(abi);
  const groups = { functions: [], events: [], errors: [] };

  for (const entry of entries) {
    if (entry.type === 'function') {
      groups.functions.push(summarizeEntry(entry));
    } else if (entry.type === 'event') {
      groups.events.push(summarizeEntry(entry));
    } else if (entry.type === 'error') {
      groups.errors.push(summarizeEntry(entry));
    }
  }

  return groups;
}

function toEntryMap(abi) {
  const map = new Map();
  for (const entry of normalizeAbi(abi)) {
    if (!entry.name) {
      continue;
    }
    map.set(`${entry.type}:${getSignature(entry)}`, entry);
  }
  return map;
}

function toNameBuckets(abi) {
  const buckets = new Map();

  for (const entry of normalizeAbi(abi)) {
    if (!entry.name) {
      continue;
    }

    const key = `${entry.type}:${entry.name}`;
    const list = buckets.get(key) || [];
    list.push(entry);
    buckets.set(key, list);
  }

  return buckets;
}

function diffAbis(oldAbi, newAbi) {
  const previous = toEntryMap(oldAbi);
  const next = toEntryMap(newAbi);
  const previousBuckets = toNameBuckets(oldAbi);
  const nextBuckets = toNameBuckets(newAbi);

  const added = [];
  const removed = [];
  const modified = [];

  for (const [key, value] of next.entries()) {
    if (!previous.has(key)) {
      added.push(summarizeEntry(value));
    }
  }

  for (const [key, value] of previous.entries()) {
    if (!next.has(key)) {
      removed.push(summarizeEntry(value));
    }
  }

  for (const [bucketKey, olderList] of previousBuckets.entries()) {
    const newerList = nextBuckets.get(bucketKey);
    if (!newerList) {
      continue;
    }

    const before = olderList.map(getSignature).sort().join('|');
    const after = newerList.map(getSignature).sort().join('|');
    if (before !== after) {
      modified.push({
        name: bucketKey.split(':')[1],
        type: bucketKey.split(':')[0],
        before: olderList.map(summarizeEntry),
        after: newerList.map(summarizeEntry),
      });
    }
  }

  const breakingChanges = [];
  for (const entry of removed) {
    if (entry.type === 'function' || entry.type === 'error') {
      breakingChanges.push(`Removed ${entry.type} ${entry.signature}`);
    }
  }
  for (const change of modified) {
    if (change.type === 'function') {
      breakingChanges.push(`Changed function ${change.name} signature`);
    }
  }

  return {
    added,
    removed,
    modified,
    compatibility: {
      backwardCompatible: breakingChanges.length === 0,
      breakingChanges,
    },
  };
}

async function inferAbiFromBytecode(bytecode, options = {}) {
  if (!bytecode || typeof bytecode !== 'string') {
    throw new Error('Bytecode is required');
  }

  if (typeof options.whatsabiInfer === 'function') {
    const inferred = await options.whatsabiInfer(bytecode);
    return normalizeAbi(inferred);
  }

  let whatsabiLib;
  try {
    whatsabiLib = await import('whatsabi');
  } catch {
    throw new Error('WhatsABI package not available. Pass options.whatsabiInfer or install whatsabi.');
  }

  const inferFn =
    whatsabiLib.inferAbi ||
    whatsabiLib.abiFromBytecode ||
    whatsabiLib.default?.inferAbi ||
    whatsabiLib.default?.abiFromBytecode;

  if (typeof inferFn !== 'function') {
    throw new Error('WhatsABI does not expose an infer function');
  }

  const inferred = await inferFn(bytecode);
  return normalizeAbi(inferred);
}

async function fetchAbiFromAddress(address, options = {}) {
  if (!address || typeof address !== 'string') {
    throw new Error('Contract address is required');
  }

  const fetchImpl = options.fetchImpl || globalThis.fetch;
  if (typeof fetchImpl !== 'function') {
    throw new Error('Fetch is not available');
  }

  const chainId = options.chainId || '1';

  const sourcifyUrl = options.sourcifyUrl ||
    `https://repo.sourcify.dev/contracts/full_match/${chainId}/${address}/metadata.json`;
  const sourcifyResp = await fetchImpl(sourcifyUrl);
  if (sourcifyResp && sourcifyResp.ok) {
    const metadata = await sourcifyResp.json();
    if (Array.isArray(metadata?.output?.abi)) {
      return normalizeAbi(metadata.output.abi);
    }
  }

  const etherscanApiKey = options.etherscanApiKey;
  const etherscanUrl = options.etherscanUrl || (
    `https://api.etherscan.io/api?module=contract&action=getabi&address=${address}` +
    `${etherscanApiKey ? `&apikey=${etherscanApiKey}` : ''}`
  );
  const etherscanResp = await fetchImpl(etherscanUrl);
  if (etherscanResp && etherscanResp.ok) {
    const body = await etherscanResp.json();
    if (body?.status === '1' && typeof body.result === 'string') {
      return normalizeAbi(parseJson(body.result, 'Etherscan ABI'));
    }
  }

  throw new Error(`Unable to fetch ABI for ${address}`);
}

function exportAbiJson(abi) {
  return JSON.stringify(normalizeAbi(abi), null, 2);
}

function solidityTypeToTs(type) {
  if (!type) {
    return 'unknown';
  }

  if (type.endsWith('[]')) {
    return `${solidityTypeToTs(type.slice(0, -2))}[]`;
  }
  if (type.startsWith('uint') || type.startsWith('int')) {
    return 'bigint';
  }
  if (type === 'address') {
    return '`0x${string}`';
  }
  if (type === 'bool') {
    return 'boolean';
  }
  if (type.startsWith('bytes') || type === 'string') {
    return 'string';
  }
  if (type === 'tuple') {
    return 'Record<string, unknown>';
  }

  return 'unknown';
}

function exportTypeScriptTypes(abi, options = {}) {
  const entries = normalizeAbi(abi).filter((item) => item.type === 'function');
  const interfaceName = options.interfaceName || 'ContractAbi';

  const lines = [`export interface ${interfaceName} {`];
  for (const fn of entries) {
    const args = (fn.inputs || [])
      .map((item, index) => `${item.name || `arg${index}`}: ${solidityTypeToTs(item.type)}`)
      .join(', ');
    const returnType = (fn.outputs || []).length
      ? (fn.outputs || []).map((item) => solidityTypeToTs(item.type)).join(' | ')
      : 'void';
    lines.push(`  ${fn.name}(${args}): Promise<${returnType}>;`);
  }
  lines.push('}');

  return lines.join('\n');
}

function exportEthersInterface(abi, options = {}) {
  const abiVarName = options.abiVarName || 'abi';
  return [
    `export const ${abiVarName} = ${exportAbiJson(abi)} as const;`,
    "import { Interface } from 'ethers';",
    `export const ${abiVarName}Interface = new Interface(${abiVarName});`,
  ].join('\n');
}

function exportViemAbi(abi, options = {}) {
  const abiVarName = options.abiVarName || 'abi';
  return `export const ${abiVarName} = ${exportAbiJson(abi)} as const;`;
}

function extractAnchorIdlFromArtifacts(files) {
  if (!files || typeof files !== 'object') {
    throw new Error('Anchor project artifacts are required');
  }

  for (const [path, content] of Object.entries(files)) {
    if (!path.includes('target/idl/') || !path.endsWith('.json')) {
      continue;
    }

    const parsed = typeof content === 'string' ? parseJson(content, `Anchor IDL ${path}`) : content;
    if (parsed && parsed.instructions && parsed.accounts) {
      return parsed;
    }
  }

  throw new Error('No Anchor IDL file found in target/idl');
}

function viewAnchorIdl(idl) {
  if (!idl || typeof idl !== 'object') {
    throw new Error('Invalid Anchor IDL');
  }

  return {
    name: idl.name || 'unknown',
    instructions: Array.isArray(idl.instructions) ? idl.instructions : [],
    accounts: Array.isArray(idl.accounts) ? idl.accounts : [],
    types: Array.isArray(idl.types) ? idl.types : [],
    events: Array.isArray(idl.events) ? idl.events : [],
  };
}

module.exports = {
  diffAbis,
  exportAbiJson,
  exportEthersInterface,
  exportTypeScriptTypes,
  exportViemAbi,
  extractAbiFromCompilerOutput,
  extractAnchorIdlFromArtifacts,
  fetchAbiFromAddress,
  getSignature,
  groupAbiEntries,
  importAbiFromJson,
  inferAbiFromBytecode,
  normalizeAbi,
  viewAnchorIdl,
};
