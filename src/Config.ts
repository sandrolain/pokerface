export interface Config {
  "threads"?: number | "auto";
  "logs"?: {
    "level": "debug" | "warn" | "error";
    "path"?: string;
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
