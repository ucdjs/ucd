import { dedent } from "@luxass/utils";

export const WILDCARD_PARAM = {
  in: "path",
  name: "wildcard",
  description: dedent`
    The path to the Unicode data resource you want to access. This can be any valid path from the official Unicode Public directory structure.

    ## Path Format Options

    | Pattern                        | Description                    | Example                             |
    |--------------------------------|--------------------------------|-------------------------------------|
    | \`{version}/ucd/{filename}\`   | UCD files for specific version | \`15.1.0/ucd/UnicodeData.txt\`      |
    | \`{version}/ucd/{sub}/{file}\` | Files in subdirectories        | \`15.1.0/ucd/emoji/emoji-data.txt\` |
    | \`{version}\`                  | List files for version         | \`15.1.0\`                          |
    | \`latest/ucd/{filename}\`      | Latest version of file         | \`latest/ucd/PropList.txt\`         |
  `,
  required: true,
  schema: {
    type: "string",
    pattern: ".*",
  },
  examples: {
    "UnicodeData.txt": {
      summary: "UnicodeData.txt for Unicode 15.0.0",
      value: "15.0.0/ucd/UnicodeData.txt",
    },
    "emoji-data.txt": {
      summary: "Emoji data file",
      value: "15.1.0/ucd/emoji/emoji-data.txt",
    },
    "root": {
      summary: "Root path",
      value: "",
    },
    "list-version-dir": {
      summary: "Versioned path",
      value: "15.1.0",
    },
  },
} as const;

export const PATTERN_QUERY_PARAM = {
  in: "query",
  name: "pattern",
  description: dedent`
    A glob pattern to filter directory listing results by filename. Only applies when the response is a directory listing.
    The matching is **case-insensitive**.

    ## Supported Glob Syntax

    | Pattern   | Description                                   | Example                                              |
    |-----------|-----------------------------------------------|------------------------------------------------------|
    | \`*\`     | Match any characters (except path separators) | \`*.txt\` matches \`file.txt\`                       |
    | \`?\`     | Match a single character                      | \`file?.txt\` matches \`file1.txt\`                  |
    | \`{a,b}\` | Match any of the patterns                     | \`*.{txt,xml}\` matches \`file.txt\` or \`file.xml\` |
    | \`[abc]\` | Match any character in the set                | \`file[123].txt\` matches \`file1.txt\`              |

    ## Examples

    - \`*.txt\` - Match all text files
    - \`Uni*\` - Match files starting with "Uni" (e.g., UnicodeData.txt)
    - \`*Data*\` - Match files containing "Data"
    - \`*.{txt,xml}\` - Match text or XML files
  `,
  required: false,
  schema: {
    type: "string",
  },
  examples: {
    "txt-files": {
      summary: "Match all .txt files",
      value: "*.txt",
    },
    "prefix-match": {
      summary: "Match files starting with 'Uni'",
      value: "Uni*",
    },
    "contains-match": {
      summary: "Match files containing 'Data'",
      value: "*Data*",
    },
    "multi-extension": {
      summary: "Match .txt or .xml files",
      value: "*.{txt,xml}",
    },
  },
} as const;

export const QUERY_PARAM = {
  in: "query",
  name: "query",
  description: dedent`
    A search query to filter directory listing results. Entries are matched if their name **starts with** this value (case-insensitive).
    This is useful for quick prefix-based searching within a directory.

    ## Examples

    - \`Uni\` - Match entries starting with "Uni" (e.g., UnicodeData.txt)
    - \`15\` - Match version directories starting with "15"
  `,
  required: false,
  schema: {
    type: "string",
  },
  examples: {
    "unicode-prefix": {
      summary: "Search for entries starting with 'Uni'",
      value: "Uni",
    },
    "version-prefix": {
      summary: "Search for version directories",
      value: "15",
    },
  },
} as const;

export const TYPE_QUERY_PARAM = {
  in: "query",
  name: "type",
  description: dedent`
    Filter directory listing results by entry type.

    - \`all\` (default) - Return both files and directories
    - \`files\` - Return only files
    - \`directories\` - Return only directories
  `,
  required: false,
  schema: {
    type: "string",
    enum: ["all", "files", "directories"] as string[],
    default: "all",
  },
  examples: {
    "all": {
      summary: "Show all entries (default)",
      value: "all",
    },
    "files-only": {
      summary: "Show only files",
      value: "files",
    },
    "directories-only": {
      summary: "Show only directories",
      value: "directories",
    },
  },
} as const;

export const SORT_QUERY_PARAM = {
  in: "query",
  name: "sort",
  description: dedent`
    The field to sort directory listing results by.

    - \`name\` (default) - Sort alphabetically by entry name
    - \`lastModified\` - Sort by last modification timestamp
  `,
  required: false,
  schema: {
    type: "string",
    enum: ["name", "lastModified"] as string[],
    default: "name",
  },
  examples: {
    "by-name": {
      summary: "Sort by name (default)",
      value: "name",
    },
    "by-date": {
      summary: "Sort by last modified date",
      value: "lastModified",
    },
  },
} as const;

export const ORDER_QUERY_PARAM = {
  in: "query",
  name: "order",
  description: dedent`
    The sort order for directory listing results.

    - \`asc\` (default) - Ascending order (A-Z, oldest first)
    - \`desc\` - Descending order (Z-A, newest first)
  `,
  required: false,
  schema: {
    type: "string",
    enum: ["asc", "desc"] as string[],
    default: "asc",
  },
  examples: {
    ascending: {
      summary: "Ascending order (default)",
      value: "asc",
    },
    descending: {
      summary: "Descending order",
      value: "desc",
    },
  },
} as const;
