import { describe, it, expect } from "vitest";
import { parseForgeOutputString } from "../src/tools/forge-build";

describe("forge-build parse", () => {
  it("parses standard forge json output", () => {
    const sample = `{
      "contracts": {
        "MyContract.sol:MyContract": {
          "abi": [{"name": "foo", "type": "function", "inputs": [], "outputs": []}],
          "bin": "0x600160005260",
          "deployedBin": "0x600160005260"
        }
      }
    }`;

    const contracts = parseForgeOutputString(sample);
    expect(contracts).toBeInstanceOf(Array);
    expect(contracts.length).toBe(1);
    expect(contracts[0].name).toBe("MyContract.sol:MyContract");
    expect(contracts[0].abi).toBeInstanceOf(Array);
    expect(typeof contracts[0].bytecode).toBe("string");
  });

  it("filters by contract name when provided", () => {
    const sample = `{
      "contracts": {
        "MyContract.sol:MyContract": {
          "abi": [],"bin": "0x01"
        },
        "OtherContract.sol:Other": {
          "abi": [],"bin": "0x02"
        }
      }
    }`;
    const contracts = parseForgeOutputString(sample, "MyContract");
    expect(contracts.length).toBe(1);
    expect(contracts[0].name).toContain("MyContract");
  });
});
