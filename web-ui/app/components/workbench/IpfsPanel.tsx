import { useStore } from '@nanostores/react';
import { useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import { workbenchStore } from '~/lib/stores/workbench';
import {
  clearUploadHistory,
  getUserUploadApiKeys,
  ipfsProvider,
  saveUserUploadApiKeys,
  setIpfsProvider,
  uploadHistory,
  uploadStatus,
  uploadToDecentralizedStorage,
  type UploadHistoryEntry,
} from '~/lib/stores/ipfs';
import { classNames } from '~/utils/classNames';

type SourceType = 'editor' | 'build';

const formatSize = (size: number) => {
  if (size < 1024) {
    return `${size} B`;
  }

  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`;
  }

  return `${(size / (1024 * 1024)).toFixed(2)} MB`;
};

const formatTimestamp = (timestamp: number) => {
  return new Date(timestamp).toLocaleString();
};

const gatewayUrl = (entry: UploadHistoryEntry) => {
  if (entry.provider === 'pinata') {
    return `https://ipfs.io/ipfs/${entry.cid}`;
  }

  return `https://arweave.net/${entry.cid}`;
};

const collectDirectoryFiles = async (dirHandle: any): Promise<File[]> => {
  const files: File[] = [];

  for await (const entry of dirHandle.values()) {
    if (entry.kind === 'file') {
      files.push(await entry.getFile());
      continue;
    }

    if (entry.kind === 'directory') {
      const nested = await collectDirectoryFiles(entry);
      files.push(...nested);
    }
  }

  return files;
};

export default function IpfsPanel() {
  const provider = useStore(ipfsProvider);
  const status = useStore(uploadStatus);
  const history = useStore(uploadHistory);
  const filesMap = useStore(workbenchStore.files);

  const [sourceType, setSourceType] = useState<SourceType>('editor');
  const [selectedPath, setSelectedPath] = useState('');
  const [buildFiles, setBuildFiles] = useState<File[]>([]);
  const [progress, setProgress] = useState(0);
  const [lastUploaded, setLastUploaded] = useState<UploadHistoryEntry | null>(null);
  const [apiKeys, setApiKeys] = useState(getUserUploadApiKeys());

  const editorFiles = useMemo(() => {
    return Object.entries(filesMap)
      .filter(([, entry]) => entry?.type === 'file' && !entry.isBinary)
      .map(([path]) => path)
      .sort();
  }, [filesMap]);

  const canUpload = sourceType === 'editor' ? Boolean(selectedPath) : buildFiles.length > 0;

  const handleChooseBuildDirectory = async () => {
    if (!(window as any).showDirectoryPicker) {
      toast.error('Directory picker is not supported in this browser.');
      return;
    }

    try {
      const handle = await (window as any).showDirectoryPicker();
      const files = await collectDirectoryFiles(handle);
      setBuildFiles(files);
      toast.success(`Loaded ${files.length} files from selected directory.`);
    } catch (error) {
      toast.error(`Failed to read build directory: ${(error as Error).message}`);
    }
  };

  const buildEditorFile = (): File | null => {
    const entry = filesMap[selectedPath];

    if (!selectedPath || !entry || entry.type !== 'file' || entry.isBinary) {
      return null;
    }

    const filename = selectedPath.split('/').pop() || 'artifact.txt';
    return new File([entry.content], filename, { type: 'text/plain' });
  };

  const handleSaveApiKeys = () => {
    saveUserUploadApiKeys(apiKeys);
    toast.success('Upload API keys saved to user settings.');
  };

  const handleUpload = async () => {
    const files = sourceType === 'editor' ? [buildEditorFile()].filter(Boolean) as File[] : buildFiles;

    if (files.length === 0) {
      toast.error('No files selected for upload.');
      return;
    }

    setProgress(5);
    setLastUploaded(null);

    try {
      for (let index = 0; index < files.length; index++) {
        const file = files[index];
        setProgress(Math.round((index / files.length) * 90));
        const entry = await uploadToDecentralizedStorage(file, provider, apiKeys);
        setLastUploaded(entry);
        setProgress(Math.round(((index + 1) / files.length) * 100));
      }

      toast.success(`${files.length} file(s) uploaded via ${provider === 'pinata' ? 'Pinata' : 'Arweave'}.`);
    } catch (error) {
      toast.error(`Upload failed: ${(error as Error).message}`);
    }
  };

  return (
    <section className="h-full overflow-auto p-3 space-y-4" aria-label="ipfs-panel">
      <div>
        <h3 className="text-sm font-semibold text-bolt-elements-textPrimary">Decentralized Deploy</h3>
        <p className="text-xs text-bolt-elements-textSecondary">Upload metadata or static files to IPFS or Arweave.</p>
      </div>

      <div className="space-y-2 rounded-lg border border-bolt-elements-borderColor p-3">
        <label className="text-xs font-medium text-bolt-elements-textSecondary">Upload Provider</label>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setIpfsProvider('pinata')}
            className={classNames(
              'px-2 py-1 rounded text-xs border',
              provider === 'pinata'
                ? 'bg-accent-500 text-white border-accent-500'
                : 'bg-bolt-elements-background-depth-1 border-bolt-elements-borderColor',
            )}
          >
            Pinata IPFS
          </button>
          <button
            type="button"
            onClick={() => setIpfsProvider('arweave')}
            className={classNames(
              'px-2 py-1 rounded text-xs border',
              provider === 'arweave'
                ? 'bg-accent-500 text-white border-accent-500'
                : 'bg-bolt-elements-background-depth-1 border-bolt-elements-borderColor',
            )}
          >
            Arweave
          </button>
        </div>
      </div>

      <div className="space-y-2 rounded-lg border border-bolt-elements-borderColor p-3">
        <label className="text-xs font-medium text-bolt-elements-textSecondary">File Source</label>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setSourceType('editor')}
            className={classNames(
              'px-2 py-1 rounded text-xs border',
              sourceType === 'editor'
                ? 'bg-accent-500 text-white border-accent-500'
                : 'bg-bolt-elements-background-depth-1 border-bolt-elements-borderColor',
            )}
          >
            Editor File
          </button>
          <button
            type="button"
            onClick={() => setSourceType('build')}
            className={classNames(
              'px-2 py-1 rounded text-xs border',
              sourceType === 'build'
                ? 'bg-accent-500 text-white border-accent-500'
                : 'bg-bolt-elements-background-depth-1 border-bolt-elements-borderColor',
            )}
          >
            Build Directory
          </button>
        </div>

        {sourceType === 'editor' ? (
          <select
            value={selectedPath}
            onChange={(event) => setSelectedPath(event.target.value)}
            className="w-full rounded border border-bolt-elements-borderColor bg-bolt-elements-background-depth-1 px-2 py-1 text-xs"
          >
            <option value="">Select file from editor</option>
            {editorFiles.map((path) => (
              <option key={path} value={path}>
                {path}
              </option>
            ))}
          </select>
        ) : (
          <div className="space-y-2">
            <button
              type="button"
              onClick={handleChooseBuildDirectory}
              className="w-full rounded border border-bolt-elements-borderColor bg-bolt-elements-background-depth-1 px-2 py-1 text-xs"
            >
              Select Build Directory
            </button>
            <div className="text-xs text-bolt-elements-textSecondary">Loaded files: {buildFiles.length}</div>
          </div>
        )}

        <button
          type="button"
          onClick={handleUpload}
          disabled={!canUpload || status === 'uploading'}
          className={classNames(
            'w-full rounded px-2 py-1.5 text-xs font-medium',
            !canUpload || status === 'uploading'
              ? 'bg-bolt-elements-background-depth-2 text-bolt-elements-textTertiary cursor-not-allowed'
              : 'bg-accent-500 text-white',
          )}
        >
          {status === 'uploading' ? 'Uploading...' : 'Upload'}
        </button>
      </div>

      <div className="space-y-2 rounded-lg border border-bolt-elements-borderColor p-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-bolt-elements-textSecondary">Upload Progress</span>
          <span className="text-xs text-bolt-elements-textSecondary">{progress}%</span>
        </div>
        <div className="h-2 w-full rounded bg-bolt-elements-background-depth-1">
          <div className="h-2 rounded bg-accent-500 transition-all" style={{ width: `${progress}%` }} />
        </div>
        <div className="text-xs text-bolt-elements-textSecondary">Status: {status}</div>
      </div>

      {lastUploaded && (
        <div className="space-y-1 rounded-lg border border-bolt-elements-borderColor p-3">
          <div className="text-xs font-medium text-bolt-elements-textSecondary">Latest Upload</div>
          <div className="text-xs">
            {lastUploaded.provider === 'pinata' ? 'IPFS CID:' : 'Arweave TX ID:'}{' '}
            <code className="break-all">{lastUploaded.cid}</code>
          </div>
          <a
            href={gatewayUrl(lastUploaded)}
            target="_blank"
            rel="noreferrer"
            className="text-xs text-accent-500 hover:underline break-all"
          >
            {gatewayUrl(lastUploaded)}
          </a>
        </div>
      )}

      <div className="space-y-2 rounded-lg border border-bolt-elements-borderColor p-3">
        <div className="text-xs font-medium text-bolt-elements-textSecondary">API Key Settings</div>
        <input
          type="password"
          value={apiKeys.PINATA_JWT || ''}
          onChange={(event) => setApiKeys({ ...apiKeys, PINATA_JWT: event.target.value })}
          placeholder="PINATA_JWT (preferred)"
          className="w-full rounded border border-bolt-elements-borderColor bg-bolt-elements-background-depth-1 px-2 py-1 text-xs"
        />
        <input
          type="password"
          value={apiKeys.PINATA_API_KEY || ''}
          onChange={(event) => setApiKeys({ ...apiKeys, PINATA_API_KEY: event.target.value })}
          placeholder="PINATA_API_KEY"
          className="w-full rounded border border-bolt-elements-borderColor bg-bolt-elements-background-depth-1 px-2 py-1 text-xs"
        />
        <input
          type="password"
          value={apiKeys.PINATA_API_SECRET || ''}
          onChange={(event) => setApiKeys({ ...apiKeys, PINATA_API_SECRET: event.target.value })}
          placeholder="PINATA_API_SECRET"
          className="w-full rounded border border-bolt-elements-borderColor bg-bolt-elements-background-depth-1 px-2 py-1 text-xs"
        />
        <input
          type="password"
          value={apiKeys.BUNDLR_API_KEY || ''}
          onChange={(event) => setApiKeys({ ...apiKeys, BUNDLR_API_KEY: event.target.value })}
          placeholder="BUNDLR_API_KEY"
          className="w-full rounded border border-bolt-elements-borderColor bg-bolt-elements-background-depth-1 px-2 py-1 text-xs"
        />
        <button
          type="button"
          onClick={handleSaveApiKeys}
          className="w-full rounded bg-bolt-elements-background-depth-1 px-2 py-1 text-xs border border-bolt-elements-borderColor"
        >
          Save API Keys
        </button>
      </div>

      <div className="space-y-2 rounded-lg border border-bolt-elements-borderColor p-3">
        <div className="flex items-center justify-between">
          <div className="text-xs font-medium text-bolt-elements-textSecondary">Upload History</div>
          <button
            type="button"
            onClick={clearUploadHistory}
            className="text-xs text-bolt-elements-textSecondary hover:underline"
          >
            Clear
          </button>
        </div>
        <div className="space-y-2 max-h-48 overflow-auto">
          {history.length === 0 && <div className="text-xs text-bolt-elements-textSecondary">No uploads yet.</div>}
          {history.map((entry) => (
            <div key={`${entry.cid}-${entry.timestamp}`} className="rounded border border-bolt-elements-borderColor p-2 text-xs">
              <div className="font-medium">{entry.filename}</div>
              <div className="text-bolt-elements-textSecondary">{entry.provider === 'pinata' ? 'IPFS CID' : 'TX ID'}: {entry.cid}</div>
              <div className="text-bolt-elements-textSecondary">
                {formatSize(entry.size)} • {formatTimestamp(entry.timestamp)}
              </div>
              <a href={gatewayUrl(entry)} target="_blank" rel="noreferrer" className="text-accent-500 hover:underline break-all">
                {gatewayUrl(entry)}
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
