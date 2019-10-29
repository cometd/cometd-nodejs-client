var assert = require('assert');
var nodeCometD = require('..');
var http = require('http');
var url = require('url');

describe('proxy', function() {
    var _lib = require('cometd');
    var _proxy;

    afterEach(function() {
        if (_proxy) {
            _proxy.close();
        }
    });

    it('proxies cometd calls', function(done) {
        _proxy = http.createServer(function(request, response) {
            var serverPort = parseInt(url.parse(request.url).port);
            assert.ok(Number.isInteger(serverPort));
            assert.notStrictEqual(serverPort, _proxy.address().port);

            var content = '';
            request.addListener('data', function(chunk) {
                content += chunk;
            });
            request.addListener('end', function() {
                response.statusCode = 200;
                response.setHeader('Content-Type', 'application/json');
                var content = '[{' +
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
        _proxy.listen(0, 'localhost', function() {
            var proxyPort = _proxy.address().port;
            console.log('proxy listening on localhost:' + proxyPort);

            nodeCometD.adapt({
                httpProxy: {
                    uri: 'http://localhost:' + proxyPort
                }
            });

            // Any port will do for the server.
            var serverPort = proxyPort + 1;
            var cometd = new _lib.CometD();
            cometd.configure({
                url: 'http://localhost:' + serverPort + '/cometd',
                logLevel: 'info'
            });
            cometd.handshake(function(r) {
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

    it('proxies with includes list', function(done) {
        _proxy = http.createServer(function(request, response) {
            var serverPort = parseInt(url.parse(request.url).port);
            assert.ok(Number.isInteger(serverPort));
            assert.notStrictEqual(serverPort, _proxy.address().port);

            var content = '';
            request.addListener('data', function(chunk) {
                content += chunk;
            });
            request.addListener('end', function() {
                response.statusCode = 200;
                response.setHeader('Content-Type', 'application/json');
                var content = '[{' +
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
        _proxy.listen(0, 'localhost', function() {
            var proxyPort = _proxy.address().port;
            console.log('proxy listening on localhost:' + proxyPort);
            // Any port will do for the server.
            var serverPort1 = proxyPort + 1;
            var serverPort2 = proxyPort + 2;

            nodeCometD.adapt({
                httpProxy: {
                    uri: 'http://localhost:' + proxyPort,
                    includes: ['localhost:' + serverPort1]
                }
            });

            var cometd1 = new _lib.CometD();
            cometd1.configure({
                url: 'http://localhost:' + serverPort1 + '/cometd',
                logLevel: 'info'
            });
            cometd1.handshake(function(r) {
                if (r.successful) {
                    var cometd2 = new _lib.CometD();
                    cometd2.configure({
                        url: 'http://localhost:' + serverPort2 + '/cometd',
                        logLevel: 'info'
                    });
                    cometd2.handshake(function(r) {
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

    it('proxies with excludes list', function(done) {
        _proxy = http.createServer(function(request, response) {
            var serverPort = parseInt(url.parse(request.url).port);
            assert.ok(Number.isInteger(serverPort));
            assert.notStrictEqual(serverPort, _proxy.address().port);

            var content = '';
            request.addListener('data', function(chunk) {
                content += chunk;
            });
            request.addListener('end', function() {
                response.statusCode = 200;
                response.setHeader('Content-Type', 'application/json');
                var content = '[{' +
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
        _proxy.listen(0, 'localhost', function() {
            var proxyPort = _proxy.address().port;
            console.log('proxy listening on localhost:' + proxyPort);
            // Any port will do for the server.
            var serverPort1 = proxyPort + 1;
            var serverPort2 = proxyPort + 2;

            nodeCometD.adapt({
                httpProxy: {
                    uri: 'http://localhost:' + proxyPort,
                    excludes: ['local.*:' + serverPort1]
                }
            });

            var cometd1 = new _lib.CometD();
            cometd1.configure({
                url: 'http://localhost:' + serverPort1 + '/cometd',
                logLevel: 'info'
            });
            cometd1.handshake(function(r) {
                if (r.successful) {
                    done(new Error('could not handshake'));
                } else {
                    // Stop /meta/handshake retries.
                    cometd1.disconnect();
                    var cometd2 = new _lib.CometD();
                    cometd2.configure({
                        url: 'http://localhost:' + serverPort2 + '/cometd',
                        logLevel: 'info'
                    });
                    cometd2.handshake(function(r) {
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

    it('proxies with includes and excludes list', function(done) {
        _proxy = http.createServer(function(request, response) {
            var serverPort = parseInt(url.parse(request.url).port);
            assert.ok(Number.isInteger(serverPort));
            assert.notStrictEqual(serverPort, _proxy.address().port);

            var content = '';
            request.addListener('data', function(chunk) {
                content += chunk;
            });
            request.addListener('end', function() {
                response.statusCode = 200;
                response.setHeader('Content-Type', 'application/json');
                var content = '[{' +
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
        _proxy.listen(0, 'localhost', function() {
            var proxyPort = _proxy.address().port;
            console.log('proxy listening on localhost:' + proxyPort);
            // Any port will do for the server.
            var serverPort1 = proxyPort + 1;
            var serverPort2 = proxyPort + 2;

            nodeCometD.adapt({
                httpProxy: {
                    uri: 'http://localhost:' + proxyPort,
                    includes: ['.*:' + serverPort1, '.*host:' + serverPort2],
                    excludes: ['local.*:' + serverPort1]
                }
            });

            var cometd1 = new _lib.CometD();
            cometd1.configure({
                url: 'http://localhost:' + serverPort1 + '/cometd',
                logLevel: 'info'
            });
            cometd1.handshake(function(r) {
                if (r.successful) {
                    done(new Error('could not handshake'));
                } else {
                    // Stop /meta/handshake retries.
                    cometd1.disconnect();
                    var cometd2 = new _lib.CometD();
                    cometd2.configure({
                        url: 'http://localhost:' + serverPort2 + '/cometd',
                        logLevel: 'info'
                    });
                    cometd2.handshake(function(r) {
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

    it('proxies with authentication', function(done) {
        _proxy = http.createServer(function(request, response) {
            var proxyAuth = request.headers['proxy-authorization'];
            assert.ok(proxyAuth);
            assert.ok(proxyAuth.startsWith('Basic '));

            var content = '';
            request.addListener('data', function(chunk) {
                content += chunk;
            });
            request.addListener('end', function() {
                response.statusCode = 200;
                response.setHeader('Content-Type', 'application/json');
                var content = '[{' +
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
        _proxy.listen(0, 'localhost', function() {
            var proxyPort = _proxy.address().port;
            console.log('proxy listening on localhost:' + proxyPort);

            nodeCometD.adapt({
                httpProxy: {
                    uri: 'http://user:password@localhost:' + proxyPort
                }
            });

            // Any port will do for the server.
            var serverPort = proxyPort + 1;
            var cometd = new _lib.CometD();
            cometd.configure({
                url: 'http://localhost:' + serverPort + '/cometd',
                logLevel: 'info'
            });
            cometd.handshake(function(r) {
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
