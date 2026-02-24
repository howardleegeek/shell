// Vercel REST API client
// This module provides a lightweight client to create deployments, fetch
// deployment status and list deployments using the Vercel REST API.
// Token must be supplied via environment variable VERCEL_TOKEN.
// The API shape is aligned to a minimal, pragmatic subset to support the
// integration pipeline in this repo.

export type VercelDeploymentFile = {
  path: string;
  data: string; // base64-encoded content
  encoding?: string;
};

export type VercelDeploymentPayload = {
  name?: string;
  files: VercelDeploymentFile[];
  builds?: Array<{ src: string; use: string; config?: any }>;
};

export type VercelDeploymentResponse = {
  uid?: string;
  id?: string;
  url?: string;
  [k: string]: any;
};

export class VercelClient {
  private token: string;
  private baseUrl: string = 'https://api.vercel.com/v13';

  constructor(token?: string) {
    this.token = token ?? process.env.VERCEL_TOKEN ?? '';
  }

  private authHeaders(): Record<string, string> {
    if (!this.token) return {};
    return {
      Authorization: `Bearer ${this.token}`,
      'Content-Type': 'application/json',
    };
  }

  // Create a new deployment on Vercel
  async createDeployment(payload: VercelDeploymentPayload): Promise<VercelDeploymentResponse> {
    if (!this.token) throw new Error('VERCEL_TOKEN is not set');
    const url = `${this.baseUrl}/deployments`;
    const res = await fetch(url, {
      method: 'POST',
      headers: this.authHeaders(),
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Vercel deployment failed: ${res.status} ${text}`);
    }
    return (await res.json()) as VercelDeploymentResponse;
  }

  // Get a specific deployment by UID
  async getDeployment(uid: string): Promise<VercelDeploymentResponse> {
    if (!this.token) throw new Error('VERCEL_TOKEN is not set');
    const url = `${this.baseUrl}/deployments/${uid}`;
    const res = await fetch(url, { headers: this.authHeaders() });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Vercel get deployment failed: ${res.status} ${text}`);
    }
    return (await res.json()) as VercelDeploymentResponse;
  }

  // List deployments (simplified)
  async listDeployments(limit: number = 20): Promise<VercelDeploymentResponse[]> {
    if (!this.token) throw new Error('VERCEL_TOKEN is not set');
    const url = `${this.baseUrl}/deployments?limit=${limit}`;
    const res = await fetch(url, { headers: this.authHeaders() });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Vercel list deployments failed: ${res.status} ${text}`);
    }
    const data = await res.json();
    // Normalize to an array of deployments if possible
    if (Array.isArray(data.deployments)) return data.deployments as VercelDeploymentResponse[];
    // Fallback: attempt to return a best-effort array
    return Array.isArray(data) ? (data as VercelDeploymentResponse[]) : [];
  }

  // Poll until deployment exposes a URL or timeout
  async pollForDeploymentUrl(uid: string, opts?: { intervalMs?: number; timeoutMs?: number }): Promise<string> {
    const intervalMs = opts?.intervalMs ?? 2500;
    const timeoutMs = opts?.timeoutMs ?? 600000;
    const start = Date.now();
    while (true) {
      const dep = await this.getDeployment(uid);
      const url = (dep as any).url as string | undefined;
      if (url) return url;
      if (Date.now() - start > timeoutMs) {
        throw new Error('Deployment polling timed out');
      }
      await new Promise((r) => setTimeout(r, intervalMs));
    }
  }
}

export default VercelClient;
