import React, { useMemo, useState } from 'react';

// Import a tiny template engine from our repository (fallback to in-file templates)
let templateGen: any = null;
try {
  // Path from this file to templates/gen.js
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  templateGen = require('../../../../templates/gen');
} catch {
  templateGen = null;
}

type Standard = 'ERC20' | 'ERC721' | 'ERC1155' | 'SPL';

const TokenWizard: React.FC = () => {
  const [step, setStep] = useState<number>(1);
  const [standard, setStandard] = useState<Standard>('ERC20');
  // Step 2: parameters per standard
  const [params, setParams] = useState<any>({
    name: 'MyToken',
    symbol: 'MTK',
    supply: 1000000,
    maxSupply: 0,
    baseURI: '',
    uri: '',
    enumerable: false,
    authority: 'TOKEN_WIZARD',
    decimals: 6,
  });

  const [preview, setPreview] = useState<string>('');

  // Simple in-file templates as fallback (if importer not available)
  const inlineTemplates = useMemo(() => {
    const ERC20 = `// SPDX-License-Identifier: MIT\npragma solidity ^0.8.0;\nimport "@openzeppelin/contracts/token/ERC20/ERC20.sol";\nimport "@openzeppelin/contracts/access/Ownable.sol";\ncontract {{name}} is ERC20, Ownable {\n  {{mintableCode}}\n  {{burnableCode}}\n  {{pausableCode}}\n  constructor() ERC20("{{name}}", "{{symbol}}") {\n    _mint(msg.sender, {{supply}} * 10 ** decimals());\n  }\n}`;
    const ERC721 = `// SPDX-License-Identifier: MIT\npragma solidity ^0.8.0;\nimport "@openzeppelin/contracts/token/ERC721/ERC721.sol";\nimport "@openzeppelin/contracts/access/Ownable.sol";\ncontract {{name}} is ERC721, Ownable {\n  string private _baseURIOverride = "{{baseURI}}";\n  uint256 public maxSupply = {{maxSupply}};\n  uint256 private _totalMinted;\n  constructor() ERC721("{{name}}", "{{symbol}}") { }\n  function _baseURI() internal view override returns (string memory) { return _baseURIOverride; }\n  function mint(address to, uint256 tokenId) public onlyOwner { require(_totalMinted < maxSupply, \"Max supply reached\"); _safeMint(to, tokenId); _totalMinted += 1; }\n}`;
    const ERC1155 = `// SPDX-License-Identifier: MIT\npragma solidity ^0.8.0;\nimport "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";\nimport "@openzeppelin/contracts/access/Ownable.sol";\ncontract {{name}} is ERC1155, Ownable {\n  string private _uri = "{{uri}}";{{pausableCode}}\n  constructor() ERC1155(_uri) { }\n  function mint(address to, uint256 id, uint256 amount, bytes memory data) public onlyOwner { _mint(to, id, amount, data); }\n  {{pausableOverride}}\n}`;
    const SPL = `// SPDX-License-Identifier: MIT\nuse anchor_lang::prelude::*;\n\ndeclare_id!("{{authority}}");\n\n#[program]\npub mod {{name}} {\n  use super::*;\n  pub fn mint(_ctx: Context<Mint>, _amount: u64) -> Result<()> { Ok(()) }\n  pub fn transfer(_ctx: Context<Transfer>, _to: Pubkey, _amount: u64) -> Result<()> { Ok(()) }\n}\n`;
    return { ERC20, ERC721, ERC1155, SPL };
  }, []);

  // Build a preview by selecting the template and replacing placeholders
  const generatePreview = (std: Standard) => {
    const vars = {
      name: params.name,
      symbol: params.symbol,
      supply: String(params.supply || 0),
      baseURI: params.baseURI || '',
      maxSupply: String(params.maxSupply || 0),
      uri: params.uri || '',
      enumerableCode: params.enumerable ? '// enumerable: enabled' : '',
      mintableCode: '',
      burnableCode: '',
      pausableCode: '',
      pausableOverride: '',
      authority: params.authority || 'TOKEN_WIZARD',
      decimals: String(params.decimals || 18),
    };

    // Generate code based on standard
    if (std === 'ERC20') {
      // Optional feature snippets
      vars.mintableCode = '// mint function available';
      vars.burnableCode = '';
      vars.pausableCode = '';
      var tpl = `{{name}}` // dummy
      // Try to load a template string if available
      const tplStr = (templateGen && templateGen.generateFromTemplate) ? null : null;
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      const content = `"""ERC20 template"""`;
      // If generator exists, use it; otherwise use inline string
      if (templateGen && templateGen.generateFromTemplate) {
        // Try to fetch template content inline (not from FS in browser)
        const t = inlineTemplates.ERC20;
        const code = templateGen.generateFromTemplate(t, vars);
        return code;
      } else {
        // Fallback inline
        const t = ERC20Fallback;
        const code = t.replace(/\{\{name\}\}/g, vars.name).replace(/\{\{symbol\}\}/g, vars.symbol).replace(/\{\{supply\}\}/g, vars.supply);
        return code;
      }
    } else if (std === 'ERC721') {
      const t = inlineTemplates.ERC721;
      // simple replacement
      let code = t
        .replace(/\{\{name\}\}/g, vars.name)
        .replace(/\{\{symbol\}\}/g, vars.symbol)
        .replace(/\{\{baseURI\}\}/g, vars.baseURI)
        .replace(/\{\{maxSupply\}\}/g, vars.maxSupply);
      if (params.enumerable) {
        code = code.replace('{{enumerableCode}}', '')
      } else {
        code = code.replace('{{enumerableCode}}', '')
      }
      return code;
    } else if (std === 'ERC1155') {
      const t = inlineTemplates.ERC1155;
      let code = t
        .replace(/\{\{uri\}\}/g, vars.uri);
      return code;
    } else {
      // SPL
      const t = inlineTemplates.SPL;
      return t
        .replace(/\{\{name\}\}/g, vars.name)
        .replace(/\{\{authority\}\}/g, vars.authority);
    }
  };

  // Public preview generator (UI button triggers this)
  const onPreview = () => {
    const code = generatePreview(standard);
    setPreview(code);
  };

  // Create project: try to write to file in repo when running under Node; otherwise no-op
  const createProject = async () => {
    const code = preview || '';
    try {
      // If running in Node, write to a file path in repo
      // Use dynamic require to avoid browser bundling
      if (typeof window === 'undefined') {
        // @ts-ignore
        const fs = require('fs');
        const path = require('path');
        const dir = path.join(__dirname, '../../../../projects/token_wizard');
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
        const file = path.join(dir, `${params.name || 'Token'}.sol`);
        fs.writeFileSync(file, code);
        console.log(`Wrote project to ${file}`);
      } else {
        // Browser environment: no filesystem access; optionally copy to clipboard or show message
        console.log('Preview saved in browser (no filesystem access).');
      }
    } catch (e) {
      console.error('Failed to create project', e);
    }
  };

  // Tiny UI rendering
  return (
    <div className="token-wizard">
      <h2>Token Standard Wizard</h2>
      <div className="steps">
        <div>
          Step 1: Choose Standard
          <select value={standard} onChange={(e) => setStandard(e.target.value as Standard)}>
            <option value="ERC20">ERC20</option>
            <option value="ERC721">ERC721</option>
            <option value="ERC1155">ERC1155</option>
            <option value="SPL">SPL (Solana)</option>
          </select>
        </div>
        <div>
          Step 2: Configure Parameters
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <input placeholder="Name" value={params.name} onChange={(e) => setParams({ ...params, name: e.target.value })} />
            <input placeholder="Symbol" value={params.symbol} onChange={(e) => setParams({ ...params, symbol: e.target.value })} />
            {standard === 'ERC20' && (
              <React.Fragment>
                <input placeholder="Supply" type="number" value={params.supply} onChange={(e) => setParams({ ...params, supply: Number(e.target.value) })} />
                <input placeholder="Decimals" type="number" value={params.decimals} onChange={(e) => setParams({ ...params, decimals: Number(e.target.value) })} />
              </React.Fragment>
            )}
            {standard === 'ERC721' && (
              <React.Fragment>
                <input placeholder="Max Supply" type="number" value={params.maxSupply} onChange={(e) => setParams({ ...params, maxSupply: Number(e.target.value) })} />
                <input placeholder="Base URI" value={params.baseURI} onChange={(e) => setParams({ ...params, baseURI: e.target.value })} />
              </React.Fragment>
            )}
            {standard === 'ERC1155' && (
              <React.Fragment>
                <input placeholder="URI" value={params.uri} onChange={(e) => setParams({ ...params, uri: e.target.value })} />
              </React.Fragment>
            )}
            {standard === 'SPL' && (
              <React.Fragment>
                <input placeholder="Authority" value={params.authority} onChange={(e) => setParams({ ...params, authority: e.target.value })} />
              </React.Fragment>
            )}
          </div>
        </div>
        <div>
          Step 3: Preview
          <div style={{ border: '1px solid #ccc', padding: 8, borderRadius: 4, minHeight: 120 }}>
            <pre style={{ margin: 0 }}>{preview || '// click Preview to generate code'}</pre>
          </div>
        </div>
        <div>
          Step 4: Create Project
          <button onClick={onPreview}>Preview</button>
          <button onClick={createProject} style={{ marginLeft: 8 }}>Create Project</button>
        </div>
      </div>
      <div style={{ marginTop: 12 }}>
        <button onClick={() => setStep((s) => Math.max(1, s - 1))}>Back</button>
        <button onClick={() => setStep((s) => Math.min(4, s + 1))} style={{ marginLeft: 8 }}>Next</button>
      </div>
    </div>
  );
};

// Lightweight fallback template strings (to render without runtime template loader)
const ERC20Fallback = `// SPDX-License-Identifier: MIT\npragma solidity ^0.8.0;\nimport "@openzeppelin/contracts/token/ERC20/ERC20.sol";\ncontract {{name}} is ERC20 {\n  constructor() ERC20("{{name}}", "{{symbol}}") {\n    _mint(msg.sender, {{supply}} * 10 ** decimals());\n  }\n}`;

export default TokenWizard;
