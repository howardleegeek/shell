// Auto-generated Aave V3 lending tool scaffold
export const inputSchema = {
  type: "object",
  properties: {
    asset: { type: "string" },
    amount: { type: "string" },
    onBehalfOf: { type: "string" },
    action: { type: "string" }, // 'supply' or 'borrow'
  },
  required: ["asset", "amount", "action"],
  additionalProperties: true
} as const;

export async function execute(input: any): Promise<string> {
  if (!input || !input.asset || !input.amount || !input.action) {
    throw new Error("Invalid input: asset, amount and action are required");
  }
  const action = (input.action || "").toLowerCase();
  const onBehalfOf = input.onBehalfOf ?? "0x0000000000000000000000000000000000000000";
  const code = `// Aave V3 scaffold
import { ethers } from "ethers";
const LENDING_POOL_ADDRESS = "0x0000000000000000000000000000000000000000"; // replace with actual pool

export interface AaveInput {
  asset: string;
  amount: string;
  onBehalfOf?: string;
  action: "supply" | "borrow";
}

export function buildAaveTx(input: AaveInput): string {
  const onBehalfOf = input.onBehalfOf ?? "${onBehalfOf}";
  if (input.action === "supply") {
    return `LENDING_POOL.supply(input.asset, input.amount, onBehalfOf, 0)`;
  } else {
    return `LENDING_POOL.borrow(input.asset, input.amount, 1, onBehalfOf)`;
  }
}
`;
  return code;
}

export default { inputSchema, execute };
