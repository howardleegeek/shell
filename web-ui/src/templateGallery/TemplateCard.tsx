import React from 'react'

export type TemplateItem = {
  id: string
  name: string
  description: string
  chain: 'SVM' | 'EVM'
  category: string
  icon: string
  promptTemplate: string
}

type Props = {
  template: TemplateItem
  onUse?: (t: TemplateItem) => void
}

export const TemplateCard: React.FC<Props> = ({ template, onUse }) => {
  const handleUse = () => {
    if (onUse) onUse(template)
  }

  return (
    <div className="template-card" data-testid={`template-card-${template.id}`}> 
      <div className="template-icon" aria-label={template.name}>{template.icon}</div>
      <div className="template-content">
        <div className="template-name">{template.name}</div>
        <div className="template-desc">{template.description}</div>
      </div>
      <button className="template-use" onClick={handleUse}>Use</button>
    </div>
  )
}

export default TemplateCard
