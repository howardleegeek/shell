import { SVM_TEMPLATES, EVM_TEMPLATES } from '../src/promptTemplates'

test('SVM templates count', () => {
  expect(SVM_TEMPLATES).toHaveLength(5)
})

test('EVM templates count', () => {
  expect(EVM_TEMPLATES).toHaveLength(5)
})
