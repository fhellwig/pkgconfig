# pkgconfig

Reads and validates JSON configuration files for Node.js packages.

Key Features:

- It provides a *consistent* approach for finding configuration files that does not rely on the current working directory.
- It provides a *safe* approach for using configuration files by validating them against a JSON schema.

## Quick Start

### Installation

Add pkgconfig to your `package.json` depencencies and run `npm install`.

    "dependencies": {
        "pkgconfig": "0.0.x"
    }

### Configuration

Create a `config` directory in the root of your application directory. Put a `config.json` and a `schema.json` file into the `config` directory.

    app/
        config/
            config.json
            schema.json
        package.json
        server.js

Sample `config.json` file:

    {
        "port": 8080
    }

Sample `schema.json` file:

    {
        "properties": {
            "port": {
                "description": "The web server port number.",
                "type": "integer",
                "minimum": 1,
                "maximum": 65535,
                "default": 80
            }
        }
    }

Any `.json` configuration or schema file can also be provided as a `.js` module file by setting `module.exports` to a JSON-compatible JavaScript object or array. For example, instead of `config.json`, we could have written the following `config.js` file:

    module.exports = {
        port: 8080
    };

The JSON data is simple rewritten as a JavaScript object literal. Beyond notational convenience, this also allows for nested constructs or code that evaluates the environment at runtime.

### Usage

In your main file, require and call the `pkgconfig()` function.

For example, in the `server.js` file, add the following statements:

    // Require pkgconfig.
    var pkgconfig = require('pkgconfig');

    // Read the config file and validate it against the schema.
    var config = pkgconfig();

    // Use the config values, knowing that they have been validated.
    console.log('port: %d', config.port);

The code using `pkgconfig` need not be in the top level package directory.  For example, if these statements were placed in a file located in the `lib` subdirectory, then pkgconfig will still find the package root directory (the one containing the `package.json` file) and look for the `config` directory in the package root directory.

### Overrides

The `NODE_CONFIG_DIR` environment variable overrides the location of configuration (but **not** schema) files. (The schema file MUST be located in the `config` subdirectory of the package root directory.) If the value of the `NODE_CONFIG_DIR` environment variable is not an absolute path, it is resolved against the package root directory, and not the current working directory.

The `NODE_ENV` environment variable overrides the `config.js` or `config.json` default filename of the configuration file. Typically, `NODE_ENV` is set to a value such as `development` or `production`.

In this example, we have used `config.json` as the filename of the configuration file. This is the default, or fallback, filename. Preference is given to a configuration file having the same basename as the package name. This is detailed in the *How It Works* section.

## Motivation

There are many Node.js configuration utilities available. Observed limitations are:

1. Using the current working directory as a reference point when locating configuration files.
2. Verifying that configuration files are well-formed, but not validating that the contents are correct.

Overcoming the first limitation is important for servers. Unlike simple Node.js programs that are typically run from the root package directory, servers are often run from a script. This script is started by some system initialization sequence. The current working directory is not necessarily the package root directory.

Overcoming the second limitation is important because an application should be presented with a correct configuration object. Checking that a port number is an integer, the value of which is within a specific range, is the job of the configuration file reader, not the application.

The pkgconfig utility deals with these limitations in two ways. First, the directory of the module calling `require('pkgconfig')` is the base for finding the configuration directory. Second, the configuration file is validated using a required JSON schema.

## How It Works

This section describes how pkgconfig finds the configuration directories and files.

### Step 1 - Find the package.json file

- Get the parent module pathname. This is the module calling `require('pkgconfig')`.
- Get the directory portion of the parent module pathname.
- Look for a `package.json` file in this directory.
- If not found, get the parent directory and repeat the previous step.
- Throw an error if not found.
- If found, remember the package name and the package root directory.

### Step 2 - Find the config directory

- Look for a `config` directory in the package root directory.
- Throw an error if not found.
- If found, look for a `schema.js` or a `schema.json` file in this directory.
- Throw an error if not found.
- If the `NODE_CONFIG_DIR` environment variable is set, then let this be the directory for configuration files (not schema files, which must still be located in the package root `config` directory).

### Step 3 - Find the configuration file

- Look for a configuration file in the config directory from the previous step.
- The following filenames are searched in order:
    1. `<package.name>.js`
    2. `<package.name>.json`
    3. `<NODE_ENV>.js`
    4. `<NODE_ENV>.json`
    5. `config.js`
    6. `config.json`
- The files based on the `package.name` are searched first so multiple configuration files for various packages can be located in a common directory.
- Throw an error if not found.

### Step 4 - Validate and return the configuration data

- Validate the configuration data read from the configuration file against the schema.
- Throw an error is validation fails.
- Return the configuration data.

## License (MIT)

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
