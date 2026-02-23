// IPFS deployment helper (backup option)
// Uses Web3.Storage public API when a token is provided.
// If no token is provided, this function will fail fast with a clear error.
export type IPFSDeployResult = {
  cid: string;
  url?: string;
};

export async function deployToIPFS(files: { path: string; content: string }[], options?: { token?: string, provider?: 'web3storage' | 'pinata' }): Promise<IPFSDeployResult> {
  const token = options?.token;
  const provider = options?.provider ?? 'web3storage'
  if (!token) {
    throw new Error('IPFS deployment token not provided. Set IPFS_TOKEN or VERCEL_TOKEN as appropriate.')
  }

  // Build a simple manifest containing the files in JSON form to keep the payload small.
  const manifest = {
    files: files.map(f => ({ path: f.path, content: f.content })),
  }
  const payload = Buffer.from(JSON.stringify(manifest))

  // Web3.Storage upload endpoint (simplified single-file upload)
  const url = 'https://api.web3.storage/upload'
  const form = new FormData()
  // Name the blob for easier debugging
  form.append('file', payload, {
    filename: 'manifest.json',
    contentType: 'application/json',
  } as any)

  const resp = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: form as any,
  })
  if (!resp.ok) {
    const text = await resp.text()
    throw new Error(`IPFS upload failed: ${resp.status} ${text}`)
  }
  const data = await resp.json()
  const cid = data?.cid ?? ''
  return {
    cid,
    url: cid ? `https://${cid}.ipfs.dweb.link` : undefined,
  }
}

export default deployToIPFS
