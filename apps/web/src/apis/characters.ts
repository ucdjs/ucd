import { queryOptions } from '@tanstack/react-query'

const API_BASE = 'https://api.ucdjs.dev/api/v1'

export interface UnicodeCharacter {
  codepoint: string
  name: string
  character: string
  category: string
  block: string
  script: string
  age: string
  bidirectional: string
  decomposition: string | null
  uppercase: string | null
  lowercase: string | null
  titlecase: string | null
}

export const fetchCharacter = async (hex: string, version: string) => {
  // TODO: Replace with actual API call when endpoint exists
  // const res = await fetch(`${API_BASE}/u/${hex}?version=${version}`)

  // Mock data for now
  const codepoint = parseInt(hex, 16)
  const char = String.fromCodePoint(codepoint)

  return {
    codepoint: `U+${hex.toUpperCase().padStart(4, '0')}`,
    name: `CHARACTER ${hex.toUpperCase()}`,
    character: char,
    category: 'Letter, Uppercase',
    block: 'Basic Latin',
    script: 'Latin',
    age: version,
    bidirectional: 'L',
    decomposition: null,
    uppercase: null,
    lowercase: char.toLowerCase() !== char ? char.toLowerCase() : null,
    titlecase: null,
  } satisfies UnicodeCharacter
}

export const characterQueryOptions = (hex: string, version: string) =>
  queryOptions({
    queryKey: ['character', version, hex],
    queryFn: () => fetchCharacter(hex, version),
    staleTime: 1000 * 60 * 60, // 1 hour
  })
