import React, { useMemo } from 'react'
import TemplateCard from './TemplateCard'
import registry from '../../../templates/registry.json'
import './TemplateGallery.css'

type Tab = 'SVM' | 'EVM'

type TemplateItem = any
type Props = {
  onUse?: (t: TemplateItem) => void
}

const TemplateGallery: React.FC<Props> = ({ onUse }) => {
  const [activeTab, setActiveTab] = React.useState<Tab>('SVM')
  const [query, setQuery] = React.useState('')

  // Normalize registry items to TS type
  const templates: TemplateItem[] = registry as any

  const visible = useMemo(() => {
    return templates.filter(t => t.chain === activeTab).filter(t => {
      if (!query) return true
      const q = query.toLowerCase()
      return (
        t.name.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q)
      )
    })
  }, [templates, activeTab, query])

  return (
    <div className="template-gallery" aria-label="Template Gallery">
      <div className="tg-header">
        <div className="tg-tabs" role="tablist" aria-label="Template tabs">
          {(['SVM', 'EVM'] as Tab[]).map((t) => (
            <button
              key={t}
              role="tab"
              aria-selected={activeTab === t}
              className={`tg-tab ${activeTab === t ? 'active' : ''}`}
              onClick={() => setActiveTab(t)}
            >{t}</button>
          ))}
        </div>
        <input
          className="tg-search"
          placeholder="Search templates..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Search templates"
        />
      </div>

      <div className="tg-grid">
        {visible.map((tmpl) => (
          <TemplateCard key={tmpl.id} template={tmpl as any} onUse={onUse} />
        ))}
      </div>
    </div>
  )
}

export default TemplateGallery
