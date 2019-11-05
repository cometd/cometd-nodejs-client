var assert = require('assert');
var nodeCometD = require('..');
var ws = require("ws");

describe('websocket', function() {
    var _lib = require('cometd');
    var _server;

    afterEach(function() {
        if (_server) {
            _server.close();
        }
    });

    it('handshakes with websocket', function(done) {
        _server = new ws.Server({port: 0}, function() {
            _server.on('connection', function(s) {
                s.on('message', function(m) {
                    var handshake = JSON.parse(m)[0];
                    assert.strictEqual('/meta/handshake', handshake.channel);
                    assert.ok(handshake.supportedConnectionTypes.indexOf('websocket') >= 0);
                    var reply = [{
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
            var cometd = new _lib.CometD();
            cometd.configure({
                url: 'http://localhost:' + _server.address().port,
                logLevel: 'info'
            });
            cometd.handshake(function(r) {
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
