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
      const action = await window.showQuickPick(
        [
          { label: "$(check) Confirm Selection", action: "confirm" },
          { label: "$(close) Cancel", action: "cancel" },
        ],
        { placeHolder: "You are already selecting a heading range" },
      );

      if (action?.action === "confirm") {
        const override = generator.confirm();
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

    await vscodeCommands.executeCommand("ucd:inspector.focus");

    const result = await window.showQuickPick(
      [
        { label: `$(check) Confirm (lines ${detected.start}-${detected.end})`, action: "confirm" },
        { label: "$(edit) Adjust Start Line", action: "adjust-start" },
        { label: "$(edit) Adjust End Line", action: "adjust-end" },
        { label: "$(close) Cancel", action: "cancel" },
      ],
      {
        placeHolder: `Detected heading: lines ${detected.start}-${detected.end}. Confirm or adjust?`,
      },
    );

    if (!result) {
      generator.cancel();
      return;
    }

    if (result.action === "confirm") {
      const override = generator.confirm();
      if (override) {
        const json = JSON.stringify(override, null, 2);
        await env.clipboard.writeText(json);
        window.showInformationMessage("Override JSON copied to clipboard!");
      }
    } else if (result.action === "adjust-start") {
      const input = await window.showInputBox({
        prompt: "Enter start line number (0-indexed)",
        value: String(generator.selectionStart.value ?? 0),
        validateInput: (value) => {
          const num = Number.parseInt(value, 10);
          if (Number.isNaN(num) || num < 0) {
            return "Must be a non-negative integer";
          }
          return null;
        },
      });

      if (input !== undefined) {
        generator.setStart(Number.parseInt(input, 10));
        await promptForConfirmation();
      } else {
        generator.cancel();
      }
    } else if (result.action === "adjust-end") {
      const input = await window.showInputBox({
        prompt: "Enter end line number (0-indexed)",
        value: String(generator.selectionEnd.value ?? 0),
        validateInput: (value) => {
          const num = Number.parseInt(value, 10);
          if (Number.isNaN(num) || num < 0) {
            return "Must be a non-negative integer";
          }
          return null;
        },
      });

      if (input !== undefined) {
        generator.setEnd(Number.parseInt(input, 10));
        await promptForConfirmation();
      } else {
        generator.cancel();
      }
    } else {
      generator.cancel();
    }
  });

  async function promptForConfirmation() {
    const start = generator.selectionStart.value;
    const end = generator.selectionEnd.value;

    const result = await window.showQuickPick(
      [
        { label: `$(check) Confirm (lines ${start}-${end})`, action: "confirm" },
        { label: "$(edit) Adjust Start Line", action: "adjust-start" },
        { label: "$(edit) Adjust End Line", action: "adjust-end" },
        { label: "$(close) Cancel", action: "cancel" },
      ],
      {
        placeHolder: `Current selection: lines ${start}-${end}. Confirm or adjust?`,
      },
    );

    if (!result || result.action === "cancel") {
      generator.cancel();
      return;
    }

    if (result.action === "confirm") {
      const override = generator.confirm();
      if (override) {
        const json = JSON.stringify(override, null, 2);
        await env.clipboard.writeText(json);
        window.showInformationMessage("Override JSON copied to clipboard!");
      }
    } else if (result.action === "adjust-start") {
      const input = await window.showInputBox({
        prompt: "Enter start line number (0-indexed)",
        value: String(generator.selectionStart.value ?? 0),
      });

      if (input !== undefined) {
        generator.setStart(Number.parseInt(input, 10));
        await promptForConfirmation();
      } else {
        generator.cancel();
      }
    } else if (result.action === "adjust-end") {
      const input = await window.showInputBox({
        prompt: "Enter end line number (0-indexed)",
        value: String(generator.selectionEnd.value ?? 0),
      });

      if (input !== undefined) {
        generator.setEnd(Number.parseInt(input, 10));
        await promptForConfirmation();
      } else {
        generator.cancel();
      }
    }
  }
}
