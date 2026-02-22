const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function read(rel) {
  return fs.readFileSync(path.join(root, rel), 'utf8');
}

try {
  const deployTemplate = read('templates/foundry-scripts/Deploy.s.sol.template');
  const upgradeTemplate = read('templates/foundry-scripts/Upgrade.s.sol.template');
  const interactionTemplate = read('templates/foundry-scripts/Interaction.s.sol.template');
  const runner = read('web-ui/app/components/workbench/ScriptRunner.tsx');

  assert(deployTemplate.includes('new ${CONTRACT_NAME}(${CONSTRUCTOR_ARGS})'), 'deploy template should include constructor args');
  assert(upgradeTemplate.includes('upgradeTo(implementation)'), 'upgrade template should call upgradeTo');
  assert(interactionTemplate.includes('${INTERACTION_CALL};'), 'interaction template should include interaction placeholder');

  assert(runner.includes('forge script script/Deploy.s.sol'), 'runner should use forge script command');
  assert(runner.includes('--broadcast'), 'runner should support broadcast mode');
  assert(runner.includes('--verify --etherscan-api-key'), 'runner should support verify mode');
  assert(runner.includes('parseForgeScriptOutput'), 'runner should include output parser');
  assert(runner.includes('Deployed to|deployed at|Contract Address'), 'runner should parse deployment address');
  assert(runner.includes('Gas used|gas used'), 'runner should parse gas usage');
  assert(runner.includes('Transaction hash|Tx hash|transactionHash'), 'runner should parse tx hash');

  console.log('foundry_script_runner.test: ok');
  process.exit(0);
} catch (err) {
  console.error('foundry_script_runner.test: failed', err);
  process.exit(1);
}
