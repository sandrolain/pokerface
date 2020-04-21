
export interface Rule {
  "method"?: "GET" | "POST" | "PUT" | "DELETE" | "OPTIONS";
  "path": string;
  "dest": string;
  "destPath"?: string;
  "headers"?: Record<string, string>;
  "query"?: Record<string, string>;
}
