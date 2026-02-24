import {
  addUploadHistory,
  clearUploadHistory,
  getUserUploadApiKeys,
  ipfsProvider,
  saveUserUploadApiKeys,
  setIpfsProvider,
  uploadHistory,
  uploadStatus,
  uploadToDecentralizedStorage,
} from './ipfs';

describe('ipfs store', () => {
  beforeEach(() => {
    localStorage.clear();
    document.cookie = 'apiKeys=; path=/; max-age=0';
    clearUploadHistory();
    uploadStatus.set('idle');
    ipfsProvider.set('pinata');
    (global as any).fetch = undefined;
  });

  test('persists provider and upload history', () => {
    setIpfsProvider('arweave');
    addUploadHistory({
      cid: 'abc123',
      filename: 'index.html',
      size: 1200,
      timestamp: 1700000000,
      provider: 'arweave',
    });

    expect(ipfsProvider.get()).toBe('arweave');
    expect(uploadHistory.get().length).toBe(1);
    expect(localStorage.getItem('ipfs_provider')).toBe('arweave');
    expect(localStorage.getItem('ipfs_upload_history')).toContain('abc123');
  });

  test('reads and writes upload api keys in user settings cookie', () => {
    saveUserUploadApiKeys({
      PINATA_JWT: 'jwt-token',
      BUNDLR_API_KEY: 'bundlr-token',
    });

    const keys = getUserUploadApiKeys();
    expect(keys.PINATA_JWT).toBe('jwt-token');
    expect(keys.BUNDLR_API_KEY).toBe('bundlr-token');
  });

  test('uploads to pinata and records history', async () => {
    saveUserUploadApiKeys({ PINATA_JWT: 'jwt-token' });
    (global as any).fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ IpfsHash: 'QmCID123' }),
    });

    const file = new File(['hello'], 'hello.txt', { type: 'text/plain' });
    const result = await uploadToDecentralizedStorage(file, 'pinata');

    expect(result.cid).toBe('QmCID123');
    expect(uploadStatus.get()).toBe('done');
    expect(uploadHistory.get()[0]?.cid).toBe('QmCID123');
    expect((global as any).fetch).toHaveBeenCalled();
  });
});
