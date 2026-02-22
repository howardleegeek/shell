export type TransportMode = "stdio" | "sse";

export interface CliOptions {
  transport: TransportMode;
  port: number;
  host: string;
}

export const DEFAULT_PORT = 3001;
export const DEFAULT_HOST = "127.0.0.1";

export function parseCliOptions(argv: string[]): CliOptions {
  let transport: TransportMode = "stdio";
  let port = DEFAULT_PORT;
  let host = DEFAULT_HOST;

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const next = argv[index + 1];

    if (arg === "--transport") {
      if (next !== "stdio" && next !== "sse") {
        throw new Error('Invalid --transport value. Expected "stdio" or "sse".');
      }
      transport = next;
      index += 1;
      continue;
    }

    if (arg === "--port") {
      const parsed = Number(next);
      if (!Number.isInteger(parsed) || parsed < 1 || parsed > 65535) {
        throw new Error("Invalid --port value. Expected an integer between 1 and 65535.");
      }
      port = parsed;
      index += 1;
      continue;
    }

    if (arg === "--host") {
      if (!next || !next.trim()) {
        throw new Error("Invalid --host value. Expected a non-empty host.");
      }
      host = next.trim();
      index += 1;
    }
  }

  return { transport, port, host };
}

export function createSessionId(randomValue: number = Math.random()): string {
  const rand = Math.max(0, Math.min(0.9999999999999999, randomValue));
  return Math.floor(rand * 1e16).toString(36).padStart(10, "0");
}

export function isValidSessionId(sessionId: string): boolean {
  return /^[a-z0-9]{10,}$/.test(sessionId);
}
