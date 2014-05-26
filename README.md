pkgconfig
=========

A configuration file manager for node.js applications.

Overall approach:

- The name of the master configuration file is determined by the `name` property from your application's `package.json` file.
- The master configuration file must be located in the `config` directory at the top-level of your application (the directory containing your `package.json` file).
- An additional deployment-specific configuration file is found using the values of the `NODE_ENV` and the `NODE_CONFIG_DIR` environment variables.
- This additional deployment-specific configuration file is merged with the master configuration file.
- Both JavaScript `(.js)` and JSON `(.json)` configuration files are acceptable.

The previous version (0.0.5) of this utility used JSON schema validation.
The current version (0.0.6) uses the much simpler template-override approach
by merging a deployment-specific file with the master configuration file.

This package does not depend on any other packages.

## 1. Quick Start

### 1.1 Installation

```
npm install pkgconfig
```

or

```
"dependencies": {
    "pkgconfig": "0.1.x",
    ...
}
```

### 1.2 Setup

```
myapp/
    package.json
    config/
        myapp.json
```

### 1.3 Usage

```javascript
var pkgconfig = require('pkgconfig'),
    config = pkgconfig();
// Use the config object...
```

## 2. Detailed Instructions

### 2.1 Master Configuration File

In your application, create a `config` directory at the same level as
your `package.json` file. Then, create a `<name>.js` or `<name>.json`
configuration file in the `config` directory where `<name>` is the
value of the `name` property in your `package.json` file.

```
myapp/
    server.js
    package.json  <-- "name": "myapp"
    config/
        myapp.js  <-- can also be myapp.json
```

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

You can do this from anywhere in your application, not just from a top-level
file such as `server.js`. For example, you could have a `lib` directory
containing an `app.js` file. The `config` directory in the top-level directory
(the one containing your `package.json` file) is still found and used.

```
myapp/
    server.js
    package.json  <-- "name": "myapp"
    lib/
        app.js    <-- requires and calls pkgconfig
    config/
        myapp.js  <-- this file is still used
```

### 2.2 Deployment-Specific Configuration File

The `NODE_ENV` and `NODE_CONFIG_DIR` environment variables determine the name
and location of your application's deployment-specific configuration file.
Both of these are optional. If neither environment variable is set, then only
the master configuration file is used.

#### 2.2.1 NODE_ENV

The `NODE_ENV` environment variable specifies the run time environment such as
development or production. If the `NODE_ENV` environment variable is set, then
a `<name>.<NODE_ENV>.(js|json)` configuration file is loaded and merged with
the master configuration file. For example, if the value of `NODE_ENV` is set
to `production`, then the settings in `myapp.production.js` are merged with
the settings in the `myapp.js` configuration file. 

Here is the application with two configuration files:

```
myapp/
    server.js
    package.json
    config/
        myapp.js            <-- always loaded
        myapp.production.js <-- loaded if NODE_ENV = production
```

Here is the `myapp.js` file:

```javascript
module.exports = {
    server: {
        port: 80
    },
    database: {
        username: 'admin',
        password: 'password'
    }
}       
```

Here is the `myapp.production.js` file:

```javascript
module.exports = {
    database: {
        password: 'z349xy'
    }
}   
```

The result of merging `myapp.production.js` with `myapp.js` is the following configuration object:

```javascript
{
    server: {
        port: 80
    },
    database: {
        username: 'admin',
        password: 'z349xy'
    }
}
```

There are three important points regarding the merge process:

1. **Like matches like.** Since the `password` in `myapp.js` is a string, an exception would be thrown if the `password` in `myapp.production.js` were a number. Similarly, if the port were specified as a string in the `myapp.production.js` file instead of a number, then an exception would also be thrown.
2. **Extras are ignored.** If the `database` object in `myapp.production.js` had an additional property, such as `tablespace`, then this is *not* merged since there is no `tablespace` property in the original `myapp.js` file.
3. **Scalars and arrays are replaced.** Any property that has a scalar (string, number, boolean) or an array value replaces the original value. Only objects are recursively traversed.

#### 2.2.2 NODE_CONFIG_DIR

If the `NODE_CONFIG_DIR` environment variable is set, then this directory
determines the location of the deployment-specific configuration file.
For example, if the value of `NODE_CONFIG_DIR` is `/etc` and the value of
`NODE_ENV` is `production`, then the following deployment-specific
configuration file is loaded *and merged* with the master configuration
file in the `config` directory.

```
/etc/myapp.production.js
```

If `NODE_ENV` were not set in this case, then the following configuration file
is merged with the master configuration file.

```
/etc/myapp.js
```

**Please note:** The directory specified by the `NODE_CONFIG_DIR` environment
variable is resolved against the application directory. Therefore, if is not
absolute, it is considered relative to the application directory.

### 2.3 Exceptions

The `pkgconfig` utility follows the [fail-fast](http://en.wikipedia.org/wiki/Fail-fast) design principle. If a configuration file is not found, an exception is thrown. For example, if the `NODE_CONFIG_DIR` environment variable is set and no configuration file is found in that directory, then this is considered an error (versus trying the default `config` directory). Configuration files determine the initial state of your application and there should never be any ambiguity about that state.

The following conditions are considered errors and an exception is thrown (or an error object is passed to the callback function) in each case:

1. The `package.json` file is not found.
2. The `package.json` file cannot be read using `require`.
3. The `package.json` file does not have a `name` property.
4. The `<name>.(js|json)` configuration file is not found in the application `config` directory.
5. The `NODE_ENV` environment variable is set but no `<name>.<NODE_ENV>.(js|json)` configuration file is found.
6. The `NODE_CONFIG_DIR` environment variable is set but a configuration file is not found in this directory.
7. The configuration file cannot be read using `require`.
8. There is an error in the merge process (type mismatch errors).

## 3. Additional Information

### 3.1 Motivations

I created this utility because I wanted a configuration file manager that had the following properties:

1. It must be easy to use. A simple require and a function call is all that is needed. Environment variables enhance this process, but are completely optional.
2. It must use the package name as the configuration filename. Often, production configuration files are located in a directory other than the installation directory. Having them named by package simplifies their maintenance.
3. The configuration directory location must be independent from the module calling `pkgconfig`. A trivial approach of calling `require('./config/' + package.name)` would only work from a module in the top-level directory and fail elsewhere.

### 3.2 Finding the Application Directory

It is worth discussing how the application directory is found since this allows calling `pkgconfig` from any module your application's directory structure.

1. The directory of the main entry point of your application is determined by calling `path.dirname(require.main.filename)`.
2. The `package.json` file is then loaded from this directory.
3. If there is no `package.json` file in this directory, then successive parent directories are searched until the root of the filesystem is found.
4. If no `package.json` file is found, an exception is thrown.

## 4. License

(The MIT License)

Copyright (c) 2014 Frank Hellwig

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
