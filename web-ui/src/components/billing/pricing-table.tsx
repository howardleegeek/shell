import React from 'react'
import { useSubscription } from '../../hooks/useSubscription'

export const PricingTable: React.FC = () => {
  const { state, upgrade } = useSubscription()
  const isFree = state.plan === 'free'
  return (
    <div style={{ display: 'flex', gap: 16 }}>
      <div style={{ border: '1px solid #ddd', padding: 16, borderRadius: 8, width: 260 }}>
        <h3>Free</h3>
        <p>Price: $0 / month</p>
        <p>Projects: up to 3</p>
        <button disabled={!isFree} onClick={() => upgrade('pro')}>Upgrade to Pro</button>
      </div>
      <div style={{ border: '1px solid #ddd', padding: 16, borderRadius: 8, width: 260 }}>
        <h3>Pro</h3>
        <p>Price: $19 / month</p>
        <p>Unlimited projects & AI tokens</p>
        {state.plan === 'free' && (
          <button onClick={() => upgrade('pro')}>Upgrade</button>
        )}
        {state.plan === 'pro' && <span>Already active</span>}
      </div>
    </div>
  )
}

export default PricingTable
