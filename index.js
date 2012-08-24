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
var jsvutil = require('jsvutil');

var PACKAGE_FILE = 'package.json';
var SCHEMA_DEFAULT = 'config/schema';
var CONFIG_DEFAULT = 'config';
var NODE_CONFIG_DIR = process.env['NODE_CONFIG_DIR'];
var NODE_ENV = process.env['NODE_ENV'];

/**
 * Returns true if the pathname exists and is a file.
 */
function isFile(pathname) {
    return fs.existsSync(pathname) && fs.statSync(pathname).isFile();
}

/**
 * Returns true if the pathname exists and is a directory.
 */
function isDirectory(pathname) {
    return fs.existsSync(pathname) && fs.statSync(pathname).isDirectory();
}

/**
 * Given a directory, tries to find the file in that directory. Tries the
 * parent directory if not found. Returns the pathname or null if not found.
 */
function findFile(directory, filename) {
    var current = directory;
    var previous = null;
    while (current !== previous) {
        var pathname = path.resolve(current, filename);
        if (isFile(pathname)) {
            return pathname;
        }
        previous = current;
        current = path.resolve(current, '..');
    }
    return null;
}

/**
 * Reads the file as either a JavaScript module or a JSON file. The Node.js
 * require function is not used because we want to limit it to only .js and
 * .json files.
 */
function readFile(pathname) {
    var ext = path.extname(pathname);
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
            return JSON.parse(text);
        } else {
            return null;
        }
    }
    return readFile(pathname + '.js') || readFile(pathname + '.json');
}

/**
 * Converts a string or an array of strings to a display value.
 * 'a' -> "'a'"
 * ['a'] -> "'a'"
 * ['a','b'] -> "'a' or 'b'"
 * ['a','b','c'] -> "'a', 'b', or 'c'"
 */
function display(names) {
    if (typeof names === 'string') {
        names = [names];
    }
    var list = [];
    var n = names.length;
    names.forEach(function (name, i) {
        if (i > 0) {
            if (n === 2) {
                list.push(' or ');
            } else if (i === n - 1) {
                list.push(', or ');
            } else {
                list.push(', ');
            }
        }
        list.push("'" + name + "'");
    });
    return list.join('');
}

/**
 * Gets the schema given the base directory and the schema option.
 */
function getSchema(base, option) {
    if (typeof option === 'object') {
        return option;
    } else if (typeof option === 'string') {
        var pathname = path.resolve(base, option);
        schema = readFile(path.resolve(base, option));
        if (schema === null) {
            throw new Error('Schema not found: ' + pathname);
        }
    } else {
        throw new TypeError('The schema option be an object or a string');
    }
}

/**
 * Gets the configuration given the base directory, package name, and the
 * config option.
 */
function getConfig(base, pkgname, option) {
    if (typeof option !== 'string') {
        throw new TypeError('The config option must be a string');
    }

    var directory = path.resolve(base, option);

    if (!isDirectory(directory)) {
        throw new Error('Config directory not found: ' + directory);
    }

    var names = [];

    function push(name) {
        if (typeof name === 'string' && names.indexOf(name) < 0) {
            names.push(name);
        }
    }

    push(NODE_ENV);
    push(pkgname);
    push(pkgname.toLowerCase());
    push(CONFIG_DEFAULT);

    var config = null;

    for (var i = 0; i < names.length; i++) {
        config = readFile(path.resolve(directory, names[i]));
        if (config !== null) {
            break;
        }
    }

    names = names.join(', ');

    if (config === null) {
        throw new Error('Config file not found: ' + names + ' in ' + directory);
    }

    return config;
}

/**
 * The function exported by this module.
 */
function pkgconfig(options) {

    // Find and read the package descriptor file.

    var file = findFile(path.dirname(module.parent.filename), PACKAGE_FILE);

    if (file === null) {
        throw new Error('File not found: ' + PACKAGE_FILE);
    }

    options = options || {};
    options.schema = options.schema || SCHEMA_DEFAULT;
    options.config = NODE_CONFIG_DIR || options.config;
    options.config = options.config || CONFIG_DEFAULT;

    var base = path.dirname(file);
    var package = readFile(file);

    // Find, read, and check the schema file.

    var schema;

    if (typeof options.schema === 'object') {
        schema = options.schema;
    } else if (typeof options.schema === 'string') {
        var pathname = path.resolve(base, options.schema);
        schema = readFile(path.resolve(base, options.schema));
        if (schema === null) {
            throw new Error('Schema not found: ' + display(pathname));
        }
    } else {
        throw new TypeError('The schema option be an object or a string');
    }

    jsvutil.check(schema);

    // Find, read, and validate the schema file.

    if (typeof options.config !== 'string') {
        throw new TypeError('The config option must be a string');
    }

    var directory = path.resolve(base, options.config);

    if (!isDirectory(directory)) {
        throw new Error('Config directory not found: ' + display(directory));
    }

    var names = [];

    function push(name) {
        if (typeof name === 'string' && names.indexOf(name) < 0) {
            names.push(name);
        }
    }

    push(NODE_ENV);
    push(package.name);
    push(package.name.toLowerCase());
    push(CONFIG_DEFAULT);

    var config = null;

    for (var i = 0; i < names.length; i++) {
        config = readFile(path.resolve(directory, names[i]));
        if (config !== null) {
            break;
        }
    }

    if (config === null) {
        throw new Error('Config file not found: ' + display(names) + ' in ' +
            display(directory));
    }

    jsvutil.validate(config, schema);
}

module.exports = pkgconfig;
