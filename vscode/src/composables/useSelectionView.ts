import type { SectionId, SectionState } from "../lib/override-schema";
import { computed, createSingletonComposable, useWebviewView, watchEffect } from "reactive-vscode";
import { env, window } from "vscode";
import { getSectionDefinition, SECTION_DEFINITIONS } from "../lib/override-schema";
import { useOverrideGenerator } from "./useOverrideGenerator";

function getStatusIcon(status: SectionState["status"]): string {
  switch (status) {
    case "done": return "✅";
    case "active": return "➜";
    case "pending": return "○";
  }
}

function getStatusLabel(status: SectionState["status"]): string {
  switch (status) {
    case "done": return "Complete";
    case "active": return "Active";
    case "pending": return "Pending";
  }
}

function generateSectionListHtml(
  sections: SectionState[],
  activeSectionId: string | null,
): string {
  return sections.map((section) => {
    const definition = getSectionDefinition(section.id);
    if (!definition) return "";

    const isActive = section.id === activeSectionId;
    const activeClass = isActive ? "active" : "";
    const statusClass = section.status;

    let selectionInfo = "";
    if (definition.mode === "range" && section.range) {
      selectionInfo = `Lines ${section.range.start}-${section.range.end}`;
    } else if (definition.mode === "lines" && section.lines.length > 0) {
      selectionInfo = `${section.lines.length} line(s)`;
    } else {
      selectionInfo = "Not set";
    }

    return `
      <div class="section-item ${activeClass} ${statusClass}" data-section-id="${section.id}">
        <div class="section-header">
          <span class="status-icon">${getStatusIcon(section.status)}</span>
          <span class="section-label">${definition.label}</span>
          <span class="status-label">${getStatusLabel(section.status)}</span>
        </div>
        <div class="section-details">
          <span class="mode-badge">${definition.mode}</span>
          <span class="selection-info">${selectionInfo}</span>
        </div>
      </div>
    `;
  }).join("");
}

function generateSelectionHtml(
  fileName: string,
  version: string,
  sections: SectionState[],
  activeSectionId: string | null,
  clickMode: string,
  jsonPreview: string,
  pendingCount: number,
  doneCount: number,
  allDone: boolean,
): string {
  const activeSection = sections.find((s) => s.id === activeSectionId);
  const activeDefinition = activeSectionId ? getSectionDefinition(activeSectionId as "heading") : null;

  let nextClickAction = "";
  let nextClickColor = "var(--vscode-descriptionForeground)";

  if (activeSection && activeDefinition) {
    if (activeDefinition.mode === "range") {
      nextClickAction = clickMode === "set-start" ? "Set START line" : "Set END line";
      nextClickColor = activeDefinition.markerColor;
    } else {
      nextClickAction = "Toggle line selection";
      nextClickColor = activeDefinition.markerColor;
    }
  }

  return `
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

    .progress-bar {
      display: flex;
      gap: 4px;
      margin-top: 8px;
    }

    .progress-segment {
      flex: 1;
      height: 4px;
      border-radius: 2px;
      background: var(--vscode-panel-border);
    }

    .progress-segment.done {
      background: rgba(76, 175, 80, 0.8);
    }

    .progress-segment.active {
      background: rgba(255, 213, 79, 0.8);
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

    .section-item {
      padding: 10px;
      background: var(--vscode-editor-background);
      border-radius: 4px;
      margin-bottom: 6px;
      border-left: 3px solid transparent;
      cursor: pointer;
      transition: all 0.15s ease;
    }

    .section-item:hover {
      background: var(--vscode-list-hoverBackground);
    }

    .section-item.active {
      border-left-color: rgba(255, 213, 79, 0.8);
      background: var(--vscode-list-activeSelectionBackground);
    }

    .section-item.done {
      border-left-color: rgba(76, 175, 80, 0.6);
    }

    .section-header {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .status-icon {
      font-size: 0.9em;
    }

    .section-label {
      font-weight: 500;
      flex: 1;
    }

    .status-label {
      font-size: 0.8em;
      color: var(--vscode-descriptionForeground);
    }

    .section-details {
      display: flex;
      gap: 8px;
      margin-top: 6px;
      font-size: 0.85em;
    }

    .mode-badge {
      padding: 2px 6px;
      background: var(--vscode-badge-background);
      color: var(--vscode-badge-foreground);
      border-radius: 3px;
      font-size: 0.75em;
      text-transform: uppercase;
    }

    .selection-info {
      color: var(--vscode-descriptionForeground);
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

    .json-preview {
      background: var(--vscode-editor-background);
      border: 1px solid var(--vscode-panel-border);
      border-radius: 4px;
      padding: 8px;
      font-family: var(--vscode-editor-font-family);
      font-size: 0.85em;
      white-space: pre;
      overflow-x: auto;
      max-height: 150px;
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

    .action-buttons {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-top: 16px;
      padding-top: 12px;
      border-top: 1px solid var(--vscode-panel-border);
    }

    .action-btn {
      flex: 1;
      min-width: 80px;
      padding: 8px 12px;
      border: none;
      border-radius: 4px;
      font-family: var(--vscode-font-family);
      font-size: 0.9em;
      cursor: pointer;
      transition: opacity 0.15s ease;
    }

    .action-btn:hover {
      opacity: 0.9;
    }

    .action-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .action-btn.primary {
      background: var(--vscode-button-background);
      color: var(--vscode-button-foreground);
    }

    .action-btn.secondary {
      background: var(--vscode-button-secondaryBackground);
      color: var(--vscode-button-secondaryForeground);
    }

    .action-btn.danger {
      background: var(--vscode-errorForeground);
      color: var(--vscode-editor-background);
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="title">Override Selection</div>
    <div class="subtitle">${doneCount}/${sections.length} sections complete</div>
    <div class="progress-bar">
      ${sections.map((s) => `<div class="progress-segment ${s.status}"></div>`).join("")}
    </div>
  </div>

  ${activeSection
    ? `
  <div class="click-hint">
    <strong>Next click:</strong> ${nextClickAction}
  </div>
  `
    : ""}

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
    <div class="section-title">Sections</div>
    ${generateSectionListHtml(sections, activeSectionId)}
  </section>

  <section class="section">
    <div class="section-title">JSON Preview</div>
    <div class="json-preview">${jsonPreview}</div>
  </section>

  <div class="action-buttons">
    ${allDone
        ? `<button class="action-btn primary" id="finish-btn">Copy & Finish</button>`
        : `
        <button class="action-btn primary" id="confirm-btn" ${!activeSection ? "disabled" : ""}>Confirm</button>
        <button class="action-btn secondary" id="skip-btn" ${!activeSection ? "disabled" : ""}>Skip</button>
      `
    }
    <button class="action-btn danger" id="cancel-btn">Cancel</button>
  </div>

  <script>
    const vscode = acquireVsCodeApi();
    document.querySelectorAll('.section-item').forEach(item => {
      item.addEventListener('click', () => {
        const sectionId = item.getAttribute('data-section-id');
        vscode.postMessage({ type: 'selectSection', sectionId });
      });
    });

    const confirmBtn = document.getElementById('confirm-btn');
    const skipBtn = document.getElementById('skip-btn');
    const finishBtn = document.getElementById('finish-btn');
    const cancelBtn = document.getElementById('cancel-btn');

    if (confirmBtn) {
      confirmBtn.addEventListener('click', () => {
        vscode.postMessage({ type: 'confirmSection' });
      });
    }
    if (skipBtn) {
      skipBtn.addEventListener('click', () => {
        vscode.postMessage({ type: 'skipSection' });
      });
    }
    if (finishBtn) {
      finishBtn.addEventListener('click', () => {
        vscode.postMessage({ type: 'finish' });
      });
    }
    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => {
        vscode.postMessage({ type: 'cancel' });
      });
    }
  </script>
</body>
</html>
  `.trim();
}

function generateEmptyHtml(): string {
  return `
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
    const sections = generator.sections.value;
    const activeSectionId = generator.activeSectionId.value;
    const json = generator.overrideJson.value ?? "{}";
    const pendingCount = generator.pendingSections.value.length;
    const doneCount = generator.doneSections.value.length;
    const allDone = generator.allSectionsDone.value;

    return generateSelectionHtml(
      file,
      version,
      sections,
      activeSectionId,
      generator.clickMode.value,
      json,
      pendingCount,
      doneCount,
      allDone,
    );
  });

  useWebviewView("ucd:selection", html, {
    webviewOptions: {
      enableScripts: true,
    },
    onDidReceiveMessage: async (message: { type: string; sectionId?: string }) => {
      switch (message.type) {
        case "selectSection":
          if (message.sectionId) {
            generator.setActiveSection(message.sectionId as "heading");
          }
          break;
        case "confirmSection":
          generator.confirmActiveSection();
          break;
        case "skipSection":
          generator.skipActiveSection();
          break;
        case "finish": {
          const override = generator.confirmAll();
          if (override) {
            const json = JSON.stringify(override, null, 2);
            await env.clipboard.writeText(json);
            void window.showInformationMessage("Override JSON copied to clipboard!");
          }
          break;
        }
        case "cancel":
          generator.cancel();
          break;
      }
    },
  });

  watchEffect(() => {
    if (generator.mode.value === "selecting") {
      void generator.sections.value;
      void generator.activeSectionId.value;
      void generator.clickMode.value;
    }
  });
});
