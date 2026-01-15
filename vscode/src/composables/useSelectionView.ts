import { computed, createSingletonComposable, useWebviewView, watchEffect } from "reactive-vscode";
import { useOverrideGenerator } from "./useOverrideGenerator";

function generateSelectionHtml(
  fileName: string,
  version: string,
  start: number,
  end: number,
  jsonPreview: string,
  clickMode: string,
): string {
  const nextClickAction = clickMode === "set-start" ? "Set START line" : "Set END line";
  const nextClickColor = clickMode === "set-start" ? "rgba(76, 175, 80, 0.8)" : "rgba(244, 67, 54, 0.8)";

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
      max-height: 200px;
      overflow-y: auto;
    }

    .click-hint {
      font-size: 0.9em;
      padding: 10px;
      background: var(--vscode-editor-background);
      border-radius: 4px;
      border-left: 3px solid ${nextClickColor};
      margin-bottom: 12px;
    }

    .click-hint strong {
      color: ${nextClickColor};
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
    <div class="subtitle">Click lines in the editor to adjust range</div>
  </div>

  <div class="click-hint">
    <strong>Next click:</strong> ${nextClickAction}
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
    Run "Generate Parser Override" again to <strong>confirm</strong> or <strong>cancel</strong>.
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
  <div class="icon">🎯</div>
  <div class="message">No active selection</div>
  <div class="hint">Run "Generate Parser Override" command<br>to start selection mode</div>
</body>
</html>
  `.trim();
}

export const useSelectionView = createSingletonComposable(() => {
  const generator = useOverrideGenerator();

  const html = computed(() => {
    if (generator.mode.value !== "selecting") {
      return generateEmptyHtml();
    }

    const file = generator.fileName.value ?? "Unknown";
    const version = generator.unicodeVersion.value ?? "Unknown";
    const start = generator.selectionStart.value ?? 0;
    const end = generator.selectionEnd.value ?? 0;
    const json = generator.overrideJson.value ?? "{}";

    return generateSelectionHtml(file, version, start, end, json, generator.clickMode.value);
  });

  useWebviewView("ucd:selection", html, {
    webviewOptions: {
      enableScripts: false,
    },
  });

  watchEffect(() => {
    if (generator.mode.value === "selecting") {
      void generator.selectionStart.value;
      void generator.selectionEnd.value;
      void generator.clickMode.value;
    }
  });
});
