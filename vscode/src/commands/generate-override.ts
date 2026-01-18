import { useActiveTextEditor, useCommand } from "reactive-vscode";
import { env, commands as vscodeCommands, window } from "vscode";
import { useOverrideGenerator } from "../composables/useOverrideGenerator";
import { commands } from "../generated/meta";

function detectHeadingBounds(content: string): { start: number; end: number } {
  const lines = content.split("\n");
  let end = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]?.trim() ?? "";

    if (line === "" || line.startsWith("#")) {
      end = i;
    } else {
      break;
    }
  }

  return { start: 0, end };
}

function extractVersionFromContent(content: string): string {
  const versionMatch = content.match(/Unicode\s+(\d+\.\d+\.\d+)/i);
  if (versionMatch?.[1]) {
    return versionMatch[1];
  }

  const dateMatch = content.match(/Date:\s*(\d{4})/);
  if (dateMatch?.[1]) {
    return `${dateMatch[1]}.0.0`;
  }

  return "16.0.0";
}

function getSelectionSummary(generator: ReturnType<typeof useOverrideGenerator>): string {
  const activeSection = generator.activeSection.value;
  const definition = generator.activeSectionDefinition.value;

  if (!activeSection || !definition) {
    return "";
  }

  if (definition.mode === "range" && activeSection.range) {
    return `${definition.label}: lines ${activeSection.range.start}-${activeSection.range.end}`;
  } else if (definition.mode === "lines" && activeSection.lines.length > 0) {
    return `${definition.label}: ${activeSection.lines.length} line(s)`;
  }

  return `${definition.label}: not set`;
}

export function useGenerateOverrideCommand() {
  const activeEditor = useActiveTextEditor();
  const generator = useOverrideGenerator();

  useCommand(commands.generateOverride, async () => {
    const editor = activeEditor.value;

    if (!editor) {
      window.showErrorMessage("No active editor found");
      return;
    }

    if (generator.mode.value === "selecting") {
      const doneCount = generator.doneSections.value.length;
      const totalCount = generator.sections.value.length;
      const summary = getSelectionSummary(generator);

      const items = [
        {
          label: generator.activeSection.value
            ? `$(check) Confirm ${generator.activeSectionDefinition.value?.label ?? "Section"}`
            : `$(check) Finish (${doneCount}/${totalCount} sections)`,
          action: "confirm" as const,
          description: summary,
        },
        { label: "$(close) Cancel Selection", action: "cancel" as const },
      ];

      const action = await window.showQuickPick(items, {
        placeHolder: generator.activeSection.value
          ? `Editing ${generator.activeSectionDefinition.value?.label}. Click lines in editor to adjust.`
          : "All sections complete. Confirm to generate override.",
      });

      if (action?.action === "confirm") {
        if (generator.activeSection.value) {
          const confirmed = generator.confirmActiveSection();
          if (!confirmed) {
            window.showWarningMessage("Selection is not valid. Please adjust the selection.");
            return;
          }

          if (generator.activeSection.value) {
            window.showInformationMessage(
              `Section confirmed. Now editing: ${generator.activeSectionDefinition.value?.label}`,
            );
            return;
          }
        }

        const override = generator.confirmAll();
        if (override) {
          const json = JSON.stringify(override, null, 2);
          await env.clipboard.writeText(json);
          window.showInformationMessage("Override JSON copied to clipboard!");
        }
      } else if (action?.action === "cancel") {
        generator.cancel();
        window.showInformationMessage("Selection cancelled");
      }
      return;
    }

    const document = editor.document;
    const content = document.getText();
    const fileName = document.fileName.split("/").pop() ?? "Unknown.txt";
    const version = extractVersionFromContent(content);

    const detected = detectHeadingBounds(content);

    generator.startSelection(editor, fileName, version, detected.start, detected.end);

    await vscodeCommands.executeCommand("ucd:selection.focus");

    window.showInformationMessage(
      `Selection mode active. Editing: Heading (lines ${detected.start}-${detected.end}). Click to adjust. Run command again to confirm.`,
    );
  });
}
