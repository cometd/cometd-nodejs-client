/*
 * Copyright (c) 2017 the original author or authors.
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
const https = require('https');
const fs = require('fs');

describe('https', () => {
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

    it('supports https', done => {
        const options = {
            key: fs.readFileSync('test/tls/private.pem'),
            cert: fs.readFileSync('test/tls/public.pem')
        };
        _server = https.createServer(options, (request, response) => {
            response.end();
        });
        _server.listen(0, 'localhost', () => {
            const port = _server.address().port;
            console.log('listening on localhost:' + port);
            const uri = 'https://localhost:' + port;
            const xhr = new _runtime.XMLHttpRequest();
            xhr.open('GET', uri + '/');
            // Allow self-signed certificates.
            xhr._config().rejectUnauthorized = false;
            xhr.onload = () => {
                assert.strictEqual(xhr.status, 200);
                done();
            };
            xhr.send();
        });
    });
});
