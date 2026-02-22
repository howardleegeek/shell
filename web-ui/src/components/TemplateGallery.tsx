import React, { useMemo, useState } from 'react'
import registry from '../../templates/registry.json'

type Template = {
  id: string
  name: string
  description: string
  category: string
  icon: string
  promptTemplate: string
}

export const TemplateGallery: React.FC<{ onUse?: (t: Template) => void }> = ({ onUse = () => {} }) => {
  const [query, setQuery] = useState('')
  const [tab, setTab] = useState<'SVM'|'EVM'|'All'>('All')
  const templates: Template[] = (registry as any).templates || []

  const filtered = templates.filter(t => {
    const hay = (t.name + ' ' + t.description).toLowerCase()
    const inQuery = hay.includes(query.toLowerCase())
    const inTab = tab === 'All' || t.category === tab
    return inQuery && inTab
  })

  const cols = 4

  return (
    <div style={{ padding: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button onClick={() => setTab('SVM')} style={{ padding: '6px 12px', background: tab==='SVM' ? '#0ea5e9' : '#111827', color: 'white', border: 'none', borderRadius: 6 }}>SVM</button>
          <button onClick={() => setTab('EVM')} style={{ padding: '6px 12px', background: tab==='EVM' ? '#0ea5e9' : '#111827', color: 'white', border: 'none', borderRadius: 6 }}>EVM</button>
          <button onClick={() => setTab('All')} style={{ padding: '6px 12px', background: tab==='All' ? '#0ea5e9' : '#111827', color: 'white', border: 'none', borderRadius: 6 }}>All</button>
        </div>
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search templates..."
          style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid #374151', width: 240, background: '#111827', color: 'white' }}
        />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 16 }}>
        {filtered.map(t => (
          <div key={t.id} role="article" style={{ border: '1px solid #374151', borderRadius: 8, padding: 12, position: 'relative', background: 'linear-gradient(135deg, rgba(2,6,23,0.9), rgba(8,14,34,0.9))', boxShadow: '0 0 0 2px rgba(0,0,0,0.3) inset', minHeight: 120 }}>
            <div style={{ fontSize: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 18 }}>{t.icon}</span>
              <strong>{t.name}</strong>
            </div>
            <div style={{ fontSize: 12, marginTop: 6, color: '#d1d5db' }}>{t.description}</div>
            <button
              onClick={() => onUse(t)}
              style={{ marginTop: 10, padding: '6px 12px', background: '#111827', color: 'white', border: '1px solid #374151', borderRadius: 6, cursor: 'pointer' }}
              aria-label={`Use ${t.name}`}
            >
              Use
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

export default TemplateGallery
