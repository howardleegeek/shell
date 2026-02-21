import { describe, it, expect } from 'vitest';
import { MetadataEditor, uploadToIpfs, createCollection, batchMint, getCollectionNFTs, previewNFT } from '../lib/nftToolkit';

describe('NFT Toolkit (mock)', () => {
  it('MetadataEditor should manage fields and export JSON', () => {
    const editor = new MetadataEditor({ name: 'Cool NFT', description: 'desc', image: 'img.png' });
    editor.addAttribute({ trait_type: 'Color', value: 'Blue' });
    const json = editor.toJSON();
    expect(json.name).toBe('Cool NFT');
    expect(json.image).toBe('img.png');
    expect(Array.isArray(json.attributes)).toBe(true);
    expect(json.attributes?.[0]).toEqual({ trait_type: 'Color', value: 'Blue' });
  });

  it('uploadToIpfs returns ipfs:// hash', async () => {
    const hash = await uploadToIpfs({ name: 'NFT' });
    expect(typeof hash).toBe('string');
    expect(hash.startsWith('ipfs://')).toBe(true);
  });

  it('collection creation and batch mint', async () => {
    const coll = createCollection('TestCol', 'TC', 0.05);
    expect(coll.name).toBe('TestCol');
    const minted = await batchMint('TestCol', 3, { name: 'Batch NFT' } as any);
    expect(minted.length).toBe(3);
    expect(minted[0].collection).toBe('TestCol');
    expect(typeof minted[0].ipfsHash).toBe('string');
    const all = getCollectionNFTs('TestCol');
    expect(all.length).toBe(3);
  });

  it('previewNFT returns a string', () => {
    const nft = {
      id: 'TestCol-1',
      collection: 'TestCol',
      metadata: { name: 'Preview NFT' } as any,
    } as any;
    const out = previewNFT(nft);
    expect(typeof out).toBe('string');
    expect(out).toContain('Preview NFT');
  });
});
