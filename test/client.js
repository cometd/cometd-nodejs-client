/*
 * Copyright (c) 2019 the original author or authors.
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

const cometd = require('..');
const http = require('http');

describe('client', () => {
    let _lib;
    let _server;

    beforeEach(() => {
        cometd.adapt();
        _lib = require('cometd');
    });

    afterEach(() => {
        if (_server) {
            _server.close();
        }
    });

    it('performs handshake', done => {
        _server = http.createServer((request, response) => {
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
        _server.listen(0, 'localhost', () => {
            const port = _server.address().port;
            console.log('listening on localhost:' + port);

            const cometd = new _lib.CometD();
            cometd.websocketEnabled = false;
            cometd.configure({
                url: 'http://localhost:' + port + '/cometd',
                logLevel: 'info'
            });
            cometd.handshake(r => {
                if (r.successful) {
                    done();
                }
            });
        });
    });
});
