/*
 * Copyright (c) 2015 Frank Hellwig
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
    strformat = require('strformat'),
    pkgfinder = require('pkgfinder');

function pkgconfig(name) {
    var pkg = pkgfinder(),
        name = (typeof name === 'string') ? name : pkg.name,
        dir = pkg.resolve('etc'),
        config = loadrequired(dir, name),
        env = process.env.NODE_ENV;
    if (env) {
        merge(config, loadoptional(path.resolve(dir, env), name));
    }
    return config;
}

function loadrequired(dir, name) {
    var file = path.resolve(checkdir(dir), name);
    try {
        return checkobj(require(file));
    } catch (err) {
        if (err.code === 'MODULE_NOT_FOUND') {
            throw new Error(strformat("Configuration file not found: '{0}.(js|json)'", file));
        } else {
            throw err;
        }
    }
}

function loadoptional(dir, name) {
    var file = path.resolve(dir, name);
    try {
        return checkobj(require(file));
    } catch (err) {
        if (err.code === 'MODULE_NOT_FOUND') {
            return null;
        } else {
            throw err;
        }
    }
}

function checkdir(dir) {
    if (fs.existsSync(dir)) {
        if (fs.statSync(dir).isDirectory()) {
            return dir;
        }
        throw new Error(strformat("Not a directory: '{0}'", dir));
    }
    throw new Error(strformat("Configuration directory not found: '{0}'", dir));
}

function checkobj(val) {
    var type = gettype(val);
    if (type === 'object') {
        return val;
    }
    throw new Error(strformat("Expected an object but got {0} instead", type));
}

function gettype(val) {
    return util.isArray(val) ? 'array' : typeof val;
}

function merge(target, source) {
    if (source === null) {
        return;
    }
    var props = Object.getOwnPropertyNames(target);
    props.forEach(function (name) {
        var s = gettype(source[name]);
        if (s !== 'undefined') {
            var t = gettype(target[name]);
            if (t !== s) {
                throw new Error(strformat("Type mismatch between '{0}' and '{1}' for '{2}'", t, s, name));
            }
            if (t === 'object') {
                merge(target[name], source[name]);
            } else {
                target[name] = source[name];
            }
        }
    });
}

module.exports = pkgconfig;
