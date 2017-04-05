const assert = require('assert')
const pkgconfig = require('../pkgconfig')

defaultConfig = {
    server: {
        host: 'localhost',
        port: 80
    },
    database: {
        username: 'admin',
        password: 'password'
    }
}

developmentConfig = {
    server: {
        port: 443
    },
    database: {
        connection: {
            string: 'my_database_connection_string'
        }
    }
}

mergedConfig = {
    server: {
        host: 'localhost',
        port: 443
    },
    database: {
        username: 'admin',
        password: 'password',
        connection: {
            string: 'my_database_connection_string'
        }
    }
}

process.env.NODE_ENV = ''
cfg = pkgconfig()
assert.deepStrictEqual(cfg, defaultConfig, 'Invalid default configuration.')
console.log('Passed test 1 (read the default configuration file).')

process.env.NODE_ENV = 'development'
cfg = pkgconfig()
assert.deepStrictEqual(cfg, mergedConfig, 'Invalid merged configuration.')
console.log('Passed test 2 (read the default and development configuration files).')

cfg = pkgconfig('notrequired')
assert.deepStrictEqual(cfg, developmentConfig, 'Invalid development configuration.')
console.log('Passed test 3 (read only the development configuration file).')

process.env.NODE_ENV = 'error'
try {
    cfg = pkgconfig()
} catch (e) {
    if (e.message.startsWith('Configuration file not found:')) {
        console.log('Passed test 4 (error if the NODE_ENV configuration file is not found).')
    } else {
        throw (e)
    }
}

process.env.NODE_ENV = ''
try {
    cfg = pkgconfig('error')
} catch (e) {
    if (e.message.startsWith('Configuration file not found:')) {
        console.log('Passed test 5 (error if the default configuration file is not found).')
    } else {
        throw (e)
    }
}

console.log('All tests pass.')