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

export const fetchVersions = createServerFn({ method: 'GET' }).handler(async () => {
  const res = await fetch(`${API_BASE}/versions`, {
    headers: { accept: 'application/json' },
  })
  if (!res.ok) {
    throw new Error('Failed to fetch versions')
  }
  return res.json() as Promise<UnicodeVersion[]>
})

export const versionsQueryOptions = () =>
  queryOptions({
    queryKey: ['versions'],
    queryFn: () => fetchVersions(),
    staleTime: 1000 * 60 * 60, // 1 hour
  })
