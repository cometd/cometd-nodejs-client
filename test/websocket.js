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
const nodeCometD = require('..');
const ws = require("ws");

describe('websocket', () => {
    const _lib = require('cometd');
    let _server;

    afterEach(() => {
        if (_server) {
            _server.close();
        }
    });

    it('handshakes with websocket', done => {
        _server = new ws.Server({port: 0}, () => {
            _server.on('connection', s => {
                s.on('message', m => {
                    const handshake = JSON.parse(m)[0];
                    assert.strictEqual('/meta/handshake', handshake.channel);
                    assert.ok(handshake.supportedConnectionTypes.indexOf('websocket') >= 0);
                    const reply = [{
                        id: handshake.id,
                        channel: handshake.channel,
                        successful: true,
                        version: "1.0",
                        supportedConnectionTypes: ['websocket'],
                        clientId: '0123456789abcdef',
                        advice: {
                            reconnect: 'none'
                        }
                    }];
                    s.send(JSON.stringify(reply));
                });
            });

            nodeCometD.adapt();
            const cometd = new _lib.CometD();
            cometd.configure({
                url: 'http://localhost:' + _server.address().port,
                logLevel: 'info'
            });
            cometd.handshake(r => {
                if (r.successful) {
                    done();
                } else {
                    cometd.disconnect();
                    done(new Error('could not handshake'));
                }
            });
        });
    });
});
