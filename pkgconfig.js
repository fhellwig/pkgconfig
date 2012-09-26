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

var OPTIONS_SCHEMA = {
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
};

/**
 * Returns true if the pathname identifies a file.
 */
function isFile(pathname) {
    return fs.existsSync(pathname) && fs.statSync(pathname).isFile();
}

/**
 * Reads and parses JSON file. If a syntax error occurs, the pathname is
 * included in the error message.
 */
function readJsonFile(pathname) {
    var json = fs.readFileSync(pathname, 'utf8');
    try {
        return JSON.parse(json);
    } catch (err) {
        if (err instanceof SyntaxError) {
            err.message = strformat("{0} in '{1}'", err.message, pathname);
        }
        throw err;
    }
}

/**
 * Reads the file specified by the pathname. If the file does not exist,
 * then .js and .json extensions are added. Returns a JavaScript object.
 * Throws an error if the file is not found.
 */
function readFile(pathname) {
    var msg = ''; // additional error message info
    var ext = path.extname(pathname).toLowerCase();
    if (ext === '.js') {
        if (isFile(pathname)) {
            return require(pathname);
        }
    } else if (ext === '.json') {
        if (isFile(pathname)) {
            return readJsonFile(pathname);
        }
    } else {
        if (isFile(pathname + '.js')) {
            return require(pathname + '.js');
        } else if (isFile(pathname + '.json')) {
            return readJsonFile(pathname + '.json');
        } else {
            msg = ' (tried .js and .json)'; // note leading space
        }
    }
    throw new Error(strformat("File not found '{0}'{1}", pathname, msg));
}

/**
 * The function exported by this module.
 */
function pkgconfig(options) {
    if (typeof options === 'undefined') {
        options = {};
    }
    options = jsvutil.validate(options, OPTIONS_SCHEMA);
    if (PKGCONFIG_FILE) {
        options.config = PKGCONFIG_FILE;
    }
    var pkginfo = findpkg(module.parent);
    if (typeof options.schema === 'string') {
        options.schema = readFile(pkginfo.resolve(options.schema));
    }
    if (typeof options.config === 'string') {
        options.config = readFile(pkginfo.resolve(options.config));
    }
    jsvutil.check(options.schema);
    return jsvutil.validate(options.config, options.schema);
}

module.exports = pkgconfig;
