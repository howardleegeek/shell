import { describe, it, expect } from 'vitest'

import {
  buildMetadataJSON,
  uploadImageMock,
  uploadMetadataMock,
  createCollection,
  mintBatch,
  NFTMetadata,
  Attribute,
  Collection,
} from '../web-ui/src/nft-toolkit/NFTToolkit'

describe('NFT Toolkit core helpers', () => {
  it('buildMetadataJSON produces valid JSON with fields', () => {
    const nft: NFTMetadata = {
      name: 'Test NFT',
      description: 'desc',
      image: 'ipfs://image',
      attributes: [{ trait_type: 'rarity', value: 'rare' }],
    }
    const json = buildMetadataJSON(nft)
    expect(json).toContain('"name": "Test NFT"')
    expect(json).toContain('"image": "ipfs://image"')
  })

  it('uploadImageMock returns ipfs:// hash', async () => {
    const res = await uploadImageMock('dummy')
    expect(res).toMatch(/^ipfs:\/\//)
  })

  it('uploadMetadataMock returns ipfs:// hash', async () => {
    const nft: NFTMetadata = { name: 'A', description: '', image: '', attributes: [] }
    const uri = await uploadMetadataMock(nft)
    expect(uri).toMatch(/^ipfs:\/\//)
  })

  it('createCollection initializes fields', () => {
    const c: Collection = createCollection('Demo', 'DM', 10)
    expect(c.name).toBe('Demo')
    expect(c.symbol).toBe('DM')
    expect(c.royalty).toBe(10)
  })

  it('mintBatch appends tokens to collection', () => {
    const c = createCollection('Demo', 'DM', 5)
    const base: NFTMetadata = { name: 'Token', description: '', image: '', attributes: [] }
    const minted = mintBatch(c, 3, base)
    expect(minted).toHaveLength(3)
    expect((c.minted || []).length).toBe(3)
  })
})
