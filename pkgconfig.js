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

var path = require('path'),
    util = require('util'),
    pkgfinder = require('pkgfinder');

function getType(val) {
    // Returns the type of the specified value but returns 'array'
    // instead of 'object' if the specified value is an array.
    return util.isArray(val) ? 'array' : typeof val;
}

function merge(target, source) {
    // Merges the target with values from the source.
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

function checkObject(val) {
    // Checks that the specified value is an object and throws an exception
    // if it is not an object. Arrays are not considered objects.
    var type = getType(val);
    if (type !== 'object') {
        throw new Error("Expected an object instead of '" + val + "' (" + type + ").");
    }
}

function loadConfig(pathname) {
    // Loads the configuration module specified by the pathname.
    // An exception is thrown if the module is not found, cannot
    // be read, or is not an object. Returns the object.
    try {
        var config = require(pathname);
        checkObject(config);
        return config;
    } catch (err) {
        if (err.code === 'MODULE_NOT_FOUND') {
            throw new Error("Cannot find the '" + pathname + ".(js|json)' configuration file.");
        } else {
            throw err;
        }
    }
}

function getConfigFilePathnames() {
    var pathnames = [],
        pkg = pkgfinder(),
        env = process.env.NODE_ENV,
        pkgname = pkg.name,
        envname = env ? pkgname + '.' + env : pkgname;
    pathnames.push(path.resolve(path.resolve(pkg.directory, './etc'), pkgname));
    if (!pkg.isCurrent || pkgname != envname) {
        pathnames.push(path.resolve(path.resolve(process.cwd(), './etc'), envname));
    }
    return pathnames;
}

etcPathname
envPathname

function getConfigObject() {
    // Loads the master configuration file and merges it with the
    // deployment-specific configuration file if different.
    var pkg = pkgfinder(),
        directory = path.resolve(pkg.directory, './config'),
        filename = pkg.name,
        pathname = path.resolve(directory, filename),
        config = loadConfig(pathname);
    if (process.env.NODE_CONFIG_DIR) {
        directory = path.resolve(pkg.directory, process.env.NODE_CONFIG_DIR);
    }
    if (process.env.NODE_ENV) {
        filename = pkg.name + '.' + process.env.NODE_ENV;
    }
    var extend = path.resolve(directory, filename);
    if (pathname !== extend) {
        merge(config, loadConfig(extend));
    }
    return config;
}

module.exports = function(callback) {
    try {
        var config = getConfigObject();
        if (typeof callback === 'function') {
            callback(null, config);
            return;
        } else {
            return config;
        }
    } catch (err) {
        if (typeof callback === 'function') {
            callback(err, null);
        } else {
            throw err;
        }
    }
};
