import React from 'react'
import { useSubscription } from '../../hooks/useSubscription'

const SubscriptionPage: React.FC = () => {
  const { state, upgrade } = useSubscription()

  return (
    <div style={{ padding: 16 }}>
      <h2>Billing</h2>
      <p>Current plan: {state.plan.toUpperCase()}</p>
      {state.plan === 'free' && (
        <button onClick={() => upgrade('pro')}>Upgrade to Pro</button>
      )}
      {state.plan === 'pro' && <p>Pro features unlocked.</p>}
    </div>
  )
}

export default SubscriptionPage
