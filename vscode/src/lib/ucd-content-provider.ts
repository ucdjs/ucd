import type { TextDocumentContentProvider, Uri } from "vscode";
import { EventEmitter } from "vscode";
import { logger } from "../logger";

export class UCDContentProvider implements TextDocumentContentProvider {
  onDidChangeEmitter = new EventEmitter<Uri>();
  onDidChange = this.onDidChangeEmitter.event;

  async provideTextDocumentContent(uri: Uri) {
    logger.info(`Providing content for URI: ${JSON.stringify(uri)}`);

    const data = await fetch(`https://unicode-proxy.ucdjs.dev/${uri.path}`);
    if (!data.ok) {
      logger.error(`Failed to fetch UCD file: ${data.statusText}`);
      return `Error fetching UCD file: ${data.statusText}`;
    }

    const text = await data.text();

    return text;
  }
}
