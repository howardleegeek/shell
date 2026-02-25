import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  __resetSnsModuleCacheForTest,
  __setSnsImporterForTest,
  ENS_TEXT_RECORD_KEYS,
  fetchEnsTextRecords,
  loadSnsModule,
  requireProvider,
  resolveSnsAddress,
  sanitizeAvatarUrl,
} from '../ensResolver'

afterEach(() => {
  __setSnsImporterForTest(null)
  __resetSnsModuleCacheForTest()
})

describe('ensResolver utils', () => {
  it('throws when provider is missing', () => {
    expect(() => requireProvider(null)).toThrow('Provider required')
  })

  it('sanitizes avatar URL to https only', () => {
    expect(sanitizeAvatarUrl('https://example.com/avatar.png')).toBe('https://example.com/avatar.png')
    expect(sanitizeAvatarUrl('javascript:alert(1)')).toBeNull()
    expect(sanitizeAvatarUrl('http://example.com/avatar.png')).toBeNull()
  })

  it('fetches ENS text records in parallel', async () => {
    const started: string[] = []
    let release: (() => void) | null = null
    const gate = new Promise<void>((resolve) => {
      release = resolve
    })

    const resolver = {
      getText: vi.fn(async (key: string) => {
        started.push(key)
        await gate
        return `${key}-value`
      }),
    }

    const pending = fetchEnsTextRecords(resolver)
    await Promise.resolve()

    expect(started).toEqual([...ENS_TEXT_RECORD_KEYS])

    if (release) {
      release()
    }

    const records = await pending
    for (const key of ENS_TEXT_RECORD_KEYS) {
      expect(records[key]).toBe(`${key}-value`)
    }
  })

  it('caches SNS dynamic import across calls', async () => {
    const importer = vi.fn(async () => ({
      resolveDomain: async () => null,
    }))
    __setSnsImporterForTest(importer)

    const first = await loadSnsModule()
    const second = await loadSnsModule()

    expect(first).toBe(second)
    expect(importer).toHaveBeenCalledTimes(1)
  })

  it('falls back to compatible Bonfida API when primary API throws', async () => {
    const retrieve = vi.fn(async () => ({
      registry: {
        owner: {
          toBase58: () => 'LegacyOwnerAddress',
        },
      },
    }))

    __setSnsImporterForTest(async () => ({
      resolveDomain: async () => {
        throw new Error('new API failed')
      },
      getDomainKey: async () => ({ pubkey: 'legacy-domain-key' }),
      NameRegistryState: { retrieve },
    }))

    const result = await resolveSnsAddress('alice.sol', { connection: {} })

    expect(result).toBe('LegacyOwnerAddress')
    expect(retrieve).toHaveBeenCalledTimes(1)
  })
})
