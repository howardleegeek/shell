import { readFileSync } from 'fs'
import path from 'path'
import { action, generateUpgradeCode, __testUtils } from '~/routes/api.upgrade'

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

  test('generated code includes storage layout check reminder', () => {
    const code = generateUpgradeCode('transparent', 'VaultV2')
    expect(code).toContain('STORAGE LAYOUT CHECK REMINDER')
    expect(code).toContain('forge inspect VaultV2 storage-layout')
  })

  test('uups generated script has upgradeToAndCall and valid calldata reference', () => {
    const code = generateUpgradeCode('uups', 'VaultV3')
    expect(code).toContain('upgradeToAndCall(address,bytes)')
    expect(code).toContain('upgradeCallData')
    expect(code).not.toContain('initData.length')
  })

  test('beacon generated script includes BeaconProxy import', () => {
    const code = generateUpgradeCode('beacon', 'Treasury')
    expect(code).toContain('import "@openzeppelin/contracts/proxy/beacon/BeaconProxy.sol";')
  })

  test('action rejects invalid mode', async () => {
    const request = new Request('http://localhost/api/upgrade', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode: 'invalid', contractName: 'Vault' }),
    })

    const response = await action({ request } as any)
    expect(response.status).toBe(400)

    const payload = await response.json()
    expect(payload.error).toContain('Invalid mode')
  })

  test('sanitizeContractName strips invalid identifier chars', () => {
    expect(__testUtils.sanitizeContractName('123 Vault-V2!')).toBe('VaultV2')
  })
})
