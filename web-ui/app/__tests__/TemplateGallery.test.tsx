import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import registry from '../../../templates/registry.json'
import { TemplateGallery } from '../components/TemplateGallery'

// Flatten registry as the UI expects: 8 SVM + 8 EVM visible templates
const flatten = () => {
  const evm = Object.values((registry as any).templates?.evm ?? {}) as any[]
  const sol = Object.values((registry as any).templates?.solana ?? {}) as any[]
  return [
    ...sol.map(t => ({ ...t, chain: 'SVM' } as any)),
    ...evm.map(t => ({ ...t, chain: 'EVM' } as any))
  ]
}

export const TemplateGalleryTestWrapper: React.FC<{ templates?: any[]; onUse?: jest.Mock }> = ({ templates, onUse }) => {
  const data = templates ?? flatten()
  // Import TemplateCard types via compile-time boundary; we just render using the gallery directly
  const { TemplateGallery } = require('../components/TemplateGallery')
  return <TemplateGallery templates={data as any} onUse={onUse as any} />
}

test('Gallery renders 16 visible templates from registry (8 SVM + 8 EVM)', () => {
  const data = flatten()
  const { container } = render(<TemplateGallery templates={data as any} />)
  const cards = container.querySelectorAll('[data-testid^="template-"]')
  expect(cards.length).toBe(16)
})

test('Switching to EVM does not remove items (still shows 16)', () => {
  const data = flatten()
  const { container, getByText } = render(<TemplateGallery templates={data as any} />)
  // Click EVM tab (prefer button if multiple elements share the label)
  const evmBtn = Array.from(container.querySelectorAll('button')).find(b => b.textContent?.trim() === 'EVM')
  if (evmBtn) fireEvent.click(evmBtn)
  const cards = container.querySelectorAll('[data-testid^="template-"]')
  expect(cards.length).toBe(16)
})

test('Search filter reduces results', () => {
  const data = flatten()
  const { container } = render(<TemplateGallery templates={data as any} />)
  const input = container.querySelector('input[placeholder="Search templates"]') as HTMLInputElement
  expect(input).toBeTruthy()
  if (!input) return
  fireEvent.change(input, { target: { value: 'ERC' } })
  // Should filter to a subset when searching for a keyword
  const cards = container.querySelectorAll('[data-testid^="template-"]')
  expect(cards.length).toBeLessThan(16)
})

test('Use button triggers callback', () => {
  const data = flatten()
  const onUse = jest.fn()
  const { container } = render(<TemplateGallery templates={data as any} onUse={onUse} />)
  const useBtn = Array.from(container.querySelectorAll('button')).find(b => b.textContent?.trim() === 'Use') as HTMLButtonElement
  expect(useBtn).toBeTruthy()
  if (useBtn) fireEvent.click(useBtn)
  expect(onUse).toHaveBeenCalled()
})
