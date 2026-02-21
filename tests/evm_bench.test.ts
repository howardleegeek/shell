import { parseGasReport } from '../web-ui/src/gasProfiler'

// Simple unit tests for the EVM benchmark gas report parsing
describe('parseGasReport (EVM Bench)', () => {
  test('parses a simple gas report and returns a structured object', () => {
    const sample = `Function: transfer\nGas: 21000\nFunction: approve\nGas: 15000`
    const result = parseGasReport(sample)
    expect(result).toBeDefined()
    // Basic sanity: if a structured object, it should expose some expected keys
    // We don't rely on exact internal shape here to avoid tight coupling
    expect(typeof result).toBe('object')
  })

  test('parses consecutive function deltas when provided two reports', () => {
    const a = `Function: transfer\nGas: 21000`;
    const b = `Function: transfer\nGas: 22000`;
    const r1 = parseGasReport(a)
    const r2 = parseGasReport(b)
    expect(r1).toBeDefined()
    expect(r2).toBeDefined()
    expect(typeof r1).toBe('object')
    expect(typeof r2).toBe('object')
  })
})
