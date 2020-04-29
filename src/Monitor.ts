import net from "net";
import { URL } from "url";
import { DefaultConfig } from "./Config";

export interface MonitorConfiguration {
  "enabled": boolean;
  "interval"?: number;
  "timeout"?: number;
  "endpoint"?: string;
}

export type MonitorResultCallback = (result: MonitorConnectivityResult) => void;

export interface MonitorDestination {
  hostname: string;
  port: number;
  callback?: MonitorResultCallback;
}

export interface MonitorResultInfo {
  success: boolean;
}

export interface MonitorConnectivityResult {
  hostname: string;
  port: number;
  success: boolean;
}

export class Monitor {
  private destinations: MonitorDestination[] = [];
  private interval: NodeJS.Timeout;

  constructor (
    private config: MonitorConfiguration,
    private status: MonitorStatus
  ) {}

  startPolling (): void {
    if(this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
    this.interval = setInterval(() => {
      this.verifyDestinations();
    }, this.config.interval || DefaultConfig.monitor.interval);
  }

  addDestinationByUrl (destinationUrl: string, callback: MonitorResultCallback): MonitorDestination {
    const destination = Monitor.parseDestinationUrl(destinationUrl);
    destination.callback = callback;
    this.destinations.push(destination);
    return destination;
  }

  private verifyDestinations (): void {
    for(const destination of this.destinations) {
      this.verifyDestinationConnectivity(destination, this.config.timeout || DefaultConfig.monitor.timeout)
        .then((result: MonitorConnectivityResult) => {
          this.status.addResult(result);
          destination.callback(result);
        }, (error: Error) => {
          console.error(error);
        });
    }
  }

  private verifyDestinationConnectivity (destination: MonitorDestination, timeout: number): Promise<MonitorConnectivityResult> {
    const hostname = destination.hostname;
    const port     = destination.port;

    return new Promise(((resolve) => {
      const socket = new net.Socket();
      socket.setTimeout(timeout);

      const onError = function (): void {
        socket.destroy();
        resolve({
          hostname,
          port,
          success: false
        });
      };

      socket.once("error", onError);
      socket.once("timeout", onError);

      socket.connect(port, hostname, function () {
        socket.end();
        resolve({
          hostname,
          port,
          success: true
        });
      });
    }));
  }

  static parseDestinationUrl (destinationUrl: string): MonitorDestination {
    const url = new URL(destinationUrl);
    const hostname = url.hostname;
    const port = url.port ? parseInt(url.port, 10) : (url.protocol === "https:" ? 443 : 80);
    return {
      hostname,
      port
    };
  }
}


export class MonitorStatus {
  private resultsCache: Map<string, MonitorConnectivityResult> = new Map();

  getDestinationKey (destination: MonitorDestination): string {
    return `${destination.hostname}:${destination.port}`;
  }

  addResult (result: MonitorConnectivityResult): void {
    const key = this.getDestinationKey({
      hostname: result.hostname,
      port: result.port
    });
    this.resultsCache.set(key, result);
  }

  addResultForUrl (destinationUrl: string, info: MonitorResultInfo): void {
    const destination = Monitor.parseDestinationUrl(destinationUrl);
    this.addResult({
      hostname: destination.hostname,
      port: destination.port,
      success: info.success
    });
  }

  connectivityAvailable (destination: MonitorDestination): number {
    const key = this.getDestinationKey(destination);
    if(this.resultsCache.has(key)) {
      return this.resultsCache.get(key).success ? 1 : 0;
    }
    return -1;
  }

  connectivityAvailableByUrl (destinationUrl: string): number {
    const destination = Monitor.parseDestinationUrl(destinationUrl);
    return this.connectivityAvailable(destination);
  }
}
