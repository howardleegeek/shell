import React, { useState } from 'react'

type EnsResolverRecord = {
  getText?: (key: string) => Promise<string | null>
}

type EnsProvider = {
  resolveName?: (name: string) => Promise<string | null>
  lookupAddress?: (address: string) => Promise<string | null>
  getResolver?: (name: string) => Promise<EnsResolverRecord | null>
}

declare global {
  interface Window {
    __ENS_RESOLVER_TEST_PROVIDER__?: EnsProvider
  }
}

function getProvider(): EnsProvider | null {
  return window.__ENS_RESOLVER_TEST_PROVIDER__ ?? null
}

export function sanitizeAvatarUrl(rawUrl: string | null | undefined): string | null {
  if (!rawUrl) return null

  try {
    const parsed = new URL(rawUrl)
    if (parsed.protocol !== 'https:') return null
    return parsed.toString()
  } catch {
    return null
  }
}

export default function EnsResolver(): React.ReactElement {
  const [query, setQuery] = useState('')
  const [resolvedAddress, setResolvedAddress] = useState<string | null>(null)
  const [resolvedName, setResolvedName] = useState<string | null>(null)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleResolve = async () => {
    const value = query.trim()
    setError(null)
    setResolvedAddress(null)
    setResolvedName(null)
    setAvatarUrl(null)

    if (!value) {
      setError('Please enter a name or address.')
      return
    }

    const provider = getProvider()
    if (!provider) {
      setError('Provider unavailable.')
      return
    }

    if (value.toLowerCase().endsWith('.eth')) {
      if (!provider.resolveName) {
        setError('Resolver unavailable.')
        return
      }

      const address = await provider.resolveName(value)
      if (!address) {
        setError('Name not found.')
        return
      }

      setResolvedAddress(address)

      if (provider.getResolver) {
        const resolver = await provider.getResolver(value)
        const rawAvatar = resolver?.getText ? await resolver.getText('avatar') : null
        setAvatarUrl(sanitizeAvatarUrl(rawAvatar))
      }
      return
    }

    if (value.startsWith('0x') && provider.lookupAddress) {
      const name = await provider.lookupAddress(value)
      if (!name) {
        setError('Address not found.')
        return
      }
      setResolvedName(name)
      return
    }

    setError('Unsupported input.')
  }

  const copyAddress = async () => {
    if (!resolvedAddress) return
    await navigator.clipboard.writeText(resolvedAddress)
  }

  return (
    <div>
      <input
        value={query}
        onChange={(event: React.ChangeEvent<HTMLInputElement>) => setQuery(event.target.value)}
        placeholder="0x... or example.eth or example.sol"
      />
      <button type="button" onClick={handleResolve}>Resolve .eth</button>

      {error ? <p role="alert">{error}</p> : null}
      {resolvedAddress ? <p>Address: {resolvedAddress}</p> : null}
      {resolvedName ? <p>Name: {resolvedName}</p> : null}

      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt="ENS avatar"
          referrerPolicy="no-referrer"
        />
      ) : null}

      {resolvedAddress ? (
        <button type="button" onClick={copyAddress}>Copy address</button>
      ) : null}
    </div>
  )
}
