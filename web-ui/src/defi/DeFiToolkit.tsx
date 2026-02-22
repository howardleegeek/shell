import React, { useEffect, useMemo, useState } from 'react';

// Simple DeFi Toolkit UI with mock data (no real on-chain interactions).
// This file implements: price panel, 5 templates, and an impermanent loss calculator.

type PriceMap = Record<string, number>;

// Mock Pyth price feed (example for README/demo purposes)
const MOCK_PYTH_PRICES: PriceMap = {
  'ETH/USD': 1800,
  'BTC/USD': 26000,
  'DAI/USD': 1,
};

function getPythPrice(pair: string): number {
  return MOCK_PYTH_PRICES[pair] ?? 0;
}

// Impermanent loss calculator helper
function computeImpermanentLoss(p0: number, p1: number): number {
  if (p0 <= 0 || p1 <= 0) return 0;
  const ratio = p1 / p0;
  // IL% = |1 - 2*sqrt(ratio)/(1+ratio)| * 100
  const il = Math.abs((1 - (2 * Math.sqrt(ratio)) / (1 + ratio)) * 100);
  return il;
}

// Each template is kept simple and self-contained for demonstration.
const FlashLoanTemplate: React.FC = () => {
  const [simProfit, setSimProfit] = useState<number | null>(null);
  const simulate = () => {
    // Fake deterministic-ish mock: profit based on a random seed
    const profit = Math.max(0, Math.round((Math.random() * 0.5 + 0.5) * 100) / 100);
    setSimProfit(profit);
  };
  return (
    <div className="defi-template card" style={{ border: '1px solid #ddd', padding: 12, borderRadius: 8, width: 300 }}>
      <div style={{ fontWeight: 600, marginBottom: 6 }}>Flash Loan Simulator</div>
      <div style={{ fontSize: 12, color: '#555', marginBottom: 8 }}>
        Simulated non-persistent arbitrage without real assets.
      </div>
      <button onClick={simulate} style={{ padding: '6px 12px' }}>Simulate</button>
      {simProfit !== null && (
        <div style={{ marginTop: 6, fontSize: 12 }}>Estimated profit: ${simProfit.toFixed(2)}</div>
      )}
    </div>
  );
};

const YieldFarmingTemplate: React.FC = () => {
  const [amount, setAmount] = useState<string>('100');
  const [apy, setApy] = useState<number>(25);
  const value = useMemo(() => {
    const a = parseFloat(amount) || 0;
    return a * (apy / 100);
  }, [amount, apy]);
  return (
    <div className="defi-template card" style={{ border: '1px solid #ddd', padding: 12, borderRadius: 8, width: 300 }}>
      <div style={{ fontWeight: 600, marginBottom: 6 }}>Yield Farming Template</div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
        <input value={amount} onChange={(e) => setAmount(e.target.value)} style={{ flex: 1, padding: 6 }} />
        <input value={apy} onChange={(e) => setApy(parseFloat(e.target.value) || 0)} style={{ width: 80, padding: 6 }} />
      </div>
      <div style={{ fontSize: 12, color: '#555' }}>Est. yearly yield: ${value.toFixed(2)}</div>
    </div>
  );
};

const JupiterSwapTemplate: React.FC = () => {
  const [fromAmount, setFromAmount] = useState<string>('1');
  const [rate, setRate] = useState<number>(0.95); // mock rate
  const [toAmount, setToAmount] = useState<string>('0.95');
  const swap = () => {
    const a = parseFloat(fromAmount) || 0;
    const out = a * rate;
    setToAmount(out.toFixed(4));
  };
  return (
    <div className="defi-template card" style={{ border: '1px solid #ddd', padding: 12, borderRadius: 8, width: 300 }}>
      <div style={{ fontWeight: 600, marginBottom: 6 }}>Jupiter Swap Integration</div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
        <input value={fromAmount} onChange={(e) => setFromAmount(e.target.value)} style={{ flex: 1, padding: 6 }} />
        <button onClick={swap} style={{ padding: '6px 12px' }}>Swap</button>
      </div>
      <div style={{ fontSize: 12, color: '#555' }}>Estimated output: {toAmount}</div>
    </div>
  );
};

const LendingPoolTemplate: React.FC = () => {
  const [pool, setPool] = useState<{ totalLent: number; apr: number }>({ totalLent: 12000, apr: 7.5 });
  return (
    <div className="defi-template card" style={{ border: '1px solid #ddd', padding: 12, borderRadius: 8, width: 300 }}>
      <div style={{ fontWeight: 600, marginBottom: 6 }}>Lending Pool Template</div>
      <div style={{ fontSize: 12, color: '#555' }}>Total lent: ${pool.totalLent.toLocaleString()} </div>
      <div style={{ fontSize: 12, color: '#555' }}>APR: {pool.apr}%</div>
      <button style={{ marginTop: 6, padding: '6px 12px' }}>Simulate APR Change</button>
    </div>
  );
};

const LpTokenStakingTemplate: React.FC = () => {
  const [staked, setStaked] = useState<number>(250);
  const [rewardRate, setRewardRate] = useState<number>(12);
  const rewards = (staked * rewardRate) / 100;
  return (
    <div className="defi-template card" style={{ border: '1px solid #ddd', padding: 12, borderRadius: 8, width: 300 }}>
      <div style={{ fontWeight: 600, marginBottom: 6 }}>LP Token Staking</div>
      <div style={{ fontSize: 12, color: '#555' }}>Staked: {staked.toLocaleString()} tokens</div>
      <div style={{ fontSize: 12, color: '#555' }}>Estimated yearly rewards: {rewards.toFixed(2)} tokens</div>
      <button style={{ marginTop: 6, padding: '6px 12px' }}>Harvest</button>
    </div>
  );
};

const ILCalculator: React.FC = () => {
  const [p0, setP0] = useState<number>(1);
  const [p1, setP1] = useState<number>(1);
  const [il, setIl] = useState<number | null>(null);
  const compute = () => {
    const val = computeImpermanentLoss(p0, p1);
    setIl(val);
  };
  return (
    <div className="defi-il calculator" style={{ border: '1px solid #ddd', padding: 12, borderRadius: 8, width: 420 }}>
      <div style={{ fontWeight: 600, marginBottom: 6 }}>Impermanent Loss Calculator</div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <label>Initial price</label>
        <input type="number" value={p0} onChange={(e) => setP0(parseFloat(e.target.value) || 0)} style={{ width: 100, padding: 6 }} />
        <span>→</span>
        <label>Final price</label>
        <input type="number" value={p1} onChange={(e) => setP1(parseFloat(e.target.value) || 0)} style={{ width: 100, padding: 6 }} />
        <button onClick={compute} style={{ padding: '6px 12px' }}>Calculate</button>
      </div>
      {il !== null && (
        <div style={{ marginTop: 8, fontSize: 14 }}>Impermanent Loss: {il.toFixed(2)}%</div>
      )}
    </div>
  );
};

const DeFiToolkit: React.FC = () => {
  // Simple synthetic listing of prices from the mock Pyth feed
  const tokenPrices = useMemo(() => [
    { pair: 'ETH/USD', price: getPythPrice('ETH/USD') },
    { pair: 'BTC/USD', price: getPythPrice('BTC/USD') },
    { pair: 'DAI/USD', price: getPythPrice('DAI/USD') },
  ], []);

  return (
    <div className="defi-toolkit" style={{ padding: 16, fontFamily: 'Inter, system-ui, Arial' }}>
      <h2 style={{ margin: 0, fontSize: 20 }}>DeFi Toolkit</h2>

      <section aria-label="token-prices" style={{ marginTop: 12 }}>
        <h3 style={{ fontSize: 14, margin: '6px 0' }}>Token Prices (mocked via Pyth)</h3>
        <table style={{ borderCollapse: 'collapse', width: '100%' }}>
          <thead>
            <tr><th style={{ textAlign: 'left', padding: 6 }}>Pair</th><th style={{ textAlign: 'left', padding: 6 }}>Price</th></tr>
          </thead>
          <tbody>
            {tokenPrices.map((r) => (
              <tr key={r.pair}>
                <td style={{ padding: 6 }}>{r.pair}</td>
                <td style={{ padding: 6 }}>${r.price.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section aria-label="defi-templates" style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 12 }}>
        <FlashLoanTemplate />
        <YieldFarmingTemplate />
        <JupiterSwapTemplate />
        <LendingPoolTemplate />
        <LpTokenStakingTemplate />
      </section>

      <section aria-label="il-calculator" style={{ marginTop: 12 }}>
        <ILCalculator />
      </section>
    </div>
  );
};

export default DeFiToolkit;
