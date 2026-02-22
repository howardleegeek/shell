// Environment check utilities for startup validation
// Checks configured LLM providers and MCP server reachability without exposing secrets

export interface EnvStatus {
  provider: string;
  configured: boolean;
  key_prefix?: string; // first 3 chars of the key, e.g. "sk-" for a key like "sk-abcdef..."
}

export async function checkEnvironment(): Promise<{
  llm_providers: EnvStatus[];
  mcp_server: { url: string; reachable: boolean };
  warnings: string[];
}> {
  // Define known providers and their environment keys
  const providers: { provider: string; keys: string[] }[] = [
    { provider: "OpenAI", keys: ["OPENAI_API_KEY"] },
    { provider: "Anthropic", keys: ["ANTHROPIC_API_KEY"] },
    { provider: "Cohere", keys: ["COHERE_API_KEY"] },
    { provider: "Azure OpenAI", keys: ["AZURE_OPENAI_API_KEY", "AZURE_OPENAI_ENDPOINT"] },
    { provider: "Google PaLM", keys: ["GOOGLE_PALM_API_KEY"] },
  ];

  const env = process.env;
  const llm_providers: EnvStatus[] = providers.map(p => {
    let configured = false;
    let key_prefix: string | undefined = undefined;
    for (const k of p.keys) {
      const val = env[k];
      if (typeof val === "string" && val.trim().length > 0) {
        configured = true;
        key_prefix = val.trim().slice(0, 3);
        break;
      }
    }
    return {
      provider: p.provider,
      configured,
      key_prefix: configured ? key_prefix : undefined,
    };
  });

  // MCP server URL (optional) and reachability check (async)
  const mcp_url = env["SHELL_MCP_URL"] ?? "";
  let reachable = false;
  if (typeof mcp_url === "string" && mcp_url.trim().length > 0) {
    try {
      // Try a lightweight HEAD request to check reachability with timeout support
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 2000);
      const res = await fetch(mcp_url, { method: "HEAD" as any, signal: ctrl.signal });
      clearTimeout(t);
      reachable = res.ok;
    } catch {
      reachable = false;
    }
  }

  const mcp_server = { url: mcp_url, reachable };

  const warnings: string[] = [];
  const configuredCount = llm_providers.filter(p => p.configured).length;
  if (configuredCount === 0) {
    warnings.push("No API keys configured for any LLM providers");
  }

  return { llm_providers, mcp_server, warnings };
}
