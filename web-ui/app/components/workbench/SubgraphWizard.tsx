import React, { useEffect, useMemo, useState } from 'react';

export type AbiEvent = {
  type: 'event';
  name: string;
  inputs: Array<{ name: string; type: string; indexed?: boolean }>;
};

export type DeployedContract = {
  address: string;
  name: string;
  abi: string;
  network: string;
};

type Props = {
  deployedContracts?: DeployedContract[];
  onCreateSubgraph?: (files: SubgraphFiles) => void;
};

export type SubgraphFiles = {
  schema: string;
  mapping: string;
  subgraphYaml: string;
};

const typeToGraphQL: Record<string, string> = {
  address: 'Bytes',
  uint256: 'BigInt',
  uint256_t: 'BigInt',
  uint128: 'BigInt',
  uint64: 'BigInt',
  uint32: 'BigInt',
  uint16: 'BigInt',
  uint8: 'BigInt',
  int256: 'BigInt',
  int128: 'BigInt',
  int64: 'BigInt',
  int32: 'BigInt',
  int16: 'BigInt',
  int8: 'BigInt',
  bool: 'Boolean',
  string: 'String',
  bytes: 'Bytes',
  bytes32: 'Bytes',
  bytes16: 'Bytes',
  bytes8: 'Bytes',
  bytes4: 'Bytes',
  bytes2: 'Bytes',
  bytes1: 'Bytes',
};

function abiTypeToGraphQL(abiType: string): string {
  const baseType = abiType.replace(/\[\d*\]/, '');
  const match = baseType.match(/^uint(\d+)$/i);
  if (match) {
    return 'BigInt';
  }
  const intMatch = baseType.match(/^int(\d+)$/i);
  if (intMatch) {
    return 'BigInt';
  }
  return typeToGraphQL[baseType] || 'String';
}

function parseAbiEvents(abiJson: string): AbiEvent[] {
  try {
    const abi = JSON.parse(abiJson);
    if (!Array.isArray(abi)) return [];
    return abi.filter((item) => item.type === 'event') as AbiEvent[];
  } catch {
    return [];
  }
}

function generateSchema(contractName: string, events: AbiEvent[]): string {
  if (events.length === 0) {
    return `# No events selected`;
  }

  let schema = `# Generated GraphQL Schema for ${contractName}\n`;
  schema += `# Auto-generated from ABI events\n\n`;

  events.forEach((event) => {
    const entityName = event.name;
    schema += `type ${entityName} @entity {\n`;
    schema += `  id: ID!\n`;
    schema += `  transactionHash: Bytes!\n`;
    schema += `  blockNumber: BigInt!\n`;
    schema += `  blockTimestamp: BigInt!\n`;

    event.inputs.forEach((input) => {
      const gqlType = abiTypeToGraphQL(input.type);
      schema += `  ${input.name}: ${gqlType}!\n`;
    });

    schema += `}\n\n`;
  });

  return schema;
}

function generateMapping(contractName: string, events: AbiEvent[]): string {
  if (events.length === 0) {
    return `// No events selected for mapping`;
  }

  let mapping = `import {\n`;
  events.forEach((event, idx) => {
    mapping += `  ${event.name}Event`;
    if (idx < events.length - 1) mapping += `,`;
    mapping += `\n`;
  });
  mapping += `} from './types/${contractName}/${contractName}';\n`;
  mapping += `import { store } from '@graphprotocol/graph-ts';\n\n`;

  events.forEach((event) => {
    const entityName = event.name;
    mapping += `export function handle${event.name}(event: ${event.name}Event): void {\n`;
    mapping += `  const id = event.transaction.hash.concatI32(event.logIndex.toI32());\n`;
    mapping += `  const entity = new ${entityName}(id);\n\n`;
    mapping += `  entity.transactionHash = event.transaction.hash;\n`;
    mapping += `  entity.blockNumber = event.block.number;\n`;
    mapping += `  entity.blockTimestamp = event.block.timestamp;\n`;

    event.inputs.forEach((input) => {
      mapping += `  entity.${input.name} = event.params.${input.name};\n`;
    });

    mapping += `\n  entity.save();\n`;
    mapping += `}\n\n`;
  });

  return mapping;
}

function generateSubgraphYaml(
  contractName: string,
  contractAddress: string,
  network: string,
  startBlock: number,
  events: AbiEvent[]
): string {
  const entities = events.map((e) => e.name).join(',\n        ');
  const eventHandlers = events
    .map((event) => {
      const inputs = event.inputs.map((i) => i.type + ' ' + i.name).join(', ');
      return `      - event: ${event.name}(${inputs})
        handler: handle${event.name}`;
    })
    .join('\n');

  return `specVersion: 0.0.5
description: Subgraph for ${contractName}
repository: https://github.com/your-org/your-repo
schema:
  file: ./schema.graphql
dataSources:
  - kind: ethereum
    name: ${contractName}
    network: ${network}
    source:
      address: '${contractAddress}'
      abi: ${contractName}
      startBlock: ${startBlock}
    mapping:
      kind: ethereum/events
      apiVersion: 0.0.7
      language: wasm/assemblyscript
      entities:
        - ${entities}
      abis:
        - name: ${contractName}
          file: ./abis/${contractName}.json
      eventHandlers:
${eventHandlers}
      file: ./mapping.ts`;
}

const SubgraphWizard: React.FC<Props> = ({
  deployedContracts = [],
  onCreateSubgraph,
}) => {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  const [contractSource, setContractSource] = useState<'select' | 'paste'>('select');
  const [selectedContractIdx, setSelectedContractIdx] = useState<number>(0);
  const [pastedAbi, setPastedAbi] = useState<string>('');
  const [contractAddress, setContractAddress] = useState<string>('');
  const [contractName, setContractName] = useState<string>('MyContract');
  const [network, setNetwork] = useState<string>('mainnet');
  const [startBlock, setStartBlock] = useState<number>(1);

  const [selectedEvents, setSelectedEvents] = useState<Set<string>>(new Set());

  const events = useMemo(() => {
    const abiSource = contractSource === 'select' && deployedContracts[selectedContractIdx]
      ? deployedContracts[selectedContractIdx].abi
      : pastedAbi;
    return parseAbiEvents(abiSource);
  }, [contractSource, selectedContractIdx, deployedContracts, pastedAbi]);

  useEffect(() => {
    if (events.length > 0 && selectedEvents.size === 0) {
      setSelectedEvents(new Set(events.map((e) => e.name)));
    }
  }, [events, selectedEvents.size]);

  useEffect(() => {
    if (contractSource === 'select' && deployedContracts[selectedContractIdx]) {
      const contract = deployedContracts[selectedContractIdx];
      setContractAddress(contract.address);
      setNetwork(contract.network);
    }
  }, [contractSource, selectedContractIdx, deployedContracts]);

  const toggleEvent = (eventName: string) => {
    const next = new Set(selectedEvents);
    if (next.has(eventName)) {
      next.delete(eventName);
    } else {
      next.add(eventName);
    }
    setSelectedEvents(next);
  };

  const selectedAbiEvents = useMemo(() => {
    return events.filter((e) => selectedEvents.has(e.name));
  }, [events, selectedEvents]);

  const generatedSchema = useMemo(() => {
    return generateSchema(contractName, selectedAbiEvents);
  }, [contractName, selectedAbiEvents]);

  const generatedMapping = useMemo(() => {
    return generateMapping(contractName, selectedAbiEvents);
  }, [contractName, selectedAbiEvents]);

  const generatedSubgraphYaml = useMemo(() => {
    return generateSubgraphYaml(
      contractName,
      contractAddress,
      network,
      startBlock,
      selectedAbiEvents
    );
  }, [contractName, contractAddress, network, startBlock, selectedAbiEvents]);

  const handleCreateSubgraph = () => {
    if (onCreateSubgraph) {
      onCreateSubgraph({
        schema: generatedSchema,
        mapping: generatedMapping,
        subgraphYaml: generatedSubgraphYaml,
      });
    }
  };

  return (
    <div className="subgraph-wizard" style={{ padding: 16, border: '1px solid #333', borderRadius: 8 }}>
      <h3>Subgraph Wizard</h3>

      <div className="steps" style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {[1, 2, 3, 4].map((s) => (
          <button
            key={s}
            onClick={() => setStep(s as 1 | 2 | 3 | 4)}
            disabled={s > step}
            style={{
              padding: '8px 16px',
              background: step === s ? '#007acc' : '#222',
              color: step === s ? '#fff' : '#888',
              border: 'none',
              borderRadius: 4,
              cursor: s <= step ? 'pointer' : 'not-allowed',
            }}
          >
            Step {s}
          </button>
        ))}
      </div>

      {step === 1 && (
        <div className="step1">
          <h4>Step 1: Select Contract</h4>
          <div style={{ marginBottom: 12 }}>
            <label>
              <input
                type="radio"
                name="contractSource"
                checked={contractSource === 'select'}
                onChange={() => setContractSource('select')}
              />
              Select deployed contract
            </label>
            <label style={{ marginLeft: 16 }}>
              <input
                type="radio"
                name="contractSource"
                checked={contractSource === 'paste'}
                onChange={() => setContractSource('paste')}
              />
              Paste ABI JSON
            </label>
          </div>

          {contractSource === 'select' && (
            <div>
              {deployedContracts.length > 0 ? (
                <select
                  value={selectedContractIdx}
                  onChange={(e) => setSelectedContractIdx(parseInt(e.target.value, 10))}
                  style={{ padding: 8, width: '100%' }}
                >
                  {deployedContracts.map((c, idx) => (
                    <option key={idx} value={idx}>
                      {c.name} ({c.address})
                    </option>
                  ))}
                </select>
              ) : (
                <p style={{ color: '#888' }}>No deployed contracts available</p>
              )}
            </div>
          )}

          {contractSource === 'paste' && (
            <div>
              <textarea
                placeholder='Paste ABI JSON here, e.g. [{"type":"event","name":"Transfer",...}]'
                value={pastedAbi}
                onChange={(e) => setPastedAbi(e.target.value)}
                rows={8}
                style={{ width: '100%', fontFamily: 'monospace' }}
              />
            </div>
          )}

          <div style={{ marginTop: 12 }}>
            <label>
              Contract Name:{' '}
              <input
                type="text"
                value={contractName}
                onChange={(e) => setContractName(e.target.value)}
                style={{ padding: 4 }}
              />
            </label>
          </div>

          <button
            onClick={() => setStep(2)}
            disabled={events.length === 0}
            style={{ marginTop: 12, padding: '8px 16px', cursor: events.length > 0 ? 'pointer' : 'not-allowed' }}
          >
            Next →
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="step2">
          <h4>Step 2: Select Events to Index</h4>
          {events.length > 0 ? (
            <div style={{ maxHeight: 300, overflowY: 'auto', border: '1px solid #333', padding: 8 }}>
              {events.map((event) => (
                <label
                  key={event.name}
                  style={{ display: 'block', padding: 4, cursor: 'pointer' }}
                >
                  <input
                    type="checkbox"
                    checked={selectedEvents.has(event.name)}
                    onChange={() => toggleEvent(event.name)}
                  />
                  <span style={{ marginLeft: 8 }}>{event.name}</span>
                  <span style={{ color: '#888', marginLeft: 8 }}>
                    ({event.inputs.map((i) => i.type + ' ' + i.name).join(', ')})
                  </span>
                </label>
              ))}
            </div>
          ) : (
            <p style={{ color: '#888' }}>No events found in ABI</p>
          )}

          <div style={{ marginTop: 12 }}>
            <label>
              Contract Address:{' '}
              <input
                type="text"
                value={contractAddress}
                onChange={(e) => setContractAddress(e.target.value)}
                style={{ padding: 4, width: 300 }}
              />
            </label>
          </div>

          <div style={{ marginTop: 8 }}>
            <label>
              Network:{' '}
              <select
                value={network}
                onChange={(e) => setNetwork(e.target.value)}
                style={{ padding: 4 }}
              >
                <option value="mainnet">mainnet</option>
                <option value="goerli">goerli</option>
                <option value="sepolia">sepolia</option>
                <option value="arbitrum-one">arbitrum-one</option>
                <option value="optimism">optimism</option>
                <option value="polygon">polygon</option>
                <option value="bsc">bsc</option>
              </select>
            </label>
          </div>

          <div style={{ marginTop: 8 }}>
            <label>
              Start Block:{' '}
              <input
                type="number"
                value={startBlock}
                onChange={(e) => setStartBlock(parseInt(e.target.value, 10) || 1)}
                style={{ padding: 4, width: 100 }}
              />
            </label>
          </div>

          <button onClick={() => setStep(3)} style={{ marginTop: 12, padding: '8px 16px' }}>
            Next →
          </button>
        </div>
      )}

      {step === 3 && (
        <div className="step3">
          <h4>Step 3: Preview Generated Code</h4>

          <div style={{ marginBottom: 16 }}>
            <h5>schema.graphql</h5>
            <pre style={{ background: '#111', padding: 8, maxHeight: 150, overflow: 'auto', fontSize: 12 }}>
              {generatedSchema}
            </pre>
          </div>

          <div style={{ marginBottom: 16 }}>
            <h5>mapping.ts</h5>
            <pre style={{ background: '#111', padding: 8, maxHeight: 150, overflow: 'auto', fontSize: 12 }}>
              {generatedMapping}
            </pre>
          </div>

          <div style={{ marginBottom: 16 }}>
            <h5>subgraph.yaml</h5>
            <pre style={{ background: '#111', padding: 8, maxHeight: 150, overflow: 'auto', fontSize: 12 }}>
              {generatedSubgraphYaml}
            </pre>
          </div>

          <button onClick={() => setStep(4)} style={{ padding: '8px 16px' }}>
            Next →
          </button>
        </div>
      )}

      {step === 4 && (
        <div className="step4">
          <h4>Step 4: Create Subgraph Project</h4>
          <p>Ready to generate subgraph project with {selectedAbiEvents.length} event(s).</p>

          <div style={{ marginTop: 16 }}>
            <button
              onClick={handleCreateSubgraph}
              style={{
                padding: '12px 24px',
                background: '#28a745',
                color: '#fff',
                border: 'none',
                borderRadius: 4,
                cursor: 'pointer',
                fontSize: 16,
              }}
            >
              Create Subgraph Project
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubgraphWizard;
export { generateSchema, generateMapping, generateSubgraphYaml, parseAbiEvents };
