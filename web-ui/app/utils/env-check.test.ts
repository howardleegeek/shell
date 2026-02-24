import { afterEach, describe, expect, it } from "vitest";
import { checkEnvironment, type EnvStatus } from "./env-check";

// Helper to reset environment between tests
function resetEnv(keys: string[]) {
  for (const k of keys) {
    delete process.env[k];
  }
}

describe("checkEnvironment", () => {
  afterEach(() => {
    resetEnv([
      "OPENAI_API_KEY",
      "ANTHROPIC_API_KEY",
      "COHERE_API_KEY",
      "AZURE_OPENAI_API_KEY",
      "AZURE_OPENAI_ENDPOINT",
      "GOOGLE_PALM_API_KEY",
      "SHELL_MCP_URL",
    ]);
  });

  it("reports no providers configured when none are set", async () => {
    const res = await checkEnvironment();
    const configuredCount = res.llm_providers.filter(p => p.configured).length;
    expect(configuredCount).toBe(0);
    expect(res.warnings.length).toBeGreaterThan(0);
  });

  it("detects configured OpenAI API key and masks it", async () => {
    process.env["OPENAI_API_KEY"] = "sk-abcdef12345";
    const res = await checkEnvironment();
    const openAI = res.llm_providers.find(p => p.provider === "OpenAI");
    expect(openAI).toBeDefined();
    expect(openAI!.configured).toBe(true);
    expect(openAI!.key_prefix).toBe("sk-");
  });
});
