export type StdioServerConfig = {
  type?: "stdio";
  command: string;
  args?: string[];
  cwd?: string;
  env?: Record<string, string>;
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
