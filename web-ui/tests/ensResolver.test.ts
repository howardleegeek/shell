import { describe, it, expect, vi, beforeEach } from 'vitest'

import { resolveEthDomain, resolveSolDomain, TextRecords } from '../app/utils/ensResolver'

describe('ENS Resolver Utils', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('eth forward and reverse resolves with avatar and texts', async () => {
    const mockResolver = {
      getText: vi.fn().mockImplementation((key: string) => {
        if (key === 'avatar') return Promise.resolve('https://avatar.example/me.png')
        if (key === 'url') return Promise.resolve('https://example.com')
        if (key === 'email') return Promise.resolve('me@example.com')
        if (key === 'description') return Promise.resolve('Description')
        return Promise.resolve(undefined)
      }),
    }
    const provider: any = {
      resolveName: vi.fn().mockResolvedValue('0xDEADBEEF000000000000000000000000000000'),
      lookupAddress: vi.fn().mockResolvedValue('alice.eth'),
      getResolver: vi.fn().mockResolvedValue(mockResolver),
    }

    const res = await resolveEthDomain('example.eth', provider)
    expect(res.ethAddress).toBe('0xDEADBEEF000000000000000000000000000000')
    expect(res.ethName).toBe('alice.eth')
    expect(res.avatar).toBe('https://avatar.example/me.png')
    // texts may include url, email, description
    expect(res.texts?.url).toBe('https://example.com')
  })

  it('eth address to name', async () => {
    const provider: any = {
      resolveName: vi.fn().mockResolvedValue(undefined),
      lookupAddress: vi.fn().mockResolvedValue('bob.eth'),
    }
    const res = await resolveEthDomain('0x1111111111111111111111111111111111111111', provider)
    expect(res.ethName).toBe('bob.eth')
  })
})

describe('SNS Resolver Utils', () => {
  it('sol forward and reverse resolves', async () => {
    // Mock dynamic import of @bonfida/spl-name-service
    vi.doMock('@bonfida/spl-name-service', () => {
      return {
        resolveDomain: async (domain: string) => '0x1234567890abcdef1234567890abcdef12345678',
        resolveAddress: async (addr: string) => 'alice',
      }
    }, { fake: true })

    const { resolveSolDomain } = await import('../app/utils/ensResolver')
    const res = await resolveSolDomain('example.sol')
    expect(res.solAddress).toBe('0x1234567890abcdef1234567890abcdef12345678')
    expect(res.solName).toBe('alice')
  })
})
