#pkgconfig#

A configuration file manager for node.js applications. It loads and merges
configuration files in the application `config` directory. The application
directory is the one containing the `packge.json` file.

##1. Quick Start##

Given the following application structure...

```no-highlight
myapp/
    package.json
    server.js
    config/
        myapp.json
```

...and a `package.json` file with the `name` property set to `myapp`...

```json
{
    "name": "myapp"
}
```

...then calling `pkgconfig()` will load the `myapp.json` file from the `config` directory.

```javascript
var pkgconfig = require('pkgconfig'),
    config = pkgconfig(); 
```

##2. The Config File##

This section discusses how the config file is found and loaded.

###2.1 The config filename###

The name of the config file is taken from the `name` property in the `package.json` file.
You can change this by providing a string argument to the `pkgconfig()` function.

```no-highlight
myapp/
    package.json
    server.js
    config/
        database.json
```

```javascript
var pkgconfig = require('pkgconfig'),
    config = pkgconfig('database'); 
```

###2.2 The config directory###

You can call `pkgconfig()` from anywhere in your application, not just from a
top-level file such as `server.js`. For example, you could have a `lib`
directory containing an `app.js` file. The `config` directory in the top-level
directory (the one containing the `package.json` file) is still found and used.

```no-highlight
myapp/
    server.js
    package.json                <-- "name": "myapp"
    lib/
        app.js                  <-- calls pkgconfig()
    config/
        myapp.json              <-- this file is still used
```

The application directory is found using the following algorithm:

1. The directory of the main entry point of your application is determined by calling `path.dirname(require.main.filename)`.
2. The `package.json` file is then loaded from this directory.
3. If there is no `package.json` file in this directory, then successive parent directories are searched until the root of the filesystem is found.
4. If no `package.json` file is found, an exception is thrown.

###2.3 Using JavaScript modules###

You can use a JavaScript module instead of a JSON file.
Simply set the `module.exports` property to a JavaScript object.

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

##3. Node Environment##

This section discusses how the `NODE_ENV` environment variable is used.

###3.1 The environment directory###

If the `NODE_ENV` environment variable is set, the a subdirectory in the
`config` directory having the same name as the `NODE_ENV` setting is expected.
For example, if `NODE_ENV` is set to *production*, then the `config/production`
directory must exist and the configuration file in that directory is merged
with the base configuration file in the `config` directory.

```no-highlight
myapp/
    package.json
    server.js
    config/
        myapp.json              <-- read first and provides default values
        production/
            myapp.json          <-- merged with the default myapp.json file
```

If `pkgconfig()` is called with a string argument, then the same process
applies but the specified argument is used.

```no-highlight
myapp/
    package.json
    server.js
    config/
        database.json           <-- read first and provides default values
        production/
            database.json       <-- merged with the default database.json file
```

```javascript
var pkgconfig = require('pkgconfig'),
    config = pkgconfig('database'); 
```

Multiple configuration files can be provided, each read with a call to `pkgconfig()`.

###3.2 The merge process

Consider the following `config/myapp.json` file:

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

Next, consider the following `config/production/myapp.json` file (`NODE_ENV=production`):

```json
{
    "database": {
        "password": "z349xy"
    }
}
```

Merging the second file with the first one results in the following object
being returned from `pkgconfig()`:

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

1. **Like matches like.** Since the `password` in base configuration file is a string, an exception would be thrown if the `password` in production configuration file were a number. Similarly, if the port were specified as a string in the production configuration file instead of a number, then an exception would also be thrown.
2. **Extras are ignored.** If the `database` object in the production configuration file had an additional property, such as `tablespace`, then this is *not* merged since there is no `tablespace` property in the base configuration file.
3. **Scalars and arrays are replaced.** Any property that has a scalar (string, number, boolean) or an array value replaces the original value. Only objects are recursively traversed.

The benefit of this approach is that the base `myapp.json` file essentially
provides a typed template of what is allowed in the merged file. This is much
simpler than using JSON schema or some other type of validation.

Exceptions
----------

The `pkgconfig` utility follows the
[fail-fast](http://en.wikipedia.org/wiki/Fail-fast) design principle. If a
configuration file is not found, an exception is thrown. For example, if the
`NODE_ENV` environment variable is set to *production* and the `production`
subdirectory does not exist, then this is considered an error (versus ignoring
it and only using the base configuration file). Configuration files determine
the initial state of your application and there should never be any ambiguity
about that state.

The following conditions are considered errors and an exception is thrown:

1. The `package.json` file is not found, cannot be read, or does not have a `name` property.
2. The `config` directory is not found in the application directory containing the `package.json` file.
3. The `{name}.(js|json)` configuration file is not found in the `config` directory (or the environment subdirectory) where `{name}` is either the `name` property in the `package.json` file or the string argument provided to the `pkgconfig()` function.
4. The `NODE_ENV` environment variable is set but no such subdirectory exists in the `config` directory.
5. There is an error in the merge process (type mismatch errors).

License
-------

(The MIT License)

Copyright (c) 2014 Frank Hellwig

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
