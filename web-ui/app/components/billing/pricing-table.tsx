import React from 'react'
import { type Plan } from '../../lib/billing/stripe-client'
import { isPro } from '../../lib/billing/feature-gates'

export const PricingTable: React.FC<{
  currentPlan: Plan
  onUpgrade: (plan: Plan) => void
}> = ({ currentPlan, onUpgrade }) => {
  const plans: Plan[] = ['free', 'pro']
  return (
    <table>
      <thead>
        <tr>
          <th>Plan</th>
          <th>Price</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {plans.map(p => (
          <tr key={p}>
            <td>{p.toUpperCase()}</td>
            <td>{p === 'free' ? '$0/mo' : '$19/mo'}</td>
            <td>
              {currentPlan !== p && (
                <button onClick={() => onUpgrade(p)}>Upgrade to {p}</button>
              )}
              {currentPlan === p && <span>Current</span>}
              {isPro(p) && <span> {currentPlan !== p ? '' : ''}</span>}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
