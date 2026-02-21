import { readFileSync } from 'fs'
import path from 'path'

function loadTemplate(mode: 'TransparentProxy'|'UUPSProxy'|'BeaconProxy'): string {
  const p = path.resolve(__dirname, '../../../../templates/upgrade', `${mode}.sol.template`)
  return readFileSync(p, 'utf8')
}

function generateCodeFromTemplate(mode: 'TransparentProxy'|'UUPSProxy'|'BeaconProxy', contractName: string): string {
  const tmpl = loadTemplate(mode)
  return tmpl.replace(/\{\{contractName\}\}/g, contractName)
}

describe('Upgrade templates', () => {
  test('TransparentProxy template contains contract placeholder', () => {
    const t = loadTemplate('TransparentProxy')
    expect(t).toContain('{{contractName}}')
    const code = generateCodeFromTemplate('TransparentProxy', 'MyContract')
    expect(code).toContain('MyContract')
  })

  test('UUPSProxy template contains contract placeholder', () => {
    const t = loadTemplate('UUPSProxy')
    expect(t).toContain('{{contractName}}')
    const code = generateCodeFromTemplate('UUPSProxy', 'MyContract')
    expect(code).toContain('MyContract')
  })

  test('BeaconProxy template exists and can render', () => {
    const t = loadTemplate('BeaconProxy')
    expect(t).toContain('{{contractName}}')
    const code = generateCodeFromTemplate('BeaconProxy', 'MyContract')
    expect(code).toContain('MyContract')
  })
})
