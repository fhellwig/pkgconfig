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
var util = require('./lib/util.js');
var jsvutil = require('jsvutil');

// String constants
var PACKAGE_FILE = 'package.json';
var SCHEMA = 'schema';
var CONFIG = 'config';

// Environment variables
var CONFIG_DIR = process.env['CONFIG_DIR'];
var CONFIG_ENV = process.env['CONFIG_ENV'];

/**
 * Gets the information for the package of the parent module.
 * Returns an object having two properties: base (the package
 * directory) and name (the package name).
 */
function getParentPackage() {
    var directory = path.dirname(module.parent.filename);
    var file = util.findFile(directory, PACKAGE_FILE);
    if (file === null) {
        throw new Error('Package file not found: ' + PACKAGE_FILE);
    }
    var package = {
        base: path.dirname(file),
        name: util.readFile(file).name
    };
    return package;
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
                default: CONFIG
            },
            config: {
                type: ['object', 'string'],
                default: CONFIG
            }
        }
    });
}

function getSchema(package, options) {
    if (typeof options.schema === 'object') {
        return options.schema;
    }
    var pathname = path.resolve(package.base, options.schema);
    if (util.isDirectory(pathname)) {
        pathname = path.join(options.schema, SCHEMA);
    }
    var schema = util.readFile(pathname);
    if (schema === null) {
        throw new Error('Schema file not found: ' + pathname);
    }
    return schema;
}

function getConfig(package, options) {
    if (typeof options.config === 'object') {
        return options.config;
    }
    var pathname;
    if (typeof CONFIG_DIR === 'string') {
        pathname = path.resolve(package.base, CONFIG_DIR);
    } else {
        pathname = path.resolve(package.base, pathname);
        var config = readFile(pathname);
        if (config !== null) {
            return config;
        }
    }
    if (!util.isDirectory(pathname)) {
        throw new Error('Config directory not found: ' + pathname); 
    }
    var names = [];
    function push(name) {
        if (typeof name === 'string' && names.indexOf(name) < 0) {
            names.push(name);
        }
    }
    push(CONFIG_ENV);
    push(package.name);
    push(package.name.toLowerCase());
    push(CONFIG);
    for (var i = 0; i < names.length; i++) {
        var config = util.readFile(path.join(pathname, names[i]));
        if (config !== null) {
            return config;
        }
    }
    throw new Error('Config file not found: ' + pathname +
            path.sep + '(' + names.join('|') + ')');
}

/**
 * The function exported by this module.
 */
function pkgconfig(options) {
    var package = getParentPackage();
    var options = validateOptions(options);
    var schema = getSchema(package, options);
    var config = getConfig(package, options);
    jsvutil.check(schema);
    jsvutil.validate(schema, config);
    return config;
}

module.exports = pkgconfig;
