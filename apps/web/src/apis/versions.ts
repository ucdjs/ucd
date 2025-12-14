import { createServerFn } from '@tanstack/react-start'
import { queryOptions } from '@tanstack/react-query'

const API_BASE = 'https://api.ucdjs.dev/api/v1'

export interface UnicodeVersion {
  version: string
  documentationUrl: string
  date: string
  url: string
  mappedUcdVersion: string | null
  type: 'stable' | 'draft' | 'beta'
}

export interface UnicodeVersionDetails {
  version: string
  totalCharacters: number
  newCharacters: number
  totalBlocks: number
  newBlocks: number
  totalScripts: number
  newScripts: number
}

// Mock data for version details until API endpoint is available
const VERSION_DETAILS_MOCK: Record<string, UnicodeVersionDetails> = {
  '17.0.0': { version: '17.0.0', totalCharacters: 154998, newCharacters: 5185, totalBlocks: 338, newBlocks: 7, totalScripts: 168, newScripts: 3 },
  '16.0.0': { version: '16.0.0', totalCharacters: 149813, newCharacters: 5185, totalBlocks: 331, newBlocks: 4, totalScripts: 165, newScripts: 2 },
  '15.1.0': { version: '15.1.0', totalCharacters: 149628, newCharacters: 627, totalBlocks: 327, newBlocks: 1, totalScripts: 163, newScripts: 1 },
  '15.0.0': { version: '15.0.0', totalCharacters: 149001, newCharacters: 4489, totalBlocks: 326, newBlocks: 6, totalScripts: 162, newScripts: 2 },
  '14.0.0': { version: '14.0.0', totalCharacters: 144512, newCharacters: 838, totalBlocks: 320, newBlocks: 5, totalScripts: 160, newScripts: 1 },
  '13.0.0': { version: '13.0.0', totalCharacters: 143674, newCharacters: 5930, totalBlocks: 315, newBlocks: 5, totalScripts: 159, newScripts: 4 },
  '12.1.0': { version: '12.1.0', totalCharacters: 137744, newCharacters: 1, totalBlocks: 310, newBlocks: 0, totalScripts: 155, newScripts: 0 },
  '12.0.0': { version: '12.0.0', totalCharacters: 137743, newCharacters: 553, totalBlocks: 310, newBlocks: 4, totalScripts: 155, newScripts: 1 },
}

export const fetchVersions = createServerFn({ method: 'GET' }).handler(async () => {
  const res = await fetch(`${API_BASE}/versions`, {
    headers: { accept: 'application/json' },
  })
  if (!res.ok) {
    throw new Error('Failed to fetch versions')
  }
  return res.json() as Promise<UnicodeVersion[]>
})

export const fetchVersionDetails = async (version: string): Promise<UnicodeVersionDetails> => {
  // TODO: Replace with actual API call when endpoint is available
  // const res = await fetch(`${API_BASE}/versions/${version}/details`)
  // return res.json() as Promise<UnicodeVersionDetails>

  // Return mock data for now
  const details = VERSION_DETAILS_MOCK[version]
  if (details) {
    return details
  }

  // Fallback for unknown versions
  return {
    version,
    totalCharacters: 0,
    newCharacters: 0,
    totalBlocks: 0,
    newBlocks: 0,
    totalScripts: 0,
    newScripts: 0,
  }
}

export const versionsQueryOptions = () =>
  queryOptions({
    queryKey: ['versions'],
    queryFn: () => fetchVersions(),
    staleTime: 1000 * 60 * 60, // 1 hour
  })

export const versionDetailsQueryOptions = (version: string) =>
  queryOptions({
    queryKey: ['version-details', version],
    queryFn: () => fetchVersionDetails(version),
    staleTime: 1000 * 60 * 60, // 1 hour
  })
