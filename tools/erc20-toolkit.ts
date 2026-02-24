// ERC20 toolkit: approve / transfer / balanceOf scaffolds
export const inputSchema = {
  type: "object",
  properties: {
    asset: { type: "string" },
    to: { type: "string" },
    amount: { type: "string" },
    action: { type: "string" }
  },
  required: ["asset", "action"],
  additionalProperties: true
} as const;

export async function execute(input: any): Promise<string> {
  if (!input || !input.asset || !input.action) {
    throw new Error("Invalid input: asset and action are required");
  }
  const action = String(input.action).toLowerCase();
  const to = input.to ?? "0x0000000000000000000000000000000000000000";
  const amount = input.amount ?? "0";
  const code = `// ERC20 toolkit
import { ethers } from "ethers";
export function buildErc20Tx(input: { asset: string; action: string; to?: string; amount?: string }): string {
  const toAddr = input.to ?? "${to}";
  const amt = input.amount ?? "${amount}";
  if (input.action === "approve") {
    return \`await erc20(${input.asset}).approve(${toAddr}, ${amt})\`;
  }
  if (input.action === "transfer") {
    return \`await erc20(${input.asset}).transfer(${toAddr}, ${amt})\`;
  }
  if (input.action === "balanceof") {
    return \`await erc20(${input.asset}).balanceOf(${toAddr})\`;
  }
  return "";
}
`;
  return code;
}

export default { inputSchema, execute };
