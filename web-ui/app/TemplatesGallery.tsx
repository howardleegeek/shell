import React, { useMemo, useState } from 'react'
import registry from '../../templates/registry.json'

type TemplateInfo = {
  id: string
  name: string
  description: string
  icon: string
  promptTemplate: string
  category: 'SVM' | 'EVM'
}

// Build a flat list of templates from the registry.json
function loadTemplates(): TemplateInfo[] {
  const evm = (registry as any).templates?.evm || {}
  const solana = (registry as any).templates?.solana || {}
  const arr: TemplateInfo[] = []

  Object.values(evm).forEach((t: any) => {
    arr.push({
      id: t.id,
      name: t.name,
      description: t.description,
      icon: t.icon,
      promptTemplate: t.promptTemplate,
      category: 'EVM',
    })
  })
  Object.values(solana).forEach((t: any) => {
    arr.push({
      id: t.id,
      name: t.name,
      description: t.description,
      icon: t.icon,
      promptTemplate: t.promptTemplate,
      category: 'SVM',
    })
  })
  return arr
}

type Props = {}

export const TemplatesGallery: React.FC<Props> = () => {
  const templates = useMemo(loadTemplates, [])
  const [tab, setTab] = useState<'SVM' | 'EVM'>('EVM')
  const [q, setQ] = useState('')

  const filtered = useMemo(() => {
    return templates.filter(t => {
      const inTab = t.category === tab
      const matches = t.name.toLowerCase().includes(q.toLowerCase()) || t.description.toLowerCase().includes(q.toLowerCase())
      return inTab && (q.trim() === '' ? true : matches)
    })
  }, [templates, tab, q])

  return (
    <div style={{ padding: 20, fontFamily: 'Inter, system-ui, Arial', color: '#e6e6e6', minHeight: '100vh', background: '#0b0b14' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ fontSize: 20, fontWeight: 600 }}>Template Gallery</div>
        <button
          onClick={() => console.log('start-from-scratch')}
          style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid #3f3f8f', background: '#111', color: '#7df2ff' }}
        >
          Start from scratch
        </button>
      </div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12 }}>
        <button onClick={() => setTab('SVM')} style={tab === 'SVM' ? activeTabStyle : tabButtonStyle}>SVM</button>
        <button onClick={() => setTab('EVM')} style={tab === 'EVM' ? activeTabStyle : tabButtonStyle}>EVM</button>
        <div style={{ marginLeft: 'auto' }} />
        <input
          aria-label="search"
          placeholder="Search templates..."
          value={q}
          onChange={e => setQ(e.target.value)}
          style={{ background: '#111', border: '1px solid #333', color: '#fff', padding: '8px 10px', borderRadius: 6 }}
        />
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))',
          gap: 16,
        }}
      >
        {filtered.map(t => (
          <TemplateCard key={t.id} t={t} />
        ))}
      </div>
    </div>
  )
}

const tabButtonStyle: React.CSSProperties = {
  padding: '6px 12px',
  borderRadius: 6,
  border: '1px solid #333',
  background: '#141414',
  color: '#cbd5e1',
}
const activeTabStyle: React.CSSProperties = {
  ...tabButtonStyle,
  borderColor: '#3f3f8f',
  color: '#7df2ff',
  boxShadow: '0 0 12px rgba(125,242,255,0.8)'
}

export default TemplatesGallery
