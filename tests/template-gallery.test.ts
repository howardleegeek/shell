import { readFileSync } from 'fs'
import path from 'path'

test('registry contains 16 templates (8 SVM + 8 EVM)', () => {
  const registryPath = path.resolve(__dirname, '../templates/registry.json')
  const raw = readFileSync(registryPath, 'utf-8')
  const data = JSON.parse(raw)
  const evmCount = Object.keys(data?.templates?.evm || {}).length
  const svmCount = Object.keys(data?.templates?.solana || {}).length
  expect(evmCount + svmCount).toBe(16)
})
