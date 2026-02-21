import * as fs from 'fs';
import * as path from 'path';

const configPath = path.join(__dirname, '../mcp-servers.json');

test('mcp-servers.json exists and is valid JSON', () => {
  expect(fs.existsSync(configPath)).toBe(true);
  
  const content = fs.readFileSync(configPath, 'utf-8');
  const config = JSON.parse(content);
  
  expect(config).toHaveProperty('mcpServers');
  expect(config).toHaveProperty('chainModes');
});

test('mcp-servers.json has solana and evm servers', () => {
  const content = fs.readFileSync(configPath, 'utf-8');
  const config = JSON.parse(content);
  
  expect(config.mcpServers).toHaveProperty('solana');
  expect(config.mcpServers).toHaveProperty('evm');
  
  expect(config.mcpServers.solana.name).toBe('solana-mcp');
  expect(config.mcpServers.evm.name).toBe('evm-mcp-server');
});

test('mcp-servers.json has svm and evm chain modes', () => {
  const content = fs.readFileSync(configPath, 'utf-8');
  const config = JSON.parse(content);
  
  expect(config.chainModes).toHaveProperty('svm');
  expect(config.chainModes).toHaveProperty('evm');
  
  expect(config.chainModes.svm.mcpServer).toBe('solana');
  expect(config.chainModes.evm.mcpServer).toBe('evm');
});

test('mcp-servers.json solana has required capabilities', () => {
  const content = fs.readFileSync(configPath, 'utf-8');
  const config = JSON.parse(content);
  
  const solanaCapabilities = config.mcpServers.solana.capabilities;
  expect(solanaCapabilities).toContain('getBalance');
  expect(solanaCapabilities).toContain('requestAirdrop');
});

test('mcp-servers.json evm has required capabilities', () => {
  const content = fs.readFileSync(configPath, 'utf-8');
  const config = JSON.parse(content);
  
  const evmCapabilities = config.mcpServers.evm.capabilities;
  expect(evmCapabilities).toContain('getBalance');
  expect(evmCapabilities).toContain('getERC20Balance');
});
