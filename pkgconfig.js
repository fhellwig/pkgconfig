/*
 * Copyright (c) 2012 Frank Hellwig
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to
 * deal in the Software without restriction, including without limitation the
 * rights to use, copy, modify, merge, publish, distribute, sublicense, and/or
 * sell copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS
 * IN THE SOFTWARE.
 */

// Required modules
var fs = require('fs');
var path = require('path');
var jsvutil = require('jsvutil');

// Pathname constants
var PACKAGE_FILE = 'package.json';
var DEFAULT_SCHEMA = path.join('config', 'schema');
var DEFAULT_CONFIG = path.join('config', 'config');

// Environment variables
var NODE_CONFIG_DIR = process.env['NODE_CONFIG_DIR'];
var NODE_ENV = process.env['NODE_ENV'];

/**
 * Returns true if the pathname exists and is a file.
 */
function isFile(pathname) {
    return fs.existsSync(pathname) && fs.statSync(pathname).isFile();
}

/**
 * Given a directory, tries to find the file in that directory. Tries the
 * parent directory if not found. Returns the pathname or null if not found.
 */
function findFile(directory, filename) {
    var current = directory;
    var previous = null;
    while (current !== previous) {
        var pathname = path.join(current, filename);
        if (isFile(pathname)) {
            return pathname;
        }
        previous = current;
        current = path.join(current, '..');
    }
    return null;
}

/**
 * Reads the file as either a JavaScript module or a JSON file.
 * Returns a JavaScript object or null if the file is not found.
 */
function readFile(pathname) {
    var ext = path.extname(pathname).toLowerCase();
    if (ext === '.js') {
        if (isFile(pathname)) {
            return require(pathname);
        } else {
            return null;
        }
    }
    if (ext === '.json') {
        if (isFile(pathname)) {
            var text = fs.readFileSync(pathname, 'utf8');
            try {
                return JSON.parse(text);
            } catch (err) {
                if (err instanceof SyntaxError) {
                    err.message = err.message + ' in ' + pathname;
                }
                throw err;
            }
        } else {
            return null;
        }
    }
    return readFile(pathname + '.js') || readFile(pathname + '.json');
}

/**
 * Removes any .js or .json extension from the specified pathname.
 */
function removeExtension(pathname) {
    var ext = path.extname(pathname);
    var extlc = ext.toLowerCase();
    if (extlc === '.js' || extlc === '.json') {
        return path.basename(pathname, ext);
    } else {
        return pathname;
    }
}

/**
 * Returns the directory for the package of the parent module.
 */
function getPackageBase() {
    var directory = path.dirname(module.parent.filename);
    var pathname = util.findFile(directory, PACKAGE_FILE);
    if (pathname === null) {
        throw new Error('Package file not found: ' + PACKAGE_FILE);
    }
    return path.dirname(pathname);
}

/**
 * Validates the options argument passed to the pkgconfig function.
 * Returns an options object with the default values applied.
 */
function validateOptions(options) {
    if (typeof options === 'undefined') {
       options = {};
    }
    return jsvutil.validate(options, {
        type: 'object',
        properties: {
            schema: {
                type: ['object', 'string'],
                default: DEFAULT_SCHEMA
            },
            config: {
                type: ['object', 'string'],
                default: DEFAULT_CONFIG
            }
        }
    });
}

/**
 * Processes the schema option.
 */
function getSchema(base, option) {
    if (typeof option === 'object') {
        return option;
    }
    var pathname = util.removeExtension(path.resolve(base, option));
    var schema = util.readFile(pathname);
    if (schema === null) {
        throw new Error('Schema file not found: ' + pathname + '.(js|json)');
    }
    return schema;
}

/**
 * Processes the config option.
 */
function getConfig(base, option) {
    if (typeof option === 'object') {
        return option;
    }
    var directory = NODE_CONFIG_DIR || path.dirname(option);
    var filename = NODE_ENV || path.basename(option);
    var pathname = path.join(directory, filename);
    pathname = util.removeExtension(path.resolve(base, pathname));
    var config = util.readFile(pathname);
    if (config === null) {
        throw new Error('Config file not found: ' + pathname + '.(js|json)');
    }
    return config;
}

/**
 * The function exported by this module.
 */
function pkgconfig(options) {
    var base = getPackageBase();
    var options = validateOptions(options);
    var schema = getSchema(base, options.schema);
    var config = getConfig(base, options.config);
    jsvutil.check(schema);
    jsvutil.validate(schema, config);
    return config;
}

module.exports = pkgconfig;
