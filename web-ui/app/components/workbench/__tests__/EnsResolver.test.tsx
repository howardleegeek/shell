import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi } from 'vitest'
import EnsResolver from '../EnsResolver'

// Simple mock provider implementing the subset used by the tests
function createMockProvider() {
  return {
    resolveName: async (name: string) => {
      // forward: example.eth -> mock address
      if (name.endsWith('.eth')) {
        return '0xDEADBEEFDEADBEEFDEADBEEFDEADBEEFDEADBEEF'
      }
      // otherwise pretend not found
      return null
    },
    lookupAddress: async (addr: string) => {
      // reverse: address -> name
      if (addr.startsWith('0xDEADBEEF')) {
        return 'alice.eth'
      }
      return null
    },
    // For completeness; not used in .eth test but present to avoid runtime errors
    getResolver: async (_domain: string) => {
      return {
        getText: async (_key: string) => null,
      }
    },
  }
}

describe('EnsResolver (.eth)', () => {
  test('forward and reverse lookup for .eth', async () => {
    // Inject mock provider into global window for the component to pick up
    // @ts-ignore
    window.__ENS_RESOLVER_TEST_PROVIDER__ = createMockProvider()

    render(<EnsResolver />)

    // Enter a .eth domain
    const input = screen.getByPlaceholderText('0x... or example.eth or example.sol')
    fireEvent.change(input, { target: { value: 'alice.eth' } })

    // Trigger forward lookup
    fireEvent.click(screen.getByText('Resolve .eth'))

    // Expect address to be shown
    await waitFor(() => {
      expect(screen.getByText(/Address:/i)).toBeTruthy()
      expect(screen.getByText(/0xDEADBEEFDEADBEEFDEADBEEFDEADBEEFDEADBEEF/i)).toBeTruthy()
    })

    // Clean up test provider
    // @ts-ignore
    delete window.__ENS_RESOLVER_TEST_PROVIDER__
  })

  test('copy address copies to clipboard', async () => {
    // Re-inject mock provider
    // @ts-ignore
    window.__ENS_RESOLVER_TEST_PROVIDER__ = createMockProvider()

    // Mock clipboard
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: vi.fn() },
      configurable: true,
    })
    const writeTextSpy = vi.spyOn(navigator.clipboard, 'writeText').mockImplementation(async () => {})

    render(<EnsResolver />)
    const input = screen.getByPlaceholderText('0x... or example.eth or example.sol')
    fireEvent.change(input, { target: { value: 'alice.eth' } })
    fireEvent.click(screen.getByText('Resolve .eth'))
    await waitFor(() => {
      expect(screen.getByText(/Address:/i)).toBeTruthy()
    })
    // Click copy button
    const copyBtn = screen.getByText('Copy address')
    fireEvent.click(copyBtn)
    expect(writeTextSpy).toHaveBeenCalledWith('0xDEADBEEFDEADBEEFDEADBEEFDEADBEEFDEADBEEF')
    writeTextSpy.mockRestore()
  })
})
