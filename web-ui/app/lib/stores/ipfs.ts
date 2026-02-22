import { atom } from 'nanostores';

export type IpfsProvider = 'pinata' | 'arweave';
export type UploadStatus = 'idle' | 'uploading' | 'done' | 'error';

export type UploadHistoryEntry = {
  cid: string;
  filename: string;
  size: number;
  timestamp: number;
  provider: IpfsProvider;
};

type UserUploadApiKeys = {
  PINATA_JWT?: string;
  PINATA_API_KEY?: string;
  PINATA_API_SECRET?: string;
  BUNDLR_API_KEY?: string;
};

const HISTORY_KEY = 'ipfs_upload_history';
const PROVIDER_KEY = 'ipfs_provider';
const HISTORY_MAX = 30;
const ONE_YEAR_SECONDS = 31536000;

const isBrowser = typeof window !== 'undefined';

const safeParse = <T>(raw: string | undefined, fallback: T): T => {
  if (!raw) {
    return fallback;
  }

  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
};

const readInitialProvider = (): IpfsProvider => {
  if (!isBrowser) {
    return 'pinata';
  }

  const stored = localStorage.getItem(PROVIDER_KEY);
  return stored === 'arweave' ? 'arweave' : 'pinata';
};

const readInitialHistory = (): UploadHistoryEntry[] => {
  if (!isBrowser) {
    return [];
  }

  const parsed = safeParse<UploadHistoryEntry[]>(localStorage.getItem(HISTORY_KEY) || undefined, []);
  return Array.isArray(parsed) ? parsed : [];
};

const persistProvider = (provider: IpfsProvider) => {
  if (isBrowser) {
    localStorage.setItem(PROVIDER_KEY, provider);
  }
};

const persistHistory = (history: UploadHistoryEntry[]) => {
  if (isBrowser) {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  }
};

const parseCookies = (cookieHeader: string): Record<string, string> => {
  if (!cookieHeader) {
    return {};
  }

  return cookieHeader.split(';').reduce<Record<string, string>>((acc, pair) => {
    const [rawName, ...rest] = pair.split('=');
    const name = rawName?.trim();

    if (!name) {
      return acc;
    }

    acc[decodeURIComponent(name)] = decodeURIComponent(rest.join('='));
    return acc;
  }, {});
};

const pinataHeaders = (keys: UserUploadApiKeys): HeadersInit => {
  if (keys.PINATA_JWT?.trim()) {
    return { Authorization: `Bearer ${keys.PINATA_JWT.trim()}` };
  }

  if (keys.PINATA_API_KEY?.trim() && keys.PINATA_API_SECRET?.trim()) {
    return {
      pinata_api_key: keys.PINATA_API_KEY.trim(),
      pinata_secret_api_key: keys.PINATA_API_SECRET.trim(),
    };
  }

  throw new Error('Missing Pinata credentials. Set PINATA_JWT or PINATA_API_KEY + PINATA_API_SECRET.');
};

export const ipfsProvider = atom<IpfsProvider>(readInitialProvider());
export const uploadStatus = atom<UploadStatus>('idle');
export const uploadHistory = atom<UploadHistoryEntry[]>(readInitialHistory());

ipfsProvider.listen((provider) => {
  persistProvider(provider);
});

uploadHistory.listen((entries) => {
  persistHistory(entries);
});

export const setIpfsProvider = (provider: IpfsProvider) => {
  ipfsProvider.set(provider);
};

export const addUploadHistory = (entry: UploadHistoryEntry) => {
  const next = [entry, ...uploadHistory.get()].slice(0, HISTORY_MAX);
  uploadHistory.set(next);
};

export const clearUploadHistory = () => {
  uploadHistory.set([]);
};

export const getUserUploadApiKeys = (): UserUploadApiKeys => {
  if (!isBrowser) {
    return {};
  }

  const cookies = parseCookies(document.cookie || '');
  const apiKeys = safeParse<Record<string, string>>(cookies.apiKeys, {});

  return {
    PINATA_JWT: apiKeys.PINATA_JWT || '',
    PINATA_API_KEY: apiKeys.PINATA_API_KEY || '',
    PINATA_API_SECRET: apiKeys.PINATA_API_SECRET || '',
    BUNDLR_API_KEY: apiKeys.BUNDLR_API_KEY || '',
  };
};

export const saveUserUploadApiKeys = (keys: UserUploadApiKeys) => {
  if (!isBrowser) {
    return;
  }

  const cookies = parseCookies(document.cookie || '');
  const current = safeParse<Record<string, string>>(cookies.apiKeys, {});
  const next = { ...current, ...keys };
  const cookieValue = encodeURIComponent(JSON.stringify(next));
  document.cookie = `apiKeys=${cookieValue}; path=/; max-age=${ONE_YEAR_SECONDS}; samesite=lax`;
};

const uploadToPinata = async (file: File, keys: UserUploadApiKeys): Promise<string> => {
  const formData = new FormData();
  formData.append('file', file, file.name);
  formData.append('pinataMetadata', JSON.stringify({ name: file.name }));

  const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
    method: 'POST',
    headers: pinataHeaders(keys),
    body: formData,
  });

  if (!response.ok) {
    const details = await response.text();
    throw new Error(`Pinata upload failed (${response.status}): ${details || response.statusText}`);
  }

  const data = (await response.json()) as { IpfsHash?: string; cid?: string };
  const cid = data.IpfsHash || data.cid;

  if (!cid) {
    throw new Error('Pinata response did not include CID');
  }

  return cid;
};

const uploadToBundlr = async (file: File, keys: UserUploadApiKeys): Promise<string> => {
  if (!keys.BUNDLR_API_KEY?.trim()) {
    throw new Error('Missing Bundlr credential. Set BUNDLR_API_KEY.');
  }

  const response = await fetch('https://node1.bundlr.network/tx', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${keys.BUNDLR_API_KEY.trim()}`,
      'Content-Type': file.type || 'application/octet-stream',
      'x-file-name': encodeURIComponent(file.name),
    },
    body: file,
  });

  if (!response.ok) {
    const details = await response.text();
    throw new Error(`Bundlr upload failed (${response.status}): ${details || response.statusText}`);
  }

  const text = await response.text();
  const maybeJson = safeParse<{ id?: string; txId?: string; tx_id?: string }>(text, {});
  const txId = maybeJson.id || maybeJson.txId || maybeJson.tx_id || text.trim();

  if (!txId) {
    throw new Error('Bundlr response did not include transaction id');
  }

  return txId;
};

export const uploadToDecentralizedStorage = async (
  file: File,
  provider: IpfsProvider,
  keys = getUserUploadApiKeys(),
): Promise<UploadHistoryEntry> => {
  uploadStatus.set('uploading');

  try {
    const cid = provider === 'pinata' ? await uploadToPinata(file, keys) : await uploadToBundlr(file, keys);
    const entry: UploadHistoryEntry = {
      cid,
      filename: file.name,
      size: file.size,
      timestamp: Date.now(),
      provider,
    };
    addUploadHistory(entry);
    uploadStatus.set('done');
    return entry;
  } catch (error) {
    uploadStatus.set('error');
    throw error;
  }
};
