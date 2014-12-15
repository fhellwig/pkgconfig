#pkgconfig

A configuration file manager for node.js applications.

##1. Installation

Add `pkgconfig` as a dependency in your `package.json` file.

```json
"dependencies": {
    "pkgconfig": "2.x.x"
}
```

```no-highlight
$ npm install
```

##2. Quick Start

Create an `etc` directory in your application.

```no-highlight
myapp/
    server.js
    package.json               <-- "name": "myapp"
    etc/                       <-- this directory must exist
```

Create a `.json` default configuration file.

```no-highlight
myapp/
    server.js
    package.json               <-- "name": "myapp"
    etc/                       <-- this directory must exist
        myapp.default.json     <-- this file must exist
```

Create one or more deployment-specific configuration files.
The `NODE_ENV` environment variable determines which file is used.

```no-highlight
myapp/
    server.js
    package.json               <-- "name": "myapp"
    etc/                       <-- this directory must exist
        myapp.default.json     <-- this file must exist
        myapp.development.json <-- used if NODE_ENV = 'development'
        myapp.production.json  <-- used if NODE_ENV = 'production'
        myapp.json             <-- used if NODE_ENV is not set
```

Call the `pkgconfig()` function from your `server.js` file.

```javascript
var pkgconfig = require('pkgconfig'),
    config = pkgconfig();
// Use the config object...
```

##3. Details

This section explores the `pkgconfig` utility in more detail.

###3.1 The current working directory

If you are running your application from a directory other than the application package directory,
then the `etc` directory for the **deployment-specific configuration file** must be present in the
current working directory. The **default configuration file** is still read from the application
package `etc` directory.

###3.2 Calling from other locations

You can call `pkgconfig()` from anywhere in your application, not just from a top-level file such as `server.js`.
For example, you could have a `lib` directory containing an `app.js` file.
The `etc` directory in the top-level directory (the one containing your `package.json` file) is still found and used.

```no-highlight
myapp/
    server.js
    package.json               <-- name property = 'myapp'
    lib/
        app.js                 <-- requires and calls pkgconfig
    etc/                       <-- this directory is still used
        myapp.default.json
        myapp.production.json
```

###3.3 Merging configuration settings

The deployment configuration settings are merged with the default configuration
settings. For example, if `NODE_ENV` is set to 'production', then the
`myapp.production.json` file is merged with the `myapp.default.json` file. The
following example illustrated this merge process.

Here is the application with two configuration files:

```no-highlight
myapp/
    server.js
    package.json
    etc/
        myapp.default.json
        myapp.production.json
```

Here is the `myapp.default.json` file:

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

Here is the `myapp.production.json` file:

```json
{
    "database": {
        "password": "z349xy"
    }
}   
```

The result of merging `myapp.production.json` with `myapp.default.json` is the following configuration object:

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

1. **Like matches like.** Since the `password` in `myapp.js` is a string, an exception would be thrown if the `password` in `myapp.production.js` were a number. Similarly, if the port were specified as a string in the `myapp.production.js` file instead of a number, then an exception would also be thrown.
2. **Extras are ignored.** If the `database` object in `myapp.production.js` had an additional property, such as `tablespace`, then this is *not* merged since there is no `tablespace` property in the original `myapp.js` file.
3. **Scalars and arrays are replaced.** Any property that has a scalar (string, number, boolean) or an array value replaces the original value. Only objects are recursively traversed.

###3.4 Using JavaScript instead of JSON

You can use a JavaScript module instead of a JSON file.

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

##4. Error Handling

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

The `pkgconfig` utility follows the
[fail-fast](http://en.wikipedia.org/wiki/Fail-fast) design principle. If a
configuration file is not found, an exception is thrown. For example, if the
`NODE_CONFIG_DIR` environment variable is set and no configuration file is
found in that directory, then this is considered an error (versus trying the
default `config` directory). Configuration files determine the initial state of
your application and there should never be any ambiguity about that state.

The following conditions are considered errors and an exception is thrown (or an error object is passed to the callback function) in each case:

1. The `package.json` file is not found.
2. The `package.json` file cannot be read using `require`.
3. The `package.json` file does not have a `name` property.
4. The `{pkgname}.default.(js|json)` configuration file is not found in the application `etc` directory.
5. The `NODE_ENV` environment variable is set but the `{pkgname}.{NODE_ENV}.(js|json)` configuration file is not found.
5. The `NODE_ENV` environment variable is not set and the `{pkgname}.(js|json)` configuration file is not found.
7. The configuration file cannot be read using `require`.
8. There is an error in the merge process (type mismatch errors).

##5. Additional Information

###5.1 Motivations

I created this utility because I wanted a configuration file manager that had the following properties:

1. It must be easy to use. A simple require and a function call is all that is needed. The `NODE_ENV` environment variable enhance this process, but is completely optional.
2. It must use the package name as the configuration filename. Often, production configuration files are located in a directory other than the installation directory. Having them named by package simplifies their maintenance.
3. The configuration directory location must be independent from the module calling `pkgconfig`. A trivial approach of calling `require('./config/' + package.name)` would only work from a module in the top-level directory and fail elsewhere.

###5.2 Finding the application directory

It is worth discussing how the application directory is found since this allows calling `pkgconfig` from any module your application's directory structure.

1. The directory of the main entry point of your application is determined by calling `path.dirname(require.main.filename)`.
2. The `package.json` file is then loaded from this directory.
3. If there is no `package.json` file in this directory, then successive parent directories are searched until the root of the filesystem is found.
4. If no `package.json` file is found, an exception is thrown.

##6. License

(The MIT License)

Copyright (c) 2014 Frank Hellwig

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
