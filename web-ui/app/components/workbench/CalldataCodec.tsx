import React, { useEffect, useState } from 'react';
// Re-export AbiFunction for tests that import from this module
import type { AbiFunction as AbiFunctionType } from '../../../lib/calldata';
export type AbiFunction = AbiFunctionType;
export { decodeCalldata, encodeCalldata } from '../../../lib/calldata';
import { decodeCalldata, encodeCalldata, lookup4byte } from '../../../lib/calldata';

// Sample ABI used for decoding/encoding. In the real app this will be
// replaced by data from the S40-abi-manager integration.
const sampleAbi: AbiFunction[] = [
  { name: 'setValue', inputs: [{ name: 'newValue', type: 'uint256' }] },
  { name: 'transfer', inputs: [{ name: 'to', type: 'address' }, { name: 'amount', type: 'uint256' }] },
  { name: 'updateData', inputs: [{ name: 'data', type: 'bytes' }, { name: 'flag', type: 'bool' }] },
];

type TabKey = 'decode' | 'encode';

const CalldataCodec: React.FC = () => {
  // Decode state
  const [calldata, setCalldata] = useState<string>('0x');
  const [abi, setAbi] = useState<AbiFunction[] | undefined>(sampleAbi);
  const [decodeResult, setDecodeResult] = useState<any>(null);
  // Encode state
  const [selectedFn, setSelectedFn] = useState<string>(sampleAbi[0]?.name ?? '');
  const [args, setArgs] = useState<string[]>([]);
  const [encoded, setEncoded] = useState<string>('0x');
  const [lookup, setLookup] = useState<string[]>([]);
  const [tab, setTab] = useState<TabKey>('decode');

  // Initialize args when ABI or function changes
  useEffect(() => {
    if (!abi || abi.length === 0) return;
    const fn = abi.find((f) => f.name === selectedFn) ?? abi[0];
    const init: string[] = fn.inputs.map(() => '');
    setArgs(init);
  }, [abi, selectedFn]);

  // Decode whenever calldata or ABI changes
  useEffect(() => {
    const res = decodeCalldata(calldata, abi);
    setDecodeResult(res);
  }, [calldata, abi]);

  // Encode whenever function args change
  useEffect(() => {
    if (!abi) return;
    const fn = abi.find((f) => f.name === selectedFn) ?? abi[0];
    try {
      const values = args.map((v) => v);
      const res = encodeCalldata(fn?.name || '', values, abi);
      setEncoded(res);
    } catch {
      // ignore encoding errors mid-typing
    }
  }, [args, abi, selectedFn]);

  const performLookup = async () => {
    const sel = calldata.startsWith('0x') ? calldata.substring(0, 10) : calldata.substring(0, 10);
    const res = await lookup4byte(sel);
    setLookup(res);
  };

  // UI rendering helpers
  const renderDecode = () => {
    if (!decodeResult) return null;
    if (decodeResult.functionName) {
      return (
        <div>
          <div><strong>Function:</strong> {decodeResult.functionName}</div>
          <div><strong>Decoded params:</strong> {JSON.stringify(decodeResult.params ?? decodeResult.args)}</div>
        </div>
      );
    }
    return (
      <div>
        <div><strong>Selector:</strong> {decodeResult.selector}</div>
        {Array.isArray(decodeResult.raw) && (
          <div>
            <strong>Raw params (32-byte chunks):</strong>
            <ul>
              {decodeResult.raw.map((c: string, i: number) => (
                <li key={i}>{c}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={{ border: '1px solid #ddd', padding: 12, borderRadius: 8 }}>
      <h3 style={{ marginTop: 0 }}>Calldata Codec</h3>
      <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
        <div>
          <button onClick={() => setTab('decode')} style={{ padding: '6px 12px', marginRight: 8, background: tab === 'decode' ? '#ddd' : '#fff' }}>Decode</button>
          <button onClick={() => setTab('encode')} style={{ padding: '6px 12px', background: tab === 'encode' ? '#ddd' : '#fff' }}>Encode</button>
        </div>
      </div>

      {tab === 'decode' && (
        <div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 12 }}>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <label>Calldata</label>
              <input value={calldata} onChange={(e) => setCalldata(e.target.value)} style={{ width: 420 }} placeholder="0x..." />
            </div>
            <div style={{ alignSelf: 'flex-end' }}>
              <button onClick={performLookup} style={{ padding: '6px 12px' }}>4-byte lookup</button>
            </div>
          </div>
          <div>
            {renderDecode()}
          </div>
          {lookup.length > 0 && (
            <div style={{ marginTop: 8 }}>
              <strong>4-byte lookup:</strong>
              <ul>
                {lookup.map((r, i) => (
                  <li key={i}>{r}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {tab === 'encode' && (
        <div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 12 }}>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <label>Function</label>
              <select value={selectedFn} onChange={(e) => setSelectedFn(e.target.value)} style={{ width: 320 }}>
                {abi?.map((f) => (
                  <option key={f.name} value={f.name}>{f.name}({f.inputs.map(i => i.type).join(', ')})</option>
                ))}
              </select>
            </div>
            <div style={{ alignSelf: 'flex-end' }}>
              <button onClick={() => setAbi(sampleAbi)} style={{ padding: '6px 12px' }}>Load Sample ABI</button>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 700 }}>
            {abi?.find((f) => f.name === selectedFn)?.inputs.map((inp, idx) => (
              <div key={idx} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <label style={{ minWidth: 120 }}>{inp.name || `param${idx}`}</label>
                <input value={args[idx] ?? ''} onChange={(e) => {
                  const v = e.target.value;
                  setArgs((old) => {
                    const next = [...old];
                    next[idx] = v;
                    return next;
                  });
                }} style={{ width: 260 }} placeholder={inp.type} />
              </div>
            ))}
          </div>
          <div style={{ marginTop: 8 }}>
            <div><strong>Calldata:</strong> {encoded}</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CalldataCodec;
