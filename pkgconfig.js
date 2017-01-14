/*
 * Copyright (c) 2017 Frank Hellwig
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

const fs = require('fs')
const path = require('path')
const util = require('util')
const pkgfinder = require('pkgfinder')

function pkgconfig() {
    const pkg = pkgfinder()
    const dir = configdir()
    const env = process.env.NODE_ENV
    if (env) {
        const e = loadrequired(dir, env)
        const d = loadoptional(dir, 'default')
        if (d === null) {
            return e
        } else {
            return Object.assign(d, e)
        }
    } else {
        return loadrequired(dir, 'default')
    }
}

function configdir() {
    const pkg = pkgfinder()
    const dir = pkg.resolve(process.env.NODE_CONFIG_DIR || 'config')
    if (fs.existsSync(dir)) {
        if (fs.statSync(dir).isDirectory()) {
            return dir
        }
        throw new Error(`Not a directory: '${dir}'`)
    }
    throw new Error(`Configuration directory not found: '${dir}'`)
}

function loadrequired(dir, name) {
    var file = path.resolve(dir, name)
    try {
        return checkobj(require(file))
    } catch (err) {
        if (err.code === 'MODULE_NOT_FOUND') {
            throw new Error(`Configuration file not found: '${file}.(js|json)'`)
        } else {
            throw err
        }
    }
}

function loadoptional(dir, name) {
    var file = path.resolve(dir, name)
    try {
        return checkobj(require(file))
    } catch (err) {
        if (err.code === 'MODULE_NOT_FOUND') {
            return null
        } else {
            throw err
        }
    }
}

function checkobj(val) {
    var type = gettype(val)
    if (type === 'object') {
        return val
    }
    throw new Error(`Expected an object but got ${type} instead`)
}

function gettype(val) {
    return util.isArray(val) ? 'array' : typeof val
}

// Merges the source with the target. The target is modified and returned.
function merge(target, source) {
    if (source === null) {
        return target
    }
    var props = Object.getOwnPropertyNames(target)
    props.forEach(function (name) {
        var s = gettype(source[name])
        if (s !== 'undefined') {
            var t = gettype(target[name])
            if (t !== s) {
                throw new Error(`Type mismatch between '${t}' and '${s}' for '${name}'`)
            }
            if (t === 'object') {
                merge(target[name], source[name])
            } else {
                target[name] = source[name]
            }
        }
    })
    return target
}

module.exports = pkgconfig
