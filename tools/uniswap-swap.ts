// Auto-generated Uniswap V3 swap tool scaffold
export const inputSchema = {
  type: "object",
  properties: {
    tokenIn: { type: "string" },
    tokenOut: { type: "string" },
    amountIn: { type: "string" },
    recipient: { type: "string" },
    poolFee: { type: "number" },
    slippage: { type: "number" }
  },
  required: ["tokenIn", "tokenOut", "amountIn"],
  additionalProperties: true
} as const;

export async function execute(input: any): Promise<string> {
  // Basic runtime validation
  if (!input || !input.tokenIn || !input.tokenOut || !input.amountIn) {
    throw new Error("Invalid input: tokenIn, tokenOut and amountIn are required");
  }

  const recipient = input.recipient ?? "0x0000000000000000000000000000000000000000";
  const poolFee = input.poolFee ?? 3000; // default 0.3%
  const slippage = input.slippage ?? 0.5;

  const code = `// Uniswap V3 swap scaffold (generated)
import { ethers } from "ethers";

// Uniswap V3 SwapRouter address (example)
const SWAP_ROUTER_ADDRESS = "0xE592427A0AEce92De3Edee1F18E0157C05861564";

export interface UniSwapSwapInput {
  tokenIn: string;
  tokenOut: string;
  amountIn: string;
  recipient?: string;
  poolFee?: number;
  slippage?: number;
}

export function quoteExactInputSingle(input: UniSwapSwapInput): string {
  // Placeholder quote generation; in real usage, call Uniswap v3 Quoter
  return "0";
}

export function buildSwapCalldata(input: UniSwapSwapInput): string {
  const recipient = input.recipient ?? "${recipient}";
  const fee = input.poolFee ?? ${poolFee};
  return `swapExactInputSingle(\n  tokenIn=${input.tokenIn},\n  tokenOut=${input.tokenOut},\n  amountIn=${input.amountIn},\n  recipient=${recipient},\n  fee=${fee},\n  slippage=${slippage}\n)`;
}
`;

  return code;
}

export default { inputSchema, execute };
