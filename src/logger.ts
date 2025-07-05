import { Vault, normalizePath } from "obsidian";

export const LOG_FILE_NAME = "github-sync.log" as const;

export default class Logger {
  private logFile: string;

  constructor(
    private vault: Vault,
    private enabled: boolean,
  ) {
    this.logFile = normalizePath(`${vault.configDir}/${LOG_FILE_NAME}`);
  }

  async init() {
    // Create the log file in case it doesn't exist
    if (await this.vault.adapter.exists(this.logFile)) {
      return;
    }
    this.vault.adapter.write(this.logFile, "");
  }

  private async write(
    level: string,
    message: string,
    data?: any,
    context?: {
      operation?: string;
      repository?: string;
      branch?: string;
      filePath?: string;
      stack?: string;
    },
  ): Promise<void> {
    if (!this.enabled) return;

    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      additional_data: data,
      context: {
        operation: context?.operation,
        repository: context?.repository,
        branch: context?.branch,
        filePath: context?.filePath,
        stack: context?.stack,
        userAgent: 'github-gitless-sync-obsidian',
      },
    };

    await this.vault.adapter.append(
      this.logFile,
      JSON.stringify(logEntry) + "\n",
    );
  }

  async read(): Promise<string> {
    return await this.vault.adapter.read(this.logFile);
  }

  async clean(): Promise<void> {
    return await this.vault.adapter.write(this.logFile, "");
  }

  enable(): void {
    this.enabled = true;
  }

  disable(): void {
    this.enabled = false;
  }

  async info(message: string, data?: any, context?: {
    operation?: string;
    repository?: string;
    branch?: string;
    filePath?: string;
  }): Promise<void> {
    await this.write("INFO", message, data, context);
  }

  async warn(message: string, data?: any, context?: {
    operation?: string;
    repository?: string;
    branch?: string;
    filePath?: string;
  }): Promise<void> {
    await this.write("WARN", message, data, context);
  }

  async error(message: string, data?: any, context?: {
    operation?: string;
    repository?: string;
    branch?: string;
    filePath?: string;
    stack?: string;
  }): Promise<void> {
    await this.write("ERROR", message, data, {
      ...context,
      stack: context?.stack || new Error().stack,
    });
  }
}
