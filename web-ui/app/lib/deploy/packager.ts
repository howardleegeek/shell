import * as fs from 'fs';
import * as path from 'path';

export type VercelPackagedFile = {
  path: string;
  data: string; // base64 encoded
  encoding?: string;
};

export type PackedPayload = {
  files: VercelPackagedFile[];
  builds?: Array<{ src: string; use: string; config?: any }>;
};

// Recursively walk a directory and collect all files as base64 payloads
async function walkDir(baseDir: string, dir: string, accumulator: VercelPackagedFile[]): Promise<void> {
  const full = path.join(baseDir, dir);
  const entries = await fs.promises.readdir(full, { withFileTypes: true });
  for (const e of entries) {
    const relPath = path.posix.join(dir, e.name);
    const absPath = path.join(full, e.name);
    if (e.isDirectory()) {
      await walkDir(baseDir, relPath, accumulator);
    } else if (e.isFile()) {
      const data = await fs.promises.readFile(absPath);
      accumulator.push({ path: relPath, data: data.toString('base64'), encoding: 'base64' });
    }
  }
}

/**
 * Package generated code directory into Vercel deployment files format
 * - Reads all files under sourceDir
 * - Encodes contents as base64
 * - Returns a list of files and a basic builds entry
 */
export async function packForVercel(sourceDir: string): Promise<PackedPayload> {
  const files: VercelPackagedFile[] = [];
  // Normalize to absolute path to walk
  const baseDir = path.resolve(sourceDir);
  await walkDir(baseDir, '.', files);

  // Basic static build hint. This can be extended to include framework-specific builds.
  const builds = [{ src: 'index.html', use: '@vercel/static' }];
  return { files, builds };
}

export default packForVercel;
