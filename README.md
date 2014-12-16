pkgconfig
=========

A configuration file manager for node.js applications. It uses the package name
from the application's `package.json` file and looks for `{pkgname}.json` or
`{pkgname}.js` file in the application's `etc` directory.

Installation
------------

Add the `pkgconfig` module as a dependency in your `package.json` file and then
run `npm install`.

```json
"dependencies": {
    "pkgconfig": "2.x.x"
}
```

```no-highlight
$ npm install
```

Quick Start
-----------

Step 1: Create an `etc` directory in your application.

```no-highlight
myapp/
    server.js
    package.json                <-- "name": "myapp"
    etc/                        <-- this directory must exist
```

Step 2: Add a `.json` configuration file. This file must have the same
base name as your application as specified by the `name` property in
the `package.json` file.

```no-highlight
myapp/
    server.js
    package.json                <-- "name": "myapp"
    etc/                        <-- this directory must exist
        myapp.json              <-- this file must exist
```

Step 3 (optional): Add a deployment-specific configuration file.
The `NODE_ENV` environment variable determines the filename.
This file is merged with the manditory `myapp.json` file.

```no-highlight
myapp/
    server.js
    package.json                <-- "name": "myapp"
    etc/                        <-- this directory must exist
        myapp.json              <-- this file must exist
        myapp.production.json   <-- used if NODE_ENV='production'
```

Step 4: Call the `pkgconfig()` function from your `server.js` file.

```javascript
var pkgconfig = require('pkgconfig'),
    config = pkgconfig();
// Use the config object...
```

The Merge Process
-----------------

In the previous example, the `myapp.production.json` file is merged
with the `myapp.json` file. This section describes the merge process.

Consider the following default `myapp.json` file:

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

Next, consider the `myapp.production.json` file that is used if the `NODE_ENV`
environment variable is set to *production*:

```json
{
    "database": {
        "password": "z349xy"
    }
}
```

The result of merging the `myapp.production.json` with the `myapp.json` is the
following configuration object:

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

Current Working Directory
-------------------------

The behavior of `pkgconfig` is altered slightly if you run your application
from a directory other than the application's directory. This is useful if you
want to treat the application directory as a read-only deployment and need to
keep your `etc` directory in an alternate location such as your home directory.

For example, assume you install the application into the `/opt/myapp` directory
and then create a `/home/yourname/myapp`  directory. You then execute the
following commands:

```no-highlight
$ cd /home/yourname/myapp
$ export NODE_ENV=development
$ node /opt/myapp/server.js
```

Then `pkgconfig` will look for a
`/home/yourname/myapp/etc/myapp.development.json` configuration file. If the
`NODE_ENV` environment variable is not set, then it will look for a
`/home/yourname/myapp/etc/myapp.json` file. In either case, this file is
*merged* with the `/opt/myapp/etc/myapp.json` file as previously described.

Nested Modules
--------------

You can call `pkgconfig()` from anywhere in your application, not just from a
top-level file such as `server.js`. For example, you could have a `lib`
directory containing an `app.js` file. The `etc` directory in the top-level
directory (the one containing your `package.json` file) is still found and
used.

```no-highlight
myapp/
    server.js
    package.json                <-- "name": "myapp"
    lib/
        app.js                  <-- requires and calls pkgconfig
    etc/                        <-- this directory is still used
        myapp.json
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

Error Handling
--------------

In your `server.js` file, get your configurations settings using either the
simple approach discussed in the *Quick Start* section above or one of the
following two, more robust, approaches that take error handling into account.

(a) Using a return value and exceptions:

```javascript
var pkgconfig = require('pkgconfig');

try {
    var config = pkgconfig();
    // Use the config object...
} catch (err) {
    console.error(err.message);
}
```

(b) Using a callback function:

```javascript
var pkgconfig = require('pkgconfig');

pkgconfig(function(err, config) {
    if (err) {
        console.error(err.message);
    } else {
        // Use the config object...
    }
});
```

Exceptions
----------

The `pkgconfig` utility follows the
[fail-fast](http://en.wikipedia.org/wiki/Fail-fast) design principle. If a
configuration file is not found, an exception is thrown. For example, if the
`NODE_ENV` environment variable is set to *production* and a
`{pkgname}.production.(js|json)` file is not found, then this is considered an
error (versus trying some alternate default configuration file). Configuration
files determine the initial state of your application and there should never be
any ambiguity about that state.

The following conditions are considered errors and an exception is thrown (or
an error object is passed to the callback function) in each case:

1. The `package.json` file is not found.
2. The `package.json` file cannot be read using `require`.
3. The `package.json` file does not have a `name` property.
4. The `{pkgname}.(js|json)` configuration file is not found in the application `etc` directory.
5. The `NODE_ENV` environment variable is set but the `{pkgname}.{NODE_ENV}.(js|json)` configuration file is not found.
6. The current working directory is not the application directory, the `NODE_ENV` environment variable is not set, and the `{pkgname}.(js|json)` configuration file is not found.
7. The configuration file cannot be read using `require`.
8. There is an error in the merge process (type mismatch errors).

License
-------

(The MIT License)

Copyright (c) 2014 Frank Hellwig

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
