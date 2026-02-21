import React, { useEffect, useState } from 'react';
import { fuzzStatus, fuzzResults } from '../../lib/stores/fuzz';

// Simple Fuzz Panel UI
const RUN_OPTIONS = [100, 1000, 10000];

const FuzzPanel: React.FC = () => {
  const [runs, setRuns] = useState<number>(RUN_OPTIONS[0]);
  const [status, setStatus] = useState<string>('idle');
  const [progress, setProgress] = useState<number>(0);
  const [results, setResults] = useState<{ totalRuns: number; failures: number; counterexamples: string[] } | null>(null);

  useEffect(() => {
    // subscribe to fuzz status if available
    if (typeof fuzzStatus?.subscribe === 'function') {
      const unsub = fuzzStatus.subscribe((s: any) => setStatus(String(s)));
      return unsub;
    }
  }, []);

  useEffect(() => {
    // load latest results if present
    const r = fuzzResults.get();
    setResults(r as any);
  }, []);

  const runFuzz = async () => {
    // Trigger backend API to run fuzz (Remix/Next.js pattern)
    try {
      setStatus('running');
      setProgress(0);
      const timer = setInterval(() => setProgress(p => Math.min(99, p + Math.floor(Math.random() * 10) + 5)), 400);
      const resp = await fetch('/api/fuzz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ runs }),
      }).catch(() => null);
      clearInterval(timer);
      setProgress(100);
      if (resp && resp.ok) {
        // Try to refresh results from the backend if it returns data
        try {
          const data = await resp.json();
          if (data?.latest) {
            setResults(data.latest as any);
          }
        } catch {
          // ignore
        }
        setStatus('done');
      } else {
        setStatus('error');
      }
    } catch {
      setStatus('error');
    }
  };

  return (
    <div className="fuzz-panel" style={{ border: '1px solid #e5e7eb', borderRadius: 6, padding: 12, maxWidth: 420 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <strong>Fuzz Test</strong>
        <span style={{ fontSize: 12, color: '#6b7280' }}>{status}</span>
      </div>
      <div style={{ height: 8, background: '#f3f4f6', borderRadius: 4, marginTop: 8, overflow: 'hidden' }}>
        <div style={{ width: `${progress}%`, height: '100%', background: '#10b981' }} />
      </div>
      <div style={{ marginTop: 8 }}>
        <span>Runs:</span>
        {RUN_OPTIONS.map((n) => (
          <button
            key={n}
            onClick={() => setRuns(n)}
            style={{ marginLeft: 6, padding: '6px 10px', borderRadius: 4, border: '1px solid #d1d5db', background: runs === n ? '#1e40af' : '#fff', color: runs === n ? '#fff' : '#111' }}
          >
            {n}
          </button>
        ))}
        <button onClick={runFuzz} style={{ marginLeft: 8, padding: '6px 12px', borderRadius: 4, background: '#0ea5e9', color: '#fff', border: 'none' }}>
          Run Fuzz
        </button>
      </div>
      {results?.counterexamples?.length ? (
        <div style={{ marginTop: 12 }}>
          <div style={{ fontWeight: 600, marginBottom: 6 }}>Counterexamples</div>
          {results!.counterexamples.map((ce, idx) => (
            <div key={idx} style={{ fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>{ce}</div>
          ))}
        </div>
      ) : null}
    </div>
  );
};

export default FuzzPanel;
