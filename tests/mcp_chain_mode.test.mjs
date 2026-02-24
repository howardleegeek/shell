import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { buildChainMcpConfig, getMcpServerNameForChain } from '../web-ui/app/lib/services/chainMcpConfig.js';

test('desktop mcp config includes solana-mcp and evm-mcp-server chain mappings', async () => {
  const raw = await readFile(new URL('../desktop/mcp-servers.json', import.meta.url), 'utf8');
  const config = JSON.parse(raw);

  assert.ok(config.mcpServers['solana-mcp']);
  assert.ok(config.mcpServers['evm-mcp-server']);
  assert.equal(config.chainModes.svm.mcpServer, 'solana-mcp');
  assert.equal(config.chainModes.evm.mcpServer, 'evm-mcp-server');
});

test('buildChainMcpConfig returns Solana MCP config for svm mode', () => {
  const config = buildChainMcpConfig('svm', 'devnet');
  const server = config.mcpServers['solana-mcp'];

  assert.ok(server);
  assert.equal(getMcpServerNameForChain('svm'), 'solana-mcp');
  assert.deepEqual(server.args, ['-y', 'solana-mcp']);
  assert.equal(server.env.SOLANA_CLUSTER, 'devnet');
});

test('buildChainMcpConfig returns EVM MCP config for evm mode', () => {
  const config = buildChainMcpConfig('evm', 'sepolia');
  const server = config.mcpServers['evm-mcp-server'];

  assert.ok(server);
  assert.equal(getMcpServerNameForChain('evm'), 'evm-mcp-server');
  assert.deepEqual(server.args, ['-y', 'evm-mcp-server']);
  assert.equal(server.env.EVM_DEFAULT_NETWORK, 'sepolia');
});
