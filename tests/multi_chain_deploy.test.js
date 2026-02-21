const assert = require('node:assert');
const {
  NETWORKS,
  createDefaultDeployConfig,
  serializeDeployConfig,
  parseDeployConfig,
  buildExplorerTxUrl,
  deploySelectedNetworks,
  verifyAllWithSourcify,
} = require('../web-ui/app/lib/web3/multiChainDeploy.js');

async function testParallelAndRetry() {
  const config = createDefaultDeployConfig();
  config.contract = 'MyToken.sol';
  config.retryLimit = 1;
  config.networks.sepolia.selected = true;
  config.networks['base-sepolia'].selected = true;
  config.networks['solana-devnet'].selected = true;

  const attempts = { sepolia: 0, 'base-sepolia': 0, 'solana-devnet': 0 };
  const started = {};
  const updates = [];
  const adapters = {
    async deployEvm({ network }) {
      started[network.id] = started[network.id] || Date.now();
      attempts[network.id] += 1;
      await new Promise((resolve) => setTimeout(resolve, 80));

      if (network.id === 'base-sepolia' && attempts[network.id] === 1) {
        throw new Error('temporary rpc issue');
      }

      return {
        address: `0x${network.id.replace(/-/g, '').padEnd(40, '0').slice(0, 40)}`,
        txHash: `0x${network.id.replace(/-/g, '').padEnd(64, 'a').slice(0, 64)}`,
      };
    },
    async deploySvm({ network }) {
      started[network.id] = started[network.id] || Date.now();
      attempts[network.id] += 1;
      await new Promise((resolve) => setTimeout(resolve, 80));
      return { address: `${network.id}Addr`, txHash: `${network.id}Tx` };
    },
  };

  const result = await deploySelectedNetworks({
    contract: config.contract,
    networkConfigs: config.networks,
    retryLimit: config.retryLimit,
    adapters,
    onUpdate: (networkId, state) => updates.push(`${networkId}:${state.status}:${state.attempt}`),
  });

  assert.equal(result.length, 3, 'should deploy all selected networks');
  assert.ok(Math.abs(started.sepolia - started['base-sepolia']) < 40, 'evm deployments should start in parallel');
  assert.ok(Math.abs(started.sepolia - started['solana-devnet']) < 40, 'svm deployments should start in parallel');
  assert.equal(attempts['base-sepolia'], 2, 'failed network should retry once');
  assert.ok(updates.includes('base-sepolia:retrying:1'), 'should emit retry state update');

  const failed = result.find((item) => item.status === 'failed');
  assert.equal(failed, undefined, 'all selected networks should eventually succeed');
}

async function testSummaryAndVerify() {
  const sample = [
    {
      networkId: 'sepolia',
      networkLabel: 'Sepolia',
      networkType: 'evm',
      status: 'success',
      address: '0x1111111111111111111111111111111111111111',
      txHash: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
      explorerUrl: buildExplorerTxUrl('sepolia', '0xaaaa'),
    },
    {
      networkId: 'solana-devnet',
      networkLabel: 'Solana Devnet',
      networkType: 'svm',
      status: 'success',
      address: 'Dev111111111111111',
      txHash: 'DevTx111',
      explorerUrl: buildExplorerTxUrl('solana-devnet', 'DevTx111'),
    },
  ];

  const verify = await verifyAllWithSourcify(sample);
  assert.equal(verify.length, 1, 'only evm networks should be verified via Sourcify');
  assert.equal(verify[0].networkId, 'sepolia');
  assert.equal(verify[0].status, 'verified');
  assert.ok(verify[0].verifyUrl.includes('sourcify.dev'));
}

function testConfigRoundtrip() {
  const base = createDefaultDeployConfig();
  base.contract = 'Vault.sol';
  base.networks['arbitrum-sepolia'].selected = true;
  base.networks['arbitrum-sepolia'].constructorArgs = 'owner,1000';

  const serialized = serializeDeployConfig(base);
  const parsed = parseDeployConfig(serialized);
  assert.equal(parsed.contract, 'Vault.sol');
  assert.equal(parsed.networks['arbitrum-sepolia'].selected, true);
  assert.equal(parsed.networks['arbitrum-sepolia'].constructorArgs, 'owner,1000');
}

function testNetworkList() {
  const ids = NETWORKS.map((item) => item.id);
  assert.ok(ids.includes('sepolia'));
  assert.ok(ids.includes('solana-testnet'));
}

(async () => {
  try {
    await testParallelAndRetry();
    await testSummaryAndVerify();
    testConfigRoundtrip();
    testNetworkList();
    console.log('multi_chain_deploy.test: ok');
    process.exit(0);
  } catch (error) {
    console.error('multi_chain_deploy.test: failed', error);
    process.exit(1);
  }
})();
