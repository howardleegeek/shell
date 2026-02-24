// Auto-generated Chainlink price feed tool scaffold
export const inputSchema = {
  type: "object",
  properties: {
    priceFeedAddress: { type: "string" },
    decimals: { type: "number" }
  },
  required: ["priceFeedAddress"],
  additionalProperties: true
} as const;

export async function execute(input: any): Promise<string> {
  if (!input || !input.priceFeedAddress) {
    throw new Error("Invalid input: priceFeedAddress is required");
  }
  const decimals = input.decimals ?? 8;
  const code = `// Chainlink price feed fetch (via AggregatorV3Interface)
import { ethers } from "ethers";
export async function getPrice(input: { priceFeedAddress: string; decimals?: number }, provider: ethers.providers.Provider): Promise<number> {
  const priceFeed = new ethers.Contract(input.priceFeedAddress, [
    "function latestRoundData() view returns (uint80 roundId, int256 price, uint256 startedAt, uint256 updatedAt, uint80 answeredInRound)",
    "function decimals() view returns (uint8)"
  ], provider);
  const price = await priceFeed.latestRoundData().then((r: any) => Number(r[1]));
  // Normalize by decimals if needed
  const d = input.decimals ?? ${decimals};
  return price / Math.pow(10, d);
}
`;
  return code;
}

export default { inputSchema, execute };
