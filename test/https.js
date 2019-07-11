var assert = require('assert');
var cometd = require('..');
var https = require('https');
var fs = require('fs');

describe('https', function() {
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

    it('supports https', function(done) {
        var options = {
            key: fs.readFileSync('test/tls/private.pem'),
            cert: fs.readFileSync('test/tls/public.pem')
        };
        _server = https.createServer(options, function(request, response) {
            response.end();
        });
        _server.listen(0, 'localhost', function() {
            var port = _server.address().port;
            console.log('listening on localhost:' + port);
            var uri = 'https://localhost:' + port;
            var xhr = new _runtime.XMLHttpRequest();
            xhr.open('GET', uri + '/');
            // Allow self-signed certificates.
            xhr._config().rejectUnauthorized = false;
            xhr.onload = function() {
                assert.strictEqual(xhr.status, 200);
                done();
            };
            xhr.send();
        });
    });
});
