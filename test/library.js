var assert = require('assert');
var cometd = require('..');

describe('library', function() {
    it('adapter method exported', function() {
        assert.ok(cometd.adapt);
    });
});
