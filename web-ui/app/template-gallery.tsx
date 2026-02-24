import React from 'react'
import registry from '../../templates/registry.json'
import { TemplateGallery } from './components/TemplateGallery'

// Flatten registry into a single template list with chain hints
type T = { id: string; name: string; description: string; icon: string; promptTemplate: string; chain?: string }

export type TemplateItem = T

function flattenRegistry(): TemplateItem[] {
  const evm = Object.values((registry as any).templates?.evm ?? {}) as TemplateItem[]
  const sol = Object.values((registry as any).templates?.solana ?? {}) as TemplateItem[]
  const list: TemplateItem[] = [
    ...sol.map(t => ({ ...t, chain: 'SVM' })),
    ...evm.map(t => ({ ...t, chain: 'EVM' }))
  ]
  return list
}

export const TemplateGalleryPage: React.FC = () => {
  const templates = flattenRegistry()
  return <TemplateGallery templates={templates} />
}

export default TemplateGalleryPage
