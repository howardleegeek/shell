import { Tool } from "@modelcontextprotocol/sdk";
import { execSync } from "child_process";
import { parseEther } from "@ethersproject/units";
import { Interface, parseTransaction } from "@ethersproject/abi";
import { decodeParams } from "@ethersproject/abi/lib/format.js";

export const contractInteract: Tool = {
  name: "contract_interact",
  description: "Call a function on a deployed smart contract.",
  inputSchema: {
    type: "object",
    properties: {
      address: { type: "string", description: "Contract address" },
      abi: {
        oneOf: [
          { type: "string", description: "Path to ABI JSON file" },
          { 
            type: "array", 
            description: "ABI array", 
            items: { type: "object" }
          }
        ]
      },
      function_name: { type: "string", description: "Function name to call" },
      args: { 
        type: "array", 
        description: "Function arguments", 
        items: { type: "any" },
        default: []
      },
      value: { 
        type: "string", 
        description: "Amount of ETH to send (in wei)", 
        default: "0"
      },
      from: { 
        type: "string", 
        description: "Caller address (optional)", 
        default: null
      },
      call_type: {
        type: "string",
        enum: ["read", "write"],
        description: "Type of call: read for view/pure functions, write for state-changing functions"
      }
    },
    required: ["address", "abi", "function_name", "call_type"]
  },

  async execute(input) {
    const { address, abi, function_name, args = [], value = "0", from = null, call_type } = input;
    
    // Load ABI
    let abiArray;
    if (typeof abi === 'string') {
      try {
        const fs = await import('fs');
        const path = await import('path');
        const absPath = path.isAbsolute(abi) ? abi : path.join(process.cwd(), abi);
        if (!fs.existsSync(absPath)) {
          throw new Error(`ABI file not found: ${absPath}`);
        }
        const abiContent = fs.readFileSync(absPath, 'utf8');
        try {
          abiArray = JSON.parse(abiContent);
        } catch (e) {
          abiArray = JSON.parse(abiContent.replace(/^\s*\/\/.*$/gm, '')); // Remove comments
        }
      } catch (e) {
        throw new Error(`Failed to load ABI from file: ${e.message}`);
      }
    } else {
      abiArray = abi;
    }

    const iface = new Interface(abiArray);
    
    // Find the function in ABI
    const functionFragment = iface.getFunction(function_name);
    if (!functionFragment) {
      throw new Error(`Function \"${function_name}\" not found in ABI`);
    }

    // Encode the function call
    let encodedData;
    try {
      encodedData = iface.encodeFunctionData(functionFragment, args);
    } catch (e) {
      throw new Error(`Failed to encode function call: ${e.message}`);
    }

    const rpcUrl = "http://127.0.0.1:8545";
    const result = {
      success: false,
      result: null,
      raw_result: null,
      tx_hash: null,
      gas_used: null,
      events: [],
      error: null
    };

    if (call_type === "read") {
      try {
        // Use cast call for read operations
        const command = [
          "cast", "call",
          address,
          `\"${function_name}(${args.map(arg => typeof arg === 'string' ? arg : JSON.stringify(arg)).join(',')})\"`,
          "--rpc-url", rpcUrl,
          "--decode", "true"
        ];

        const output = execSync(command.join(' '), { encoding: 'utf8' });
        
        // Parse the output to extract decoded result
        const lines = output.trim().split('\n');
        const decodedResult = lines.find(line => line.startsWith('Decoded output:'));
        
        if (decodedResult) {
          const decodedValue = decodedResult.replace('Decoded output: ', '').trim();
          result.success = true;
          result.result = decodedValue;
          result.raw_result = encodedData;
        } else {
          result.success = true;
          result.result = output.trim();
          result.raw_result = encodedData;
        }
      } catch (e) {
        result.error = `Read call failed: ${e.message}`;
        throw new Error(result.error);
      }
    } else if (call_type === "write") {
      try {
        // Use cast send for write operations
        const privateKey = process.env.PRIVATE_KEY || "0x0123456789012345678901234567890123456789012345678901234567890123"; // Default Anvil key
        const fromAddress = from || "0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266"; // Default Anvil first account

        const command = [
          "cast", "send",
          address,
          `\"${function_name}(${args.map(arg => typeof arg === 'string' ? arg : JSON.stringify(arg)).join(',')})\"`,
          "--private-key", privateKey,
          "--value", value,
          "--from", fromAddress,
          "--rpc-url", rpcUrl,
          "--estimate", "true",
          "--yes"
        ];

        const output = execSync(command.join(' '), { encoding: 'utf8' });
        
        // Parse the output to extract transaction hash and gas used
        const lines = output.trim().split('\n');
        const txHashLine = lines.find(line => line.startsWith('Transaction hash:'));
        const gasUsedLine = lines.find(line => line.startsWith('Gas used:'));
        
        if (txHashLine) {
          result.tx_hash = txHashLine.replace('Transaction hash: ', '').trim();
        }
        if (gasUsedLine) {
          result.gas_used = parseInt(gasUsedLine.replace('Gas used: ', '').trim());
        }
        
        // Try to extract events from the output
        const events = [];
        let inEvents = false;
        for (const line of lines) {
          if (line === 'Events:') {
            inEvents = true;
            continue;
          }
          if (inEvents && line.trim()) {
            const eventMatch = line.match(/^([^\(]+)\(([^\)]+)\)$/);
            if (eventMatch) {
              events.push({
                name: eventMatch[1].trim(),
                args: eventMatch[2].split(',').map(arg => arg.trim())
              });
            }
          }
        }
        
        if (events.length > 0) {
          result.events = events;
        }
        
        result.success = true;
        result.result = { tx_hash: result.tx_hash };
        
      } catch (e) {
        result.error = `Write call failed: ${e.message}`;
        throw new Error(result.error);
      }
    }

    return result;
  }
};

// Helper function to decode hex values
function decodeHex(value: string, types: string[]): any {
  try {
    return decodeParams(types, value);
  } catch (e) {
    return value; // Return raw value if decoding fails
  }
}