/*
 * Copyright (c) 2014 Frank Hellwig
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

var fs = require('fs'),
    path = require('path'),
    util = require('util'),
    pkgfinder = require('pkgfinder');

/**
 * Loads the default configuration file. If an environment is specified by the
 * NODE_ENV environment variable, it is merged with the default settings.
 */
function loadAndMerge(def) {
    var def = def || 'default',
        pkg = pkgfinder(),
        dir = pkg.resolve('config'),
        env = process.env.NODE_ENV,
        cfg = loadConfigFile(path.resolve(dir, def));
    if (env) {
        merge(cfg, loadConfigFile(path.resolve(dir, env)));
    }
    return cfg;
};

/**
 * Loads the configuration file, merging them if required.
 * Returns the configuration object.
 */
function getConfigObject() {
    var pathnames = getConfigPathnames();
    var config = loadConfigFile(pathnames[0]);
    if (pathnames.length > 1) {
        merge(config, loadConfigFile(pathnames[1]));
    }
    return config;
}

/**
 * Loads the configuration module specified by the pathname. It uses the
 * require function and therefore reads both JavaScript and JSON files.
 * An exception is thrown if the module is not found, cannot be read, or
 * is not an object. Returns the configuration as an object.
 */
function loadConfigFile(pathname) {
    try {
        var config = require(pathname);
        checkObject(config);
        return config;
    } catch (err) {
        if (err.code === 'MODULE_NOT_FOUND') {
            throw new Error("Cannot load the '" + pathname + ".(js|json)' configuration file.");
        } else {
            throw err;
        }
    }
}

/**
 * Merges the target with values from the source.
 * Throws an exception on type mismatch.
 */
function merge(target, source) {
    var props = Object.getOwnPropertyNames(target);
    props.forEach(function(name) {
        var s = getType(source[name]);
        if (s !== 'undefined') {
            var t = getType(target[name]);
            if (t !== s) {
                throw new Error("Type mismatch between '" + t + "' and '" + s + "' for '" + name + "'.");
            }
            if (t === 'object') {
                merge(target[name], source[name]);
            } else {
                target[name] = source[name];
            }
        }
    });
}

/**
 * Checks that the specified value is an object and throws an exception
 * if it is not an object. Arrays are not considered objects.
 */
function checkObject(val) {
    var type = getType(val);
    if (type !== 'object') {
        throw new Error("Expected an object instead of '" + val + "' (" + type + ").");
    }
}

/**
 * Returns the type of the specified value but returns 'array'
 * instead of 'object' if the specified value is an array.
 */
function getType(val) {
    return util.isArray(val) ? 'array' : typeof val;
}

module.exports = loadAndMerge;

if (!module.parent) {
    loadAndMerge();
    loadAndMerge('config');
}
