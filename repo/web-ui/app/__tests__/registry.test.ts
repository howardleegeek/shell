import registry from '../../../templates/registry.json'
describe('Template registry shape', () => {
  test('exposes at least 16 templates (8 SVM + 8 EVM)', () => {
    // Support both old nested shape and flat array shape
    let items: any[] = []
    if (registry && typeof registry === 'object') {
      if (registry.templates && typeof registry.templates === 'object') {
        const evm = registry.templates.evm || {}
        Object.entries(evm).forEach(([id, data]: [string, any]) => {
          items.push({ id, ...data, chain: 'EVM' })
        })
        const sol = registry.templates.solana || {}
        Object.entries(sol).forEach(([id, data]: [string, any]) => {
          items.push({ id, ...data, chain: 'SVM' })
        })
      } else if (Array.isArray(registry)) {
        items = registry
      }
    }
    // Fallback: if registry.json has become a plain object, do a safe guard
    expect(items.length).toBeGreaterThanOrEqual(16)
  })
})
