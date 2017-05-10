const Redis = require('ioredis');

function service(settings) {

    const self = this;
    const consolePrefix = service.prefix

    console.info(`${consolePrefix} started`);

    const client = new Redis(settings.url)
    this.client = client;

    const prefixes = {};

    this.stats = {
    }

    Object.defineProperty(this.stats, 'prefix', {
        enumerable: true,
        get: () => {
            return Object.keys(prefixes)
        }
    })

    this.register = {
        prefix: (prefix, depth = 0) => {

            if (!prefixes.hasOwnProperty(prefix)) {
                console.info(`${service.prefix} prefix registered: ${prefix}`);
                prefixes[prefix] = true;
                return `${prefix}:`
            }
            console.error(`${service.prefix} multiple prefix: ${prefix}`);
            depth++;
            prefix = `${prefix}${depth}`;
            return this.registerPrefix(prefix, depth);
        }
    }

    this.register.prefix.reuse = (prefix) => {
        if (prefix.hasOwnProperty(prefix)) {
            return prefix;
        }
        return this.register.prefix(prefix);
    }

    this.boot = async () => {
        return new Promise((resolve, reject) => {
            client.on('ready', async() => {
                console.info(`${consolePrefix} ready`)
                resolve();
            })
            client.on('error', async(e) => {
                console.error(`${consolePrefix} error`)
                reject(e);
            })
        })
    }
}

service.alias = 'redis';

module.exports = service;