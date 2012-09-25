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

var fs = require('fs');
var path = require('path');
var findpkg = require('findpkg');
var jsvutil = require('jsvutil');
var strformat = require('strformat');

var DEFAULT_SCHEMA = path.join('config', 'schema');
var DEFAULT_CONFIG = path.join('config', 'config');
var PKGCONFIG_FILE = process.env['PKGCONFIG_FILE'];

/**
 * Returns true if the pathname exists and is a file.
 */
function isFile(pathname) {
    return fs.existsSync(pathname) && fs.statSync(pathname).isFile();
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
    if (ext === '') {
        return readFile(pathname + '.js') || readFile(pathname + '.json');
    }
    throw new Error(strformat("Invalid file extension '{0}' in '{1}' (expected .js or .json)", ext, pathname));
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
 * Processes the options argument passed to the pkgconfig function.
 * Returns an options object with the default values applied.
 */
function processOptions(options) {
    if (typeof options === 'undefined') {
        options = {};
    }
    options = jsvutil.validate(options, {
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
    if (PKGCONFIG_FILE) {
        options.config = PKGCONFIG_FILE;
    }
}

/**
 * Processes the schema option.
 */
function getSchema(base, option) {
    if (typeof option === 'object') {
        return option;
    }
    var pathname = removeExtension(path.resolve(base, option));
    var schema = readFile(pathname);
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
    var pathname = removeExtension(path.resolve(base, option));
    var config = readFile(pathname);
    if (config === null) {
        throw new Error('Config file not found: ' + pathname + '.(js|json)');
    }
    return config;
}

/**
 * The function exported by this module.
 */
function pkgconfig(options) {
    var pkginfo = findpkg(module.parent);
    var base = pkginfo.dirname;
    var options = processOptions(options);
    var schema = getSchema(base, options.schema);
    var config = getConfig(base, options.config);
    jsvutil.check(schema);
    jsvutil.validate(schema, config);
    return config;
}

module.exports = pkgconfig;
