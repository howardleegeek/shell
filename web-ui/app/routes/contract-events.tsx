import { json, type MetaFunction } from '@remix-run/cloudflare'
import ContractEventPanel from '~/components/workbench/ContractEventPanel'

export const meta: MetaFunction = () => {
  return [{ title: 'Contract Events' }, { name: 'description', content: 'Real-time contract and account events panel' }]
}

export const loader = () => json({})

export default function ContractEventsRoute() {
  return (
    <div style={{ padding: 16 }}>
      <h1>Contract Events</h1>
      <ContractEventPanel />
    </div>
  )
}
