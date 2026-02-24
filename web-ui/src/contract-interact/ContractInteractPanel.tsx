import React, { useMemo, useState } from 'react';

type AbiInput = { name: string; type: string };
type AbiOutput = { name: string; type: string };
type AbiFunction = {
  type: string;
  name: string;
  inputs: AbiInput[];
  outputs?: AbiOutput[];
  stateMutability?: string;
};

type ContractInteractPanelProps = {
  abi: AbiFunction[];
  address?: string;
};

function isReadFunction(f: AbiFunction): boolean {
  const sm = f.stateMutability ?? '';
  return sm === 'view' || sm === 'pure';
}

function sampleValue(type: string): string {
  if (type.startsWith('uint') || type === 'int') return '42';
  if (type === 'bool') return 'true';
  if (type === 'address') return '0x0000000000000000000000000000000000000001';
  return '0x';
}

function simpleHash(s: string): string {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) | 0;
  }
  return '0x' + (Math.abs(h) >>> 0).toString(16).padStart(8, '0');
}

const ContractInteractPanel: React.FC<ContractInteractPanelProps> = ({ abi, address }) => {
  const functions = useMemo(() => abi.filter((f) => f.type === 'function'), [abi]);
  const reads = functions.filter(isReadFunction);
  const writes = functions.filter((f) => !isReadFunction(f));

  const [readInputs, setReadInputs] = useState<Record<string, string>>({});
  const [readResults, setReadResults] = useState<Record<string, string>>({});
  const [writeInputs, setWriteInputs] = useState<Record<string, string>>({});
  const [writeTx, setWriteTx] = useState<Record<string, { txHash: string; gasUsed: number }>>({});

  const onReadCall = (fn: AbiFunction) => {
    // Build inputs map but it's not strictly used for the mock
    const key = fn.name;
    const outType = fn.outputs?.[0]?.type ?? 'uint256';
    const val = sampleValue(outType);
    setReadResults((r) => ({ ...r, [key]: val }));
  };

  const onWriteSend = (fn: AbiFunction) => {
    // Collect inputs (not strictly validated in mock)
    const inputs = fn.inputs.map((_, idx) => (writeInputs[`${fn.name}|${idx}`] ?? ''));
    const txHash = simpleHash(fn.name + JSON.stringify(inputs) + Date.now());
    const gasUsed = 21000 + inputs.length * 1500;
    setWriteTx((t) => ({ ...t, [fn.name]: { txHash, gasUsed } }));
  };

  const renderInputs = (fn: AbiFunction) => {
    return (
      <div aria-label={`inputs-${fn.name}`}>
        {fn.inputs.map((inp, idx) => (
          <input
            key={idx}
            data-testid={`${fn.name}-input-${idx}`}
            placeholder={inp.name || inp.type}
            value={writeInputs?.[`${fn.name}|${idx}`] ?? ''}
            onChange={(e) =>
              setWriteInputs((w) => ({ ...w, [`${fn.name}|${idx}`]: e.target.value }))
            }
            style={{ marginRight: 8 }}
          />
        ))}
      </div>
    );
  };

  return (
    <div data-testid="contract-interact-panel">
      <div>Contract: {address ?? 'Unknown'}</div>

      <section aria-label="Read Functions">
        <div style={{ fontWeight: 'bold' }}>Read Functions</div>
        {reads.map((fn) => (
          <div key={fn.name} style={{ border: '1px solid #ddd', padding: 8, margin: '8px 0' }}>
            <div>{fn.name}({fn.inputs.map((i) => i.type).join(', ')})</div>
            {renderInputs(fn)}
            <button data-testid={`call-${fn.name}`} onClick={() => onReadCall(fn)} style={{ marginTop: 6 }}>
              Call
            </button>
            {readResults[fn.name] != null && (
              <div data-testid={`read-result-${fn.name}`}>Result: {readResults[fn.name]}</div>
            )}
          </div>
        ))}
      </section>

      <section aria-label="Write Functions">
        <div style={{ fontWeight: 'bold' }}>Write Functions</div>
        {writes.map((fn) => (
          <div key={fn.name} style={{ border: '1px solid #ddd', padding: 8, margin: '8px 0' }}>
            <div>{fn.name}({fn.inputs.map((i) => i.type).join(', ')})</div>
            {renderInputs(fn)}
            <button data-testid={`send-${fn.name}`} onClick={() => onWriteSend(fn)} style={{ marginTop: 6 }}>
              Send Transaction
            </button>
            {writeTx[fn.name] && (
              <div>
                Tx Hash: {writeTx[fn.name]?.txHash} | Gas Used: {writeTx[fn.name]?.gasUsed}
              </div>
            )}
          </div>
        ))}
      </section>
    </div>
  );
};

export default ContractInteractPanel;
