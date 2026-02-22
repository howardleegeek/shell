import assert from 'node:assert/strict';
import test from 'node:test';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const abiManager = require('../app/lib/abi-manager.js');

const oldAbi = [
  {
    type: 'function',
    name: 'setValue',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'value', type: 'uint256' }],
    outputs: [],
  },
  {
    type: 'event',
    name: 'Updated',
    inputs: [{ name: 'value', type: 'uint256', indexed: false }],
  },
];

const newAbi = [
  {
    type: 'function',
    name: 'setValue',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'value', type: 'uint256' }, { name: 'nonce', type: 'uint256' }],
    outputs: [],
  },
  {
    type: 'function',
    name: 'owner',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'address' }],
  },
  {
    type: 'event',
    name: 'Updated',
    inputs: [{ name: 'value', type: 'uint256', indexed: false }],
  },
];

test('groupAbiEntries groups function/event/error for ABI viewer', () => {
  const groups = abiManager.groupAbiEntries([
    ...oldAbi,
    { type: 'error', name: 'Unauthorized', inputs: [] },
  ]);

  assert.equal(groups.functions.length, 1);
  assert.equal(groups.events.length, 1);
  assert.equal(groups.errors.length, 1);
  assert.equal(groups.functions[0].name, 'setValue');
});

test('inferAbiFromBytecode uses WhatsABI adapter', async () => {
  let called = false;

  const inferred = await abiManager.inferAbiFromBytecode('0x60006000', {
    whatsabiInfer: async (bytecode) => {
      called = true;
      assert.equal(bytecode, '0x60006000');
      return oldAbi;
    },
  });

  assert.equal(called, true);
  assert.equal(inferred.length, oldAbi.length);
});

test('fetchAbiFromAddress pulls ABI from contract address source', async () => {
  const abi = await abiManager.fetchAbiFromAddress('0xabc', {
    chainId: '1',
    fetchImpl: async (url) => {
      if (url.includes('sourcify')) {
        return {
          ok: true,
          async json() {
            return { output: { abi: oldAbi } };
          },
        };
      }

      return { ok: false, async json() { return {}; } };
    },
  });

  assert.equal(abi.length, oldAbi.length);
  assert.equal(abi[0].name, 'setValue');
});

test('diffAbis reports added/modified and backward compatibility', () => {
  const diff = abiManager.diffAbis(oldAbi, newAbi);

  assert.equal(diff.added.length, 2);
  assert.equal(diff.removed.length, 1);
  assert.equal(diff.modified.length, 1);
  assert.equal(diff.compatibility.backwardCompatible, false);
  assert.ok(diff.compatibility.breakingChanges.some((line) => line.includes('Changed function setValue')));
});

test('exports TypeScript and interface snippets', () => {
  const types = abiManager.exportTypeScriptTypes(newAbi, { interfaceName: 'ManagedAbi' });
  const ethersInterface = abiManager.exportEthersInterface(newAbi, { abiVarName: 'managedAbi' });
  const viemAbi = abiManager.exportViemAbi(newAbi, { abiVarName: 'managedAbi' });

  assert.ok(types.includes('export interface ManagedAbi'));
  assert.ok(types.includes('setValue(value: bigint, nonce: bigint): Promise<void>;'));
  assert.ok(ethersInterface.includes("import { Interface } from 'ethers';"));
  assert.ok(viemAbi.includes('export const managedAbi ='));
});
