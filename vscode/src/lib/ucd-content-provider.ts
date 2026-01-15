import type { TextDocumentContentProvider, Uri } from "vscode";
import { EventEmitter } from "vscode";
import { useUCDClient } from "../composables/useUCDClient";
import { logger } from "../logger";

export class UCDContentProvider implements TextDocumentContentProvider {
  onDidChangeEmitter = new EventEmitter<Uri>();
  onDidChange = this.onDidChangeEmitter.event;

  async provideTextDocumentContent(uri: Uri) {
    logger.info(`Providing content for URI: ${JSON.stringify(uri)}`);
    const client = useUCDClient();

    const { data, error } = await client.value!.files.get(uri.path);

    if (error) {
      logger.error(`Error fetching UCD file: ${error.message}`);
      return `Error fetching UCD file: ${error.message}`;
    }

    if (typeof data !== "string") {
      logger.error(`Unexpected data type received for UCD file: ${typeof data}`);
      return `Error: Unexpected data type received for UCD file: ${typeof data}`;
    }

    return data;
  }
}
