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
        var pathname = path.join(current, filename);
        if (isFile(pathname)) {
            return pathname;
        }
        previous = current;
        current = path.join(current, '..');
    }
    return null;
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
            return JSON.parse(text);
        } else {
            return null;
        }
    }
    return readFile(pathname + '.js') || readFile(pathname + '.json');
}

exports.isFile = isFile;
exports.isDirectory = isDirectory;
exports.findFile = findFile;
exports.readFile = readFile;
