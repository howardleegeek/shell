import { z } from 'zod';

const TOOL_EXECUTION_APPROVAL = {
  APPROVE: 'Yes, approved.',
  REJECT: 'No, rejected.',
} as const;
const TOOL_NO_EXECUTE_FUNCTION = 'Error: No execute function found on tool';
const TOOL_EXECUTION_DENIED = 'Error: User denied access to tool execution';
const TOOL_EXECUTION_ERROR = 'Error: An error occured while calling tool';

const logger = {
  debug: (...args: unknown[]) => console.debug('[mcp-service]', ...args),
  warn: (...args: unknown[]) => console.warn('[mcp-service]', ...args),
  error: (...args: unknown[]) => console.error('[mcp-service]', ...args),
};

const TOOLS_TIMEOUT_MS = 30_000;
const TOOL_EXECUTE_TIMEOUT_MS = 60_000;
const REMOTE_RETRY_MAX = 5;
const REMOTE_RETRY_BASE_DELAY_MS = 500;

const runtimeImport = new Function('specifier', 'return import(specifier)') as (
  specifier: string,
) => Promise<Record<string, unknown>>;

export type ToolSet = Record<string, unknown>;
export type Message = Record<string, unknown>;
export type DataStreamWriter = { write?: (payload: unknown) => void };

export type ToolCallAnnotation = {
  toolCallId?: string;
  toolName?: string;
  args?: unknown;
  [key: string]: unknown;
};

export type StdioServerConfig = {
  type: 'stdio';
  command: string;
  args?: string[];
  cwd?: string;
  env?: Record<string, string>;
};

export type SSEServerConfig = {
  type: 'sse';
  url: string;
  headers?: Record<string, string>;
};

export type StreamableHTTPServerConfig = {
  type: 'streamable-http';
  url: string;
  headers?: Record<string, string>;
};

export type MCPServerConfig = StdioServerConfig | SSEServerConfig | StreamableHTTPServerConfig;

export type MCPConfig = {
  mcpServers: Record<string, MCPServerConfig>;
};

export type MCPServerTools = Record<
  string,
  {
    status: 'available' | 'unavailable';
    config: MCPServerConfig;
    tools: Record<string, unknown>;
    error?: string;
  }
>;

export type MCPClient = {
  tools: () => Promise<ToolSet>;
  close: () => Promise<void>;
  serverName: string;
};

type RawServerConfig = {
  type?: 'stdio' | 'sse' | 'streamable-http';
  command?: string;
  args?: string[];
  cwd?: string;
  env?: Record<string, string>;
  url?: string;
  headers?: Record<string, string>;
};

const rawServerConfigSchema = z
  .object({
    type: z.enum(['stdio', 'sse', 'streamable-http']).optional(),
    command: z.string().min(1).optional(),
    args: z.array(z.string()).optional(),
    cwd: z.string().optional(),
    env: z.record(z.string(), z.string()).optional(),
    url: z.string().url().optional(),
    headers: z.record(z.string(), z.string()).optional(),
  })
  .strict();

const rawMcpConfigSchema = z.object({
  mcpServers: z.record(z.string(), rawServerConfigSchema),
});

export class MCPConfigError extends Error {
  readonly cause?: unknown;

  constructor(message: string, cause?: unknown) {
    super(message);
    this.name = 'MCPConfigError';
    this.cause = cause;
  }
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
}

function getErrorStack(error: unknown): string {
  if (error instanceof Error) {
    // Always prefer the full stack trace if available
    const stack = error.stack ?? '';
    // If this is a Zod-like validation error, include a structured view of issues
    // to help debugging config parsing without losing the original stack.
    const asAny: any = error as any;
    if (Array.isArray(asAny.issues)) {
      const issues = asAny.issues;
      const issuesStr = JSON.stringify(issues, null, 2);
      return stack ? `${stack}\nZod Issues:\n${issuesStr}` : `Zod Issues:\n${issuesStr}`;
    }
    return stack;
  }

  return getErrorMessage(error);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number, timeoutMessage: string): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        timeoutId = setTimeout(() => reject(new Error(timeoutMessage)), timeoutMs);
      }),
    ]);
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
}

function normalizeServerConfig(name: string, rawConfig: RawServerConfig): MCPServerConfig {
  const hasCommand = typeof rawConfig.command === 'string' && rawConfig.command.trim().length > 0;
  const hasUrl = typeof rawConfig.url === 'string' && rawConfig.url.trim().length > 0;

  if (hasCommand && hasUrl) {
    throw new MCPConfigError(`mcpServers.${name} cannot define both command and url`);
  }

  // #24: never mutate readonly source object when applying stdio default type.
  const serverConfigWithDefaultType = {
    ...rawConfig,
    type: rawConfig.type || 'stdio',
  };

  if (hasCommand) {
    if (serverConfigWithDefaultType.type !== 'stdio') {
      throw new MCPConfigError(`mcpServers.${name} type must be "stdio" when command is provided`);
    }

    return {
      type: 'stdio',
      command: rawConfig.command!.trim(),
      args: rawConfig.args,
      cwd: rawConfig.cwd,
      env: rawConfig.env,
    };
  }

  if (hasUrl) {
    const type = serverConfigWithDefaultType.type === 'streamable-http' ? 'streamable-http' : 'sse';

    if (serverConfigWithDefaultType.type && serverConfigWithDefaultType.type !== 'sse' && serverConfigWithDefaultType.type !== 'streamable-http') {
      throw new MCPConfigError(`mcpServers.${name} has an invalid type`);
    }

    if (type === 'streamable-http') {
      return {
        type,
        url: rawConfig.url!.trim(),
        headers: rawConfig.headers,
      };
    }

    return {
      type: 'sse',
      url: rawConfig.url!.trim(),
      headers: rawConfig.headers,
    };
  }

  throw new MCPConfigError(`mcpServers.${name} must define either command or url`);
}

export function validateMCPConfig(raw: unknown): MCPConfig {
  const parsed = rawMcpConfigSchema.safeParse(raw);

  if (!parsed.success) {
    // #17: preserve full zod error stack/context instead of collapsing into joined messages.
    throw new MCPConfigError(`Invalid MCP config:\n${getErrorStack(parsed.error)}`, parsed.error);
  }

  const normalizedServers: Record<string, MCPServerConfig> = {};
  const inputServers = parsed.data.mcpServers;

  for (const [serverName, serverConfig] of Object.entries(inputServers)) {
    normalizedServers[serverName] = normalizeServerConfig(serverName, serverConfig as RawServerConfig);
  }

  return {
    mcpServers: normalizedServers,
  };
}

export function getServerToolPrefixMap(config: MCPConfig): Record<string, string> {
  const mapping: Record<string, string> = {};

  for (const [name, server] of Object.entries(config.mcpServers)) {
    const prefix = server.type === 'stdio' ? 'local' : 'remote';
    mapping[name] = `${prefix}:${name}`;
  }

  return mapping;
}

type LatestToolCall = {
  toolName: string;
  toolCallId?: string;
  args: unknown;
};

type RuntimeMCPClient = {
  tools: () => Promise<ToolSet>;
  close: () => Promise<void>;
};

async function createRuntimeMCPClient(transport: unknown): Promise<RuntimeMCPClient> {
  const aiModule = await runtimeImport('ai');
  const createClientFn = (aiModule.experimental_createMCPClient || aiModule.createMCPClient) as
    | ((options: { transport: unknown }) => Promise<RuntimeMCPClient>)
    | undefined;

  if (!createClientFn) {
    throw new Error('MCP client factory is not available in current ai package');
  }

  return createClientFn({ transport });
}

async function createStdioTransport(config: StdioServerConfig): Promise<unknown> {
  const stdioModule = await runtimeImport('ai/mcp-stdio');
  const StdioTransportCtor = stdioModule.Experimental_StdioMCPTransport as
    | (new (options: {
        command: string;
        args?: string[];
        cwd?: string;
        env?: Record<string, string>;
      }) => unknown)
    | undefined;

  if (!StdioTransportCtor) {
    throw new Error('Experimental_StdioMCPTransport is not available');
  }

  return new StdioTransportCtor({
    command: config.command,
    args: config.args,
    cwd: config.cwd,
    env: config.env,
  });
}

async function createStreamableHttpTransport(config: SSEServerConfig | StreamableHTTPServerConfig): Promise<unknown> {
  const sdkModule = await runtimeImport('@modelcontextprotocol/sdk/client/streamableHttp.js');
  const TransportCtor = sdkModule.StreamableHTTPClientTransport as
    | (new (url: URL, options?: { requestInit?: { headers?: Record<string, string> } }) => unknown)
    | undefined;

  if (!TransportCtor) {
    throw new Error('StreamableHTTPClientTransport is not available');
  }

  return new TransportCtor(new URL(config.url), {
    requestInit: {
      headers: config.headers,
    },
  });
}

async function convertMessagesForToolLookup(messages: Message[]): Promise<unknown[]> {
  try {
    const aiModule = await runtimeImport('ai');
    const converter = (aiModule.convertToCoreMessages || aiModule.convertToModelMessages) as
      | ((value: Message[]) => unknown[])
      | undefined;

    if (converter) {
      return converter(messages);
    }
  } catch {
    // Fall back to raw messages when converter is unavailable.
  }

  return messages;
}

export class MCPService {
  private static instance: MCPService | null = null;

  private config: MCPConfig = { mcpServers: {} };
  private clients = new Map<string, MCPClient>();
  private serverTools: MCPServerTools = {};

  static getInstance(): MCPService {
    if (!MCPService.instance) {
      MCPService.instance = new MCPService();
    }

    return MCPService.instance;
  }

  async updateConfig(raw: unknown): Promise<MCPConfig> {
    const nextConfig = validateMCPConfig(raw);
    const currentConfigSerialized = JSON.stringify(this.config);
    const nextConfigSerialized = JSON.stringify(nextConfig);

    // #20: deep-equal check to avoid unnecessary restart/recreate.
    if (currentConfigSerialized === nextConfigSerialized) {
      logger.debug('Skipping MCP client recreation because config is unchanged');
      return this.config;
    }

    await this._createClients(nextConfig);
    this.config = nextConfig;
    this.serverTools = await this._collectServerTools(nextConfig);

    return this.config;
  }

  getConfig(): MCPConfig {
    return this.config;
  }

  getServerNames(): string[] {
    return Object.keys(this.config.mcpServers);
  }

  getServerTools(): MCPServerTools {
    return this.serverTools;
  }

  async checkServersAvailabilities(): Promise<MCPServerTools> {
    this.serverTools = await this._collectServerTools(this.config);
    return this.serverTools;
  }

  async getTools(): Promise<ToolSet> {
    const mergedTools: ToolSet = {};
    const prefixes = getServerToolPrefixMap(this.config);

    for (const [serverName, client] of this.clients.entries()) {
      const toolset = await withTimeout(
        client.tools(),
        TOOLS_TIMEOUT_MS,
        `Timed out while loading tools from server ${serverName}`,
      );

      for (const [toolName, tool] of Object.entries(toolset)) {
        mergedTools[`${prefixes[serverName]}:${toolName}`] = tool;
      }
    }

    return mergedTools;
  }

  async executeToolFromMessages(
    tools: ToolSet,
    messages: Message[],
    options?: {
      userResponse?: string;
      dataStream?: DataStreamWriter;
      annotation?: ToolCallAnnotation;
    },
  ): Promise<unknown> {
    const userResponse = options?.userResponse;

    if (userResponse && userResponse !== TOOL_EXECUTION_APPROVAL.APPROVE) {
      throw new Error(TOOL_EXECUTION_DENIED);
    }

    const coreMessages = await convertMessagesForToolLookup(messages);
    const latestToolCall = this._findLatestToolCall(coreMessages as unknown[]);

    if (!latestToolCall) {
      throw new Error('No tool call found in messages');
    }

    const toolInstance = (tools as Record<string, unknown>)[latestToolCall.toolName] as
      | { execute?: (args: unknown, options?: { messages?: Message[] }) => Promise<unknown> | unknown }
      | undefined;

    if (!toolInstance || typeof toolInstance.execute !== 'function') {
      throw new Error(TOOL_NO_EXECUTE_FUNCTION);
    }

    const executeResult = await withTimeout(
      Promise.resolve(toolInstance.execute(latestToolCall.args, { messages })),
      TOOL_EXECUTE_TIMEOUT_MS,
      `${TOOL_EXECUTION_ERROR}: execution timed out after ${TOOL_EXECUTE_TIMEOUT_MS}ms`,
    );

    const writer = options?.dataStream as unknown as { write?: (payload: unknown) => void } | undefined;
    if (writer?.write) {
      writer.write({
        type: 'tool-result',
        toolName: latestToolCall.toolName,
        toolCallId: latestToolCall.toolCallId,
        result: executeResult,
        annotation: options?.annotation,
      });
    }

    return executeResult;
  }

  async close(): Promise<void> {
    const staleClients = Array.from(this.clients.values());
    this.clients.clear();

    await Promise.allSettled(staleClients.map((client) => client.close()));
  }

  private async _createClients(nextConfig: MCPConfig): Promise<void> {
    // #18: close old client handles before creating new clients.
    const staleClients = Array.from(this.clients.values());
    this.clients.clear();
    await Promise.allSettled(staleClients.map((client) => client.close()));

    const entries = Object.entries(nextConfig.mcpServers);

    for (const [serverName, serverConfig] of entries) {
      try {
        const client = await this._createClientWithReconnect(serverName, serverConfig);
        this.clients.set(serverName, client);
      } catch (error) {
        logger.error(`Failed to create client for ${serverName}`, error);
      }
    }
  }

  private async _createClientWithReconnect(serverName: string, serverConfig: MCPServerConfig): Promise<MCPClient> {
    const isRemote = serverConfig.type === 'sse' || serverConfig.type === 'streamable-http';

    if (!isRemote) {
      return this._createClient(serverName, serverConfig);
    }

    // #19: reconnect strategy for SSE/HTTP clients with exponential backoff.
    let attempt = 0;
    let lastError: unknown;

    while (attempt < REMOTE_RETRY_MAX) {
      attempt += 1;

      try {
        const client = await this._createClient(serverName, serverConfig);

        try {
          await withTimeout(
            client.tools(),
            TOOLS_TIMEOUT_MS,
            `Timed out while validating remote client ${serverName}`,
          );
          return client;
        } catch (validationError) {
          await client.close();
          throw validationError;
        }
      } catch (error) {
        lastError = error;

        if (attempt >= REMOTE_RETRY_MAX) {
          break;
        }

        const delay = REMOTE_RETRY_BASE_DELAY_MS * 2 ** (attempt - 1);
        logger.warn(`Remote MCP client ${serverName} connect attempt ${attempt} failed, retrying in ${delay}ms`);
        await sleep(delay);
      }
    }

    throw new Error(
      `Failed to connect remote MCP server "${serverName}" after ${REMOTE_RETRY_MAX} retries: ${getErrorMessage(lastError)}`,
    );
  }

  private async _createClient(serverName: string, serverConfig: MCPServerConfig): Promise<MCPClient> {
    const transport =
      serverConfig.type === 'stdio'
        ? await createStdioTransport(serverConfig)
        : await createStreamableHttpTransport(serverConfig);
    const createdClient = await createRuntimeMCPClient(transport);

    return {
      serverName,
      tools: createdClient.tools.bind(createdClient),
      close: createdClient.close.bind(createdClient),
    };
  }

  private async _collectServerTools(config: MCPConfig): Promise<MCPServerTools> {
    const serverTools: MCPServerTools = {};

    for (const [serverName, serverConfig] of Object.entries(config.mcpServers)) {
      const client = this.clients.get(serverName);

      if (!client) {
        serverTools[serverName] = {
          status: 'unavailable',
          config: serverConfig,
          tools: {},
          error: 'Client is not initialized',
        };
        continue;
      }

      try {
        // #21: protect client.tools() with a hard timeout.
        const tools = await withTimeout(
          client.tools(),
          TOOLS_TIMEOUT_MS,
          `Timed out while loading tools from server ${serverName}`,
        );

        serverTools[serverName] = {
          status: 'available',
          config: serverConfig,
          tools: tools as Record<string, unknown>,
        };
      } catch (error) {
        const reconnectedClient = await this._attemptReconnect(serverName, serverConfig, error);

        if (reconnectedClient) {
          try {
            const tools = await withTimeout(
              reconnectedClient.tools(),
              TOOLS_TIMEOUT_MS,
              `Timed out while loading tools from reconnected server ${serverName}`,
            );

            serverTools[serverName] = {
              status: 'available',
              config: serverConfig,
              tools: tools as Record<string, unknown>,
            };

            continue;
          } catch (reconnectError) {
            serverTools[serverName] = {
              status: 'unavailable',
              config: serverConfig,
              tools: {},
              error: getErrorMessage(reconnectError),
            };
            continue;
          }
        }

        serverTools[serverName] = {
          status: 'unavailable',
          config: serverConfig,
          tools: {},
          error: getErrorMessage(error),
        };
      }
    }

    return serverTools;
  }

  private async _attemptReconnect(
    serverName: string,
    serverConfig: MCPServerConfig,
    originalError: unknown,
  ): Promise<MCPClient | null> {
    if (serverConfig.type === 'stdio') {
      return null;
    }

    logger.warn(`Detected remote MCP disconnection on ${serverName}: ${getErrorMessage(originalError)}`);

    const existing = this.clients.get(serverName);
    if (existing) {
      await existing.close().catch((closeError) => {
        logger.warn(`Failed to close disconnected client ${serverName}: ${getErrorMessage(closeError)}`);
      });
      this.clients.delete(serverName);
    }

    try {
      const client = await this._createClientWithReconnect(serverName, serverConfig);
      this.clients.set(serverName, client);
      return client;
    } catch (error) {
      logger.error(`Reconnect failed for ${serverName}`, error);
      return null;
    }
  }

  private _findLatestToolCall(messages: unknown[]): LatestToolCall | null {
    // #22: search from tail until the most recent message containing a tool part.
    for (let i = messages.length - 1; i >= 0; i -= 1) {
      const message = messages[i];

      if (!message || typeof message !== 'object') {
        continue;
      }

      const record = message as Record<string, unknown>;
      const content = Array.isArray(record.content) ? record.content : [];

      for (let j = content.length - 1; j >= 0; j -= 1) {
        const part = content[j];

        if (!part || typeof part !== 'object') {
          continue;
        }

        const typedPart = part as Record<string, unknown>;
        if (typedPart.type === 'tool-call') {
          const toolName =
            typeof typedPart.toolName === 'string'
              ? typedPart.toolName
              : typeof typedPart.name === 'string'
                ? typedPart.name
                : null;

          if (!toolName) {
            continue;
          }

          return {
            toolName,
            toolCallId: typeof typedPart.toolCallId === 'string' ? typedPart.toolCallId : undefined,
            args: typedPart.args ?? typedPart.input ?? {},
          };
        }

        if (typedPart.type === 'tool') {
          const toolName = typeof typedPart.toolName === 'string' ? typedPart.toolName : null;
          if (!toolName) {
            continue;
          }

          return {
            toolName,
            toolCallId: typeof typedPart.toolCallId === 'string' ? typedPart.toolCallId : undefined,
            args: typedPart.args ?? {},
          };
        }
      }
    }

    return null;
  }
}

export const mcpService = MCPService.getInstance();
