import { dedent } from "@luxass/utils";

export const WILDCARD_PARAM_DOCS = dedent`
    The path to the Unicode data resource you want to access. This can be any valid path from the official Unicode Public directory structure.

    ## Path Format Options

    | Pattern | Description | Example |
    |---------|-------------|---------|
    | \`{version}/ucd/{filename}\` | UCD files for specific version | \`15.1.0/ucd/UnicodeData.txt\` |
    | \`{version}/ucd/{sub}/{file}\` | Files in subdirectories | \`15.1.0/ucd/emoji/emoji-data.txt\` |
    | \`{version}\` | List files for version | \`15.1.0\` |
    | \`latest/ucd/{filename}\` | Latest version of file | \`latest/ucd/PropList.txt\` |
`;

export const WILDCARD_ROUTE_DOCS = dedent`
  This endpoint proxies your request directly to Unicode.org, allowing you to access any file or directory under the Unicode Public directory structure with only slight [modifications](#tag/files/get/api/v1/files/{wildcard}/description/modifications).

  > [!IMPORTANT]
  > The \`{wildcard}\` parameter can be any valid path, you are even allowed to use nested paths like \`15.1.0/ucd/emoji/emoji-data.txt\`.

  > [!NOTE]
  > If you wanna access only some metadata about the path, you can use a \`HEAD\` request instead. See [here](#tag/files/head/api/v1/files/{wildcard})


  ### Modifications

  We are doing a slight modification to the response, only if the response is for a directory.
  If you request a directory, we will return a JSON listing of the files and subdirectories in that directory.
`;

export const WILDCARD_HEAD_ROUTE_DOCS = dedent`
  This endpoint returns metadata about the requested file or directory without fetching the entire content.
  It is useful for checking the existence of a file or directory and retrieving its metadata without downloading
  the content.

  > [!NOTE]
  > The \`HEAD\` request will return the same headers as a \`GET\` request, but without the body.
  > This means you can use it to check if a file exists or to get metadata like the last modified date, size, etc.
`;
