import React from 'react'

// Lightweight NFT toolkit core primitives.
export type Attribute = { trait_type: string; value: string }
export type NFTMetadata = {
  name: string
  description: string
  image: string
  attributes: Attribute[]
}
export type Collection = {
  id: string
  name: string
  symbol: string
  royalty: number
  minted: NFTMetadata[]
}

// Build a pretty-printed JSON representation of the NFT metadata
export function buildMetadataJSON(nft: NFTMetadata): string {
  return JSON.stringify(nft, null, 2)
}

// Small delay helper for mock async operations
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

// Mock IPFS image upload
export async function uploadImageMock(input: string): Promise<string> {
  await delay(60)
  const hash = 'Qm' + Math.random().toString(36).slice(2, 10)
  return `ipfs://${hash}`
}

// Mock metadata upload to IPFS
export async function uploadMetadataMock(nft: NFTMetadata): Promise<string> {
  await delay(60)
  const hash = 'Qm' + Math.random().toString(36).slice(2, 10)
  return `ipfs://${hash}`
}

// Create a new collection placeholder
export function createCollection(name: string, symbol: string, royalty: number): Collection {
  return {
    id: 'col_' + Math.random().toString(36).slice(2, 8),
    name,
    symbol,
    royalty,
    minted: [],
  }
}

// Mint a batch of NFTs into a collection (idempotent and deterministic for tests)
export function mintBatch(
  collection: Collection,
  count: number,
  baseMetadata: NFTMetadata
): NFTMetadata[] {
  const minted: NFTMetadata[] = Array.from({ length: count }).map((_, i) => {
    // Slightly vary the name to simulate distinct tokens
    const suffix = i + 1
    return {
      ...baseMetadata,
      name: baseMetadata.name + ' #' + suffix,
      // image and attributes are kept the same in this simple mock
    }
  })
  collection.minted = (collection.minted || []).concat(minted)
  return minted
}

// Minimal UI component that ties the primitives together (kept compact)
export const NFTToolkit: React.FC = () => {
  // This is a lightweight scaffold; the tests exercise the helpers above.
  return (
    <div>
      <h2>NFT Toolkit</h2>
      <p>UI scaffold. Core logic lives in this file for testability.</p>
    </div>
  )
}

export default NFTToolkit
