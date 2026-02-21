import { atom } from 'nanostores';
import type { GitStatus, GitFileStatus, GitDiff, GitCommit } from '~/types/Git';
import { logStore } from './logs';

// Initialize with stored connection or defaults
const storedGitState = typeof window !== 'undefined' ? localStorage.getItem('git_state') : null;
const initialGitState: GitState = storedGitState
  ? JSON.parse(storedGitState)
  : {
      currentRepo: null,
      status: null,
      stagedFiles: [],
      unstagedFiles: [],
      currentBranch: 'main',
      allBranches: ['main'],
      isGitEnabled: false,
      isLoading: false,
      error: null,
    };

export const gitState = atom<GitState>(initialGitState);
export const isGitLoading = atom<boolean>(false);
export const gitError = atom<string | null>(null);

export interface GitState {
  currentRepo: string | null;
  status: GitStatus | null;
  stagedFiles: string[];
  unstagedFiles: string[];
  currentBranch: string;
  allBranches: string[];
  isGitEnabled: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface GitStatus {
  files: GitFileStatus[];
  branch: string;
  ahead: number;
  behind: number;
  hasUnstagedChanges: boolean;
  hasStagedChanges: boolean;
}

export interface GitFileStatus {
  path: string;
  status: 'added' | 'modified' | 'deleted' | 'renamed' | 'copied' | 'unchanged';
  oldPath?: string;
  staged: boolean;
}

export interface GitDiff {
  oldPath: string;
  newPath: string;
  hunks: GitDiffHunk[];
}

export interface GitDiffHunk {
  oldStart: number;
  oldLines: number;
  newStart: number;
  newLines: number;
  lines: string[];
}

export interface GitCommit {
  message: string;
  files: string[];
  author?: string;
}

// Function to initialize Git state
export async function initializeGitState() {
  try {
    isGitLoading.set(true);
    
    const currentState = gitState.get();
    
    // Check if we're in a git repository
    const isRepo = await checkIsGitRepo();
    
    if (isRepo) {
      // Get current status
      const status = await getGitStatus();
      const branches = await getGitBranches();
      
      updateGitState({
        currentRepo: window.location.pathname,
        status,
        stagedFiles: status?.files.filter(f => f.staged).map(f => f.path) || [],
        unstagedFiles: status?.files.filter(f => !f.staged).map(f => f.path) || [],
        currentBranch: status?.branch || 'main',
        allBranches: branches || ['main'],
        isGitEnabled: true,
        isLoading: false,
        error: null,
      });
      
      logStore.logSystem('Git initialized successfully');
    } else {
      updateGitState({
        ...currentState,
        isGitEnabled: false,
        isLoading: false,
        error: null,
      });
    }
  } catch (error) {
    console.error('Error initializing Git state:', error);
    logStore.logError('Failed to initialize Git state', { error });
    
    updateGitState({
      ...gitState.get(),
      isLoading: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  } finally {
    isGitLoading.set(false);
  }
}

export const updateGitState = (updates: Partial<GitState>) => {
  const currentState = gitState.get();
  const newState = { ...currentState, ...updates };
  gitState.set(newState);

  // Persist to localStorage
  if (typeof window !== 'undefined') {
    localStorage.setItem('git_state', JSON.stringify(newState));
  }
};

// Git operations
export async function stageFile(filePath: string) {
  try {
    isGitLoading.set(true);
    
    // Stage the file using isomorphic-git
    await git.add({ fs, dir: getGitDir(), filepath: filePath });
    
    // Update state
    const currentStatus = await getGitStatus();
    updateGitState({
      stagedFiles: currentStatus?.files.filter(f => f.staged).map(f => f.path) || [],
      unstagedFiles: currentStatus?.files.filter(f => !f.staged).map(f => f.path) || [],
      status: currentStatus,
    });
    
    logStore.logSystem(`Staged file: ${filePath}`);
  } catch (error) {
    console.error('Error staging file:', error);
    logStore.logError('Failed to stage file', { error, filePath });
    throw error;
  } finally {
    isGitLoading.set(false);
  }
}

export async function unstageFile(filePath: string) {
  try {
    isGitLoading.set(true);
    
    // Unstage the file using isomorphic-git
    await git.reset({ fs, dir: getGitDir(), filepath: filePath });
    
    // Update state
    const currentStatus = await getGitStatus();
    updateGitState({
      stagedFiles: currentStatus?.files.filter(f => f.staged).map(f => f.path) || [],
      unstagedFiles: currentStatus?.files.filter(f => !f.staged).map(f => f.path) || [],
      status: currentStatus,
    });
    
    logStore.logSystem(`Unstaged file: ${filePath}`);
  } catch (error) {
    console.error('Error unstaging file:', error);
    logStore.logError('Failed to unstage file', { error, filePath });
    throw error;
  } finally {
    isGitLoading.set(false);
  }
}

export async function commitChanges(commit: GitCommit) {
  try {
    isGitLoading.set(true);
    
    // Create commit using isomorphic-git
    await git.commit({
      fs,
      dir: getGitDir(),
      author: {
        name: 'Bolt IDE',
        email: 'ide@bolt.diy',
      },
      message: commit.message,
      staged: true,
    });
    
    // Clear staged files after commit
    updateGitState({
      stagedFiles: [],
      status: await getGitStatus(),
    });
    
    logStore.logSystem(`Committed changes: ${commit.message}`);
    return true;
  } catch (error) {
    console.error('Error committing changes:', error);
    logStore.logError('Failed to commit changes', { error, message: commit.message });
    throw error;
  } finally {
    isGitLoading.set(false);
  }
}

export async function getGitBranches() {
  try {
    const branches = await git.listBranches({ fs, dir: getGitDir() });
    return branches;
  } catch (error) {
    console.error('Error getting branches:', error);
    return [];
  }
}

export async function createBranch(branchName: string) {
  try {
    isGitLoading.set(true);
    
    await git.branch({ fs, dir: getGitDir(), ref: branchName });
    
    const branches = await getGitBranches();
    updateGitState({
      allBranches: branches,
      currentBranch: branchName,
    });
    
    logStore.logSystem(`Created new branch: ${branchName}`);
    return true;
  } catch (error) {
    console.error('Error creating branch:', error);
    logStore.logError('Failed to create branch', { error, branchName });
    throw error;
  } finally {
    isGitLoading.set(false);
  }
}

export async function checkoutBranch(branchName: string) {
  try {
    isGitLoading.set(true);
    
    await git.checkout({ fs, dir: getGitDir(), ref: branchName });
    
    const currentStatus = await getGitStatus();
    updateGitState({
      currentBranch: branchName,
      status: currentStatus,
    });
    
    logStore.logSystem(`Checked out branch: ${branchName}`);
    return true;
  } catch (error) {
    console.error('Error checking out branch:', error);
    logStore.logError('Failed to checkout branch', { error, branchName });
    throw error;
  } finally {
    isGitLoading.set(false);
  }
}

export async function deleteBranch(branchName: string) {
  try {
    isGitLoading.set(true);
    
    await git.deleteBranch({ fs, dir: getGitDir(), ref: branchName });
    
    const branches = await getGitBranches();
    updateGitState({
      allBranches: branches,
    });
    
    logStore.logSystem(`Deleted branch: ${branchName}`);
    return true;
  } catch (error) {
    console.error('Error deleting branch:', error);
    logStore.logError('Failed to delete branch', { error, branchName });
    throw error;
  } finally {
    isGitLoading.set(false);
  }
}

async function checkIsGitRepo() {
  try {
    const gitDir = getGitDir();
    const stats = await git.stat({ fs, dir: gitDir, filepath: '.git' });
    return stats && stats.isDirectory();
  } catch (error) {
    return false;
  }
}

async function getGitStatus() {
  try {
    const status = await git.statusMatrix({ fs, dir: getGitDir() });
    
    const files: GitFileStatus[] = [];
    let branch = 'main';
    
    for (const [path, head, workdir, stage] of status) {
      let fileStatus: 'added' | 'modified' | 'deleted' | 'renamed' | 'copied' | 'unchanged' = 'unchanged';
      
      if (head === 0 && workdir === 1 && stage === 0) {
        fileStatus = 'added';
      } else if (head === 1 && workdir === 0 && stage === 1) {
        fileStatus = 'deleted';
      } else if (head === 1 && workdir === 2 && stage === 1) {
        fileStatus = 'modified';
      } else if (head === 1 && workdir === 2 && stage === 2) {
        fileStatus = 'renamed';
      } else if (head === 1 && workdir === 2 && stage === 3) {
        fileStatus = 'copied';
      }
      
      files.push({
        path,
        status: fileStatus,
        staged: stage === 1,
      });
    }
    
    // Get current branch
    try {
      const refs = await git.listRefs({ fs, dir: getGitDir() });
      const headRef = refs.find(ref => ref.startsWith('refs/heads/'));
      if (headRef) {
        branch = headRef.replace('refs/heads/', '');
      }
    } catch (error) {
      console.warn('Could not determine current branch:', error);
    }
    
    return {
      files,
      branch,
      ahead: 0,
      behind: 0,
      hasUnstagedChanges: files.some(f => !f.staged && f.status !== 'unchanged'),
      hasStagedChanges: files.some(f => f.staged),
    };
  } catch (error) {
    console.error('Error getting git status:', error);
    return null;
  }
}

function getGitDir() {
  // For web container, we need to get the workdir
  // This is a simplified version, in practice you'd need to handle this properly
  return '/workdir';
}

// Initialize isomorphic-git
import git, { type GitAuth } from 'isomorphic-git';
import http from 'isomorphic-git/http/web';
import { webcontainer as webcontainerPromise } from '~/lib/webcontainer';
import { useEffect, useState, type MutableRefObject } from 'react';
import Cookies from 'js-cookie';

let fs: any;
let webcontainer: any;

const lookupSavedPassword = (url: string) => {
  const domain = url.split('/')[2];
  const gitCreds = Cookies.get(`git:${domain}`);

  if (!gitCreds) {
    return null;
  }

  try {
    const { username, password } = JSON.parse(gitCreds || '{}');
    return { username, password };
  } catch (error) {
    console.log(`Failed to parse Git Cookie ${error}`);
    return null;
  }
};

const saveGitAuth = (url: string, auth: GitAuth) => {
  const domain = url.split('/')[2];
  Cookies.set(`git:${domain}`, JSON.stringify(auth));
};

export function useGitOperations() {
  const [ready, setReady] = useState(false);
  const fileData = useRef<Record<string, { data: any; encoding?: string }>>({});
  
  useEffect(() => {
    webcontainerPromise.then((container) => {
      fileData.current = {};
      webcontainer = container;
      fs = getFs(container, fileData);
      setReady(true);
    });
  }, []);

  return { ready, fs };
}

const getFs = (
  webcontainer: any,
  record: MutableRefObject<Record<string, { data: any; encoding?: string }>>,
) => ({
  promises: {
    readFile: async (path: string, options: any) => {
      const encoding = options?.encoding;
      const relativePath = pathUtils.relative('/workdir', path);

      try {
        const result = await webcontainer.fs.readFile(relativePath, encoding);
        return result;
      } catch (error) {
        throw error;
      }
    },
    writeFile: async (path: string, data: any, options: any = {}) => {
      const relativePath = pathUtils.relative('/workdir', path);

      if (record.current) {
        record.current[relativePath] = { data, encoding: options?.encoding };
      }

      try {
        if (data instanceof Uint8Array) {
          const result = await webcontainer.fs.writeFile(relativePath, data);
          return result;
        } else {
          const encoding = options?.encoding || 'utf8';
          const result = await webcontainer.fs.writeFile(relativePath, data, encoding);
          return result;
        }
      } catch (error) {
        throw error;
      }
    },
    // Other fs methods...
  },
});

const pathUtils = {
  dirname: (path: string) => {
    if (!path || !path.includes('/')) {
      return '.';
    }
    path = path.replace(/\/+$/, '');
    return path.split('/').slice(0, -1).join('/') || '/';
  },
  basename: (path: string, ext?: string) => {
    path = path.replace(/\/+$/, '');
    const base = path.split('/').pop() || '';
    if (ext && base.endsWith(ext)) {
      return base.slice(0, -ext.length);
    }
    return base;
  },
  relative: (from: string, to: string): string => {
    if (!from || !to) {
      return '.';
    }
    const normalizePathParts = (p: string) => p.replace(/\/+$/, '').split('/').filter(Boolean);
    const fromParts = normalizePathParts(from);
    const toParts = normalizePathParts(to);
    
    let commonLength = 0;
    const minLength = Math.min(fromParts.length, toParts.length);
    
    for (let i = 0; i < minLength; i++) {
      if (fromParts[i] !== toParts[i]) {
        break;
      }
      commonLength++;
    }
    
    const upCount = fromParts.length - commonLength;
    const remainingPath = toParts.slice(commonLength);
    const relativeParts = [...Array(upCount).fill('..'), ...remainingPath];
    return relativeParts.length === 0 ? '.' : relativeParts.join('/');
  },
};