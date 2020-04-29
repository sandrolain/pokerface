import pino from "pino";

export interface LoggerConfig {
  "level": "trace" | "debug" | "info" | "warn" | "error" | "fatal";
  "pretty"?: boolean;
}

export class Logger {
  private logger: pino.Logger;
  private finalLogger: pino.Logger;

  constructor (config: LoggerConfig, isMaster: boolean) {
    this.logger = pino({
      prettyPrint: config.pretty ? {
        colorize: true,
        translateTime: true
      } : false,
      name: isMaster ? "master" : "worker"
    });
    this.logger.level = config.level;
    this.finalLogger = pino({
      name: isMaster ? "master" : "worker"
    });
  }

  getPino (): pino.Logger {
    return this.logger;
  }

  trace (msg: string, ...args: any[]): void {
    this.logger.trace(msg, ...args);
  }

  debug (msg: string, ...args: any[]): void {
    this.logger.debug(msg, ...args);
  }

  info (msg: string, ...args: any[]): void {
    this.logger.info(msg, ...args);
  }

  warn (msg: string, ...args: any[]): void {
    this.logger.warn(msg, ...args);
  }

  error (msg: string, ...args: any[]): void {
    this.logger.error(msg, ...args);
  }

  fatal (msg: string, ...args: any[]): void {
    this.logger.fatal(msg, ...args);
  }

  final (type: string): (error: Error) => void {
    return pino.final(this.finalLogger, (error: Error, finalLogger: pino.Logger) => {
      finalLogger.error(error, type);
      process.exit(1);
    });
  }
}
