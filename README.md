pkgconfig
=========

Version 3.2.0

A configuration file manager for node.js applications. It loads configuration
files in the application's `config` directory. Initially, a `default.json` or
`default.js` file is loaded and merged with an optional configuration file
specified by the the `NODE_ENV` environment variable.

The `default` configuration file can be overridden by specifying an argument
to the `pkgconfig(<file>)` function.

The `config` directory can be overridden by setting the `NODE_CONFIG_DIR`
environment variable.

Quick Start
-----------

Install the `pkgconfig` module.

```no-highlight
npm install pkgconfig --save
```

Add a `config` directory to your application and create a `default.json` file.

```no-highlight
myapp/
    package.json
    server.js
    config/
        default.json
        testing.json
```

Call `pkgconfig()` to load the `default.json` file from the `config` directory.

Call `pkgconfig('testing')` to load the `testing.json` file from the `config` directory.

```javascript
const pkgconfig = require('pkgconfig')
const cfg = pkgconfig(); 
```

Configuration Files
-------------------

The default configuration file is located using the following pattern:

    {pkgdir}/config/default.(js|json)

The `{pkgdir}` is the directory containing the application's `package.json`
file. The configuration file can be a JavaScript or a JSON file. For a JavaScript
files, simply set the `module.exports` property to a JavaScript object.

```javascript
module.exports = {
    server: {
        port: 80
    },
    database: {
        username: 'admin',
        password: 'password'
    }
};
```

Loading Algorithm
-----------------

The following is the algorithm for how the default configuration file is loaded
and (optionally) merged with the configuration file specified by the `NODE_ENV`
environment variable.

```no-highlight
if NODE_ENV is set then
    read the default configuration file (optional)
    read the NODE_ENV configuration file (required)
    if the NODE_ENV configuration file cannot be read then
        throw an exception
    end if
    if the default configuration file does not exist then
        return the NODE_ENV configuration values
    else
        merge the default and NODE_ENV configuration using object-merge*
        return the merged results
    end if
else
    read the default configuration file (required)
    if the default configuration file does not exist then
        throw an exception
    end if
    return the default configuration values
end if
```

* The `object-merge` refers to the [object-merge](https://www.npmjs.com/package/object-merge) package.

For example, if `NODE_ENV` is set to *production*, then the following situation applies:

```no-highlight
myapp/
    package.json
    server.js
    config/
        default.json            <-- default configuration file
        production.json         <-- merged with the default file
```

Exceptions
----------

The following conditions are considered errors and an exception is thrown:

1. The application's `package.json` file is not found or cannot be read.
2. The `config` directory (or the directory specified by the `NODE_CONFIG_DIR` environment variable) is not found in the application directory containing the `package.json` file.
3. The default configuration file is not found in the `config` directory if the `NODE_ENV` environment variable is not set.
4. The configuration file specified by the `NODE_ENV` environment variable cannot be read.
5. The configuration file does not contain a JavaScript or JSON object.

Testing
-------

```no-highlight
$ node test/pkgconfig-test.js
Passed test 1 (read the default configuration file).
Passed test 2 (read the default and development configuration files).
Passed test 3 (read only the development configuration file).
Passed test 4 (error if the NODE_ENV configuration file is not found).
Passed test 5 (error if the default configuration file is not found).
All tests pass.
```

License
-------

(The MIT License)

Copyright (c) 2017 Frank Hellwig

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
