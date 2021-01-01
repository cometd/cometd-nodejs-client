/*
 * Copyright (c) 2017-2021 the original author or authors.
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
'use strict';

module.exports = {
    adapt: options => {
        const url = require('url');
        const httpc = require('http');
        const https = require('https');
        const HttpcProxyAgent = require('http-proxy-agent');
        const HttpsProxyAgent = require('https-proxy-agent');
        const ws = require('ws');

        let window = global['window'];
        if (!window) {
            window = global['window'] = {};
        }

        window.setTimeout = setTimeout;
        window.clearTimeout = clearTimeout;

        window.console = console;
        window.console.debug = window.console.log;

        // Fields shared by all XMLHttpRequest instances.
        const _agentOptions = {
            keepAlive: true
        };
        const _agentc = new httpc.Agent(_agentOptions);
        const _agents = new https.Agent(_agentOptions);

        const _globalCookies = {};

        const _logLevel = options && options.logLevel || 'info';

        function _debug() {
            if (_logLevel === 'debug') {
                console.log.apply(this, Array.from(arguments));
            }
        }

        function _secure(uri) {
            return /^https/i.test(uri.protocol);
        }

        // Bare minimum XMLHttpRequest implementation that works with CometD.
        window.XMLHttpRequest = function() {
            const _localCookies = {};
            let _config;
            let _request;

            function _storeCookie(cookieStore, value) {
                const host = _config.hostname;
                let jar = cookieStore[host];
                if (jar === undefined) {
                    cookieStore[host] = jar = {};
                }
                const cookies = value.split(';');
                for (let i = 0; i < cookies.length; ++i) {
                    const cookie = cookies[i].trim();
                    const equal = cookie.indexOf('=');
                    if (equal > 0) {
                        jar[cookie.substring(0, equal)] = cookie;
                    }
                }
            }

            function _concatCookies(cookieStore) {
                let cookies = '';
                const jar = cookieStore[_config.hostname];
                if (jar) {
                    for (let name in jar) {
                        if (jar.hasOwnProperty(name)) {
                            if (cookies) {
                                cookies += '; ';
                            }
                            cookies += jar[name];
                        }
                    }
                }
                return cookies;
            }

            function _chooseAgent(serverURI) {
                const serverHostPort = serverURI.host;
                const proxy = options && options.httpProxy && options.httpProxy.uri;
                if (proxy) {
                    let isIncluded = true;
                    const includes = options.httpProxy.includes;
                    if (includes && Array.isArray(includes)) {
                        isIncluded = false;
                        for (let i = 0; i < includes.length; ++i) {
                            if (new RegExp(includes[i]).test(serverHostPort)) {
                                isIncluded = true;
                                break;
                            }
                        }
                    }
                    if (isIncluded) {
                        const excludes = options.httpProxy.excludes;
                        if (excludes && Array.isArray(excludes)) {
                            for (let e = 0; e < excludes.length; ++e) {
                                if (new RegExp(excludes[e]).test(serverHostPort)) {
                                    isIncluded = false;
                                    break;
                                }
                            }
                        }
                    }
                    if (isIncluded) {
                        _debug('proxying', serverURI.href, 'via', proxy);
                        const agentOpts = Object.assign(url.parse(proxy), _agentOptions);
                        return _secure(serverURI) ? new HttpsProxyAgent(agentOpts) : new HttpcProxyAgent(agentOpts);
                    }
                }
                return _secure(serverURI) ? _agents : _agentc;
            }

            this.status = 0;
            this.statusText = '';
            this.readyState = window.XMLHttpRequest.UNSENT;
            this.responseText = '';

            this.open = (method, uri) => {
                _config = url.parse(uri);
                _config.agent = _chooseAgent(_config);
                _config.method = method;
                _config.headers = {};
                this.readyState = window.XMLHttpRequest.OPENED;
            };

            this.setRequestHeader = (name, value) => {
                if (/^cookie$/i.test(name)) {
                    _storeCookie(_localCookies, value)
                } else {
                    _config.headers[name] = value;
                }
            };

            this.send = data => {
                let globalCookies = this.context && this.context.cookieStore;
                if (!globalCookies) {
                    globalCookies = _globalCookies;
                }
                const cookies1 = _concatCookies(globalCookies);
                const cookies2 = _concatCookies(_localCookies);
                const delim = (cookies1 && cookies2) ? '; ' : '';
                const cookies = cookies1 + delim + cookies2;
                if (cookies) {
                    _config.headers['Cookie'] = cookies;
                }

                const http = _secure(_config) ? https : httpc;
                _request = http.request(_config, response => {
                    let success = false;
                    this.status = response.statusCode;
                    this.statusText = response.statusMessage;
                    this.readyState = window.XMLHttpRequest.HEADERS_RECEIVED;
                    const headers = response.headers;
                    for (let name in headers) {
                        if (headers.hasOwnProperty(name)) {
                            if (/^set-cookie$/i.test(name)) {
                                const header = headers[name];
                                for (let i = 0; i < header.length; ++i) {
                                    const whole = header[i];
                                    const parts = whole.split(';');
                                    const cookie = parts[0];
                                    _storeCookie(globalCookies, cookie);
                                }
                            }
                        }
                    }
                    response.on('data', chunk => {
                        this.readyState = window.XMLHttpRequest.LOADING;
                        this.responseText += chunk;
                    });
                    response.on('end', () => {
                        success = true;
                        this.readyState = window.XMLHttpRequest.DONE;
                        if (this.onload) {
                            this.onload();
                        }
                    });
                    response.on('close', () => {
                        if (!success) {
                            this.readyState = window.XMLHttpRequest.DONE;
                            if (this.onerror) {
                                this.onerror();
                            }
                        }
                    });
                });
                ['abort', 'aborted', 'error'].forEach(event => {
                    _request.on(event, x => {
                        this.readyState = window.XMLHttpRequest.DONE;
                        if (x) {
                            const error = x.message;
                            if (error) {
                                this.statusText = error;
                            }
                        }
                        if (this.onerror) {
                            this.onerror(x);
                        }
                    });
                });
                if (data) {
                    _request.write(data);
                }
                _request.end();
            };

            this.abort = () => {
                if (_request) {
                    _request.abort();
                }
            };

            this._config = () => _config;
        };
        window.XMLHttpRequest.UNSENT = 0;
        window.XMLHttpRequest.OPENED = 1;
        window.XMLHttpRequest.HEADERS_RECEIVED = 2;
        window.XMLHttpRequest.LOADING = 3;
        window.XMLHttpRequest.DONE = 4;

        window.WebSocket = ws;
    }
};
