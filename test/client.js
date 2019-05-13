var cometd = require('..');
var http = require('http');

describe('client', function() {
    var _lib;
    var _server;

    beforeEach(function() {
        cometd.adapt();
        _lib = require('cometd');
    });

    afterEach(function() {
        if (_server) {
            _server.close();
        }
    });

    it('performs handshake', function(done) {
        _server = http.createServer(function(request, response) {
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
        _server.listen(0, 'localhost', function() {
            var port = _server.address().port;
            console.log('listening on localhost:' + port);

            var cometd = new _lib.CometD();
            cometd.configure({
                url: 'http://localhost:' + port + '/cometd',
                logLevel: 'info'
            });
            cometd.handshake(function(r) {
                if (r.successful) {
                    done();
                }
            });
        });
    });
});
