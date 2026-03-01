import { useHotkey } from "@tanstack/react-hotkeys";
import { Command, CornerDownLeft, HelpCircle, Keyboard, X } from "lucide-react";
import { useEffect, useState } from "react";

interface KeyboardShortcutsHelpProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Shortcut {
  keys: string;
  description: string;
  category: "navigation" | "actions" | "view";
}

const shortcuts: Shortcut[] = [
  { keys: "Mod+K", description: "Open command palette", category: "navigation" },
  { keys: "Mod+Shift+S", description: "Focus source selector", category: "navigation" },
  { keys: "Mod+E", description: "Toggle error log panel", category: "view" },
  { keys: "Mod+/", description: "Show keyboard shortcuts", category: "view" },
  { keys: "Escape", description: "Close modals/panels", category: "actions" },
  { keys: "Mod+Enter", description: "Execute selected pipeline", category: "actions" },
];

export function KeyboardShortcutsHelp({ isOpen, onClose }: KeyboardShortcutsHelpProps) {
  // Close on escape
  useHotkey("Escape", () => {
    if (isOpen) onClose();
  });

  if (!isOpen) return null;

  const navigationShortcuts = shortcuts.filter((s) => s.category === "navigation");
  const actionShortcuts = shortcuts.filter((s) => s.category === "actions");
  const viewShortcuts = shortcuts.filter((s) => s.category === "view");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-lg border border-border bg-background shadow-lg">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div className="flex items-center gap-2">
            <Keyboard className="h-5 w-5 text-muted-foreground" />
            <h2 className="text-lg font-semibold">Keyboard Shortcuts</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1.5 hover:bg-muted transition-colors"
            title="Close (Esc)"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="max-h-[60vh] overflow-y-auto p-4 space-y-6">
          <ShortcutCategory title="Navigation" shortcuts={navigationShortcuts} />
          <ShortcutCategory title="Actions" shortcuts={actionShortcuts} />
          <ShortcutCategory title="View" shortcuts={viewShortcuts} />
        </div>

        {/* Footer */}
        <div className="border-t border-border px-4 py-3 bg-muted/30">
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <HelpCircle className="h-3 w-3" />
            Press <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px] font-mono">Mod+/</kbd> to show this help anytime
          </p>
        </div>
      </div>
    </div>
  );
}

function ShortcutCategory({ title, shortcuts }: { title: string; shortcuts: Shortcut[] }) {
  if (shortcuts.length === 0) return null;

  return (
    <div>
      <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
        {title}
      </h3>
      <div className="space-y-2">
        {shortcuts.map((shortcut) => (
          <div
            key={shortcut.keys}
            className="flex items-center justify-between py-1.5"
          >
            <span className="text-sm text-foreground">{shortcut.description}</span>
            <KeyboardShortcut keys={shortcut.keys} />
          </div>
        ))}
      </div>
    </div>
  );
}

function KeyboardShortcut({ keys }: { keys: string }) {
  const parts = keys.split("+");

  return (
    <div className="flex items-center gap-1">
      {parts.map((part, index) => (
        <span key={index} className="flex items-center">
          <kbd className="px-2 py-1 bg-muted border border-border rounded text-xs font-mono min-w-[24px] text-center">
            {part === "Mod" ? (
              <span className="flex items-center gap-0.5">
                <Command className="h-3 w-3" />
                <span className="text-[10px]">Ctrl</span>
              </span>
            ) : part === "Enter" ? (
              <CornerDownLeft className="h-3 w-3" />
            ) : (
              part
            )}
          </kbd>
          {index < parts.length - 1 && (
            <span className="mx-1 text-muted-foreground">+</span>
          )}
        </span>
      ))}
    </div>
  );
}
