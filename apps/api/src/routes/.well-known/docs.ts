import { dedent } from "@luxass/utils";

export const UCD_CONFIG_ROUTE_DOCS = dedent`
    ## UCD Configuration

    This endpoint retrieves the UCD configuration, including available API endpoints for accessing Unicode data resources.

    > [!NOTE]
    > The configuration follows the [UCD.js Well-Known Configuration](https://ucdjs.dev/docs/usage/well-known) specification.

`;

export const UCD_STORE_ROUTE_DOCS = dedent`
    ## UCD Store Manifest

    This endpoint retrieves the UCD Store manifest, which contains metadata about available Unicode data files for each version.

    The manifest provides information about expected files for each Unicode version, allowing clients to discover and verify available data files.
`;
