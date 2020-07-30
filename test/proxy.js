/*
 * Copyright (c) 2017-2020 the original author or authors.
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

const assert = require('assert');
const nodeCometD = require('..');
const http = require('http');
const url = require('url');

describe('proxy', () => {
    const _lib = require('cometd');
    let _proxy;

    afterEach(() => {
        if (_proxy) {
            _proxy.close();
        }
    });

    it('proxies cometd calls', done => {
        _proxy = http.createServer((request, response) => {
            const serverPort = parseInt(url.parse(request.url).port);
            assert.ok(Number.isInteger(serverPort));
            assert.notStrictEqual(serverPort, _proxy.address().port);

            let content = '';
            request.addListener('data', chunk => {
                content += chunk;
            });
            request.addListener('end', () => {
                response.statusCode = 200;
                response.setHeader('Content-Type', 'application/json');
                const content = '[{' +
                    '"id":"1",' +
                    '"version":"1.0",' +
                    '"channel":"/meta/handshake",' +
                    '"clientId":"0123456789abcdef",' +
                    '"supportedConnectionTypes":["long-polling"],' +
                    '"advice":{"reconnect":"none"},' +
                    '"successful":true' +
                    '}]';
                response.end(content, 'utf8');
            });
        });
        _proxy.listen(0, 'localhost', () => {
            const proxyPort = _proxy.address().port;
            console.log('proxy listening on localhost:' + proxyPort);

            nodeCometD.adapt({
                logLevel: 'debug',
                httpProxy: {
                    uri: 'http://localhost:' + proxyPort
                }
            });

            // Any port will do for the server.
            const serverPort = proxyPort + 1;
            const cometd = new _lib.CometD();
            cometd.websocketEnabled = false;
            cometd.configure({
                url: 'http://localhost:' + serverPort + '/cometd',
                logLevel: 'info'
            });
            cometd.handshake(r => {
                if (r.successful) {
                    done();
                } else {
                    // Stop /meta/handshake retries.
                    cometd.disconnect();
                    done(new Error('could not handshake'));
                }
            });
        });
    });

    it('proxies with includes list', done => {
        _proxy = http.createServer((request, response) => {
            const serverPort = parseInt(url.parse(request.url).port);
            assert.ok(Number.isInteger(serverPort));
            assert.notStrictEqual(serverPort, _proxy.address().port);

            let content = '';
            request.addListener('data', chunk => {
                content += chunk;
            });
            request.addListener('end', () => {
                response.statusCode = 200;
                response.setHeader('Content-Type', 'application/json');
                const content = '[{' +
                    '"id":"1",' +
                    '"version":"1.0",' +
                    '"channel":"/meta/handshake",' +
                    '"clientId":"0123456789abcdef",' +
                    '"supportedConnectionTypes":["long-polling"],' +
                    '"advice":{"reconnect":"none"},' +
                    '"successful":true' +
                    '}]';
                response.end(content, 'utf8');
            });
        });
        _proxy.listen(0, 'localhost', () => {
            const proxyPort = _proxy.address().port;
            console.log('proxy listening on localhost:' + proxyPort);
            // Any port will do for the server.
            const serverPort1 = proxyPort + 1;
            const serverPort2 = proxyPort + 2;

            nodeCometD.adapt({
                httpProxy: {
                    uri: 'http://localhost:' + proxyPort,
                    includes: ['localhost:' + serverPort1]
                }
            });

            const cometd1 = new _lib.CometD();
            cometd1.websocketEnabled = false;
            cometd1.configure({
                url: 'http://localhost:' + serverPort1 + '/cometd',
                logLevel: 'info'
            });
            cometd1.handshake(r => {
                if (r.successful) {
                    const cometd2 = new _lib.CometD();
                    cometd2.websocketEnabled = false;
                    cometd2.configure({
                        url: 'http://localhost:' + serverPort2 + '/cometd',
                        logLevel: 'info'
                    });
                    cometd2.handshake(r => {
                        if (r.successful) {
                            done(new Error('must not handshake'));
                        } else {
                            // Stop /meta/handshake retries.
                            cometd2.disconnect();
                            done();
                        }
                    });
                } else {
                    cometd1.disconnect();
                    done(new Error('could not handshake'));
                }
            });
        });
    });

    it('proxies with excludes list', done => {
        _proxy = http.createServer((request, response) => {
            const serverPort = parseInt(url.parse(request.url).port);
            assert.ok(Number.isInteger(serverPort));
            assert.notStrictEqual(serverPort, _proxy.address().port);

            let content = '';
            request.addListener('data', chunk => {
                content += chunk;
            });
            request.addListener('end', () => {
                response.statusCode = 200;
                response.setHeader('Content-Type', 'application/json');
                const content = '[{' +
                    '"id":"1",' +
                    '"version":"1.0",' +
                    '"channel":"/meta/handshake",' +
                    '"clientId":"0123456789abcdef",' +
                    '"supportedConnectionTypes":["long-polling"],' +
                    '"advice":{"reconnect":"none"},' +
                    '"successful":true' +
                    '}]';
                response.end(content, 'utf8');
            });
        });
        _proxy.listen(0, 'localhost', () => {
            const proxyPort = _proxy.address().port;
            console.log('proxy listening on localhost:' + proxyPort);
            // Any port will do for the server.
            const serverPort1 = proxyPort + 1;
            const serverPort2 = proxyPort + 2;

            nodeCometD.adapt({
                httpProxy: {
                    uri: 'http://localhost:' + proxyPort,
                    excludes: ['local.*:' + serverPort1]
                }
            });

            const cometd1 = new _lib.CometD();
            cometd1.websocketEnabled = false;
            cometd1.configure({
                url: 'http://localhost:' + serverPort1 + '/cometd',
                logLevel: 'info'
            });
            cometd1.handshake(r => {
                if (r.successful) {
                    done(new Error('could not handshake'));
                } else {
                    // Stop /meta/handshake retries.
                    cometd1.disconnect();
                    const cometd2 = new _lib.CometD();
                    cometd2.websocketEnabled = false;
                    cometd2.configure({
                        url: 'http://localhost:' + serverPort2 + '/cometd',
                        logLevel: 'info'
                    });
                    cometd2.handshake(r => {
                        if (r.successful) {
                            done();
                        } else {
                            // Stop /meta/handshake retries.
                            cometd2.disconnect();
                            done(new Error('must not handshake'));
                        }
                    });
                }
            });
        });
    });

    it('proxies with includes and excludes list', done => {
        _proxy = http.createServer((request, response) => {
            const serverPort = parseInt(url.parse(request.url).port);
            assert.ok(Number.isInteger(serverPort));
            assert.notStrictEqual(serverPort, _proxy.address().port);

            let content = '';
            request.addListener('data', chunk => {
                content += chunk;
            });
            request.addListener('end', () => {
                response.statusCode = 200;
                response.setHeader('Content-Type', 'application/json');
                const content = '[{' +
                    '"id":"1",' +
                    '"version":"1.0",' +
                    '"channel":"/meta/handshake",' +
                    '"clientId":"0123456789abcdef",' +
                    '"supportedConnectionTypes":["long-polling"],' +
                    '"advice":{"reconnect":"none"},' +
                    '"successful":true' +
                    '}]';
                response.end(content, 'utf8');
            });
        });
        _proxy.listen(0, 'localhost', () => {
            const proxyPort = _proxy.address().port;
            console.log('proxy listening on localhost:' + proxyPort);
            // Any port will do for the server.
            const serverPort1 = proxyPort + 1;
            const serverPort2 = proxyPort + 2;

            nodeCometD.adapt({
                httpProxy: {
                    uri: 'http://localhost:' + proxyPort,
                    includes: ['.*:' + serverPort1, '.*host:' + serverPort2],
                    excludes: ['local.*:' + serverPort1]
                }
            });

            const cometd1 = new _lib.CometD();
            cometd1.websocketEnabled = false;
            cometd1.configure({
                url: 'http://localhost:' + serverPort1 + '/cometd',
                logLevel: 'info'
            });
            cometd1.handshake(r => {
                if (r.successful) {
                    done(new Error('could not handshake'));
                } else {
                    // Stop /meta/handshake retries.
                    cometd1.disconnect();
                    const cometd2 = new _lib.CometD();
                    cometd2.websocketEnabled = false;
                    cometd2.configure({
                        url: 'http://localhost:' + serverPort2 + '/cometd',
                        logLevel: 'info'
                    });
                    cometd2.handshake(r => {
                        if (r.successful) {
                            done();
                        } else {
                            // Stop /meta/handshake retries.
                            cometd2.disconnect();
                            done(new Error('must not handshake'));
                        }
                    });
                }
            });
        });
    });

    it('proxies with authentication', done => {
        _proxy = http.createServer((request, response) => {
            const proxyAuth = request.headers['proxy-authorization'];
            assert.ok(proxyAuth);
            assert.ok(proxyAuth.startsWith('Basic '));

            let content = '';
            request.addListener('data', chunk => {
                content += chunk;
            });
            request.addListener('end', () => {
                response.statusCode = 200;
                response.setHeader('Content-Type', 'application/json');
                const content = '[{' +
                    '"id":"1",' +
                    '"version":"1.0",' +
                    '"channel":"/meta/handshake",' +
                    '"clientId":"0123456789abcdef",' +
                    '"supportedConnectionTypes":["long-polling"],' +
                    '"advice":{"reconnect":"none"},' +
                    '"successful":true' +
                    '}]';
                response.end(content, 'utf8');
            });
        });
        _proxy.listen(0, 'localhost', () => {
            const proxyPort = _proxy.address().port;
            console.log('proxy listening on localhost:' + proxyPort);

            nodeCometD.adapt({
                httpProxy: {
                    uri: 'http://user:password@localhost:' + proxyPort
                }
            });

            // Any port will do for the server.
            const serverPort = proxyPort + 1;
            const cometd = new _lib.CometD();
            cometd.websocketEnabled = false;
            cometd.configure({
                url: 'http://localhost:' + serverPort + '/cometd',
                logLevel: 'info'
            });
            cometd.handshake(r => {
                if (r.successful) {
                    done();
                } else {
                    // Stop /meta/handshake retries.
                    cometd.disconnect();
                    done(new Error('could not handshake'));
                }
            });
        });
    });
});
