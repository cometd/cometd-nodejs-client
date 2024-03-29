/*
 * Copyright (c) 2020 the original author or authors.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
export interface HttpProxy {
  uri?: string;
  includes?: string[];
  excludes?: string[];
}

export interface Cookies {
    storeCookie?(uri: any, header: string, callback: (failure: Error | null, cookie: any) => void): void;
    retrieveCookies?(context: any, uri: any, callback: (failure: Error | null, cookies: string[]) => void): void;
}

export interface Options {
  logLevel?: 'debug' | 'info';
  httpProxy?: HttpProxy;
  cookies?: Cookies;
}

export function adapt(options?: Options): void;
