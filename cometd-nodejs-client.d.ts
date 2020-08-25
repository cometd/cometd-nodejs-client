export interface Proxy {
  uri?: string;
  includes?: string[];
  excludes?: string[];
}

export interface Options {
  logLevel?: "debug" | "info";
  httpProxy?: Proxy;
}

export function adapt(options?: Options): void;
