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
    util = require('util');

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

function loadModule(pathname) {
    // Loads the module specified by the pathname. If the module is not found,
    // then this function returns null. Otherwise, there was an error loading
    // the module and an exception is thrown.
    try {
        return require(pathname);
    } catch (err) {
        if (err.code === 'MODULE_NOT_FOUND') {
            return null;
        } else {
            throw err;
        }
    }
}

function loadConfig(pathname) {
    // Loads the configuration module specified by the pathname.
    // An exception is thrown if the module is not found, cannot
    // be read, or is not an object. Returns the object.
    var retval = loadModule(pathname);
    if (retval === null) {
        throw new Error("Cannot find the '" + pathname + ".(js|json)' configuration file.");
    }
    checkObject(retval);
    return retval;
}

function getApplicationInfo() {
    // Finds the package.json file and returns an object having the following
    // two properties: name and directory. The name property is the name from
    // the package.json file. The directory property is the location of the
    // package.json file.
    var maindir = path.dirname(require.main.filename),
        current = maindir;
    while (true) {
        var filename = path.resolve(current, 'package.json');
        var package = loadModule(filename);
        if (package) {
            if (!package.name) {
                throw new Error("Cannot find property 'name' in '" + filename + "'.");
            }
            return {
                name: package.name,
                directory: current
            };
        }
        var parent = path.resolve(current, '..');
        if (current == parent) {
            throw new Error("Cannot find 'package.json' in '" + maindir + "' nor any of its parent directories.");
        }
        current = parent;
    }
}

function getConfigObject() {
    // Loads the master configuration file and merges it with the
    // deployment-specific configuration file if different.
    var app = getApplicationInfo(),
        directory = path.resolve(app.directory, './config'),
        filename = app.name,
        pathname = path.resolve(directory, filename),
        config = loadConfig(pathname);
    if (process.env.NODE_CONFIG_DIR) {
        directory = path.resolve(app.directory, process.env.NODE_CONFIG_DIR);
    }
    if (process.env.NODE_ENV) {
        filename = app.name + '.' + process.env.NODE_ENV;
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
