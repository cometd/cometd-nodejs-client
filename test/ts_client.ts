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
import * as nodeCometD from '..';
import * as jsCometD from 'cometd';
import * as http from 'http';
import {AddressInfo} from 'net';

describe('typescript client', () => {
    let _server: http.Server;

    beforeEach(() => {
        nodeCometD.adapt();
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
            const port = (_server.address() as AddressInfo).port
            console.log('listening on localhost:' + port);

            const cometd: jsCometD.CometD = new jsCometD.CometD();
            cometd.websocketEnabled = false;
            cometd.configure({
                url: 'http://localhost:' + port + '/cometd',
                logLevel: 'info'
            });
            cometd.handshake((r: jsCometD.Message) => {
                if (r.successful) {
                    done();
                }
            });
        });
    });
});
