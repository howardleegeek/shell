const fs = require('fs')
const path = require('path')

describe('MCP Foundry Docker config', () => {
  test('Dockerfile exists and contains Foundry install steps', () => {
    const p = path.join(__dirname, '..', 'mcp-server', 'Dockerfile')
    expect(fs.existsSync(p)).toBe(true)
    const s = fs.readFileSync(p, 'utf8')
    expect(s).toContain('FROM node:22-bookworm-slim')
    expect(s).toContain('foundryup')
  })

  test('entrypoint.sh exists and starts MCP after Anvil', () => {
    const p = path.join(__dirname, '..', 'mcp-server', 'entrypoint.sh')
    expect(fs.existsSync(p)).toBe(true)
    const s = fs.readFileSync(p, 'utf8')
    expect(s).toContain('anvil --host 0.0.0.0')
    expect(s).toContain('node dist/server.js')
  })

  test('docker-compose.yaml exposes ports 3001 and 8545', () => {
    const p = path.join(__dirname, '..', 'mcp-server', 'docker-compose.yaml')
    expect(fs.existsSync(p)).toBe(true)
    const s = fs.readFileSync(p, 'utf8')
    expect(s).toContain('"3001:3001"')
    expect(s).toContain('"8545:8545"')
  })

  test('.dockerignore contains node_modules, dist, .git', () => {
    const p = path.join(__dirname, '..', 'mcp-server', '.dockerignore')
    expect(fs.existsSync(p)).toBe(true)
    const s = fs.readFileSync(p, 'utf8')
    expect(s).toContain('node_modules')
    expect(s).toContain('dist')
    expect(s).toContain('.git')
  })
})
