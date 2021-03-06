const path = require('path');
const fs = require('fs');

const os = require('os');

const pkg = JSON.parse(fs.readFileSync('./package.json'));
const crypto = require('mz/crypto');

const rootPath = path.normalize(process.cwd());



const util = require('corifeus-utils');

let boot = {};
if (fs.existsSync(`${rootPath}/corifeus-boot.json`)) {
    boot = require(`${rootPath}/corifeus-boot.json`)
} else {
    console.error('[CORE] [LIB] [SETTINGS] corifeus-boot.json is missing!');
    process.exit(1);
}

if (boot.hasOwnProperty('core')) {
    if (typeof(boot.core.lib.auth.token.expiryMinutes) === 'string') {
        boot.core.lib.auth.token.expiryMinutes = util.time.span(boot.core.lib.auth.token.expiryMinutes);
    }
}

const settings = {
    alias: 'settings',
    pkg: pkg,
    boot: boot,
    moment: 'MM/DD/YYYY HH:mm:ss',
    debug: false,

    instance: os.hostname(),

    redis: {
        prefix: {
            cluster: {
                auth: {
                    secret: 'cluster:auth-secret'
                }
            }
        }
    },
    token: {
      auto: {
          header: 'x-corifeus-token-auto',
      },
      header: 'x-corifeus-token',
      allowedUrl: [
          '/api/core/auth/login'
      ]
    },
}

if (boot.hasOwnProperty('core') && boot.core.hasOwnProperty('debug')) {
    settings.debug = boot.core.debug;
}

module.exports = settings;