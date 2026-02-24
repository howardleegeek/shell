// Lightweight tests for the AI NatSpec generator utilities
import { generateSolidityDocs, generateRustDocs, NatSpecDoc } from '../app/utils/aiNatSpec'

function assert(condition: boolean, msg: string) {
  if (!condition) throw new Error(`Assertion failed: ${msg}`)
}

function testSolidityDocs() {
  const solidity = `pragma solidity ^0.8.0;
function transfer(address to, uint amount) public returns (bool) { }` 
  const docs: NatSpecDoc[] = generateSolidityDocs(solidity)
  // Expect at least title and param for two arguments
  const hasTitle = docs.some(d => d.comment.includes('@title'))
  const hasParamTo = docs.some(d => d.comment.includes('param') && d.line > 0)
  assert(hasTitle, 'Solidity doc should include @title')
  // we should have a @param for both params
  assert(docs.filter(d => d.comment.includes('@param')).length >= 2, 'Solidity should generate @param docs')
  console.log('Solidity docs generated:', docs.length)
}

function testRustDocs() {
  const rust = `mod test {
  pub struct Account { pub balance: u64, }
  pub fn process() { }
}`
  const docs: NatSpecDoc[] = generateRustDocs(rust)
  const hasModule = docs.some(d => d.comment.includes('Auto-generated'))
  const hasInstr = docs.some(d => d.comment.includes('Instruction: process'))
  assert(hasModule, 'Rust module should have auto module doc')
  assert(hasInstr, 'Rust should generate instruction doc for process')
  console.log('Rust docs generated:', docs.length)
}

export function runTests() {
  try {
    testSolidityDocs()
    testRustDocs()
    console.log('NatSpecGenerator tests: ok')
    return true
  } catch (e) {
    console.error('NatSpecGenerator tests failed:', (e as Error).message)
    return false
  }
}

// If run directly with ts-node or similar, execute tests
if (require.main === module) {
  process.exit(runTests() ? 0 : 1)
}
