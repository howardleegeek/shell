export type TextRecords = Record<string, string>

// Pure Eth (ERC-1967) resolver logic for .eth forward/reverse lookups
export async function resolveEthDomain(inputValue: string, provider: any): Promise<{
  ethAddress?: string | null
  ethName?: string | null
  avatar?: string | null
  texts?: TextRecords
  error?: string | null
}> {
  const result: {
    ethAddress?: string | null
    ethName?: string | null
    avatar?: string | null
    texts?: TextRecords
    error?: string | null
  } = {}

  if (!provider) {
    result.error = 'No ethers provider available'
    return result
  }

  try {
    // Forward: domain -> address for .eth domains
    if (inputValue.endsWith('.eth')) {
      const address = await provider.resolveName(inputValue)
      if (address) result.ethAddress = address
      // Reverse: address -> name
      if (address) {
        try {
          const name = await provider.lookupAddress(address)
          if (name) result.ethName = name
        } catch {
          // ignore reverse lookup errors
        }
      }
      // Try to fetch avatar/text records if name is known
      if (inputValue) {
        try {
          // @ts-ignore
          const resolver = await provider.getResolver(inputValue)
          if (resolver?.getText) {
            const avatarText = await resolver.getText?.('avatar')
            if (avatarText) result.avatar = avatarText
            const obj: TextRecords = {}
            const keys = ['url', 'email', 'description']
            for (const k of keys) {
              // @ts-ignore
              if (resolver?.getText) {
                try {
                  const v = await resolver.getText?.(k)
                  if (v) obj[k] = v
                } catch {}
              }
            }
            if (Object.keys(obj).length > 0) {
              result.texts = obj
            }
          }
        } catch {
          // ignore resolver fetch errors
        }
      }
    } else if (/^0x[0-9a-fA-F]{40}$/.test(inputValue)) {
      // Address -> name
      const name = await (provider as any).lookupAddress(inputValue)
      if (name) result.ethName = name
    } else {
      // Treat as potential ENS name, try resolving to address
      const address = await provider.resolveName(inputValue)
      if (address) {
        result.ethAddress = address
        const name = await provider.lookupAddress(address)
        if (name) result.ethName = name
      }
    }
  } catch (e: any) {
    result.error = e?.message ?? 'Resolution error'
  }

  return result
}

// Pure SNS (Solana Name Service) resolver logic for .sol domains
export async function resolveSolDomain(inputValue: string): Promise<{
  solAddress?: string | null
  solName?: string | null
  error?: string | null
}> {
  const result: { solAddress?: string | null; solName?: string | null; error?: string | null } = {}
  let sns: any
  try {
    sns = await import('@bonfida/spl-name-service')
  } catch {
    result.error = 'SNS resolution library not available'
    return result
  }

  try {
    if (sns?.resolveDomain) {
      const addr = await sns.resolveDomain(inputValue)
      if (addr) result.solAddress = addr
      if (addr && sns?.resolveAddress) {
        const name = await sns.resolveAddress(addr)
        if (name) result.solName = name
      }
      return result
    }
    // Fallback approach
    const addr = await (sns?.NameService?.resolveDomain?.(inputValue))
    if (addr) result.solAddress = addr
  } catch (e: any) {
    result.error = e?.message ?? 'SNS resolution error'
  }

  return result
}
