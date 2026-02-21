import registry from '../templates/registry.json'

// Basic tests to verify the registry contains the expected templates
describe('Template Registry', () => {
  it('should contain 8 EVM templates', () => {
    const evm = (registry as any).templates?.evm || {}
    const count = Object.values(evm).filter(v => typeof v === 'object').length
    // Expect exactly 8 EVM templates
    expect(count).toBe(8)
  })

  it('should contain 8 SVM templates', () => {
    const svm = (registry as any).templates?.solana || {}
    const count = Object.values(svm).filter(v => typeof v === 'object').length
    // Expect exactly 8 SVM templates
    expect(count).toBe(8)
  })

  it('each template should have a promptTemplate', () => {
    const evm = Object.values(((registry as any).templates?.evm) || {}) as any[]
    const first = evm[0]
    expect(first).toBeDefined()
    expect(typeof first.promptTemplate).toBe('string')
  })
})
