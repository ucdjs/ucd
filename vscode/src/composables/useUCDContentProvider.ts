import { useDisposable } from "reactive-vscode";
import { workspace } from "vscode";
import { UCDContentProvider } from "../lib/UCDContentProvider";

export function useUCDContentProvider() {
  const provider = new UCDContentProvider();
  useDisposable(workspace.registerTextDocumentContentProvider("ucd", provider));
  return provider;
}
