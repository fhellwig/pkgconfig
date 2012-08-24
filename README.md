# pkgconfig

Reads and validates JSON configuration files for Node.js packages.

## Features

- It provides a *consistent* approach for finding configuration files that does not rely on the current working directory.
- It provides a *safe* approach for using configuration files by validating them against a JSON schema.

## Installation

### Dependencies

Add pkgconfig to your `package.json` depencencies and run `npm install`.

    "dependencies": {
        "pkgconfig": "0.0.x"
    }

    $ npm install

### Configuration 

Create a `config` directory in the top-level directory of your Node.js application.

Now add a `schema.json` and a `config.json` file to this directory.

    myapp/
        config/
            config.json
            schema.json
        package.json
        server.js

This is the default layout. Other configurations are supported (please see the
Options section below).

## Usage

### Reading and validating

Call the function returned by `require('pkgconfig')`:

    var pkgconfig = require('pkgconfig');

    var config = pkgconfig();

This reads and validates the configuration file against the schema.

### Top-level directory

The default location of the `config` directory is in the top-level package
directory of the module calling `require('pkgconfig')`. It is found using the
following steps:

1. Get the parent module (the module calling `require('pkgconfig')`).
2. Get the directory part of the parent module's filename.
3. Look for a `package.json` file in this directory.
4. If found, let that be the *package-root* directory.
5. Otherwise, get the parent directory (..) and go to step 3.

This algorithm means that the module using `pkgconfig` need not be in the top
level package directory. For example, if pkgconfig were used in a file located
in the `lib` subdirectory, then pkgconfig will still find the package-root
directory (the one containing the `package.json` file) and look for the
`config` directory in that package-root directory.

## Example

Here is a sample `schema.json` schema file and a sample `config.json`
configuration file that is valid against the schema.

### Sample schema.json file

This is a sample JSON schema file that requires a port number having a range of
one to 65,535 and having a default value of 80. The pkgconfig utility uses the
[JSV](https://github.com/garycourt/JSV) JSON Schema Validator.

    {
        "properties": {
            "port": {
                "description": "The web server port number.",
                "type": "integer",
                "required": true,
                "minimum": 1,
                "maximum": 65535,
                "default": 80
            }
        }
    }

### Sample config.json file

This is a sample JSON configuration file that specifies the port as being 8080.

    {
        "port": 8080
    }

### Alternate file format

JavaScript files can be used instead of JSON files by simple setting the
`module.exports` value.

A `schema.js` file can be used instead of the `schema.json` file.

    var schema = {
        properties: {
            port: {
                description: 'The web server port number.',
                type: 'integer',
                required: true,
                minimum: 1,
                maximum: 65535,
                default: 80
            }
        }
    };

    module.exports = schema;

A `config.js` file can be used instead of the `config.json` file.

    var config = {
        port: 8080
    };

    module.exports = config;

Beyond notational convenience, this also allows for nested constructs or code
that evaluates the environment at runtime.

## Options

The schema object or file and the configuration directory are specified by
passing an options object to the `pkgconfig` function. The following example
shows an options object configured with the default values:

    var pkgconfig = require('pkgconfig');

    var options = {
        schema: path.join('config', 'schema'),
        config: 'config'
    };

    var config = pkgconfig(options);

The schema and config option can be any of the following:

1. A JavaScript object literal.
2. A relative or absolute pathname to a file (the '.js' or '.json' extension is optional).
3. A relative or absolute directory name.

The schema and config options are processed using the following algorithm:

1. If the option is an object literal, then it is used as-is. Stop.
2. Resolve the option against the package-root directory (if the option is
   already an absolute path, then this will not change the option).
3. If the resulting absolute path is the pathname of a file (or if appending
   '.js' or '.json' results in an absolute pathname to a file), then read that
   file as a JSON object. Stop.
4. Otherwise, the resulting absolute path *must* be a directory. Find the file
   in that directory and read it as a JSON object. Stop.

Details for step four (4) in this algorithm (finding the file in a directory):

*For the schema option:*

- The schema file must be named `schema.js` or `schema.json`.

The way in which these are resolved will now be described.

### Schema option resolution

If the schema option is an object, then it is used 'as is' and no further
resolution is performed. Otherwise, it must be a string.

The value of this string is resolved against the package-root directory
resulting in a pathname.

If the resulting pathname is a file, or if appending '.js' or '.json'
results in a pathname to a file, then it is read as the schema.

Otherwise, 
If the resolved path is a directory, then it is joined with the literal string
'schema' to form the schema file pathname. Otherwise, it is assumed to be a
schema file pathname.

If the pathname ends with '.js' or '.json', then the file is read. Otherwise,
each of these extensions is tried in order to read the schema file.

Therefore, if no schema option is specified, then the following two default
schema pathnames are tried:

- `<package-root>/config/schema.js`
- `<package-root>/config/schema.json`

The schema is then checked to verify that is is a valid JSON schema.

### Config option resolution

If the CONFIG_DIR environment variable is set, then it is used instead of the
config option. Otherwise, if the config option is an object, then it is used
'as is' and no further resolution is performed. Otherwise, it must be a string.

The value of the CONFIG_DIR environment variable (if set) or the value of the
config option is resolved against the package-root directory.

If the resolved path is a directory, then it is joined with the the following
four basenames to arrive at four possible config file pathnames. Otherwise, it
is assumed to be a config file pathname.

- `<CONFIG_ENV>` (typically set to 'production' or 'development')
- `<package-name>` (the package name from the `package.json` file)
- `<package-name-lc>` (the lower-case version of the package name)
- `config` (the default value)

For each of these pathnames, if the pathname ends with '.js' or '.json', then
the file is read. Otherwise, each of these extensions is tried in order to read
the config file.

The configuration is then validated against the JSON schema.

## Motivation

There are many Node.js configuration utilities available. Observed limitations are:

1. Using the current working directory as a reference point when locating
   configuration files.
2. Verifying that configuration files are well-formed, but not validating that
   the contents are correct.

Overcoming the first limitation is important for servers. Unlike simple Node.js
programs that are typically run from the root package directory, servers are
often run from a script. This script is started by some system initialization
sequence. The current working directory is not necessarily the package root
directory.

Overcoming the second limitation is important because an application should be
presented with a correct configuration object. Checking that a port number is
an integer, the value of which is within a specific range, is the job of the
configuration file reader, not the application.

The pkgconfig utility deals with these limitations in two ways. First, the
directory of the module calling `require('pkgconfig')` is the base for finding
the configuration directory. Second, the configuration file is validated using
a required JSON schema.


## License

(The MIT License)

Copyright (c) 2012 Frank Hellwig

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to
deal in the Software without restriction, including without limitation the
rights to use, copy, modify, merge, publish, distribute, sublicense, and/or
sell copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS
IN THE SOFTWARE.
