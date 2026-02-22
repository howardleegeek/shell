// Lightweight, deterministic doc generator for NatSpec (Solidity) and Rust Anchor.
// This module is intentionally dependency-free and pure, to ease testing.

// AI prompt templates (kept for reference; generator is deterministic in this kata)
export const AI_PROMPT_SYSTEM_SOLIDITY = `You are Solidity NatSpec/Documentation AI. Produce concise NatSpec blocks only. Do not modify code.`
export const AI_PROMPT_SYSTEM_RUST = `You are Rust Anchor Doc AI. Produce Rust doc comments only. Do not modify code.`

export function generateSolidityNatSpec(code: string): string {
  // Generate NatSpec blocks for every Solidity function found in the code.
  // This keeps changes idempotent and predictable for tests.
  const lines = code.split(/\r?\n/);
  const result: string[] = [];
  const n = lines.length;
  let i = 0;
  const functionRegex = /^\s*function\s+([a-zA-Z0-9_]+)\s*\((.*)\)\s*(.*)\{?/;
  while (i < n) {
    const line = lines[i];
    const funcMatch = line.match(functionRegex);
    if (funcMatch) {
      const name = funcMatch[1];
      // Build full signature across lines until '{' is found
      let signature = funcMatch[0];
      let j = i + 1;
      while (!signature.includes("{") && j < n) {
        signature += ' ' + lines[j];
        j++;
      }
      // extract param names inside the first pair of parentheses
      const parenMatch = signature.match(/\(([^)]*)\)/);
      const paramNames: string[] = [];
      if (parenMatch) {
        const params = parenMatch[1];
        if (params.trim()) {
          const parts = params.split(',');
          for (const p of parts) {
            const trimmed = p.trim();
            const tokens = trimmed.split(/\s+/);
            const last = tokens[tokens.length - 1];
            if (last && /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(last)) {
              paramNames.push(last);
            }
          }
        }
      }

      // Build a NatSpec block for this function
      const blocks: string[] = [];
      blocks.push("/**");
      blocks.push(" * @title " + name);
      blocks.push(" * @author AI");
      blocks.push(" * @notice Auto-generated NatSpec by AI assistant");
      blocks.push(" * @dev Do not modify logic; generated comments only");
      for (const p of paramNames) {
        blocks.push(` * @param ${p} Auto-generated doc for parameter ${p}`);
      }
      blocks.push(" * @return Auto-generated doc for return value");
      blocks.push(" */");

      // Emit doc block, then the original function line (and keep rest as-is)
      result.push(...blocks);
      // We'll re-emit the original function line and any following lines as-is
      // Emit the function start line (i.e., lines[i]) and then advance accordingly
      result.push(lines[i]);
      // If the '{' wasn't on the same line, the subsequent lines should continue as-is.
      i++;
      // Copy the rest of the signature body until we've reached the end of the line block
      // by scanning until the line that contains '{' has been consumed; the rest of the file
      // is copied in the next iterations.
      // To keep behavior simple, continue with normal loop; the added doc is already in place.
      continue;
    } else {
      result.push(line);
      i++;
    }
  }

  // If no function found, return original
  if (result.length === 0) return code;
  return result.join("\n");
}

export function generateRustAnchorDoc(code: string): string {
  const lines = code.split(/\r?\n/);
  const out: string[] = [];
  const n = lines.length;
  let i = 0;
  while (i < n) {
    const line = lines[i];
    // Handle struct fields: pub struct / opening brace handled later
    if (/^\s*pub\s+struct\s+([A-Za-z0-9_]+)\s*\{?/.test(line)) {
      const structNameMatch = line.match(/^\s*pub\s+struct\s+([A-Za-z0-9_]+)\s*\{?/);
      const structName = structNameMatch ? structNameMatch[1] : "Struct";
      out.push(line);
      i++;
      // annotate fields inside this struct
      while (i < n) {
        const l = lines[i];
        out.push(l);
        const endBrace = l.includes("}");
        if (endBrace) break;
        // field line pattern: pub field: Type,
        const fieldMatch = l.match(/^\s*pub\s+([A-Za-z0-9_]+)\s*:\s*([^,]+),?/);
        if (fieldMatch) {
          const fieldName = fieldMatch[1];
          // insert a doc comment above the field line
          // We'll insert after the previous line in the output, so we modify the last pushed line
          // Simpler: push an extra doc line before the current field line by removing last push and re-adding
          const doc = `/// ${fieldName} - auto-documented field of ${structName}`;
          // remove the field line from output and re-add with doc + field
          out.pop();
          out.push(doc);
          out.push(l);
        }
        i++;
      }
      // keep going after struct end
      i++;
      continue;
    }
    // Function handler: pub fn or fn
    if (/^\s*pub\s+fn\s+([a-zA-Z0-9_]+)\s*\(/.test(line) || /^\s*fn\s+([a-zA-Z0-9_]+)\s*\(/.test(line)) {
      const m = line.match(/^(\s*)(?:pub\s+)?fn\s+([a-zA-Z0-9_]+)\s*\((.*)$/);
      const indent = m ? m[1] : "";
      const name = m ? m[2] : "unknown";
      // Build doc block
      const blocks = ["/// Auto-generated doc for function " + name, "///"];
      blocks.forEach((b) => out.push(b));
      // simply insert a minimal doc and then the original line
      out.push(line);
      i++;
      continue;
    }
    out.push(line);
    i++;
  }

  return out.join("\n");
}
