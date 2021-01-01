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

const assert = require('assert');
const cometd = require('..');
const http = require('http');

describe('cookies', () => {
    let _runtime;
    let _server;

    beforeEach(() => {
        cometd.adapt();
        _runtime = global.window;
    });

    afterEach(() => {
        if (_server) {
            _server.close();
        }
    });

    it('receives, stores and sends cookie', done => {
        const cookie = 'a=b';
        _server = http.createServer((request, response) => {
            if (/\/1$/.test(request.url)) {
                response.setHeader('Set-Cookie', cookie);
                response.end();
            } else if (/\/2$/.test(request.url)) {
                assert.strictEqual(request.headers['cookie'], cookie);
                response.end();
            }
        });
        _server.listen(0, 'localhost', () => {
            const port = _server.address().port;
            console.log('listening on localhost:' + port);
            const uri = 'http://localhost:' + port;

            const xhr1 = new _runtime.XMLHttpRequest();
            xhr1.open('GET', uri + '/1');
            xhr1.onload = () => {
                assert.strictEqual(xhr1.status, 200);
                const xhr2 = new _runtime.XMLHttpRequest();
                xhr2.open('GET', uri + '/2');
                xhr2.onload = () => {
                    assert.strictEqual(xhr2.status, 200);
                    done();
                };
                xhr2.send();
            };
            xhr1.send();
        });
    });

    it('sends multiple cookies', done => {
        const cookie1 = 'a=b';
        const cookie2 = 'c=d';
        const cookies = cookie1 + '; ' + cookie2;
        _server = http.createServer((request, response) => {
            if (/\/1$/.test(request.url)) {
                response.setHeader('Set-Cookie', cookie1);
                response.end();
            } else if (/\/2$/.test(request.url)) {
                response.setHeader('Set-Cookie', cookie2);
                response.end();
            } else if (/\/3$/.test(request.url)) {
                assert.strictEqual(request.headers['cookie'], cookies);
                response.end();
            }
        });
        _server.listen(0, 'localhost', () => {
            const port = _server.address().port;
            console.log('listening on localhost:' + port);
            const uri = 'http://localhost:' + port;

            const xhr1 = new _runtime.XMLHttpRequest();
            xhr1.open('GET', uri + '/1');
            xhr1.onload = () => {
                assert.strictEqual(xhr1.status, 200);
                const xhr2 = new _runtime.XMLHttpRequest();
                xhr2.open('GET', uri + '/2');
                xhr2.onload = () => {
                    assert.strictEqual(xhr2.status, 200);
                    const xhr3 = new _runtime.XMLHttpRequest();
                    xhr3.open('GET', uri + '/3');
                    xhr3.onload = () => {
                        assert.strictEqual(xhr3.status, 200);
                        done();
                    };
                    xhr3.send();
                };
                xhr2.send();
            };
            xhr1.send();
        });
    });

    it('handles cookies from different hosts', done => {
        const cookieA = 'a=b';
        const cookieB = 'b=c';
        _server = http.createServer((request, response) => {
            if (/\/hostA\//.test(request.url)) {
                if (/\/1$/.test(request.url)) {
                    response.setHeader('Set-Cookie', cookieA);
                    response.end();
                } else if (/\/2$/.test(request.url)) {
                    assert.strictEqual(request.headers['cookie'], cookieA);
                    response.end();
                }
            } else if (/\/hostB\//.test(request.url)) {
                if (/\/1$/.test(request.url)) {
                    response.setHeader('Set-Cookie', cookieB);
                    response.end();
                } else if (/\/2$/.test(request.url)) {
                    assert.strictEqual(request.headers['cookie'], cookieB);
                    response.end();
                }
            }
        });
        _server.listen(0, 'localhost', () => {
            const port = _server.address().port;
            console.log('listening on localhost:' + port);

            const xhrA1 = new _runtime.XMLHttpRequest();
            xhrA1.open('GET', 'http://localhost:' + port + '/hostA/1');
            xhrA1.onload = () => {
                assert.strictEqual(xhrA1.status, 200);
                const xhrA2 = new _runtime.XMLHttpRequest();
                xhrA2.open('GET', 'http://localhost:' + port + '/hostA/2');
                xhrA2.onload = () => {
                    assert.strictEqual(xhrA2.status, 200);

                    const xhrB1 = new _runtime.XMLHttpRequest();
                    xhrB1.open('GET', 'http://127.0.0.1:' + port + '/hostB/1');
                    xhrB1.onload = () => {
                        assert.strictEqual(xhrB1.status, 200);
                        const xhrB2 = new _runtime.XMLHttpRequest();
                        xhrB2.open('GET', 'http://127.0.0.1:' + port + '/hostB/2');
                        xhrB2.onload = () => {
                            assert.strictEqual(xhrB2.status, 200);
                            done();
                        };
                        xhrB2.send();
                    };
                    xhrB1.send();
                };
                xhrA2.send();
            };
            xhrA1.send();
        });
    });

    it('handles cookie sent multiple times', done => {
        const cookieName = 'a';
        const cookieValue = 'b';
        const cookie = cookieName + '=' + cookieValue;
        _server = http.createServer((request, response) => {
            if (/\/verify$/.test(request.url)) {
                assert.strictEqual(request.headers['cookie'], cookie);
                response.end();
            } else {
                response.setHeader('Set-Cookie', cookie);
                response.end();
            }
        });
        _server.listen(0, 'localhost', () => {
            const port = _server.address().port;
            console.log('listening on localhost:' + port);

            const xhr1 = new _runtime.XMLHttpRequest();
            xhr1.open('GET', 'http://localhost:' + port + '/1');
            xhr1.onload = () => {
                assert.strictEqual(xhr1.status, 200);
                const xhr2 = new _runtime.XMLHttpRequest();
                xhr2.open('GET', 'http://localhost:' + port + '/2');
                xhr2.onload = () => {
                    assert.strictEqual(xhr2.status, 200);
                    const xhr3 = new _runtime.XMLHttpRequest();
                    xhr3.open('GET', 'http://localhost:' + port + '/verify');
                    xhr3.onload = () => {
                        assert.strictEqual(xhr1.status, 200);
                        done();
                    };
                    xhr3.send();
                };
                xhr2.send();
            };
            xhr1.send();
        });
    });

    it('handles cookies as request headers', done => {
        _server = http.createServer((request, response) => {
            const cookies = request.headers['cookie'];
            if (/\/1$/.test(request.url)) {
                response.setHeader('Set-Cookie', 'a=b');
                response.end();
            } else if (/\/2$/.test(request.url)) {
                assert.ok(cookies.indexOf('a=b') >= 0);
                assert.ok(cookies.indexOf('c=d') >= 0);
                assert.ok(cookies.indexOf('e=f') >= 0);
                response.end();
            } else if (/\/3$/.test(request.url)) {
                assert.ok(cookies.indexOf('a=b') >= 0);
                assert.ok(cookies.indexOf('c=d') < 0);
                assert.ok(cookies.indexOf('e=f') < 0);
                response.end();
            }
        });
        _server.listen(0, 'localhost', () => {
            const port = _server.address().port;
            console.log('listening on localhost:' + port);

            const xhr1 = new _runtime.XMLHttpRequest();
            xhr1.open('GET', 'http://localhost:' + port + '/1');
            xhr1.onload = () => {
                assert.strictEqual(xhr1.status, 200);
                const xhr2 = new _runtime.XMLHttpRequest();
                xhr2.open('GET', 'http://localhost:' + port + '/2');
                xhr2.setRequestHeader('cookie', 'c=d; e=f');
                xhr2.onload = () => {
                    assert.strictEqual(xhr2.status, 200);
                    const xhr3 = new _runtime.XMLHttpRequest();
                    xhr3.open('GET', 'http://localhost:' + port + '/3');
                    xhr3.onload = () => {
                        assert.strictEqual(xhr3.status, 200);
                        done();
                    };
                    xhr3.send();
                };
                xhr2.send();
            };
            xhr1.send();
        });
    });
});
