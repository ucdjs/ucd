# vscode-ucd

A Visual Studio Code extension

## Commands

<!-- commands -->

| Command                | Title                     |
| ---------------------- | ------------------------- |
| `ucd.browse-ucd-files` | UCD: Browse UCD Files     |
| `ucd.visualize-file`   | UCD: Visualize UCD File   |
| `ucd.refresh-explorer` | UCD: Refresh UCD Explorer |
| `ucd.open-entry`       | UCD: Open UCD Entry       |

<!-- commands -->

## Configurations

<!-- configs -->

| Key                    | Description                                                   | Type     | Default                   |
| ---------------------- | ------------------------------------------------------------- | -------- | ------------------------- |
| `ucd.local-store-path` | Path to local UCD data file store                             | `string` | `""`                      |
| `ucd.store-filters`    | Filters to apply on UCD Explorer                              | `object` | `{}`                      |
| `ucd.api-base-url`     | API base URL to fetch UCD data files from                     | `string` | `"https://api.ucdjs.dev"` |
| `ucd.store-url`        | URL of the remote UCD store (used when not using local store) | `string` | `""`                      |

<!-- configs -->

## Languages

<!-- languages -->

| Language | Extensions | Grammars | Snippets |
| -------- | ---------- | -------- | -------- |
| `ucd`    | .ucd       | -        | -        |

<!-- languages -->
