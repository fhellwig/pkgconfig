pkgconfig
=========

A configuration file manager for node.js applications. It loads and merges
configuration files in the application `config` directory. The application
directory is the one containing the `packge.json` file.

Quick Start
-----------

Install `pkgconfig` and add it to your `package.json` dependencies.

```no-highlight
$ npm install --save pkgconfig
```
Ensure you have a `config` directory in your application and, at a minimum,
a `default.json` or `default.js` configuration file.

```no-highlight
myapp/
    package.json
    server.js
    config/
    	default.json
```

Require `pkgconfig` in your `server.js` file and read the default configuration
settings.

```javascript
var pkgconfig = require('pkgconfig');

var config = pkgconfig();
console.log(JSON.stringify(config, null, 4));
```

Production Settings
-------------------

Add a `production.json` or `production.js` configuration file.

```no-highlight
myapp/
    package.json
    server.js
    config/
    	default.json
    	production.json
```

The configuration settings in the `production.json` file will be merged with
the default configuration settings.

The Merge Process
-----------------

Consider the following `default.json` file:

```json
{
    "server": {
        "port": 80
    },
    "database": {
        "username": "admin",
        "password": "password"
    }
}
```

Next, consider the following `production.json` file:

```json
{
    "database": {
        "password": "z349xy"
    }
}
```

Merging the `production.json` file with the `default.json` file results in the
following configuration settings:

```json
{
    "server": {
        "port": 80
    },
    "database": {
        "username": "admin",
        "password": "z349xy"
    }
}
```

There are three important points regarding the merge process:

1. **Like matches like.** Since the `password` in `myapp.json` is a string, an exception would be thrown if the `password` in `myapp.production.json` were a number. Similarly, if the port were specified as a string in the `myapp.production.json` file instead of a number, then an exception would also be thrown.
2. **Extras are ignored.** If the `database` object in `myapp.production.json` had an additional property, such as `tablespace`, then this is *not* merged since there is no `tablespace` property in the original `myapp.json` file.
3. **Scalars and arrays are replaced.** Any property that has a scalar (string, number, boolean) or an array value replaces the original value. Only objects are recursively traversed.

The benefit of this approach is that the base `myapp.json` file essentially
provides a typed template of what is allowed in the merged file. This is much
simpler than using JSON schema or some other type of validation.

Node Environment
----------------

The default behavior is to look for a `production.json` or `production.js` file
and merge it with the default configuration settings. If the `NODE_ENV`
environment variable is set, then that value will be used.

In the following example, `NODE_ENV` is set to `development`.

```no-highlight
myapp/
    package.json
    server.js
    config/
    	default.json            <-- required
    	development.json        <-- merged
    	production.json         <-- ignored
```

If the `NODE_ENV` environment variable is not set, then `production` is used as
the default environment.

You can override the value of the `NODE_ENV` variable by specifying the
environment when calling `pkgconfig()`:

```javascript
var pkgconfig = require('pkgconfig');

var config = pkgconfig('development');
console.log(JSON.stringify(config, null, 4));
```

```no-highlight
myapp/
    package.json
    server.js
    config/
    	default.json            <-- required
    	development.json        <-- merged
    	production.json         <-- ignored
```

Nested Modules
--------------

You can call `pkgconfig()` from anywhere in your application, not just from a
top-level file such as `server.js`. For example, you could have a `lib`
directory containing an `app.js` file. The `config` directory in the top-level
directory (the one containing the `package.json` file) is still found and used.

```no-highlight
myapp/
    server.js
    package.json                <-- "name": "myapp"
    lib/
        app.js                  <-- requires and calls pkgconfig
    config/
        default.json            <-- this file is still found and used
```

The application directory is found using the following algorithm:

1. The directory of the main entry point of your application is determined by calling `path.dirname(require.main.filename)`.
2. The `package.json` file is then loaded from this directory.
3. If there is no `package.json` file in this directory, then successive parent directories are searched until the root of the filesystem is found.
4. If no `package.json` file is found, an exception is thrown.

Using JavaScript Modules
------------------------

In all of the previous examples, you can use a JavaScript module instead of a
JSON file. Simply set the `module.exports` property to a JavaScript object:

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

Exceptions
----------

The `pkgconfig` utility follows the
[fail-fast](http://en.wikipedia.org/wiki/Fail-fast) design principle. If a
configuration file is not found, an exception is thrown. For example, if the
`NODE_ENV` environment variable is set to *production* and a
`production.(js|json)` file is not found, then this is considered an
error (versus trying some alternate default configuration file). Configuration
files determine the initial state of your application and there should never be
any ambiguity about that state.

The following conditions are considered errors and an exception is thrown:

1. The `package.json` file is not found.
2. The `config` subdirectory is not found in the application directory.
3. The `default.(js|json)` configuration file is not found in the `config` subdirectory.
4. The `NODE_ENV` environment variable is set but the `{NODE_ENV}.(js|json)` configuration file is not found.
5. There is an error in the merge process (type mismatch errors).

License
-------

(The MIT License)

Copyright (c) 2014 Frank Hellwig

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
