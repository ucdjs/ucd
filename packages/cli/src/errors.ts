import { output } from "./output";

export class CLIError extends Error {
  public title: string;
  public details: string[];

  constructor(message: string, options?: { title?: string; details?: string[] }) {
    super(message);
    this.name = "CLIError";
    this.title = options?.title ?? "Error";
    this.details = options?.details ?? [];
  }

  toPrettyMessage() {
    output.fail("", {
      bugReport: true,
      details: this.details.length > 0 ? this.details : [this.message],
    });
  }
}

export class StoreDirIsRequiredError extends CLIError {
  constructor() {
    super("--store-dir is required. Please specify the directory where the UCD files should be stored.", {
      title: "Store Error",
    });
    this.name = "StoreDirIsRequiredError";
  }
}

export class RemoteNotSupportedError extends CLIError {
  constructor() {
    super("The --remote flag is not supported for this command.", {
      title: "Store Error",
    });
    this.name = "RemoteNotSupportedError";
  }
}

export class StoreConfigurationError extends CLIError {
  constructor(message: string) {
    super(message, { title: "Store Error" });
    this.name = "StoreConfigurationError";
  }
}
