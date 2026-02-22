import React, { useMemo, useState } from 'react';

export type RunMode = 'simulate' | 'broadcast';

export interface ConstructorArg {
  name: string;
  type: string;
  value?: string;
}

export interface ContractOption {
  name: string;
  constructorArgs?: ConstructorArg[];
}

export interface ScriptRunResult {
  command: string;
  mode: RunMode;
  output: string;
  deploymentAddress?: string;
  gasUsed?: string;
  txHash?: string;
  timestamp: string;
}

interface ScriptRunnerProps {
  contracts?: ContractOption[];
  rpcUrl?: string;
  onRunCommand?: (command: string) => Promise<string>;
}

const defaultContracts: ContractOption[] = [
  { name: 'MyToken', constructorArgs: [{ name: 'name', type: 'string', value: '"My Token"' }, { name: 'symbol', type: 'string', value: '"MTK"' }] },
];

const DEPLOY_TEMPLATE = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console2} from "forge-std/Script.sol";
import {__CONTRACT__} from "../src/__CONTRACT__.sol";

contract DeployScript is Script {
    function run() external returns (__CONTRACT__ deployed) {
        vm.startBroadcast();
        deployed = new __CONTRACT__(__ARGS__);
        vm.stopBroadcast();
        console2.log("__CONTRACT__ deployed at", address(deployed));
    }
}
`;

export function renderDeployScript(contractName: string, constructorArgs: string[]): string {
  const args = constructorArgs.length ? constructorArgs.join(', ') : '';
  return DEPLOY_TEMPLATE.replace(/__CONTRACT__/g, contractName).replace('__ARGS__', args);
}

export function buildForgeScriptCommand(input: {
  rpcUrl: string;
  mode: RunMode;
  verify: boolean;
  etherscanApiKey?: string;
}): string {
  const commandParts = ['forge script script/Deploy.s.sol', `--rpc-url ${input.rpcUrl}`];

  if (input.mode === 'broadcast') commandParts.push('--broadcast');
  if (input.verify) commandParts.push(`--verify --etherscan-api-key ${input.etherscanApiKey || '$KEY'}`);

  return commandParts.join(' ');
}

export function parseForgeScriptOutput(output: string): Pick<ScriptRunResult, 'deploymentAddress' | 'gasUsed' | 'txHash'> {
  const addressMatch = output.match(/(?:Deployed to|deployed at|Contract Address)\s*:?\s*(0x[a-fA-F0-9]{40})/);
  const gasMatch = output.match(/(?:Gas used|gas used)\s*:?\s*([0-9][0-9_,]*)/);
  const txHashMatch = output.match(/(?:Transaction hash|Tx hash|transactionHash)\s*:?\s*(0x[a-fA-F0-9]{64})/);

  return {
    deploymentAddress: addressMatch?.[1],
    gasUsed: gasMatch?.[1]?.replace(/,/g, ''),
    txHash: txHashMatch?.[1],
  };
}

function initialArgValues(contract?: ContractOption): string[] {
  if (!contract?.constructorArgs?.length) return [];
  return contract.constructorArgs.map((item) => item.value || defaultValueForType(item.type));
}

function defaultValueForType(type: string): string {
  if (type.includes('string')) return '""';
  if (type.includes('address')) return 'address(0)';
  if (type.includes('bool')) return 'false';
  if (type.includes('bytes')) return 'hex""';
  return '0';
}

export default function ScriptRunner({
  contracts = defaultContracts,
  rpcUrl = '$RPC',
  onRunCommand,
}: ScriptRunnerProps) {
  const [selectedContract, setSelectedContract] = useState<ContractOption>(contracts[0]);
  const [argValues, setArgValues] = useState<string[]>(() => initialArgValues(contracts[0]));
  const [mode, setMode] = useState<RunMode>('simulate');
  const [verify, setVerify] = useState(false);
  const [etherscanApiKey, setEtherscanApiKey] = useState('$KEY');
  const [scriptCode, setScriptCode] = useState('');
  const [history, setHistory] = useState<ScriptRunResult[]>([]);

  const constructorArgs = selectedContract.constructorArgs || [];
  const parsedLast = useMemo(() => (history[0] ? parseForgeScriptOutput(history[0].output) : {}), [history]);

  const onContractChange = (name: string) => {
    const next = contracts.find((item) => item.name === name) || contracts[0];
    setSelectedContract(next);
    setArgValues(initialArgValues(next));
  };

  const onArgChange = (index: number, value: string) => {
    const next = [...argValues];
    next[index] = value;
    setArgValues(next);
  };

  const onGenerate = () => {
    const next = renderDeployScript(selectedContract.name, argValues);
    setScriptCode(next);
  };

  const onRun = async () => {
    const command = buildForgeScriptCommand({ rpcUrl, mode, verify, etherscanApiKey });
    const output = onRunCommand ? await onRunCommand(command) : '';
    const parsed = parseForgeScriptOutput(output);
    const run: ScriptRunResult = { command, mode, output, ...parsed, timestamp: new Date().toISOString() };
    setHistory((prev) => [run, ...prev].slice(0, 10));
  };

  return (
    <div className="space-y-3 rounded-lg border border-bolt-elements-borderColor p-4">
      <h3 className="text-sm font-semibold">Foundry Script Runner</h3>
      <label className="block text-xs">Contract</label>
      <select className="w-full rounded border p-2 text-sm" value={selectedContract.name} onChange={(e) => onContractChange(e.target.value)}>
        {contracts.map((item) => <option key={item.name} value={item.name}>{item.name}</option>)}
      </select>

      {constructorArgs.map((arg, idx) => (
        <div key={`${arg.name}-${idx}`}>
          <label className="block text-xs">{arg.name} ({arg.type})</label>
          <input className="w-full rounded border p-2 text-sm" value={argValues[idx] || ''} onChange={(e) => onArgChange(idx, e.target.value)} />
        </div>
      ))}

      <div className="flex gap-2">
        <button className="rounded border px-3 py-1 text-xs" onClick={() => setMode('simulate')}>Simulate</button>
        <button className="rounded border px-3 py-1 text-xs" onClick={() => setMode('broadcast')}>Broadcast</button>
        <label className="text-xs"><input type="checkbox" checked={verify} onChange={(e) => setVerify(e.target.checked)} /> Verify</label>
      </div>

      {verify && (
        <input className="w-full rounded border p-2 text-sm" value={etherscanApiKey} onChange={(e) => setEtherscanApiKey(e.target.value)} />
      )}

      <div className="flex gap-2">
        <button className="rounded border px-3 py-1 text-xs" onClick={onGenerate}>Generate `script/Deploy.s.sol`</button>
        <button className="rounded border px-3 py-1 text-xs" onClick={onRun}>Run</button>
      </div>

      {scriptCode && <pre className="max-h-60 overflow-auto rounded bg-black/10 p-2 text-xs">{scriptCode}</pre>}

      <div className="text-xs">
        <div>Last deployment address: {parsedLast.deploymentAddress || '-'}</div>
        <div>Last gas used: {parsedLast.gasUsed || '-'}</div>
        <div>Last transaction hash: {parsedLast.txHash || '-'}</div>
      </div>

      <div className="space-y-1 text-xs">
        {history.map((item) => (
          <div key={`${item.timestamp}-${item.command}`} className="rounded border p-2">
            <div>{item.timestamp}</div>
            <div>{item.command}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
