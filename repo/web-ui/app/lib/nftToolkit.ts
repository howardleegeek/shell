// Lightweight NFT toolkit utilities for the in-browser IDE.
// This module provides a tiny, dependency-free in-memory implementation
// of common NFT tooling tasks used by the UI tests:
// - Metadata editor
// - IPFS-like upload (mocked, deterministic hash)
// - Collection management with batch mint
// - Simple NFT preview utility

export interface Attribute {
  trait_type: string;
  value: any;
}

export interface NFTMetadata {
  name: string;
  description?: string;
  image?: string;
  attributes?: Attribute[];
}

// Simple metadata editor with a small API surface.
export class MetadataEditor {
  private _metadata: NFTMetadata;

  constructor(initial?: NFTMetadata) {
    this._metadata = {
      name: initial?.name ?? '',
      description: initial?.description,
      image: initial?.image,
      attributes: initial?.attributes?.slice() ?? [],
    };
  }

  get metadata(): NFTMetadata {
    // expose a read-only view of the internal metadata
    return {
      name: this._metadata.name,
      description: this._metadata.description,
      image: this._metadata.image,
      attributes: this._metadata.attributes?.slice(),
    } as NFTMetadata;
  }

  setName(name: string) {
    this._metadata.name = name;
  }

  setDescription(description: string) {
    this._metadata.description = description;
  }

  setImage(image: string) {
    this._metadata.image = image;
  }

  addAttribute(attr: Attribute) {
    if (!this._metadata.attributes) this._metadata.attributes = [];
    this._metadata.attributes.push(attr);
  }

  toJSON(): NFTMetadata {
    // Return a shallow clone to prevent external mutation
    return {
      name: this._metadata.name,
      description: this._metadata.description,
      image: this._metadata.image,
      attributes: this._metadata.attributes?.slice(),
    } as NFTMetadata;
  }
}

// Very small, deterministic hash function for a mock IPFS hash.
function _simpleHash(input: string): string {
  let h = 0;
  for (let i = 0; i < input.length; i++) {
    h = (h << 5) - h + input.charCodeAt(i);
    h |= 0; // Force 32-bit int
  }
  // Convert to a hex-like string
  const hex = Math.abs(h).toString(16);
  // pad to at least 6 chars for readability
  return hex.padStart(6, '0');
}

// Public API: mock IPFS upload (returns ipfs://mock-hash)
export async function uploadToIpfs(metadata: any, provider?: string): Promise<string> {
  const json = JSON.stringify(metadata ?? {});
  const hash = _simpleHash(json);
  // deterministic for a given input
  return `ipfs://${hash}`;
}

export type MintedNFT = {
  id: string;
  collection: string;
  metadata: NFTMetadata;
  ipfsHash?: string;
};

type CollectionInfo = {
  symbol: string;
  royalty: number;
  minted: MintedNFT[];
};

// In-memory registry of collections
const _collections = new Map<string, CollectionInfo>();

export function createCollection(name: string, symbol: string, royalty: number): { name: string; symbol: string; royalty: number } {
  if (_collections.has(name)) {
    return { name, symbol: _collections.get(name)!.symbol, royalty: _collections.get(name)!.royalty } as any;
  }
  _collections.set(name, { symbol, royalty, minted: [] });
  return { name, symbol, royalty };
}

export async function batchMint(collectionName: string, count: number, baseMetadata?: NFTMetadata): Promise<MintedNFT[]> {
  const col = _collections.get(collectionName);
  if (!col) throw new Error(`Collection ${collectionName} does not exist`);
  const results: MintedNFT[] = [];
  for (let i = 0; i < count; i++) {
    const meta: NFTMetadata = baseMetadata
      ? {
          ...baseMetadata,
          name: baseMetadata.name || `NFT-${collectionName}-${col.minted.length + i + 1}`,
        }
      : { name: `NFT-${collectionName}-${col.minted.length + i + 1}` };
    const nft: MintedNFT = {
      id: `${collectionName}-${col.minted.length + i + 1}`,
      collection: collectionName,
      metadata: meta,
    };
    // Upload metadata to IPFS (mock)
    nft.ipfsHash = await uploadToIpfs(meta);
    col.minted.push(nft);
    results.push(nft);
  }
  return results;
}

export function getCollectionNFTs(collectionName: string): MintedNFT[] {
  const col = _collections.get(collectionName);
  return col?.minted ?? [];
}

// Simple preview helper (string representation used in tests)
export function previewNFT(nft: MintedNFT): string {
  const meta = nft.metadata;
  const attrs = (meta.attributes ?? []).map((a) => `${a.trait_type}:${a.value}`).join(', ');
  return `Preview for ${meta.name} [${attrs}]`;
}
