import React, { useState } from 'react';
import { useSimulator } from '../../../lib/stores/simulator';

const TxSimulator: React.FC = () => {
  const { simulationStatus, simulationResult, simulate } = useSimulator();
  const [to, setTo] = useState<string>('0xabcdefabcdefabcdefabcdefabcdefabcdef');
  const [value, setValue] = useState<string>('0');
  const [calldata, setCalldata] = useState<string>('0x');

  const onSimulate = async () => {
    const v = Number(value) || 0;
    await simulate({ to, value: v, calldata });
  };

  return (
    <div style={{ border: '1px solid #ddd', padding: 12, borderRadius: 8 }}>
      <h3 style={{ marginTop: 0 }}>Tx Simulator</h3>
      <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <label>To</label>
          <input value={to} onChange={e => setTo(e.target.value)} style={{ width: 360 }} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <label>Value</label>
          <input value={value} onChange={e => setValue(e.target.value)} style={{ width: 120 }} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <label>Calldata</label>
          <input value={calldata} onChange={e => setCalldata(e.target.value)} style={{ width: 400 }} />
        </div>
        <div style={{ alignSelf: 'flex-end' }}>
          <button onClick={onSimulate} style={{ padding: '8px 12px' }}>
            Simulate
          </button>
        </div>
      </div>

      <div>
        <div style={{ marginBottom: 8 }}>
          <strong>Status:</strong> {simulationStatus}
        </div>
        {simulationResult && simulationStatus === 'done' && (
          <div>
            <div style={{ margin: '8px 0' }}>
              <strong>Gas Used:</strong> {simulationResult.gasUsed}
              <div style={{ height: 6, width: 260, background: '#eee', borderRadius: 3, overflow: 'hidden', display: 'inline-block', marginLeft: 8 }}>
                <div style={{ width: Math.min(100, (simulationResult.gasUsed / 100000) * 100) + '%', height: '100%', background: '#4caf50' }} />
              </div>
            </div>
            <div style={{ marginTop: 8 }}>
              <strong>State Diff</strong>
              <table style={{ borderCollapse: 'collapse', width: '100%', marginTop: 6 }}>
                <thead>
                  <tr>
                    <th style={{ borderBottom: '1px solid #ccc', textAlign: 'left' }}>Slot</th>
                    <th style={{ borderBottom: '1px solid #ccc', textAlign: 'left' }}>Before</th>
                    <th style={{ borderBottom: '1px solid #ccc', textAlign: 'left' }}>After</th>
                  </tr>
                </thead>
                <tbody>
                  {simulationResult.stateDiff.map((d, idx) => (
                    <tr key={idx}>
                      <td style={{ borderTop: '1px solid #eee', padding: '4px 6px' }}>{d.slot}</td>
                      <td style={{ borderTop: '1px solid #eee', padding: '4px 6px' }}>{d.before}</td>
                      <td style={{ borderTop: '1px solid #eee', padding: '4px 6px' }}>{d.after}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ marginTop: 8 }}>
              <strong>Events</strong>
              <ul>
                {simulationResult.events.map((e, i) => (
                  <li key={i}>{e.name}: {JSON.stringify(e.data)}</li>
                ))}
              </ul>
            </div>
            {simulationResult.revertReason && (
              <div style={{ color: 'red', marginTop: 6 }}>
                <strong>Revert:</strong> {simulationResult.revertReason}
              </div>
            )}
            {simulationResult.returnValue && (
              <div style={{ marginTop: 6 }}>
                <strong>Return value:</strong> {simulationResult.returnValue}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default TxSimulator;
