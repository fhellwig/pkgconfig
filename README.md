# pkgconfig

Reads and validates JSON configuration files for Node.js packages.

## Overview

Applications often get their settings from configuration files. These files are usually structured as JSON text or JavaScript objects. Reading these files is easily accomplished. However, validating that the values are of the correct type or fall within an appropriate range should not be performed by application code. Reading configuration files and validating them against a JSON schema is the object of the pkgconfig utility.

This package uses the [findpkg](https://github.com/fhellwig/findpkg) utility for finding the top-level package directory of the module requiring pkgconfig. It then looks for a `config` directory in this top-level directory. The `config` directory must contain a configuration file and a schema file. The configuration file is read and validated against the schema file using the [JSV](https://github.com/garycourt/JSV) implementation.

## Installation

This section describes the installation of pkgconfig and the default directory layout.

### Dependencies

Add pkgconfig to your `package.json` depencencies and run `npm install`.

    "dependencies": {
        ...,
        "pkgconfig": "a.b.c"
    }

    $ npm install

### Layout

Create a `config` directory in the top-level directory of your Node.js application. Add a `schema.json` and a `config.json` file to this directory.

    myapp/
        config/
            config.json
            schema.json
        package.json
        server.js

## Usage

This section describes the pkgconfig function, the default values, the options object, and environment variables.

### Function

Require pkgconfig and call the function returned from `require('pkgconfig')`.

```javascript
var pkgconfig = require('pkgconfig');
var config = pkgconfig();
```

This reads the `config.json` configuration file and validates it against the `schema.json` schema file.

### Defaults

Be default, pkgconfig looks for the following schema and a configuration files:

- `<your-package-base>/config/schema.(js|json)`
- `<your-package-base>/config/config.(js|json)`

### Options

These defaults can be changed by passing an options object to the `pkgconfig` function.

```javascript
var pkgconfig = require('pkgconfig');

var options = {
    schema: <schema object or file pathname>,
    config: <config object or file pathname>
};

var config = pkgconfig(options);
```

Either one of these properties can be a JavaScript object or the pathname to a file (with or without an extension). If an options property is not specified, it falls back to the default value.

If it is a pathname, then it is resolved against the requiring package's base directory unless the pathname begins with a dot (i.e., `./` or `../`) in which case it is resolved against the current working directory.

### Environment

The `PKGCONFIG_FILE` environment variable overrides the default configuration file pathname and any pathname specified in the options object. The `PKGCONFIG_FILE` environment variable has no effect on the schema file location since this should not be user-configurable.

### Extensions

Both `.js` and `.json` files are valid schema and configuration file extensions and are tried in that order if no extension is specified. If a JavaScript file is used for either the schema or the configuration file, then the object must be exported using the `module.exports` variable.

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
