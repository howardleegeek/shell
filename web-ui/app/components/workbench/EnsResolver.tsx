import React, { useEffect, useMemo, useState } from 'react'

// ENS/SNS Resolver UI
// - .eth: forward (name -> address) and reverse (address -> name) using ethers
// - .sol: SNS via bonfida library (best-effort, dynamic import)
// - copy address functionality

type TextRecords = Record<string, string>

export default function EnsResolver(): JSX.Element {
  const [input, setInput] = useState<string>('')
  const [pending, setPending] = useState<boolean>(false)
  const [ethAddress, setEthAddress] = useState<string | null>(null)
  const [ethName, setEthName] = useState<string | null>(null)
  const [avatar, setAvatar] = useState<string | null>(null)
  const [texts, setTexts] = useState<TextRecords>({})
  const [solAddress, setSolAddress] = useState<string | null>(null)
    
  const [solName, setSolName] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const provider: any = useMemo(() => {
    try {
      const w = typeof window !== 'undefined' ? (window as any) : null
      if (w?.ethereum) {
        // @ts-ignore
        const { ethers } = require('ethers')
        // @ts-ignore
        return new ethers.providers.Web3Provider(w.ethereum)
      } else {
        // @ts-ignore
        const { ethers } = require('ethers')
        // @ts-ignore
        return ethers.getDefaultProvider()
      }
    } catch {
      return null
    }
  }, [])

  async function resolveEth(inputValue: string) {
    if (!provider) {
      setError('No ethers provider available')
      return
    }
    setPending(true)
    setError(null)
    setEthAddress(null)
    setEthName(null)
    setAvatar(null)
    setTexts({})
    try {
      // Forward: domain -> address for .eth domains
      if (inputValue.endsWith('.eth')) {
        const address = await provider.resolveName(inputValue)
        if (address) setEthAddress(address)
        // Reverse: address -> name
        if (address) {
          try {
            const name = await provider.lookupAddress(address)
            if (name) setEthName(name)
          } catch {
            // ignore if reverse lookup not available
          }
        }
        // Try to fetch avatar/text records if name is known
        if (inputValue) {
          try {
            // @ts-ignore
            const resolver = await provider.getResolver(inputValue)
            if (resolver?.getText) {
              const avatarText = await resolver.getText?.('avatar')
              if (avatarText) setAvatar(avatarText)
              const keys = ['url', 'email', 'description']
              const obj: TextRecords = {}
              for (const k of keys) {
                // @ts-ignore
                if (resolver?.getText) {
                  try {
                    const v = await resolver.getText?.(k)
                    if (v) obj[k] = v
                  } catch {}
                }
              }
              setTexts(obj)
            }
          } catch {
            // ignore resolver fetch errors
          }
        }
      } else if (/^0x[0-9a-fA-F]{40}$/.test(inputValue)) {
        // Address to name
        const name = await (provider as any).lookupAddress(inputValue)
        if (name) setEthName(name)
      } else {
        // Treat as potential ENS name, try resolving to address
        const address = await provider.resolveName(inputValue)
        if (address) setEthAddress(address)
        if (address) {
          const name = await provider.lookupAddress(address)
          if (name) setEthName(name)
        }
      }
    } catch (e: any) {
      setError(e?.message ?? 'Resolution error')
    } finally {
      setPending(false)
    }
  }

  async function resolveSol(inputValue: string) {
    let sns: any
    try {
      sns = await import('@bonfida/spl-name-service')
    } catch {
      setError('SNS resolution library not available')
      return
    }
    try {
      // Best-effort: try common entry points
      if (sns?.resolveDomain) {
        const addr = await sns.resolveDomain(inputValue)
        if (addr) setSolAddress(addr)
        // reverse if possible
        if (addr && sns?.resolveAddress) {
          const name = await sns.resolveAddress(addr)
          if (name) setSolName(name)
        }
        return
      }
      // Fallback naming conventions
      const addr = await (sns?.NameService?.resolveDomain?.(inputValue))
      if (addr) setSolAddress(addr)
    } catch (e: any) {
      setError(e?.message ?? 'SNS resolution error')
    }
  }

  function copyToClipboard(text: string) {
    try {
      void navigator.clipboard?.writeText(text)
    } catch {
      // ignore copy errors
    }
  }

  useEffect(() => {
    // init
  }, [])

  return (
    <div className="ens-resolver" style={{ padding: 12, border: '1px solid #ddd', borderRadius: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <strong>ENS/SNS Resolver</strong>
      </div>
      <div style={{ marginTop: 8 }}>
        <label style={{ display: 'block', marginBottom: 6 }}>Input (paste address or domain)</label>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="0x... or example.eth or example.sol"
          style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #ccc' }}
        />
      </div>
      <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
        <button onClick={() => resolveEth(input)} disabled={pending}>
          Resolve .eth
        </button>
        <button onClick={() => resolveSol(input)} disabled={pending}>
          Resolve .sol
        </button>
      </div>

      {ethAddress && (
        <div style={{ marginTop: 12 }}>
          <div>Address: {ethAddress}</div>
          {ethName && <div>Name: {ethName}</div>}
          {avatar && <img src={avatar} alt="avatar" width={48} height={48} />}
          {texts && Object.keys(texts).length > 0 && (
            <div>
              Text records:
              <ul>
                {Object.entries(texts).map(([k, v]) => (
                  <li key={k}>{k}: {v}</li>
                ))}
              </ul>
            </div>
          )}
          {ethAddress && (
            <button onClick={() => copyToClipboard(ethAddress)}>Copy address</button>
          )}
        </div>
      )}

      {solAddress && (
        <div style={{ marginTop: 12 }}>
          <div>Sol Address: {solAddress}</div>
          {solName && <div>Name: {solName}</div>}
        </div>
      )}

      {error && (
        <div role="alert" style={{ color: 'red', marginTop: 8 }}>{error}</div>
      )}
    </div>
  )
}
