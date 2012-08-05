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

// This module performs path manipulation. The following conventions are used:
//
// Given /a/b/c.txt then
//
// /a/b/c.txt is the pathname
// /a/b       is the dirname
//      c.txt is the filename
//      c     is the basename
//       .txt is the extension

/**
 * Returns the pathname of the package.json file starting at the directory
 * specified by the dirname. Recursively looks at each parent directory until
 * the file is found. Throws an error if not found.
 */
function getPackagePathname(dirname) {
    if (!dirname) {
        throw Error('The dirname argument is required');
    }
    var pathname = path.resolve(dirname, 'package.json');
    if (fs.existsSync(pathname) && fs.statSync(pathname).isFile()) {
        return pathname;
    }
    var parentDirname = path.resolve(dirname, '..');
    if (parentDirname === dirname) {
        throw new Error("Cannot find the 'package.json' file.");
    }
    return getPackagePathname(parentDirname);
}

// Checks that the directory exists and that it is a directory.
function checkDirectory(dirname) {
    if (fs.existsSync(dirname) && fs.statSync(dirname).isDirectory()) {
        return true;
    }
    throw new Error("Cannot find the '" + dirname + "' directory.");
}

/**
 * Converts an array of names to a string list. This function is called from
 * the findFile function when creating the error message.
 * ['a'] -> "'a'"
 * ['a','b'] -> "'a' or 'b'"
 * ['a','b','c'] -> "'a', 'b', or 'c'"
 */
function nameList(names) {
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
 * For each basename in basenames, find basename.js or basename.json in the
 * directory specified by the dirname. Returns the pathname of the file if
 * found. Throws an error if not found.
 */
function findFile(basenames, dirname) {
    if (!Array.isArray(basenames)) {
        basenames = [ basenames ];
    }
    var filenames = [];
    basenames.forEach(function (basename) {
        filenames.push(basename + '.js');
        filenames.push(basename + '.json');
    });
    for (var i = 0; i < filenames.length; i++) {
        var pathname = path.resolve(dirname, filenames[i]);
        if (fs.existsSync(pathname) && fs.statSync(pathname).isFile()) {
            return pathname;
        }
    }
    throw new Error("Cannot find " + nameList(filenames) + " in '" +
        dirname + "'.");
}

/**
 * The function exported by this module.
 */
function pkgconfig() {

    // Get the dirname of the module requiring this module.
    var moduleDirname = path.dirname(module.parent.filename);

    // Get the pathname and dirname of the package.json file.
    var packagePathname = getPackagePathname(moduleDirname);
    var packageDirname = path.dirname(packagePathname);

    // Check that the config directory exists.
    var configDirname = path.resolve(packageDirname, 'config');
    checkDirectory(configDirname);

    // Read the schema from the config directory.
    var schemaPathname = findFile('schema', configDirname);
    var schema = require(schemaPathname);

    // Determine the configuration directory. This is either the config
    // directory in the package directory or the directory specified by the
    // value of the NODE_CONFIG_DIR environment variable.
    var NODE_CONFIG_DIR = process.env['NODE_CONFIG_DIR'];
    if (NODE_CONFIG_DIR) {
        configDirname = path.resolve(packageDirname, NODE_CONFIG_DIR);
    }
    
    // Read the configuration file using the package.name, the value of
    // NODE_ENV, and default config basename, in that order.
    var package = require(packagePathname);
    var configBasenames = [ package.name ];
    var NODE_ENV = process.env['NODE_ENV'];
    if (NODE_ENV) {
        configBasenames.push(NODE_ENV);
    }
    configBasenames.push('config');
    var configPathname = findFile(configBasenames, configDirname);
    var config = require(configPathname);

    // Validate the configuration data against the schema and return the
    // configuration data on success.
    jsvutil.validate(config, schema);
    return config;
}

module.exports = exports = pkgconfig;
