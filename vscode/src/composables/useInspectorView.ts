import type { UCDStats } from "../lib/ucd-parser";
import { computed, createSingletonComposable, ref, useWebviewView, watchEffect } from "reactive-vscode";
import { getUCDStats } from "../lib/ucd-parser";
import { useOverrideGenerator } from "./useOverrideGenerator";

function generateInspectorHtml(fileName: string, stats: UCDStats): string {
  return /* html */ `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      font-family: var(--vscode-font-family);
      font-size: var(--vscode-font-size);
      color: var(--vscode-foreground);
      background: var(--vscode-sideBar-background);
      padding: 12px;
      line-height: 1.4;
    }

    .header {
      margin-bottom: 16px;
      padding-bottom: 12px;
      border-bottom: 1px solid var(--vscode-panel-border);
    }

    .file-name {
      font-size: 1.1em;
      font-weight: 500;
      word-break: break-all;
    }

    .version-badge {
      display: inline-block;
      padding: 2px 6px;
      background: var(--vscode-badge-background);
      color: var(--vscode-badge-foreground);
      border-radius: 3px;
      font-size: 0.8em;
      margin-top: 6px;
    }

    .section {
      margin-bottom: 16px;
    }

    .section-title {
      font-size: 0.85em;
      font-weight: 500;
      color: var(--vscode-descriptionForeground);
      margin-bottom: 8px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .stat-row {
      display: flex;
      justify-content: space-between;
      padding: 6px 8px;
      background: var(--vscode-editor-background);
      border-radius: 3px;
      margin-bottom: 4px;
    }

    .stat-label {
      color: var(--vscode-descriptionForeground);
    }

    .stat-value {
      font-weight: 500;
      color: var(--vscode-focusBorder);
    }

    .legend-item {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 6px 8px;
      background: var(--vscode-editor-background);
      border-radius: 3px;
      margin-bottom: 4px;
    }

    .legend-color {
      width: 12px;
      height: 12px;
      border-radius: 2px;
      flex-shrink: 0;
    }

    .legend-text {
      display: flex;
      flex-direction: column;
      min-width: 0;
    }

    .legend-name {
      font-size: 0.9em;
    }

    .legend-desc {
      font-size: 0.75em;
      color: var(--vscode-descriptionForeground);
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="file-name">${fileName}</div>
    ${stats.version ? `<span class="version-badge">Unicode ${stats.version}</span>` : ""}
  </div>

  <section class="section">
    <div class="section-title">Statistics</div>
    <div class="stat-row">
      <span class="stat-label">Total Lines</span>
      <span class="stat-value">${stats.totalLines.toLocaleString()}</span>
    </div>
    <div class="stat-row">
      <span class="stat-label">Entries</span>
      <span class="stat-value">${stats.totalEntries.toLocaleString()}</span>
    </div>
    <div class="stat-row">
      <span class="stat-label">Character Ranges</span>
      <span class="stat-value">${stats.characterRanges.toLocaleString()}</span>
    </div>
  </section>

  <section class="section">
    <div class="section-title">Properties</div>
    <div class="stat-row">
      <span class="stat-label">General Category</span>
      <span class="stat-value">${stats.properties.generalCategory.toLocaleString()}</span>
    </div>
    <div class="stat-row">
      <span class="stat-label">Decomposition</span>
      <span class="stat-value">${stats.properties.decomposition.toLocaleString()}</span>
    </div>
    <div class="stat-row">
      <span class="stat-label">Combining Class</span>
      <span class="stat-value">${stats.properties.combiningClass.toLocaleString()}</span>
    </div>
    <div class="stat-row">
      <span class="stat-label">Bidi Class</span>
      <span class="stat-value">${stats.properties.bidiClass.toLocaleString()}</span>
    </div>
    <div class="stat-row">
      <span class="stat-label">Numeric Type</span>
      <span class="stat-value">${stats.properties.numericType.toLocaleString()}</span>
    </div>
    <div class="stat-row">
      <span class="stat-label">Mirrored</span>
      <span class="stat-value">${stats.properties.mirrored.toLocaleString()}</span>
    </div>
  </section>

  <section class="section">
    <div class="section-title">Color Legend</div>
    <div class="legend-item">
      <div class="legend-color" style="background: #608b4e;"></div>
      <div class="legend-text">
        <span class="legend-name">Comments</span>
        <span class="legend-desc">Lines starting with #</span>
      </div>
    </div>
    <div class="legend-item">
      <div class="legend-color" style="background: #569cd6;"></div>
      <div class="legend-text">
        <span class="legend-name">Code Points</span>
        <span class="legend-desc">Unicode values</span>
      </div>
    </div>
    <div class="legend-item">
      <div class="legend-color" style="background: #ce9178;"></div>
      <div class="legend-text">
        <span class="legend-name">Names</span>
        <span class="legend-desc">Character names</span>
      </div>
    </div>
    <div class="legend-item">
      <div class="legend-color" style="background: #dcdcaa;"></div>
      <div class="legend-text">
        <span class="legend-name">Properties</span>
        <span class="legend-desc">Category, script</span>
      </div>
    </div>
    <div class="legend-item">
      <div class="legend-color" style="background: #c586c0;"></div>
      <div class="legend-text">
        <span class="legend-name">Ranges</span>
        <span class="legend-desc">Range notation (..)</span>
      </div>
    </div>
    <div class="legend-item">
      <div class="legend-color" style="background: #9cdcfe;"></div>
      <div class="legend-text">
        <span class="legend-name">Values</span>
        <span class="legend-desc">Property values</span>
      </div>
    </div>
  </section>
</body>
</html>
  `.trim();
}

function generateSelectionHtml(
  fileName: string,
  version: string,
  start: number,
  end: number,
  jsonPreview: string,
): string {
  return /* html */ `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      font-family: var(--vscode-font-family);
      font-size: var(--vscode-font-size);
      color: var(--vscode-foreground);
      background: var(--vscode-sideBar-background);
      padding: 12px;
      line-height: 1.4;
    }

    .header {
      margin-bottom: 16px;
      padding-bottom: 12px;
      border-bottom: 1px solid var(--vscode-panel-border);
    }

    .title {
      font-size: 1.1em;
      font-weight: 500;
      color: var(--vscode-textLink-foreground);
    }

    .subtitle {
      font-size: 0.85em;
      color: var(--vscode-descriptionForeground);
      margin-top: 4px;
    }

    .section {
      margin-bottom: 16px;
    }

    .section-title {
      font-size: 0.85em;
      font-weight: 500;
      color: var(--vscode-descriptionForeground);
      margin-bottom: 8px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .info-row {
      display: flex;
      justify-content: space-between;
      padding: 6px 8px;
      background: var(--vscode-editor-background);
      border-radius: 3px;
      margin-bottom: 4px;
    }

    .info-label {
      color: var(--vscode-descriptionForeground);
    }

    .info-value {
      font-weight: 500;
      font-family: var(--vscode-editor-font-family);
    }

    .selection-badge {
      display: inline-block;
      padding: 4px 8px;
      background: rgba(255, 213, 79, 0.3);
      border: 1px solid rgba(255, 213, 79, 0.6);
      border-radius: 4px;
      font-family: var(--vscode-editor-font-family);
      font-size: 0.9em;
    }

    .json-preview {
      background: var(--vscode-editor-background);
      border: 1px solid var(--vscode-panel-border);
      border-radius: 4px;
      padding: 8px;
      font-family: var(--vscode-editor-font-family);
      font-size: 0.85em;
      white-space: pre;
      overflow-x: auto;
      max-height: 300px;
      overflow-y: auto;
    }

    .hint {
      font-size: 0.8em;
      color: var(--vscode-descriptionForeground);
      margin-top: 12px;
      padding: 8px;
      background: var(--vscode-editor-background);
      border-radius: 4px;
      border-left: 3px solid var(--vscode-textLink-foreground);
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="title">Heading Selection Mode</div>
    <div class="subtitle">Adjust the heading range for parser override</div>
  </div>

  <section class="section">
    <div class="section-title">Target File</div>
    <div class="info-row">
      <span class="info-label">File</span>
      <span class="info-value">${fileName}</span>
    </div>
    <div class="info-row">
      <span class="info-label">Version</span>
      <span class="info-value">${version}</span>
    </div>
  </section>

  <section class="section">
    <div class="section-title">Current Selection</div>
    <div class="info-row">
      <span class="info-label">Start Line</span>
      <span class="selection-badge">${start}</span>
    </div>
    <div class="info-row">
      <span class="info-label">End Line</span>
      <span class="selection-badge">${end}</span>
    </div>
    <div class="info-row">
      <span class="info-label">Total Lines</span>
      <span class="info-value">${end - start + 1}</span>
    </div>
  </section>

  <section class="section">
    <div class="section-title">JSON Preview</div>
    <div class="json-preview">${jsonPreview}</div>
  </section>

  <div class="hint">
    Use the Quick Pick menu to confirm or adjust the selection.
    The highlighted lines in the editor show the current heading range.
  </div>
</body>
</html>
  `.trim();
}

function generateEmptyHtml(): string {
  return /* html */ `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <style>
    body {
      font-family: var(--vscode-font-family);
      font-size: var(--vscode-font-size);
      color: var(--vscode-descriptionForeground);
      background: var(--vscode-sideBar-background);
      padding: 20px;
      text-align: center;
    }
    .icon {
      font-size: 2em;
      margin-bottom: 12px;
      opacity: 0.5;
    }
    .message {
      line-height: 1.5;
    }
    .hint {
      font-size: 0.85em;
      margin-top: 8px;
      opacity: 0.7;
    }
  </style>
</head>
<body>
  <div class="icon">📋</div>
  <div class="message">No file inspected</div>
  <div class="hint">Open a UCD file and run<br>"Inspect UCD File" command</div>
</body>
</html>
  `.trim();
}

export const useInspectorView = createSingletonComposable(() => {
  const fileName = ref<string | null>(null);
  const fileContent = ref<string | null>(null);
  const generator = useOverrideGenerator();

  const stats = computed<UCDStats | null>(() => {
    if (!fileContent.value) return null;
    return getUCDStats(fileContent.value);
  });

  const html = computed(() => {
    if (generator.mode.value === "selecting") {
      const file = generator.fileName.value ?? "Unknown";
      const version = generator.unicodeVersion.value ?? "Unknown";
      const start = generator.selectionStart.value ?? 0;
      const end = generator.selectionEnd.value ?? 0;
      const json = generator.overrideJson.value ?? "{}";

      return generateSelectionHtml(file, version, start, end, json);
    }

    if (!fileName.value || !stats.value) {
      return generateEmptyHtml();
    }
    return generateInspectorHtml(fileName.value, stats.value);
  });

  useWebviewView("ucd:inspector", html, {
    webviewOptions: {
      enableScripts: false,
    },
  });

  watchEffect(() => {
    if (generator.mode.value === "selecting") {
      void generator.selectionStart.value;
      void generator.selectionEnd.value;
    }
  });

  function inspectFile(name: string, content: string) {
    fileName.value = name;
    fileContent.value = content;
  }

  function clear() {
    fileName.value = null;
    fileContent.value = null;
  }

  return { inspectFile, clear, fileName, stats };
});
