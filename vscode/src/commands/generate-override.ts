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
          {
            label: `$(check) Confirm (lines ${generator.selectionStart.value}-${generator.selectionEnd.value})`,
            action: "confirm",
          },
          { label: "$(close) Cancel Selection", action: "cancel" },
        ],
        {
          placeHolder: "Override selection is active. Click lines in editor to adjust.",
        },
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

    await vscodeCommands.executeCommand("ucd:selection.focus");

    window.showInformationMessage(
      `Selection mode active (lines ${detected.start}-${detected.end}). Click to set start, click again to set end. Run command again to confirm.`,
    );
  });
}
