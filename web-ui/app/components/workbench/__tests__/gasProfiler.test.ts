import {
  parseGasReport,
  parseComputeReport,
  colorForGas,
  generateAiSuggestions,
  formatNumber,
} from '../../lib/gasProfiler'

describe('Gas Profiler helpers', () => {
  test('parseGasReport parses simple lines', () => {
    const text = `Function: transfer(min)  min: 340  avg: 420  max: 580  calls: 10
Function: approve(min)  min: 260  avg: 270  max: 300  calls: 5`
    const rows = parseGasReport(text)
    expect(rows.length).toBe(2)
    expect(rows[0]).toMatchObject({ name: 'transfer', min: 340, avg: 420, max: 580, calls: 10 })
  })

  test('parseComputeReport parses compute lines', () => {
    const text = `Instruction: ADD  compute: 123
Instruction: SUB  compute: 45`
    const compute = parseComputeReport(text)
    expect(compute).toHaveLength(2)
    expect(compute[0]).toMatchObject({ instruction: 'ADD', compute: 123 })
  })
})

describe('Gas profiler utilities', () => {
  test('colorForGas returns a rgb color string', () => {
    const c = colorForGas(50000)
    expect(typeof c).toBe('string')
    expect(c.startsWith('rgb(')).toBe(true)
  })

  test('formatNumber formats large numbers', () => {
    expect(formatNumber(1234567)).toBe('1,234,567')
  })

  test('generateAiSuggestions returns hints for high gas', () => {
    const items = [{ name: 'transfer', min: 0, avg: 60000, max: 70000, calls: 1 }]
    const res = generateAiSuggestions(items as any)
    expect(Array.isArray(res)).toBe(true)
    expect(res[0]).toContain('High gas detected')
  })
})
