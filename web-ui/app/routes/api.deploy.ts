import { packForVercel } from '../lib/deploy/packager'
import { VercelClient, VercelDeploymentPayload } from '../lib/deploy/vercel'

// Simple API route to receive generated code, package it, deploy to Vercel and return URL
export default async function handler(req: any, res: any) {
  try {
    if (req.method !== 'POST') {
      res.statusCode = 405
      res.setHeader('Allow', 'POST')
      res.json({ error: 'Method not allowed' })
      return
    }

    const { sourceDir, projectName } = req.body || {}
    // Resolve token
    const token = process.env.VERCEL_TOKEN
    if (!token) {
      res.status(400).json({ error: 'VERCEL_TOKEN is not set in environment' })
      return
    }

    if (!sourceDir) {
      res.status(400).json({ error: 'sourceDir is required' })
      return
    }

    // Build Vercel payload from packaged source
    const pack = await packForVercel(sourceDir)
    const payload: VercelDeploymentPayload = {
      name: projectName ?? 'dispatch-vercel-deploy',
      files: pack.files,
      builds: pack.builds,
    }

    const client = new VercelClient(token)
    const dep = await client.createDeployment(payload)
    const uid = dep?.uid ?? dep?.id
    let url = ''
    if (uid) {
      url = await client.pollForDeploymentUrl(uid, { intervalMs: 2000, timeoutMs: 600000 })
    }

    res.statusCode = 200
    res.json({ deploymentId: uid, url })
  } catch (err: any) {
    res.statusCode = 500
    res.json({ error: err?.message ?? String(err) })
  }
}
