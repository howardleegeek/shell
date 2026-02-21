import React, { useMemo, useState } from 'react';
import * as abiManager from '../../lib/abi-manager';

function Section({ title, children }) {
  return (
    <section style={{ border: '1px solid #ddd', borderRadius: 8, padding: 12, marginBottom: 12 }}>
      <h3 style={{ marginTop: 0 }}>{title}</h3>
      {children}
    </section>
  );
}

function AbiEntryList({ title, entries }) {
  return (
    <details open>
      <summary><strong>{title}</strong> ({entries.length})</summary>
      <div style={{ marginTop: 8, display: 'grid', gap: 8 }}>
        {entries.map((entry) => (
          <details key={`${entry.type}:${entry.signature}`}>
            <summary>{entry.signature}</summary>
            <div style={{ marginTop: 6 }}>
              <div><strong>name:</strong> {entry.name}</div>
              <div><strong>stateMutability:</strong> {entry.stateMutability}</div>
              <div><strong>inputs:</strong> {JSON.stringify(entry.inputs)}</div>
              <div><strong>outputs:</strong> {JSON.stringify(entry.outputs)}</div>
            </div>
          </details>
        ))}
      </div>
    </details>
  );
}

export default function AbiIdlManager() {
  const [abiText, setAbiText] = useState('[]');
  const [bytecode, setBytecode] = useState('');
  const [address, setAddress] = useState('');
  const [loadedAbi, setLoadedAbi] = useState([]);
  const [history, setHistory] = useState([]);
  const [leftIndex, setLeftIndex] = useState(0);
  const [rightIndex, setRightIndex] = useState(0);
  const [idlText, setIdlText] = useState('');
  const [message, setMessage] = useState('');

  const grouped = useMemo(() => abiManager.groupAbiEntries(loadedAbi), [loadedAbi]);
  const diff = useMemo(() => {
    const left = history[leftIndex]?.abi || [];
    const right = history[rightIndex]?.abi || [];
    return abiManager.diffAbis(left, right);
  }, [history, leftIndex, rightIndex]);

  const loadAbi = (abi, source) => {
    setLoadedAbi(abi);
    setHistory((prev) => [...prev, { abi, source, loadedAt: new Date().toISOString() }]);
    setLeftIndex(0);
    setRightIndex(history.length);
    setMessage(`Loaded ABI (${source}), ${abi.length} entries`);
  };

  const onImportManual = () => {
    try {
      loadAbi(abiManager.importAbiFromJson(abiText), 'manual-json');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : String(error));
    }
  };

  const onImportCompilerOutput = () => {
    try {
      loadAbi(abiManager.extractAbiFromCompilerOutput(abiText), 'compiler-output');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : String(error));
    }
  };

  const onInferFromBytecode = async () => {
    try {
      const abi = await abiManager.inferAbiFromBytecode(bytecode);
      loadAbi(abi, 'whatsabi');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : String(error));
    }
  };

  const onFetchByAddress = async () => {
    try {
      const abi = await abiManager.fetchAbiFromAddress(address);
      loadAbi(abi, 'address-lookup');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : String(error));
    }
  };

  const idlView = useMemo(() => {
    if (!idlText.trim()) {
      return null;
    }
    try {
      return abiManager.viewAnchorIdl(JSON.parse(idlText));
    } catch (error) {
      return { error: error instanceof Error ? error.message : String(error) };
    }
  }, [idlText]);

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <Section title="ABI Import">
        <div style={{ display: 'grid', gap: 8 }}>
          <textarea
            value={abiText}
            onChange={(event) => setAbiText(event.target.value)}
            rows={10}
            style={{ width: '100%' }}
            placeholder='Paste ABI JSON or compiler output'
          />
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button onClick={onImportManual}>Import ABI JSON</button>
            <button onClick={onImportCompilerOutput}>Extract From Compiler Output</button>
          </div>
          <input
            value={bytecode}
            onChange={(event) => setBytecode(event.target.value)}
            placeholder='0x6080...'
          />
          <button onClick={onInferFromBytecode}>Infer ABI (WhatsABI)</button>
          <input
            value={address}
            onChange={(event) => setAddress(event.target.value)}
            placeholder='0xContractAddress'
          />
          <button onClick={onFetchByAddress}>Fetch ABI By Address</button>
        </div>
      </Section>

      <Section title="ABI Viewer">
        <AbiEntryList title="Functions" entries={grouped.functions} />
        <AbiEntryList title="Events" entries={grouped.events} />
        <AbiEntryList title="Errors" entries={grouped.errors} />
      </Section>

      <Section title="ABI Diff">
        <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
          <select value={leftIndex} onChange={(event) => setLeftIndex(Number(event.target.value))}>
            {history.map((item, index) => (
              <option key={`left-${index}`} value={index}>
                {index}: {item.source}
              </option>
            ))}
          </select>
          <select value={rightIndex} onChange={(event) => setRightIndex(Number(event.target.value))}>
            {history.map((item, index) => (
              <option key={`right-${index}`} value={index}>
                {index}: {item.source}
              </option>
            ))}
          </select>
        </div>
        <div><strong>Added:</strong> {diff.added.map((item) => item.signature).join(', ') || 'none'}</div>
        <div><strong>Removed:</strong> {diff.removed.map((item) => item.signature).join(', ') || 'none'}</div>
        <div><strong>Modified:</strong> {diff.modified.map((item) => item.name).join(', ') || 'none'}</div>
        <div>
          <strong>Backward Compatible:</strong>{' '}
          {diff.compatibility.backwardCompatible ? 'yes' : 'no'}
        </div>
      </Section>

      <Section title="Anchor IDL Viewer">
        <textarea
          value={idlText}
          onChange={(event) => setIdlText(event.target.value)}
          rows={8}
          style={{ width: '100%' }}
          placeholder='Paste Anchor IDL JSON'
        />
        {idlView && !idlView.error && (
          <div style={{ marginTop: 8 }}>
            <div><strong>Program:</strong> {idlView.name}</div>
            <div><strong>Instructions:</strong> {idlView.instructions.length}</div>
            <div><strong>Accounts:</strong> {idlView.accounts.length}</div>
            <div><strong>Types:</strong> {idlView.types.length}</div>
          </div>
        )}
        {idlView?.error && <div>{idlView.error}</div>}
      </Section>

      <Section title="ABI Export">
        <details>
          <summary>JSON</summary>
          <pre>{abiManager.exportAbiJson(loadedAbi)}</pre>
        </details>
        <details>
          <summary>TypeScript Types</summary>
          <pre>{abiManager.exportTypeScriptTypes(loadedAbi, { interfaceName: 'ManagedAbi' })}</pre>
        </details>
        <details>
          <summary>ethers.js Interface</summary>
          <pre>{abiManager.exportEthersInterface(loadedAbi, { abiVarName: 'managedAbi' })}</pre>
        </details>
        <details>
          <summary>viem ABI</summary>
          <pre>{abiManager.exportViemAbi(loadedAbi, { abiVarName: 'managedAbi' })}</pre>
        </details>
      </Section>

      {message && (
        <div role="status" style={{ fontSize: 13, color: '#555' }}>
          {message}
        </div>
      )}
    </div>
  );
}
