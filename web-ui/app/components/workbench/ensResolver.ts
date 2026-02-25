export type EnsResolverRecord = {
  getText?: (key: string) => Promise<string | null>
}

export type EnsProvider = {
  resolveName?: (name: string) => Promise<string | null>
  lookupAddress?: (address: string) => Promise<string | null>
  getResolver?: (name: string) => Promise<EnsResolverRecord | null>
  connection?: unknown
}

type MaybePubkey = {
  toBase58?: () => string
}

type SnsModule = {
  resolve?: (name: string, provider?: EnsProvider) => Promise<string | null>
  resolveDomain?: (name: string, provider?: EnsProvider) => Promise<string | null>
  getDomainKey?: (name: string) => Promise<unknown> | unknown
  getDomainKeySync?: (name: string) => Promise<unknown> | unknown
  NameRegistryState?: {
    retrieve?: (connection: unknown, key: unknown) => Promise<unknown>
  }
}

type SnsImporter = (specifier: string) => Promise<unknown>

export const ENS_TEXT_RECORD_KEYS = [
  'url',
  'email',
  'avatar',
  'description',
  'com.twitter',
  'com.github',
] as const

export type EnsTextRecordKey = (typeof ENS_TEXT_RECORD_KEYS)[number]
export type EnsTextRecords = Record<EnsTextRecordKey, string | null>

let snsModulePromise: Promise<SnsModule | null> | null = null
let snsImporterOverride: SnsImporter | null = null

function createEmptyTextRecords(): EnsTextRecords {
  return ENS_TEXT_RECORD_KEYS.reduce((acc, key) => {
    acc[key] = null
    return acc
  }, {} as EnsTextRecords)
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function castSnsModule(value: unknown): SnsModule | null {
  return isRecord(value) ? (value as SnsModule) : null
}

async function dynamicImport(specifier: string): Promise<unknown> {
  const importer = snsImporterOverride ?? ((moduleId: string) => import(/* @vite-ignore */ moduleId))
  return importer(specifier)
}

export function __setSnsImporterForTest(importer: SnsImporter | null): void {
  snsImporterOverride = importer
  snsModulePromise = null
}

export function __resetSnsModuleCacheForTest(): void {
  snsModulePromise = null
}

export function requireProvider(provider: EnsProvider | null | undefined): EnsProvider {
  if (!provider) {
    throw new Error('Provider required')
  }
  return provider
}

export function normalizeResolverError(error: unknown): Error {
  if (error instanceof Error) {
    return error
  }

  if (typeof error === 'string') {
    return new Error(error)
  }

  return new Error('Unknown resolver error')
}

export function sanitizeAvatarUrl(rawUrl: string | null | undefined): string | null {
  if (!rawUrl) {
    return null
  }

  try {
    const parsed = new URL(rawUrl)
    if (parsed.protocol !== 'https:') {
      return null
    }
    return parsed.toString()
  } catch {
    return null
  }
}

export async function fetchEnsTextRecords(
  resolver: EnsResolverRecord | null | undefined,
): Promise<EnsTextRecords> {
  const records = createEmptyTextRecords()
  const getText = resolver?.getText

  if (!getText) {
    return records
  }

  const values = await Promise.all(ENS_TEXT_RECORD_KEYS.map((key) => getText(key)))

  ENS_TEXT_RECORD_KEYS.forEach((key, index) => {
    records[key] = values[index]
  })

  return records
}

export async function loadSnsModule(): Promise<SnsModule | null> {
  if (!snsModulePromise) {
    snsModulePromise = (async () => {
      try {
        return castSnsModule(await dynamicImport('@bonfida/spl-name-service'))
      } catch {
        try {
          return castSnsModule(await dynamicImport('@bonfida/spl-name-service-v2'))
        } catch {
          return null
        }
      }
    })()
  }

  return snsModulePromise
}

function extractDomainKey(value: unknown): unknown {
  if (isRecord(value) && 'pubkey' in value) {
    return value.pubkey
  }

  return value
}

function extractOwnerAddress(value: unknown): string | null {
  if (!isRecord(value)) {
    return null
  }

  const registry = value.registry
  if (!isRecord(registry)) {
    return null
  }

  const owner = registry.owner as MaybePubkey | string | undefined
  if (!owner) {
    return null
  }

  if (typeof owner === 'string') {
    return owner
  }

  if (typeof owner.toBase58 === 'function') {
    return owner.toBase58()
  }

  return null
}

async function resolveSnsAddressLegacyApi(
  snsModule: SnsModule,
  name: string,
  provider: EnsProvider,
): Promise<string | null> {
  const getDomainKey = snsModule.getDomainKey ?? snsModule.getDomainKeySync
  const retrieve = snsModule.NameRegistryState?.retrieve

  if (typeof getDomainKey !== 'function' || typeof retrieve !== 'function' || !provider.connection) {
    return null
  }

  const domainKey = extractDomainKey(await Promise.resolve(getDomainKey(name)))
  const state = await retrieve(provider.connection, domainKey)
  return extractOwnerAddress(state)
}

export async function resolveSnsAddress(name: string, provider: EnsProvider): Promise<string | null> {
  const snsModule = await loadSnsModule()

  if (!snsModule) {
    throw new Error('SNS resolver unavailable')
  }

  try {
    if (typeof snsModule.resolveDomain === 'function') {
      return await snsModule.resolveDomain(name, provider)
    }

    if (typeof snsModule.resolve === 'function') {
      return await snsModule.resolve(name, provider)
    }

    throw new Error('Unsupported Bonfida API version')
  } catch (primaryError) {
    try {
      const fallbackAddress = await resolveSnsAddressLegacyApi(snsModule, name, provider)
      if (fallbackAddress) {
        return fallbackAddress
      }
    } catch (fallbackError) {
      throw normalizeResolverError(fallbackError)
    }

    throw normalizeResolverError(primaryError)
  }
}
