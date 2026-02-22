import React, { useEffect, useState } from 'react'

type Template = {
  id: string
  name: string
  description: string
  chain: string
  category: string
  icon: string
  promptTemplate: string
}

const TemplateGallery: React.FC = () => {
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<"SVM" | "EVM">("SVM")
  const [query, setQuery] = useState("")

  useEffect(() => {
    fetch('/templates/registry.json')
      .then((r) => r.json())
      .then((data) => {
        const arr = (data?.templates ?? data) as Template[]
        setTemplates(arr)
        setLoading(false)
      })
  }, [])

  const filtered = templates.filter((t) =>
    t.chain === tab &&
    (t.name.toLowerCase().includes(query.toLowerCase()) ||
      t.description.toLowerCase().includes(query.toLowerCase()))
  )

  const handleUse = (prompt: string) => {
    const url = '/ai-chat?prompt=' + encodeURIComponent(prompt)
    window.location.href = url
  }

  return (
    <div className="template-gallery">
      <div className="topbar" style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
        <div className="tabs" style={{ display: 'flex', gap: '8px' }}>
          <button onClick={() => setTab('SVM')} className={tab === 'SVM' ? 'active' : ''}>SVM</button>
          <button onClick={() => setTab('EVM')} className={tab === 'EVM' ? 'active' : ''}>EVM</button>
        </div>
        <input
          placeholder="Search templates..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      <div className="grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
        {loading
          ? <div>Loading...</div>
          : filtered.map((t) => (
              <div key={t.id} className="card" style={{ border: '1px solid #333', padding: 12, borderRadius: 8 }}>
                <div className="card-icon" style={{ fontSize: 28 }}>{t.icon}</div>
                <div className="card-name" style={{ fontWeight: 600, marginTop: 6 }}>{t.name}</div>
                <div className="card-desc" style={{ fontSize: 12, marginTop: 4 }}>{t.description}</div>
                <button style={{ marginTop: 8 }} onClick={() => handleUse(t.promptTemplate)}>Use</button>
              </div>
            ))}
      </div>

      <div className="cta" style={{ marginTop: 16 }}>Start from scratch →</div>
    </div>
  )
}

export default TemplateGallery
