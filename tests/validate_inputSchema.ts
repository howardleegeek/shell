// Simple runtime validation tests for inputSchema presence
import { inputSchema as uniSchema } from "../tools/uniswap-swap";

function hasRequiredFields(schema: any, required: string[]): boolean {
  const props = (schema?.properties as any) ?? {};
  for (const r of required) {
    if (!(r in props)) {
      return false;
    }
  }
  return true;
}

const ok = hasRequiredFields(uniSchema, ["tokenIn", "tokenOut", "amountIn"]);
if (!ok) {
  console.error("Validation failed: uniswap inputSchema missing required fields");
  process.exit(1);
}
console.log("validate_inputSchema.ts: PASS");
process.exit(0);
