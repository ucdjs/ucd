import { useDisposable } from "reactive-vscode";
import { workspace } from "vscode";
import { UCDContentProvider } from "../lib/ucd-content-provider";

export function useUCDContentProvider() {
  const provider = new UCDContentProvider();
  useDisposable(workspace.registerTextDocumentContentProvider("ucd", provider));
  return provider;
}
