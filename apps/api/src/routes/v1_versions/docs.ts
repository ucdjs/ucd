import { dedent } from "@luxass/utils";

export const LIST_ALL_UNICODE_VERSIONS_ROUTE_DOCS = dedent`
    ## List All Unicode Versions

    This endpoint retrieves a comprehensive list of all Unicode versions, including metadata and support status.

    - Provides **version metadata** such as documentation URLs and public URLs
    - Includes **draft versions** if available
    - Supports **caching** for performance optimization
`;

export const GET_VERSION_FILE_TREE_ROUTE_DOCS = dedent`
    This endpoint provides a **structured list of all files** inside the [\`ucd folder\`](https://unicode.org/Public/UCD/latest/ucd) associated with a specific Unicode version.

    For older versions, the files are retrieved without the \`/ucd\` prefix, while for the latest version, the \`/ucd\` prefix is included.
`;
