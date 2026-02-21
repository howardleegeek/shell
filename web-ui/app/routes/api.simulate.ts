import type { Request } from 'undici';
import { simulateLocal } from '../lib/simulator';

// Remix route: POST /api.simulate
export async function action({ request }: { request: Request }): Promise<Response> {
  try {
    const body = await request.json();
    const { to, value, calldata } = body;
    const result = simulateLocal({ to, value: Number(value) || 0, calldata: String(calldata || '') });
    return new Response(JSON.stringify({ simulationResult: result, simulationStatus: 'done' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'invalid_request' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
