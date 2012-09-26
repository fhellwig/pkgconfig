var assert = require('assert');
var pkgconfig = require('../pkgconfig.js');

// Test normal defaults.
var config = pkgconfig();
assert.deepEqual(config, { port: 8080 });

// Test good JSON options object.
pkgconfig({
    schema: 'config/schema-json.json',
    config: 'config/config-json.json'
});

// Test bad JSON schema.
assert.throws(function () {
    pkgconfig({
        schema: 'config/schema-fail.json',
        config: 'config/config-json.json'
    });
}, SyntaxError);

// Test bad JSON config.
assert.throws(function () {
    pkgconfig({
        schema: 'config/schema-json.json',
        config: 'config/config-fail.json'
    });
}, SyntaxError);

// Test invalid range.
assert.throws(function () {
    pkgconfig('config/config-invalid');
}, /ValidationError/);

// Test invalid options.
assert.throws(function () {
    pkgconfig(5);
}, TypeError);

// Test valid config file string option.
pkgconfig('config/config');

// Test invalid config file string option.
assert.throws(function () {
    pkgconfig('not/found');
}, Error);

// Test valid inline options.
pkgconfig({
    schema: {
        properties: {
            port: {
                description: 'The web server port number.',
                type: 'integer',
                required: true,
                minimum: 1,
                maximum: 65535,
                default: 80
            }
        }
    },
    config: {
        port: 8080
    }
});

// Test invalid inline options.
assert.throws(function () {
    pkgconfig({
        schema: {
            properties: {
                port: {
                    description: 'The web server port number.',
                    type: 'integer',
                    required: true,
                    minimum: 1,
                    maximum: 65535
                }
            }
        },
        config: {
            badport: 8080
        }
    });
}, /ValidationError/);

console.log('All tests passed successfully.');
