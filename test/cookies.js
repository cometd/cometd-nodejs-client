var assert = require('assert');
var cometd = require('..');
var http = require('http');

describe('cookies', function() {
    var _runtime;
    var _server;

    beforeEach(function() {
        cometd.adapt();
        _runtime = global.window;
    });

    afterEach(function() {
        if (_server) {
            _server.close();
        }
    });

    it('receives, stores and sends cookie', function(done) {
        var cookie = 'a=b';
        _server = http.createServer(function(request, response) {
            if (/\/1$/.test(request.url)) {
                response.setHeader('Set-Cookie', cookie);
                response.end();
            } else if (/\/2$/.test(request.url)) {
                assert.strictEqual(request.headers['cookie'], cookie);
                response.end();
            }
        });
        _server.listen(0, 'localhost', function() {
            var port = _server.address().port;
            console.log('listening on localhost:' + port);
            var uri = 'http://localhost:' + port;

            var xhr1 = new _runtime.XMLHttpRequest();
            xhr1.open('GET', uri + '/1');
            xhr1.onload = function() {
                assert.strictEqual(xhr1.status, 200);
                var xhr2 = new _runtime.XMLHttpRequest();
                xhr2.open('GET', uri + '/2');
                xhr2.onload = function() {
                    assert.strictEqual(xhr2.status, 200);
                    done();
                };
                xhr2.send();
            };
            xhr1.send();
        });
    });

    it('sends multiple cookies', function(done) {
        var cookie1 = 'a=b';
        var cookie2 = 'c=d';
        var cookies = cookie1 + '; ' + cookie2;
        _server = http.createServer(function(request, response) {
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
        _server.listen(0, 'localhost', function() {
            var port = _server.address().port;
            console.log('listening on localhost:' + port);
            var uri = 'http://localhost:' + port;

            var xhr1 = new _runtime.XMLHttpRequest();
            xhr1.open('GET', uri + '/1');
            xhr1.onload = function() {
                assert.strictEqual(xhr1.status, 200);
                var xhr2 = new _runtime.XMLHttpRequest();
                xhr2.open('GET', uri + '/2');
                xhr2.onload = function() {
                    assert.strictEqual(xhr2.status, 200);
                    var xhr3 = new _runtime.XMLHttpRequest();
                    xhr3.open('GET', uri + '/3');
                    xhr3.onload = function() {
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

    it('handles cookies from different hosts', function(done) {
        var cookieA = 'a=b';
        var cookieB = 'b=c';
        _server = http.createServer(function(request, response) {
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
        _server.listen(0, 'localhost', function() {
            var port = _server.address().port;
            console.log('listening on localhost:' + port);

            var xhrA1 = new _runtime.XMLHttpRequest();
            xhrA1.open('GET', 'http://localhost:' + port + '/hostA/1');
            xhrA1.onload = function() {
                assert.strictEqual(xhrA1.status, 200);
                var xhrA2 = new _runtime.XMLHttpRequest();
                xhrA2.open('GET', 'http://localhost:' + port + '/hostA/2');
                xhrA2.onload = function() {
                    assert.strictEqual(xhrA2.status, 200);

                    var xhrB1 = new _runtime.XMLHttpRequest();
                    xhrB1.open('GET', 'http://127.0.0.1:' + port + '/hostB/1');
                    xhrB1.onload = function() {
                        assert.strictEqual(xhrB1.status, 200);
                        var xhrB2 = new _runtime.XMLHttpRequest();
                        xhrB2.open('GET', 'http://127.0.0.1:' + port + '/hostB/2');
                        xhrB2.onload = function() {
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

    it('handles cookie sent multiple times', function(done) {
        var cookieName = 'a';
        var cookieValue = 'b';
        var cookie = cookieName + '=' + cookieValue;
        _server = http.createServer(function(request, response) {
            if (/\/verify$/.test(request.url)) {
                assert.strictEqual(request.headers['cookie'], cookie);
                response.end();
            } else {
                response.setHeader('Set-Cookie', cookie);
                response.end();
            }
        });
        _server.listen(0, 'localhost', function() {
            var port = _server.address().port;
            console.log('listening on localhost:' + port);

            var xhr1 = new _runtime.XMLHttpRequest();
            xhr1.open('GET', 'http://localhost:' + port + '/1');
            xhr1.onload = function() {
                assert.strictEqual(xhr1.status, 200);
                var xhr2 = new _runtime.XMLHttpRequest();
                xhr2.open('GET', 'http://localhost:' + port + '/2');
                xhr2.onload = function() {
                    assert.strictEqual(xhr2.status, 200);
                    var xhr3 = new _runtime.XMLHttpRequest();
                    xhr3.open('GET', 'http://localhost:' + port + '/verify');
                    xhr3.onload = function() {
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

    it('handles cookies as request headers', function(done) {
        _server = http.createServer(function(request, response) {
            var cookies = request.headers['cookie'];
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
        _server.listen(0, 'localhost', function() {
            var port = _server.address().port;
            console.log('listening on localhost:' + port);

            var xhr1 = new _runtime.XMLHttpRequest();
            xhr1.open('GET', 'http://localhost:' + port + '/1');
            xhr1.onload = function() {
                assert.strictEqual(xhr1.status, 200);
                var xhr2 = new _runtime.XMLHttpRequest();
                xhr2.open('GET', 'http://localhost:' + port + '/2');
                xhr2.setRequestHeader('cookie', 'c=d; e=f');
                xhr2.onload = function() {
                    assert.strictEqual(xhr2.status, 200);
                    var xhr3 = new _runtime.XMLHttpRequest();
                    xhr3.open('GET', 'http://localhost:' + port + '/3');
                    xhr3.onload = function() {
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
