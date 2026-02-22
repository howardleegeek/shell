import React, { useMemo, useState } from 'react';

type PathOption = { value: string; label: string };

// Lightweight AI-assisted migration wizard UI
const MigrationWizard: React.FC = () => {
  const sourceOptions: PathOption[] = useMemo(
    () => [
      { value: 'solidity', label: 'Solidity (EVM)' },
    ],
    []
  );

  const targetOptions: PathOption[] = useMemo(
    () => [
      { value: 'solidity-to-rust', label: 'Solidity → Rust/Anchor (Solana)' },
      { value: 'rust-to-solidity', label: 'Rust/Anchor → Solidity (EVM)' },
      { value: 'solidity-to-move', label: 'Solidity → Move (Sui)' },
    ],
    []
  );

  const [source, setSource] = useState<string>('solidity');
  const [target, setTarget] = useState<string>('solidity-to-rust');
  const [contractCode, setContractCode] = useState<string>('');
  const [skeleton, setSkeleton] = useState<string>('');
  const [error, setError] = useState<string>('');

  // Simple deterministic generator to simulate AI-driven skeletons
  const generateSkeleton = (src: string, dst: string, code: string): string => {
    const short = code?.trim().slice(0, 120) ?? '';
    if (src === 'solidity' && dst === 'solidity-to-rust') {
      return `// AI-generated Rust/Anchor skeleton from Solidity contract\n// Source length: ${code.length} chars\n\npub mod migrated {
  // This is a scaffold; replace with real translation logic.
  pub fn migrate(input: &[u8]) -> Result<(), String> { Ok(()) }
}
    }
    // Generic fallback skeleton
    return `// Migration skeleton: ${src} -> ${dst}\n// Contract preview: ${short}`;
  };

  const onGenerate = (): void => {
    try {
      const out = generateSkeleton(source, target, contractCode);
      setSkeleton(out);
      setError('');
    } catch (e) {
      setError('Failed to generate skeleton');
    }
  };

  return (
    <section className="migration-wizard" aria-label="Migration Wizard">
      <h2>AI Migration Wizard</h2>

      <div>
        <label htmlFor="src-select">Source Chain</label>
        <select
          id="src-select"
          value={source}
          onChange={(e) => setSource(e.target.value)}
        >
          {sourceOptions.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="dst-select">Target Chain</label>
        <select
          id="dst-select"
          value={target}
          onChange={(e) => setTarget(e.target.value)}
        >
          {targetOptions.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="contract-input">Contract Code</label>
        <textarea
          id="contract-input"
          rows={6}
          value={contractCode}
          placeholder="Paste Solidity contract here..."
          onChange={(e) => setContractCode(e.target.value)}
        />
      </div>

      <button onClick={onGenerate} aria-label="Generate Skeleton">Generate Skeleton</button>

      {error && <div role="alert" style={{ color: 'red' }}>{error}</div>}

      {skeleton && (
        <pre data-testid="skeleton" style={{ marginTop: 12 }}>{skeleton}</pre>
      )}
    </section>
  );
};

export default MigrationWizard;
