export interface Config {
  "threads"?: {
    "number"?: number;
    "autorestart"?: number;
  };
  "logs"?: {
    "level": "trace" | "debug" | "info" | "warn" | "error" | "fatal";
    "pretty"?: boolean;
  };
  "server": {
    "protocol": "http" | "https" | "http2";
    "port": number;
    "certs"?: {
      "cert": string;
      "key": string;
    };
  };
  "monitor"?: {
    "enabled": boolean;
    "interval"?: number;
    "timeout"?: number;
    "endpoint"?: string;
  };
  "rules": {
    "method"?: "GET" | "POST" | "PUT" | "DELETE" | "OPTIONS";
    "path": string;
    "dest": string;
    "destPath"?: string;
    "headers"?: any;
    "query"?: any;
  }[];
}

export const DefaultConfig = {
  monitor: {
    interval: 15000,
    timeout: 1000
  }
};
