#pkgconfig

A configuration file manager for node.js applications. It loads configuration
files in the application's `conf` subdirectory and merges them with
configuration files in the current working directory's `conf` subdirectory.

##Quick Start

Install the `pkgconfig` module.

```no-highlight
npm install pkgconfig --save
```

Add a `conf` directory to your application and create a JSON file having the
same name as the `name` property in your `package.json` file.

```no-highlight
myapp/
    package.json                <-- "name": "myapp"
    server.js
    conf/
        myapp.json
```

Call `pkgconfig()` to load the `myapp.json` file from the `conf` directory.

```javascript
var pkgconfig = require('pkgconfig'),
    appConf = pkgconfig(); 
```

##The Default Configuration File

The default configuration file is located using the following pattern:

    {pkgdir}/conf/{name}.(js|json)

The `{pkgdir}` is the directory containing the application's `package.json`
file. The `{name}` is either the `name` property from the `package.json` file
or the optional `name` argument to the `pkgfinder()` function.

The configuration file can be a JavaScript or a JSON file. For a JavaScript
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

The default configuration file must exist. It is an error if it is not found,
cannot be read, or is not a valid JavaScript or JSON object.

##Overriding Configuration Values

If the current working directory is not the application's directory, then the
configuration file in the `conf` subdirectory of the current working directory
is read and merged with the default configuration file. For example:

```no-highlight
/opt/myapp/                     <-- installed application location
    package.json
    server.js
    conf/
        myapp.json              <-- default configuration file
```

```no-highlight
/home/myapp/                    <-- current working directory
    conf/
        myapp.json              <-- merged with the default file
```

The overriding configuration file need not exist. If the `/home/myapp/conf`
directory does not exist or no configuration file is found, then it is not an
error and the default configuration values are used as-is.

###The merge process

Assume that the `/opt/myapp/conf/myapp.json` configuration file contains the
following values:

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

Next, assume that the `/home/myapp/conf/myapp.json` configuration file
overrides the `database.password` value:

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

The benefit of this approach is that the base configuration file essentially
provides a typed template of what is allowed in the merged file. This is much
simpler than using JSON schema or some other type of validation.

##Node Environment

This section discusses how the `NODE_ENV` environment variable is used.

###The environment directory

If the `NODE_ENV` environment variable is set, then a subdirectory in the `conf` directory of the current working directory having the same name as the `NODE_ENV` setting is used if it exists.

For example, if `NODE_ENV` is set to *production*, then the following situation applies:

```no-highlight
/opt/myapp/                     <-- installed application location
    package.json
    server.js
    conf/
        myapp.json              <-- default configuration file
```

```no-highlight
/home/myapp/                    <-- current working directory
    conf/
        myapp.json              <-- ignored because NODE_ENV is set
        production/
            myapp.json          <-- merged with the default file
```

This also applies if the current working directory is the application directory:

```no-highlight
/opt/myapp/                     <-- installed application location
    package.json
    server.js
    conf/
        myapp.json              <-- default configuration file
        production/
            myapp.json          <-- merged with the default file
```

The environment configuration file need not exist. If the `production`
directory does not exist or no configuration file is found, then it is not an
error and the default configuration values are used as-is.

Exceptions
----------

The following conditions are considered errors and an exception is thrown:

1. The `package.json` file is not found, cannot be read, or does not have a `name` property.
2. The `conf` directory is not found in the application directory containing the `package.json` file.
3. The `{name}.(js|json)` configuration file is not found in the `conf` directory where `{name}` is either the `name` property in the `package.json` file or the string argument provided to the `pkgconfig()` function.
4. There is an error in the merge process (type mismatch errors).

License
-------

(The MIT License)

Copyright (c) 2014 Frank Hellwig

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
