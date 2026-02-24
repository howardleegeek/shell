import {
  experimental_createMCPClient,
  type ToolSet,
  type Message,
  type DataStreamWriter,
  convertToCoreMessages,
  formatDataStreamPart,
} from 'ai';
import { Experimental_StdioMCPTransport } from 'ai/mcp-stdio';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { z } from 'zod';
import type { ToolCallAnnotation } from '~/types/context';
import {
  TOOL_EXECUTION_APPROVAL,
  TOOL_EXECUTION_DENIED,
  TOOL_EXECUTION_ERROR,
  TOOL_NO_EXECUTE_FUNCTION,
} from '~/utils/constants';
import { createScopedLogger } from '~/utils/logger';

const logger = createScopedLogger('mcp-service');

// Default Shell MCP Server configuration (non-blocking, non-intrusive)
// Note: only fields supported by the MCP config schema are used at runtime.
// Extra metadata (name, description, etc.) is kept for readability here only.
const DEFAULT_SHELL_MCP = {
  name: 'shell-web3-tools',
  type: 'sse',
  // URL can be overridden by env var SHELL_MCP_URL
  url: (process.env as any).SHELL_MCP_URL || 'http://localhost:3001/sse',
} as const;

export const stdioServerConfigSchema = z
  .object({
    type: z.enum(['stdio']).optional(),
    command: z.string().min(1, 'Command cannot be empty'),
    args: z.array(z.string()).optional(),
    cwd: z.string().optional(),
    env: z.record(z.string()).optional(),
  })
  .transform((data) => ({
    ...data,
    type: 'stdio' as const,
  }));
export type STDIOServerConfig = z.infer<typeof stdioServerConfigSchema>;

export const sseServerConfigSchema = z
  .object({
    type: z.enum(['sse']).optional(),
    url: z.string().url('URL must be a valid URL format'),
    headers: z.record(z.string()).optional(),
  })
  .transform((data) => ({
    ...data,
    type: 'sse' as const,
  }));
export type SSEServerConfig = z.infer<typeof sseServerConfigSchema>;

export const streamableHTTPServerConfigSchema = z
  .object({
    type: z.enum(['streamable-http']).optional(),
    url: z.string().url('URL must be a valid URL format'),
    headers: z.record(z.string()).optional(),
  })
  .transform((data) => ({
    ...data,
    type: 'streamable-http' as const,
  }));

export type StreamableHTTPServerConfig = z.infer<typeof streamableHTTPServerConfigSchema>;

export const mcpServerConfigSchema = z.union([
  stdioServerConfigSchema,
  sseServerConfigSchema,
  streamableHTTPServerConfigSchema,
]);
export type MCPServerConfig = z.infer<typeof mcpServerConfigSchema>;

export const mcpConfigSchema = z.object({
  mcpServers: z.record(z.string(), mcpServerConfigSchema),
}).strict();
export type MCPConfig = z.infer<typeof mcpConfigSchema>;

export type MCPClient = {
  tools: () => Promise<ToolSet>;
  close: () => Promise<void>;
} & {
  serverName: string;
};

export type SSEServerConfig = {
  type: "sse";
  url: string;
  headers?: Record<string, string>;
};

export type StreamableHTTPServerConfig = {
  type: "streamable-http";
  url: string;
  headers?: Record<string, string>;
};

export type MCPServerConfig = StdioServerConfig | SSEServerConfig | StreamableHTTPServerConfig;

export type MCPConfig = {
  mcpServers: Record<string, MCPServerConfig>;
};

export class MCPConfigError extends Error {}

function ensureObject(value: unknown, label: string): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new MCPConfigError(`${label} must be an object`);
  }
  return value as Record<string, unknown>;
}

function ensureString(value: unknown, label: string): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new MCPConfigError(`${label} must be a non-empty string`);
  }
  return value.trim();
}

function normalizeServerConfig(name: string, raw: unknown): MCPServerConfig {
  const config = ensureObject(raw, `mcpServers.${name}`);
  const hasCommand = typeof config.command === "string";
  const hasUrl = typeof config.url === "string";
  const explicitType = config.type;

  if (hasCommand && hasUrl) {
    throw new MCPConfigError(`mcpServers.${name} cannot define both command and url`);
  }

  if (hasCommand) {
    if (explicitType && explicitType !== "stdio") {
      throw new MCPConfigError(`mcpServers.${name} type must be "stdio" when command is provided`);
    }
    return {
      type: "stdio",
      command: ensureString(config.command, `mcpServers.${name}.command`),
      args: Array.isArray(config.args) ? config.args.map((v) => String(v)) : undefined,
      cwd: typeof config.cwd === "string" ? config.cwd : undefined,
      env:
        config.env && typeof config.env === "object"
          ? Object.fromEntries(
              Object.entries(config.env as Record<string, unknown>).map(([k, v]) => [k, String(v)]),
            )
          : undefined,
    };
  }

  if (hasUrl) {
    const type = explicitType === "streamable-http" ? "streamable-http" : "sse";
    if (explicitType && explicitType !== "sse" && explicitType !== "streamable-http") {
      throw new MCPConfigError(`mcpServers.${name} has an invalid type`);
    }
    return {
      type,
      url: ensureString(config.url, `mcpServers.${name}.url`),
      headers:
        config.headers && typeof config.headers === "object"
          ? Object.fromEntries(
              Object.entries(config.headers as Record<string, unknown>).map(([k, v]) => [k, String(v)]),
            )
          : undefined,
    };
  }

  throw new MCPConfigError(`mcpServers.${name} must define either command or url`);
}

export function validateMCPConfig(raw: unknown): MCPConfig {
  const root = ensureObject(raw, "config");
  const servers = ensureObject(root.mcpServers, "mcpServers");
  const normalized: Record<string, MCPServerConfig> = {};

  for (const [name, config] of Object.entries(servers)) {
    normalized[name] = normalizeServerConfig(name, config);
  }

  return { mcpServers: normalized };
}

export function getServerToolPrefixMap(config: MCPConfig): Record<string, string> {
  const mapping: Record<string, string> = {};
  for (const [name, server] of Object.entries(config.mcpServers)) {
    const prefix = server.type === "stdio" ? "local" : "remote";
    mapping[name] = `${prefix}:${name}`;
  }
  return mapping;
}

export class MCPService {
  private config: MCPConfig = { mcpServers: {} };

  updateConfig(raw: unknown): MCPConfig {
    this.config = validateMCPConfig(raw);
    return this.config;
  }

  getConfig(): MCPConfig {
    return this.config;
  }

  getServerNames(): string[] {
    return Object.keys(this.config.mcpServers);
  }
}
