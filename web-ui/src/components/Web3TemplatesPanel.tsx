import React from 'react'
import { SOLANA_TEMPLATES, ETHEREUM_TEMPLATES } from '../templates/templates'

type TemplateCard = {
  id: string
  title: string
  description: string
  emoji: string
  prompt: string
  chain: 'SVM' | 'EVM'
}

type TemplateCardProps = {
  item: TemplateCard
  onSelect: (prompt: string) => void
}

const Card: React.FC<TemplateCardProps> = ({ item, onSelect }) => {
  return (
    <div
      role="button"
      aria-label={item.title}
      onClick={() => onSelect(item.prompt)}
      style={{
        border: '1px solid #ddd',
        borderRadius: 8,
        padding: 12,
        width: 280,
        margin: 8,
        cursor: 'pointer',
      }}
    >
      <div style={{ fontSize: 28 }}>{item.emoji}</div>
      <div style={{ fontWeight: 600, marginTop: 6 }}>{item.title}</div>
      <div style={{ color: '#555', fontSize: 12, marginTop: 4 }}>{item.description}</div>
    </div>
  )
}

type Props = {
  onSelect: (prompt: string) => void
  initialTab?: 'SVM' | 'EVM'
  onDismiss?: () => void
}

export const Web3TemplatesPanel: React.FC<Props> = ({ onSelect, initialTab = 'SVM', onDismiss }) => {
  const [tab, setTab] = React.useState<'SVM'|'EVM'>(initialTab)

  // For simplicity ensure 5 items per tab as per acceptance criteria
  const displayed: TemplateCard[] = tab === 'SVM' ? SOLANA_TEMPLATES : ETHEREUM_TEMPLATES

  return (
    <div style={{ padding: 16, fontFamily: 'Arial, sans-serif' }}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <button onClick={() => setTab('SVM')} style={{ padding: '6px 12px', borderRadius: 6, border: tab==='SVM' ? '2px solid #333':'1px solid #ccc', background: '#fff' }}>SVM</button>
        <button onClick={() => setTab('EVM')} style={{ padding: '6px 12px', borderRadius: 6, border: tab==='EVM' ? '2px solid #333':'1px solid #ccc', background: '#fff' }}>EVM</button>
        {onDismiss ? (
          <button onClick={onDismiss} style={{ marginLeft: 'auto', padding: '6px 12px', borderRadius: 6, border: '1px solid #ccc' }}>Close</button>
        ) : null}
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', marginTop: 12 }}>
        {displayed.map((item) => (
          <Card key={item.id} item={item} onSelect={onSelect} />
        ))}
      </div>
    </div>
  )
}

export default Web3TemplatesPanel
