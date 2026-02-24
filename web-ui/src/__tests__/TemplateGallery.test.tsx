import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import TemplateGallery from '../components/TemplateGallery'

// Import registry from the project templates registry (relative to this test file)
const registry = require('../../../templates/registry.json')

describe('TemplateGallery', () => {
  test('renders 16 templates from registry (8 SVM + 8 EVM)', () => {
    const onUse = jest.fn()
    render(<TemplateGallery onUse={onUse} />)
    const items = screen.getAllByRole('article')
    // 8 SVM + 8 EVM templates
    expect(items.length).toBe(8 + 8)
  })

  test('tab switching filters templates by category', () => {
    const onUse = jest.fn()
    render(<TemplateGallery onUse={onUse} />)
    // switch to SVM
    fireEvent.click(screen.getByText('SVM'))
    const svms = screen.getAllByRole('article')
    expect(svms.length).toBe(8)
  })

  test('search filters templates by name/description', () => {
    const onUse = jest.fn()
    render(<TemplateGallery onUse={onUse} />)
    // type into search input
    const input = screen.getByPlaceholderText(/Search templates.../i) as HTMLInputElement
    input.value = 'SPL'
    fireEvent.change(input, { target: { value: 'SPL' } })
    const results = screen.getAllByRole('article')
    // Only SPL Token should match
    expect(results.length).toBe(1)
  })

  test('Use button triggers onUse with template data', () => {
    const onUse = jest.fn()
    render(<TemplateGallery onUse={onUse} />)
    const firstUse = screen.getAllByText('Use')[0]
    fireEvent.click(firstUse)
    expect(onUse).toHaveBeenCalled()
    const calledWith = onUse.mock.calls[0][0]
    expect(calledWith).toHaveProperty('id')
  })
})
