import { queryOptions } from "@tanstack/react-query";

export interface SearchResult {
  codepoint: string;
  name: string;
  version: string;
  block: string;
  script: string;
  category: string;
  character: string;
}

interface SearchSeed {
  codepoint: string;
  name: string;
  version: string;
  block: string;
  script: string;
  category: string;
}

const MOCK_SEED_RESULTS: SearchSeed[] = [
  {
    codepoint: "0041",
    name: "LATIN CAPITAL LETTER A",
    version: "1.1.0",
    block: "Basic Latin",
    script: "Latin",
    category: "Letter",
  },
  {
    codepoint: "03B1",
    name: "GREEK SMALL LETTER ALPHA",
    version: "1.1.0",
    block: "Greek and Coptic",
    script: "Greek",
    category: "Letter",
  },
  {
    codepoint: "05D0",
    name: "HEBREW LETTER ALEF",
    version: "1.1.0",
    block: "Hebrew",
    script: "Hebrew",
    category: "Letter",
  },
  {
    codepoint: "20AC",
    name: "EURO SIGN",
    version: "2.1.0",
    block: "Currency Symbols",
    script: "Common",
    category: "Symbol",
  },
  {
    codepoint: "1F600",
    name: "GRINNING FACE",
    version: "6.1.0",
    block: "Emoticons",
    script: "Common",
    category: "Symbol",
  },
  {
    codepoint: "1F984",
    name: "UNICORN FACE",
    version: "8.0.0",
    block: "Emoticons",
    script: "Common",
    category: "Symbol",
  },
  {
    codepoint: "1F9D1",
    name: "ADULT",
    version: "10.0.0",
    block: "Supplemental Symbols and Pictographs",
    script: "Common",
    category: "Symbol",
  },
  {
    codepoint: "1F9EA",
    name: "TEST TUBE",
    version: "11.0.0",
    block: "Supplemental Symbols and Pictographs",
    script: "Common",
    category: "Symbol",
  },
  {
    codepoint: "1D400",
    name: "MATHEMATICAL BOLD CAPITAL A",
    version: "3.1.0",
    block: "Mathematical Alphanumeric Symbols",
    script: "Common",
    category: "Letter",
  },
];

function toCharacter(codepoint: string) {
  const value = Number.parseInt(codepoint, 16);
  if (Number.isNaN(value)) return "?";
  return String.fromCodePoint(value);
}

function normalizeQuery(query: string) {
  return query.trim().toLowerCase().replace(/^u\+/, "");
}

export interface SearchCharactersInput {
  query?: string;
  version?: string;
}

export async function searchCharacters({ query, version }: SearchCharactersInput) {
  const trimmed = query?.trim() ?? "";
  if (!trimmed) return [] satisfies SearchResult[];

  const normalized = normalizeQuery(trimmed);
  const results = MOCK_SEED_RESULTS.filter((item) => {
    if (version && item.version !== version) return false;

    const haystack = [
      item.codepoint.toLowerCase(),
      item.name.toLowerCase(),
      item.block.toLowerCase(),
      item.script.toLowerCase(),
      item.category.toLowerCase(),
    ];

    return haystack.some((value) => value.includes(normalized));
  }).map((item) => ({
    ...item,
    character: toCharacter(item.codepoint),
  }));

  await new Promise((resolve) => setTimeout(resolve, 120));
  return results;
}

export function searchCharactersQueryOptions(input: SearchCharactersInput) {
  return queryOptions({
    queryKey: ["search", input.query ?? "", input.version ?? ""],
    queryFn: () => searchCharacters(input),
    staleTime: 1000 * 30,
  });
}
