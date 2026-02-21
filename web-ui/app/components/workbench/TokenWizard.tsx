import React, { useMemo, useState, useEffect } from 'react';

type Standard = 'ERC20' | 'ERC721' | 'ERC1155' | 'SPL';

type ERC20Params = {
  name: string;
  symbol: string;
  supply: string;
  mintable: boolean;
  burnable: boolean;
  pausable: boolean;
};

type ERC721Params = {
  name: string;
  symbol: string;
  maxSupply: string;
  baseURI: string;
  enumerable: boolean;
};

type ERC1155Params = {
  uri: string;
  pausable: boolean;
};

type SPLParams = {
  name: string;
  symbol: string;
  decimals: string;
  authority: string;
};

type Project = {
  id: string;
  title: string;
  standard: Standard;
  code: string;
  createdAt: string;
};

const ERC20_TPL = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
contract {{name}} is ERC20, Ownable, Pausable {
  bool public mintable; bool public burnable; bool public pausableFlag;
  constructor(string memory name_, string memory symbol_, uint256 initialSupply, bool mintable_, bool burnable_, bool pausable_) ERC20(name_, symbol_) {
    _mint(msg.sender, initialSupply); mintable = mintable_; burnable = burnable_; pausableFlag = pausable_;
  }
  function mint(address to, uint256 amount) public onlyOwner { require(mintable, "Minting disabled"); _mint(to, amount); }
  function burn(uint256 amount) public { require(burnable, "Burning disabled"); _burn(msg.sender, amount); }
  function pause() public onlyOwner { require(pausableFlag, "Pausing disabled"); _pause(); }
  function unpause() public onlyOwner { require(pausableFlag, "Pausing disabled"); _unpause(); }
  function _beforeTokenTransfer(address from, address to, uint256 amount) internal override { super._beforeTokenTransfer(from, to, amount); require(!paused(), "Token transfer paused"); }
}`;

const ERC721_TPL = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
contract {{name}} is ERC721, ERC721Enumerable, Ownable {
  using Counters for Counters.Counter; Counters.Counter private _tokenIdCounter;
  uint256 public maxSupply; string private _baseTokenURI; bool public enumerable;
  constructor(string memory name_, string memory symbol_, uint256 maxSupply_, string memory baseURI_, bool enumerable_) ERC721(name_, symbol_) { maxSupply = maxSupply_; _baseTokenURI = baseURI_; enumerable = enumerable_; }
  function _baseURI() internal view override returns (string memory) { return _baseTokenURI; }
  function mint(address to) public onlyOwner returns (uint256) { if (maxSupply > 0) { uint256 current = _tokenIdCounter.current(); require(current < maxSupply, "Max supply reached"); } _tokenIdCounter.increment(); uint256 tokenId = _tokenIdCounter.current(); _safeMint(to, tokenId); return tokenId; }
  function _beforeTokenTransfer(address from, address to, uint256 tokenId) internal override(ERC721, ERC721Enumerable) { super._beforeTokenTransfer(from, to, tokenId); }
  function supportsInterface(bytes4 interfaceId) public view override(ERC721, ERC721Enumerable) returns (bool) { return super.supportsInterface(interfaceId); }
}`;

const ERC1155_TPL = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
contract {{name}} is ERC1155, Ownable {
  string public name; string public symbol; bool public paused; bool public pausableFlag;
  constructor(string memory uri_, string memory name_, string memory symbol_, bool pausable_) ERC1155(uri_) { name = name_; symbol = symbol_; pausableFlag = pausable_; paused = false; }
  function setPaused(bool v) public onlyOwner { require(pausableFlag, "Pausing disabled"); paused = v; }
  function mint(address to, uint256 id, uint256 amount, bytes memory data) public onlyOwner { require(!paused, "Paused"); _mint(to, id, amount, data); }
  function burn(address from, uint256 id, uint256 amount) public onlyOwner { require(!paused, "Paused"); _burn(from, id, amount); }
}`;

const SPL_TPL = `// SPDX-License-Identifier: MIT
// Anchor SPL Token template with mint/transfer instructions
use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, TokenAccount, MintTo, Transfer};
#[program]\npub mod {{program_name}} {\n  use super::*;\n  pub fn initialize(ctx: Context<Initialize>, decimals: u8) -> Result<()> { token::initialize_mint(ctx.accounts.mint.to_account_info(), decimals, ctx.accounts.mint_authority.key, None)?; Ok(()) }\n  pub fn mint_to(ctx: Context<MintTo>, amount: u64) -> Result<()> { token::mint_to(ctx.accounts.mint.to_account_info(), ctx.accounts.to.to_account_info(), ctx.accounts.authority.key, amount)?; Ok(()) }\n  pub fn transfer(ctx: Context<Transfer>, amount: u64) -> Result<()> { token::transfer(ctx.accounts.from.to_account_info(), ctx.accounts.to.to_account_info(), ctx.accounts.authority.key, amount)?; Ok(()) }\n}\n#[derive(Accounts)]\npub struct Initialize<'info> { #[account(init, payer = payer, mint)] pub mint: Account<'info, Mint>, #[account(mut)] pub payer: Signer<'info>, pub mint_authority: Signer<'info>, pub system_program: Program<'info, System>, pub token_program: Program<'info, anchor_spl::token::Token>, pub rent: sysvar::Rent, }\n#[derive(Accounts)]\npub struct MintTo<'info> { #[account(mut)] pub mint: Account<'info, Mint>, #[account(mut)] pub to: Account<'info, TokenAccount>, pub authority: Signer<'info>, pub token_program: Program<'info, anchor_spl::token::Token>, }\n#[derive(Accounts)]\npub struct Transfer<'info> { #[account(mut)] pub from: Account<'info, TokenAccount>, #[account(mut)] pub to: Account<'info, TokenAccount>, pub authority: Signer<'info>, pub token_program: Program<'info, anchor_spl::token::Token>, }`;

type ProjectPreviewData = {
  name: string;
};

const TemplatePreview = (): string => '';

export default function TokenWizard() {
  const [standard, setStandard] = useState<Standard>('ERC20');
  const [params, setParams] = useState<any>({});
  const [projects, setProjects] = useState<Project[]>([]);

  useEffect(() => {
    // load existing projects from localStorage
    const raw = localStorage.getItem('tokenWizardProjects');
    if (raw) {
      try { setProjects(JSON.parse(raw)); } catch {} 
    }
  }, []);

  const renderTemplate = useMemo(() => {
    // Build code from templates with placeholders replaced by current params
    const t = (() => {
      switch (standard) {
        case 'ERC20': return ERC20_TPL; 
        case 'ERC721': return ERC721_TPL;
        case 'ERC1155': return ERC1155_TPL;
        case 'SPL': return SPL_TPL;
      }
    })();
    const data: any = {
      name: params.name || 'Token',
      symbol: params.symbol || 'TKN',
      // ERC20
      initialSupply: (params as any).supply ?? 1000000,
      mintable: (params as any).mintable ?? true,
      burnable: (params as any).burnable ?? true,
      pausable: (params as any).pausable ?? false,
      // ERC721
      maxSupply: (params as any).maxSupply ?? 0,
      baseURI: (params as any).baseURI ?? '',
      enumerable: (params as any).enumerable ?? true,
      // ERC1155
      uri: (params as any).uri ?? '',
      // SPL
      program_name: (params as any).program_name ?? 'spl_token',
    };
    let code = t;
    Object.keys(data).forEach((k) => {
      const re = new RegExp(`{{${k}}}`, 'g');
      const val = (data as any)[k];
      code = code.replace(re, String(val));
    });
    return code;
  }, [standard, params]);

  const createProject = () => {
    const id = String(Date.now());
    const title = `Token ${standard} Project`;
    const code = renderTemplate;
    const project: Project = { id, title, standard, code, createdAt: new Date().toISOString() } as any;
    const next = [...projects, project];
    setProjects(next);
    localStorage.setItem('tokenWizardProjects', JSON.stringify(next));
    alert('Project created in editor (simulated).');
  };

  return (
    <div style={{ padding: 16 }}>
      <h3>Token Wizard</h3>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div>
          <label>Step 1: Select Standard</label>
          <select value={standard} onChange={(e) => setStandard(e.target.value as Standard)} style={{ width: '100%', padding: 8 }}>
            <option value="ERC20">ERC20</option>
            <option value="ERC721">ERC721</option>
            <option value="ERC1155">ERC1155</option>
            <option value="SPL">SPL</option>
          </select>
        </div>
        <div>
          <label>Step 2: Parameters (live validation)</label>
          {standard === 'ERC20' && (
            <div>
              <input placeholder="Name" value={params.name || ''} onChange={e=>setParams({...params, name: e.target.value})} style={{width:'100%', padding:6, marginBottom:6}}/>
              <input placeholder="Symbol" value={params.symbol || ''} onChange={e=>setParams({...params, symbol: e.target.value})} style={{width:'100%', padding:6, marginBottom:6}}/>
              <input placeholder="Supply" type="number" value={params.supply || ''} onChange={e=>setParams({...params, supply: e.target.value})} style={{width:'100%', padding:6, marginBottom:6}}/>
              <label><input type="checkbox" checked={params.mintable ?? true} onChange={e=>setParams({...params, mintable: e.target.checked})}/> Mintable</label><br/>
              <label><input type="checkbox" checked={params.burnable ?? true} onChange={e=>setParams({...params, burnable: e.target.checked})}/> Burnable</label><br/>
              <label><input type="checkbox" checked={params.pausable ?? false} onChange={e=>setParams({...params, pausable: e.target.checked})}/> Pausable</label>
            </div>
          )}
          {standard === 'ERC721' && (
            <div>
              <input placeholder="Name" value={params.name || ''} onChange={e=>setParams({...params, name: e.target.value})} style={{width:'100%', padding:6, marginBottom:6}}/>
              <input placeholder="Symbol" value={params.symbol || ''} onChange={e=>setParams({...params, symbol: e.target.value})} style={{width:'100%', padding:6, marginBottom:6}}/>
              <input placeholder="Max Supply" value={params.maxSupply || ''} onChange={e=>setParams({...params, maxSupply: e.target.value})} style={{width:'100%', padding:6, marginBottom:6}}/>
              <input placeholder="Base URI" value={params.baseURI || ''} onChange={e=>setParams({...params, baseURI: e.target.value})} style={{width:'100%', padding:6, marginBottom:6}}/>
              <label><input type="checkbox" checked={params.enumerable ?? true} onChange={e=>setParams({...params, enumerable: e.target.checked})}/> Enumerable</label>
            </div>
          )}
          {standard === 'ERC1155' && (
            <div>
              <input placeholder="URI" value={params.uri || ''} onChange={e=>setParams({...params, uri: e.target.value})} style={{width:'100%', padding:6, marginBottom:6}}/>
              <label><input type="checkbox" checked={params.pausable ?? false} onChange={e=>setParams({...params, pausable: e.target.checked})}/> Pausable</label>
            </div>
          )}
          {standard === 'SPL' && (
            <div>
              <input placeholder="Name" value={params.name || ''} onChange={e=>setParams({...params, name: e.target.value})} style={{width:'100%', padding:6, marginBottom:6}}/>
              <input placeholder="Symbol" value={params.symbol || ''} onChange={e=>setParams({...params, symbol: e.target.value})} style={{width:'100%', padding:6, marginBottom:6}}/>
              <input placeholder="Decimals" value={params.decimals || ''} onChange={e=>setParams({...params, decimals: e.target.value})} style={{width:'100%', padding:6, marginBottom:6}}/>
              <input placeholder="Authority" value={params.authority || ''} onChange={e=>setParams({...params, authority: e.target.value})} style={{width:'100%', padding:6, marginBottom:6}}/>
            </div>
          )}
        </div>
      </div>
      <hr />
      <div>
        <h4>Step 3: Preview</h4>
        <pre style={{ background: '#0f172a', color: '#e2e8f0', padding: 12, borderRadius: 6, maxHeight: 320, overflow: 'auto' }}>
{renderTemplate}
        </pre>
      </div>
      <button onClick={createProject} style={{ marginTop: 12, padding: '8px 16px' }}>
        Create Project
      </button>
      <hr />
      <div>
        <h4>Step 4: Projects</h4>
        {projects.length === 0 ? (
          <div>No projects yet.</div>
        ) : (
          <ul>
            {projects.map(p => (
              <li key={p.id}>{p.title} - {p.standard} - {new Date(p.createdAt).toLocaleString()}</li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
