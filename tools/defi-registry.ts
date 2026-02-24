// Registry for DeFi tools available in MCP server
import type { inputSchema as UniSwapInputSchema } from "./uniswap-swap";
import type { inputSchema as AaveInputSchema } from "./aave-lend";
import type { inputSchema as ChainlinkInputSchema } from "./chainlink-price";
import type { inputSchema as Erc20InputSchema } from "./erc20-toolkit";

type ToolEntry = {
  id: string;
  name: string;
  path: string;
  inputSchema: object;
};

export function registerTools(): ToolEntry[] {
  const registry: ToolEntry[] = [
    {
      id: "uniswap-swap",
      name: "Uniswap V3 Swap Tool",
      path: "./uniswap-swap",
      inputSchema: UniSwapInputSchema,
    },
    {
      id: "aave-lend",
      name: "Aave V3 Lend/Borrow Tool",
      path: "./aave-lend",
      inputSchema: AaveInputSchema,
    },
    {
      id: "chainlink-price",
      name: "Chainlink Price Feed Tool",
      path: "./chainlink-price",
      inputSchema: ChainlinkInputSchema,
    },
    {
      id: "erc20-toolkit",
      name: "ERC20 Toolkit (approve/transfer/balanceOf)",
      path: "./erc20-toolkit",
      inputSchema: Erc20InputSchema,
    },
  ];
  return registry;
}

export default { registerTools };
